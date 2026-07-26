// lead-intro-comms — speed-to-lead fan-out at booking-funnel entry.
//
// Fires the moment a visitor submits their name / email / phone on
// /book/zip (invoked by `emit-lead-webhook`, which is the single
// server-side choke point for funnel leads):
//
//   1. Intro SMS to the lead, sent through OpenPhone from the business
//      number that matches their state — NJ (551) 239-9444,
//      TX (972) 559-0223, CA (323) 300-5528, NY/NYC (631) 366-8565.
//      The state comes from the validated ZIP lookup, falling back to
//      ZIP-range inference, so the reply always lands in the right
//      market's OpenPhone inbox.
//   2. Internal notification email to the ops mailbox
//      (info@alphaluxcleaning.com + any INTERNAL_RECIPIENT_EMAILS)
//      so a human can follow up while the lead is still warm.
//
// Idempotent: `lead_intro_notifications` is keyed on the normalized
// email and the SMS slot is claimed atomically (UPDATE … WHERE
// intro_sms_sent_at IS NULL) before dispatch, the same pattern
// booking-confirm-comms uses. A double-submitted form or a retried
// webhook can never double-text a lead. A failed send releases the
// claim so a later attempt can retry.
//
// Opt-outs are enforced inside `sendSms()` — a lead who previously
// texted STOP is never messaged again, and the attempt is recorded as
// skipped rather than sent.
//
// Body: { firstName, lastName?, email, phone, zipCode?, city?, state?,
//         promoCode?, utms?, landingPage?, referrer?, submittedAt?,
//         sendSms?: boolean, sendInternalEmail?: boolean }

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendSms } from "../_shared/sms.ts";
import { renderSMSTemplate } from "../_shared/sms-templates.ts";
import { phoneDigits10 } from "../_shared/phone-format.ts";
import { normalizeStateCode, stateFromZip, defaultStateCode } from "../_shared/openphone.ts";
import { getInternalRecipients } from "../_shared/internal-recipients.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, data?: unknown) =>
  console.log(`[lead-intro-comms] ${step}`, data !== undefined ? JSON.stringify(data) : "");

interface LeadIntroBody {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  zipCode?: string;
  city?: string;
  state?: string;
  promoCode?: string;
  landingPage?: string;
  referrer?: string;
  submittedAt?: string;
  utms?: Record<string, unknown>;
  sendSms?: boolean;
  sendInternalEmail?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body: LeadIntroBody = await req.json();
    const email = (body.email || "").trim().toLowerCase();
    if (!email) return json({ success: false, error: "email is required" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const firstName = (body.firstName || "").trim() || "there";
    const digits = body.phone ? phoneDigits10(body.phone) : "";
    const stateCode =
      normalizeStateCode(body.state) ?? stateFromZip(body.zipCode) ?? defaultStateCode();
    const submittedAt = body.submittedAt || new Date().toISOString();

    // Upsert the ledger row first so the claim below has something to
    // claim, and so the lead is visible in the admin workspace even if
    // both channels end up failing.
    await supabase.from("lead_intro_notifications").upsert(
      {
        email,
        phone_digits: digits || null,
        first_name: body.firstName || null,
        last_name: body.lastName || null,
        zip_code: body.zipCode || null,
        state_code: stateCode,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" },
    );

    // ==================== INTRO SMS (idempotent) ====================
    let smsOutcome = "skipped";
    let smsProvider: string | null = null;
    let fromNumber: string | null = null;

    if (body.sendSms === false) {
      smsOutcome = "skipped_disabled";
    } else if (!digits) {
      smsOutcome = "skipped_no_phone";
      await supabase.from("lead_intro_notifications")
        .update({ intro_sms_status: smsOutcome, updated_at: new Date().toISOString() })
        .eq("email", email);
    } else {
      // Atomic claim — only one caller flips NULL → now().
      const { data: claim, error: claimError } = await supabase
        .from("lead_intro_notifications")
        .update({ intro_sms_sent_at: new Date().toISOString() })
        .eq("email", email)
        .is("intro_sms_sent_at", null)
        .select("email");

      if (claimError) {
        smsOutcome = `failed: claim error — ${claimError.message}`;
        log("SMS claim error", { error: claimError.message });
      } else if (!claim || claim.length === 0) {
        smsOutcome = "already_sent";
        log("Intro SMS already sent — skipping", { email });
      } else {
        const bookingLink =
          Deno.env.get("BOOKING_LINK") || "https://try.alphaluxcleaning.com/book/zip";
        const message = renderSMSTemplate("lead_intro", {
          first_name: firstName,
          city: body.city || "",
          booking_link: bookingLink,
          promo_code: body.promoCode || "",
        });

        const res = await sendSms({
          to: body.phone as string,
          message,
          state: body.state || stateCode,
          zip: body.zipCode,
          context: "lead_intro",
          email,
          firstName: body.firstName,
          lastName: body.lastName,
        });

        if (res.suppressed) {
          smsOutcome = "skipped_opted_out";
          await supabase.from("lead_intro_notifications")
            .update({ intro_sms_status: smsOutcome, updated_at: new Date().toISOString() })
            .eq("email", email);
        } else if (res.success) {
          smsOutcome = "sent";
          smsProvider = res.provider;
          fromNumber = res.fromNumber || null;
          await supabase.from("lead_intro_notifications")
            .update({
              intro_sms_status: "sent",
              from_number: res.fromNumber || null,
              state_code: res.stateCode || stateCode,
              updated_at: new Date().toISOString(),
            })
            .eq("email", email);
          log("Intro SMS sent", { email, state: res.stateCode, from: res.fromNumber });
        } else {
          // Release the claim so a retry can attempt the send again.
          smsOutcome = `failed: ${res.error || "unknown SMS error"}`;
          await supabase.from("lead_intro_notifications")
            .update({
              intro_sms_sent_at: null,
              intro_sms_status: "failed",
              intro_sms_error: (res.error || "").slice(0, 500),
              updated_at: new Date().toISOString(),
            })
            .eq("email", email);
          log("Intro SMS failed — claim released", { error: res.error });
        }
      }
    }

    // ============= INTERNAL OPS NOTIFICATION (idempotent) =============
    // send-email-system dedupes on event_id, so a retried webhook won't
    // spam the ops mailbox.
    const internalResults: Array<{ recipient: string; ok: boolean; error?: string }> = [];
    if (body.sendInternalEmail !== false) {
      const appUrl = Deno.env.get("APP_URL") || "https://try.alphaluxcleaning.com";
      const eventBase = `lead-admin-${email}-${submittedAt.slice(0, 16)}`;
      const utms = (body.utms || {}) as Record<string, string>;

      // Awaited (not fire-and-forget): the edge runtime tears down
      // pending promises once the response returns, which is why these
      // alerts were unreliable before.
      await Promise.all(
        getInternalRecipients().map(async (recipient) => {
          try {
            const r = await supabase.functions.invoke("send-email-system", {
              body: {
                template: "lead_admin_notification",
                to: recipient,
                event_id: `${eventBase}-${recipient}`,
                data: {
                  first_name: body.firstName || "",
                  last_name: body.lastName || "",
                  email,
                  phone: body.phone || "",
                  zip_code: body.zipCode || "",
                  city: body.city || "",
                  state: body.state || stateCode,
                  promo_code: body.promoCode || "",
                  utm_source: utms.utm_source || "",
                  utm_medium: utms.utm_medium || "",
                  utm_campaign: utms.utm_campaign || "",
                  utm_content: utms.utm_content || "",
                  landing_page: body.landingPage || "",
                  referrer: body.referrer || "",
                  message: `Intro SMS: ${smsOutcome}${fromNumber ? ` (from ${fromNumber})` : ""}`,
                  submitted_at: submittedAt,
                  app_url: appUrl,
                },
                category: "transactional",
              },
            });
            internalResults.push({ recipient, ok: !r.error, error: r.error?.message });
          } catch (err) {
            internalResults.push({
              recipient,
              ok: false,
              error: err instanceof Error ? err.message : String(err),
            });
          }
        }),
      );

      if (internalResults.some((r) => r.ok)) {
        await supabase.from("lead_intro_notifications")
          .update({ internal_email_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq("email", email);
      }
      log("Internal notifications", internalResults);
    }

    return json({
      success: true,
      email,
      stateCode,
      sms: smsOutcome,
      smsProvider,
      fromNumber,
      internal: internalResults,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log("ERROR", { message });
    return json({ success: false, error: message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
