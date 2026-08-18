// lead-intro-comms — speed-to-lead fan-out at booking-funnel entry.
//
// Fires the moment a visitor submits their name / email / phone on
// /book/zip (invoked by `emit-lead-webhook`, the single server-side
// choke point for funnel leads):
//
//   1. Intro SMS to the lead, sent through OpenPhone from the business
//      number that matches their state — NJ (551) 239-9444,
//      TX (972) 559-0223, CA (323) 300-5528, NY/NYC (631) 366-8565.
//      The state comes from the validated ZIP lookup, falling back to
//      ZIP-range inference, so the reply lands in the right market's
//      OpenPhone inbox with a local caller ID.
//   2. Internal notification email to the ops mailbox
//      (info@alphaluxcleaning.com + any INTERNAL_RECIPIENT_EMAILS)
//      so a human can follow up while the lead is still warm.
//
// OpenPhone-only by design, like every automated SMS on the public
// booking rail: this send goes through `sendSms({ channel: 'public' })`,
// which is OpenPhone with no GHL fallback. Sending from a GoHighLevel
// number would use the wrong area code and break the reply routing.
// (GHL still receives the lead itself via `ghl-sync-lead` — it just
// doesn't send the text.)
//
// The live OpenPhone key is read from `app_secrets` first. A stale
// dashboard env var has been 401ing every intro SMS since this
// function's v1 deploy (2026-07-26).
//
// Idempotent: `lead_intro_notifications` is keyed on the normalized
// email and the SMS slot is claimed atomically (UPDATE … WHERE
// intro_sms_sent_at IS NULL) before dispatch — the same pattern
// booking-confirm-comms uses — so a double-submitted form or a retried
// webhook can never double-text a lead. A failed send releases the
// claim so a later attempt can retry.
//
// Compliance: leads who previously texted STOP live in `sms_opt_outs`
// and are never messaged; the attempt is recorded as skipped.
//
// Body: { firstName, lastName?, email, phone, zipCode?, city?, state?,
//         promoCode?, utms?, landingPage?, referrer?, submittedAt?,
//         sendSms?: boolean, sendInternalEmail?: boolean }

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { resolveStateNumber } from "../_shared/openphone.ts";
import { sendSms } from "../_shared/sms.ts";
import { renderSMSTemplate } from "../_shared/sms-templates.ts";
import { phoneDigits10, toE164US } from "../_shared/phone-format.ts";
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
    const submittedAt = body.submittedAt || new Date().toISOString();

    // Resolve the market + outbound number once (DB registry first, then
    // the hardcoded per-state defaults).
    const stateNumber = await resolveStateNumber({
      state: body.state,
      zip: body.zipCode,
      supabase,
    });

    // Upsert the ledger row first so the claim below has a row to claim,
    // and so the lead shows up in the admin workspace even if both
    // channels fail.
    await supabase.from("lead_intro_notifications").upsert(
      {
        email,
        phone_digits: digits || null,
        first_name: body.firstName || null,
        last_name: body.lastName || null,
        zip_code: body.zipCode || null,
        state_code: stateNumber.stateCode,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" },
    );

    // ==================== INTRO SMS (idempotent) ====================
    let smsOutcome = "skipped";
    let messageId: string | null = null;

    const markSms = async (fields: Record<string, unknown>) => {
      await supabase.from("lead_intro_notifications")
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq("email", email);
    };

    if (body.sendSms === false) {
      smsOutcome = "skipped_disabled";
    } else if (!digits) {
      smsOutcome = "skipped_no_phone";
      await markSms({ intro_sms_status: smsOutcome });
    } else {
      // STOP means stop — never text a lead who opted out.
      const { data: optOut } = await supabase
        .from("sms_opt_outs").select("phone_digits").eq("phone_digits", digits).maybeSingle();

      if (optOut) {
        smsOutcome = "skipped_opted_out";
        await markSms({ intro_sms_status: smsOutcome });
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
            to: toE164US(body.phone) || body.phone,
            message,
            channel: "public",
            state: stateNumber.stateCode,
            zip: body.zipCode,
            context: "lead_intro",
            email,
            firstName,
            lastName: body.lastName || undefined,
          });

          if (res.success && !res.suppressed) {
            smsOutcome = "sent";
            messageId = res.messageId || null;
            await markSms({
              intro_sms_status: "sent",
              from_number: res.fromNumber || stateNumber.phoneE164,
              state_code: res.stateCode || stateNumber.stateCode,
              intro_sms_error: null,
            });
            log("Intro SMS sent", {
              email,
              state: res.stateCode || stateNumber.stateCode,
              from: res.fromNumber || stateNumber.phoneE164,
              provider: res.provider,
            });
          } else if (res.suppressed) {
            smsOutcome = "skipped_opted_out";
            await markSms({
              intro_sms_sent_at: null,
              intro_sms_status: smsOutcome,
            });
          } else {
            // Release the claim so a retry can attempt the send again.
            smsOutcome = `failed: ${res.error || "unknown SMS error"}`;
            await markSms({
              intro_sms_sent_at: null,
              intro_sms_status: "failed",
              intro_sms_error: (res.error || "").slice(0, 500),
            });
            log("Intro SMS failed — claim released", {
              error: res.error,
              provider: res.provider,
              attempts: res.attempts,
            });
          }
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
                  state: body.state || stateNumber.stateCode,
                  promo_code: body.promoCode || "",
                  utm_source: utms.utm_source || "",
                  utm_medium: utms.utm_medium || "",
                  utm_campaign: utms.utm_campaign || "",
                  utm_content: utms.utm_content || "",
                  landing_page: body.landingPage || "",
                  referrer: body.referrer || "",
                  message:
                    `Market: ${stateNumber.stateCode} · Intro SMS: ${smsOutcome}` +
                    (smsOutcome === "sent" ? ` from ${stateNumber.phoneE164}` : ""),
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
        await markSms({ internal_email_sent_at: new Date().toISOString() });
      }
      log("Internal notifications", internalResults);
    }

    return json({
      success: true,
      email,
      stateCode: stateNumber.stateCode,
      fromNumber: stateNumber.phoneE164,
      sms: smsOutcome,
      messageId,
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
