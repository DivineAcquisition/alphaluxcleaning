// booking-confirm-comms — idempotent customer confirmation fan-out.
//
// Single place that guarantees a confirmed booking produces EXACTLY ONE
// customer confirmation email and EXACTLY ONE confirmation SMS, no
// matter how many times the confirm path fires (details re-submit,
// Stripe webhook + client confirm racing, manual re-invoke, retries).
//
// How idempotency works: `bookings.confirmation_email_sent_at` /
// `bookings.confirmation_sms_sent_at` are claimed atomically with
// UPDATE ... WHERE <flag> IS NULL before any send. Whoever wins the
// claim performs the send; everyone else sees "already_sent" and
// no-ops. If a send fails after a claim, the flag is released so a
// later retry can try again.
//
// Channels:
//   Email — delegates to the existing `send-booking-confirmation`
//           function (branded customer email + internal ops email).
//   SMS   — rendered from `_shared/sms-templates.ts` and sent through
//           `_shared/sms.ts` (GHL primary → OpenPhone fallback).
//
// Failures never propagate as HTTP errors to the confirm path —
// the booking is already paid/confirmed; comms are best-effort and
// retryable.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendSms } from "../_shared/sms.ts";
import { renderSMSTemplate } from "../_shared/sms-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, data?: unknown) => {
  console.log(
    `[booking-confirm-comms] ${step}`,
    data !== undefined ? JSON.stringify(data) : "",
  );
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  regular: "Standard",
  deep: "Deep",
  move_in_out: "Move-In/Out",
};

const TIME_SLOT_WINDOWS: Record<string, string> = {
  early_morning: "7–9 AM",
  morning: "9–11 AM",
  late_morning: "11 AM–1 PM",
  afternoon: "1–3 PM",
  late_afternoon: "3–5 PM",
  evening: "5–7 PM",
};

function fmtDate(yyyymmdd: string | null | undefined): string {
  if (!yyyymmdd) return "your scheduled date";
  const [y, m, d] = String(yyyymmdd).split("-").map(Number);
  if (!y || !m || !d) return String(yyyymmdd);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

type ChannelOutcome =
  | "sent"
  | "already_sent"
  | "skipped_no_phone"
  | "skipped_no_email"
  | `failed: ${string}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId } = await req.json();
    if (!bookingId) throw new Error("Missing bookingId");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(
        "id, customer_id, status, service_type, service_date, time_slot, offer_name, confirmation_email_sent_at, confirmation_sms_sent_at",
      )
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error(
        `Failed to load booking ${bookingId}: ${bookingError?.message}`,
      );
    }

    let customer: {
      email?: string | null;
      phone?: string | null;
      first_name?: string | null;
      last_name?: string | null;
      name?: string | null;
    } | null = null;
    if (booking.customer_id) {
      const { data } = await supabase
        .from("customers")
        .select("email, phone, first_name, last_name, name")
        .eq("id", booking.customer_id)
        .maybeSingle();
      customer = data;
    }

    let emailOutcome: ChannelOutcome;
    let smsOutcome: ChannelOutcome;
    let smsProvider: string | null = null;

    // =================== EMAIL (idempotent) ===================
    if (!customer?.email) {
      emailOutcome = "skipped_no_email";
      log("Email skipped — customer has no email", { bookingId });
    } else {
      // Atomic claim: only one caller flips NULL → now().
      const { data: emailClaim, error: emailClaimError } = await supabase
        .from("bookings")
        .update({ confirmation_email_sent_at: new Date().toISOString() })
        .eq("id", bookingId)
        .is("confirmation_email_sent_at", null)
        .select("id");

      if (emailClaimError) {
        emailOutcome = `failed: claim error — ${emailClaimError.message}`;
        log("Email claim error", { error: emailClaimError.message });
      } else if (!emailClaim || emailClaim.length === 0) {
        emailOutcome = "already_sent";
        log("Email already sent — skipping", { bookingId });
      } else {
        try {
          const r = await supabase.functions.invoke(
            "send-booking-confirmation",
            { body: { bookingId } },
          );
          const sendFailed =
            r.error || r.data?.success === false ||
            (r.data && r.data.customerEmailSent === false);
          if (sendFailed) {
            throw new Error(
              r.error?.message ||
                r.data?.customerEmailError ||
                r.data?.error ||
                "send-booking-confirmation reported failure",
            );
          }
          emailOutcome = "sent";
          log("Email sent", { bookingId });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          // Release the claim so a retry can attempt the send again.
          await supabase
            .from("bookings")
            .update({ confirmation_email_sent_at: null })
            .eq("id", bookingId);
          emailOutcome = `failed: ${msg}`;
          log("Email send failed — claim released", { error: msg });
        }
      }
    }

    // ==================== SMS (idempotent) ====================
    if (!customer?.phone) {
      smsOutcome = "skipped_no_phone";
      log("SMS skipped — customer has no phone", { bookingId });
    } else {
      const { data: smsClaim, error: smsClaimError } = await supabase
        .from("bookings")
        .update({ confirmation_sms_sent_at: new Date().toISOString() })
        .eq("id", bookingId)
        .is("confirmation_sms_sent_at", null)
        .select("id");

      if (smsClaimError) {
        smsOutcome = `failed: claim error — ${smsClaimError.message}`;
        log("SMS claim error", { error: smsClaimError.message });
      } else if (!smsClaim || smsClaim.length === 0) {
        smsOutcome = "already_sent";
        log("SMS already sent — skipping", { bookingId });
      } else {
        const serviceLabel =
          booking.offer_name ||
          SERVICE_TYPE_LABELS[booking.service_type] ||
          booking.service_type ||
          "cleaning";
        const message = renderSMSTemplate("booking_confirmed", {
          first_name: customer.first_name || customer.name || "there",
          service_type: serviceLabel,
          service_date: fmtDate(booking.service_date),
          time_window: booking.time_slot
            ? TIME_SLOT_WINDOWS[booking.time_slot] || booking.time_slot
            : "arrival window TBD",
        });

        const res = await sendSms({
          to: customer.phone,
          message,
          email: customer.email || undefined,
          firstName: customer.first_name || undefined,
          lastName: customer.last_name || undefined,
          name: customer.name || undefined,
        });

        if (res.success) {
          smsOutcome = "sent";
          smsProvider = res.provider;
          log("SMS sent", {
            bookingId,
            provider: res.provider,
            fallback: res.fallback,
          });
        } else {
          // Release the claim so a retry can attempt the send again.
          await supabase
            .from("bookings")
            .update({ confirmation_sms_sent_at: null })
            .eq("id", bookingId);
          smsOutcome = `failed: ${res.error || "unknown SMS error"}`;
          log("SMS send failed — claim released", { error: res.error });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        bookingId,
        email: emailOutcome,
        sms: smsOutcome,
        smsProvider,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ success: false, error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
