// authorize-booking-balance — places (or replaces) a Stripe
// authorization-only hold on the customer's saved card for the
// remaining balance after the 50% deposit. The hold reserves the
// funds without charging them; `capture-booking-balance` flips
// the hold into a real charge once the cleaning is complete.
//
// Called from:
//   * confirm-booking-payment fan-out (immediately after deposit)
//   * retry-balance-authorizations (cron-driven retry sweep)
//   * Admin/CSR replay (manual)
//
// Input:
//   { booking_id: string,
//     reason?: 'initial' | 'retry' | 'reauth_before_expiry' | 'manual' }
//
// Side effects (on success):
//   * Stripe PI created with capture_method='manual' for the full
//     balance_due amount, off-session against the customer's saved
//     default PaymentMethod, confirmed immediately so the hold
//     lands. If a previous hold exists (`balance_auth_payment_intent_id`),
//     we cancel it first to release the old reservation before the
//     new one lands — keeps the customer's available credit clean.
//   * bookings row updated:
//       balance_auth_payment_intent_id = <new pi>
//       balance_auth_status = 'authorized'
//       balance_auth_amount_cents = <amount>
//       balance_auth_attempts += 1
//       balance_auth_authorized_at = now
//       balance_auth_expires_at = now + 7d
//       balance_auth_last_error / _code = null
//       balance_auth_next_retry_at = null
//
// On failure (decline / insufficient funds / SCA required):
//   * bookings row updated:
//       balance_auth_status = 'failed'
//       balance_auth_attempts += 1
//       balance_auth_last_error / _code = <stripe error>
//       balance_auth_next_retry_at = <computed by helper, or null
//                                    if attempts >= 3>
//   * If attempts >= MAX (3), caller (retry sweep) is expected to
//     invoke `cancel-booking-for-auth-failure`. This function does
//     not cancel on its own so a single transient failure doesn't
//     wipe a booking.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  requireStripeSecretKey,
  slugFromBookingColumn,
} from "../_shared/stripe-env.ts";
import {
  BALANCE_AUTH_MAX_ATTEMPTS,
  STRIPE_AUTH_WINDOW_MS,
  computeNextRetryAt,
  summarizeStripeError,
  type BookingBalanceAuthRow,
} from "../_shared/balance-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, data?: unknown) =>
  console.log(
    `[authorize-booking-balance] ${step}`,
    data !== undefined ? JSON.stringify(data) : "",
  );

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const bookingId: string | undefined = body?.booking_id || body?.bookingId;
    const reason: string = body?.reason || "initial";

    if (!bookingId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing booking_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    log("Request received", { bookingId, reason });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    // === Load booking + customer ===
    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .select(
        `
        id, balance_due, service_date, paid_at, stripe_account_slug,
        payment_status, status, customer_id, full_name, est_price,
        balance_auth_payment_intent_id, balance_auth_status,
        balance_auth_amount_cents, balance_auth_attempts,
        balance_auth_last_attempt_at, balance_auth_last_error,
        balance_auth_last_error_code, balance_auth_authorized_at,
        balance_auth_expires_at, balance_auth_next_retry_at
        `,
      )
      .eq("id", bookingId)
      .single();

    if (bookingErr || !booking) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Booking not found: ${bookingErr?.message || "unknown"}`,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // === Short-circuits ===
    if (booking.status === "cancelled") {
      return ok({
        success: true,
        skipped: "booking_cancelled",
        booking_id: bookingId,
      });
    }
    if (
      booking.balance_auth_status === "captured" ||
      booking.balance_auth_status === "released"
    ) {
      return ok({
        success: true,
        skipped: `already_${booking.balance_auth_status}`,
        booking_id: bookingId,
      });
    }
    if (
      (booking.balance_due ?? 0) <= 0 &&
      booking.balance_auth_status !== "authorized"
    ) {
      // Nothing to authorize — mark as released so the sweep stops
      // looking at this row.
      await supabase
        .from("bookings")
        .update({
          balance_auth_status: "released",
          balance_auth_released_at: new Date().toISOString(),
        })
        .eq("id", bookingId);
      return ok({
        success: true,
        skipped: "zero_balance",
        booking_id: bookingId,
      });
    }

    const customer = booking.customer_id
      ? (
          await supabase
            .from("customers")
            .select(
              "id, email, name, first_name, last_name, phone, stripe_customer_id, stripe_default_payment_method_id, stripe_card_on_file",
            )
            .eq("id", booking.customer_id)
            .maybeSingle()
        ).data
      : null;

    if (!customer?.stripe_customer_id) {
      return await recordFailure(supabase, booking, {
        message: "Customer has no Stripe Customer attached.",
        code: "missing_stripe_customer",
      });
    }

    // === Resolve account-aware Stripe SDK ===
    const slug = slugFromBookingColumn(booking.stripe_account_slug);
    let secretKey: string;
    try {
      secretKey = requireStripeSecretKey(slug);
    } catch (err: unknown) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Stripe secret key not configured for account "${slug}": ${
            (err as Error)?.message || String(err)
          }`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const stripe = new Stripe(secretKey, { apiVersion: "2023-10-16" });

    // === Resolve a usable default PaymentMethod ===
    //
    // Priority:
    //   1. customers.stripe_default_payment_method_id (mirror that
    //      stripe-webhook / confirm-booking-payment promote on the
    //      Stripe Customer's invoice_settings).
    //   2. Stripe Customer's actual invoice_settings.default_payment_method.
    //   3. Most-recently-attached card PM on the Customer (self-heal).
    let paymentMethodId: string | null =
      customer.stripe_default_payment_method_id || null;
    if (!paymentMethodId) {
      try {
        const sc = await stripe.customers.retrieve(customer.stripe_customer_id);
        if (!("deleted" in sc) || !sc.deleted) {
          const explicit =
            (sc as { invoice_settings?: { default_payment_method?: unknown } })
              ?.invoice_settings?.default_payment_method;
          paymentMethodId =
            typeof explicit === "string"
              ? explicit
              : (explicit as { id?: string } | null)?.id || null;
        }
        if (!paymentMethodId) {
          const pms = await stripe.paymentMethods.list({
            customer: customer.stripe_customer_id,
            type: "card",
            limit: 1,
          });
          paymentMethodId = pms.data[0]?.id || null;
        }
      } catch (err: unknown) {
        return await recordFailure(supabase, booking, summarizeStripeError(err));
      }
    }

    if (!paymentMethodId) {
      return await recordFailure(supabase, booking, {
        message:
          "No PaymentMethod on file for this customer. The deposit may not have saved a card.",
        code: "no_payment_method",
      });
    }

    // === Cancel any prior outstanding hold ===
    //
    // If we already have an authorized PI sitting on the booking
    // (this is a retry / re-auth call), cancel it first so we don't
    // double-reserve the customer's credit. Cancelling a
    // requires_capture PI releases the hold instantly. We swallow
    // errors here — if the prior PI already expired or was
    // captured, the cancel call will 4xx and that's fine.
    if (booking.balance_auth_payment_intent_id) {
      try {
        await stripe.paymentIntents.cancel(
          booking.balance_auth_payment_intent_id,
          { cancellation_reason: "duplicate" },
        );
        log("Cancelled prior hold before re-authorizing", {
          prior: booking.balance_auth_payment_intent_id,
        });
      } catch (cancelErr: unknown) {
        log("Prior-hold cancel returned non-fatal error (likely already cleared)", {
          prior: booking.balance_auth_payment_intent_id,
          error: (cancelErr as Error)?.message,
        });
      }
    }

    // === Place the new hold ===
    const balanceCents = Math.round(Number(booking.balance_due || 0) * 100);
    if (balanceCents < 50) {
      // Stripe minimum is $0.50.
      await supabase
        .from("bookings")
        .update({
          balance_auth_status: "released",
          balance_auth_released_at: new Date().toISOString(),
        })
        .eq("id", bookingId);
      return ok({
        success: true,
        skipped: "balance_below_stripe_minimum",
        booking_id: bookingId,
      });
    }

    let pi: Stripe.PaymentIntent;
    try {
      pi = await stripe.paymentIntents.create({
        amount: balanceCents,
        currency: "usd",
        customer: customer.stripe_customer_id,
        payment_method: paymentMethodId,
        payment_method_types: ["card"],
        // Authorize-only — funds are reserved, not captured. We
        // flip to a real charge later via paymentIntents.capture.
        capture_method: "manual",
        // Off-session because the customer isn't on the page — we
        // already have their saved card. If the card requires SCA
        // for off-session it'll throw `authentication_required`
        // which we record so ops can request the customer
        // re-authorize manually.
        confirm: true,
        off_session: true,
        description: `AlphaLux balance hold — booking ${booking.id.slice(0, 8).toUpperCase()}`,
        metadata: {
          booking_id: bookingId,
          customer_id: booking.customer_id || "",
          purpose: "balance_authorization",
          reason,
          attempt: String((booking.balance_auth_attempts || 0) + 1),
        },
      });
    } catch (err: unknown) {
      return await recordFailure(supabase, booking, summarizeStripeError(err));
    }

    // Verify the PI actually landed in requires_capture (hold
    // placed). If we got requires_action / processing / anything
    // else, treat as a failed attempt — off-session can't drive
    // a 3DS challenge.
    if (pi.status !== "requires_capture") {
      const message = `Authorization did not complete — Stripe returned status="${pi.status}".`;
      const code =
        pi.last_payment_error?.decline_code ||
        pi.last_payment_error?.code ||
        pi.status;
      return await recordFailure(supabase, booking, { message, code });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + STRIPE_AUTH_WINDOW_MS);
    await supabase
      .from("bookings")
      .update({
        balance_auth_payment_intent_id: pi.id,
        balance_auth_status: "authorized",
        balance_auth_amount_cents: pi.amount,
        balance_auth_attempts: (booking.balance_auth_attempts || 0) + 1,
        balance_auth_last_attempt_at: now.toISOString(),
        balance_auth_last_error: null,
        balance_auth_last_error_code: null,
        balance_auth_authorized_at: now.toISOString(),
        balance_auth_expires_at: expiresAt.toISOString(),
        balance_auth_next_retry_at: null,
        updated_at: now.toISOString(),
      })
      .eq("id", bookingId);

    log("Hold placed successfully", {
      bookingId,
      paymentIntentId: pi.id,
      amount: pi.amount,
      attempts: (booking.balance_auth_attempts || 0) + 1,
    });

    return ok({
      success: true,
      booking_id: bookingId,
      payment_intent_id: pi.id,
      amount_cents: pi.amount,
      status: "authorized",
      attempts: (booking.balance_auth_attempts || 0) + 1,
      expires_at: expiresAt.toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

function ok(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function recordFailure(
  supabase: ReturnType<typeof createClient>,
  booking: BookingBalanceAuthRow & { id: string },
  err: { message: string; code: string | null },
): Promise<Response> {
  const newAttempts = (booking.balance_auth_attempts || 0) + 1;
  const nextRetryAt = computeNextRetryAt(newAttempts, booking.service_date);
  const exhausted = newAttempts >= BALANCE_AUTH_MAX_ATTEMPTS;

  await supabase
    .from("bookings")
    .update({
      balance_auth_status: "failed",
      balance_auth_attempts: newAttempts,
      balance_auth_last_attempt_at: new Date().toISOString(),
      balance_auth_last_error: err.message.slice(0, 500),
      balance_auth_last_error_code: err.code,
      balance_auth_next_retry_at: exhausted ? null : nextRetryAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", booking.id);

  log("Hold attempt failed", {
    bookingId: booking.id,
    attempts: newAttempts,
    exhausted,
    error: err.message,
    code: err.code,
    nextRetryAt,
  });

  return new Response(
    JSON.stringify({
      success: false,
      booking_id: booking.id,
      status: "failed",
      attempts: newAttempts,
      attempts_exhausted: exhausted,
      next_retry_at: exhausted ? null : nextRetryAt,
      error: err.message,
      code: err.code,
    }),
    {
      status: 200, // 200 so the caller (sweep) can read body; failure is in JSON
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}
