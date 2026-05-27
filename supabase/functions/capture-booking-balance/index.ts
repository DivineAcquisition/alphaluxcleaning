// capture-booking-balance — turns the authorization-only hold
// placed by authorize-booking-balance into a real charge once the
// cleaning is complete. Eliminates the hosted-invoice email
// round-trip — the funds were already reserved on the customer's
// card at booking time, so capture is a single Stripe API call
// that almost never fails.
//
// Called from:
//   * HCP webhook on job_status='completed' (recommended)
//   * Admin "Mark cleaning complete" button on /admin/bookings
//   * Manual ops curl (this function is idempotent)
//
// Fallback paths handled inside:
//   * If the original hold expired (Stripe 7-day window passed
//     before the cleaning landed and the retry sweep didn't
//     re-auth in time), we attempt a fresh off-session charge
//     against the saved card. If THAT fails too, we fall back to
//     the legacy send-balance-invoice path so the customer gets
//     a hosted invoice link rather than no charge at all.
//   * If the hold was already cancelled (e.g. someone manually
//     released it), we degrade to the fresh off-session charge
//     path.
//
// Input:
//   { booking_id: string, amount_cents?: number }
//   - amount_cents lets ops capture a partial amount (e.g. service
//     was reduced in scope). Defaults to the full authorized
//     amount.
//
// Response includes the resulting Stripe charge id, the path
// taken (capture / fresh_charge / hosted_invoice), and the
// updated balance_auth_status.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  requireStripeSecretKey,
  slugFromBookingColumn,
} from "../_shared/stripe-env.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, data?: unknown) =>
  console.log(
    `[capture-booking-balance] ${step}`,
    data !== undefined ? JSON.stringify(data) : "",
  );

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const bookingId: string | undefined = body?.booking_id || body?.bookingId;
    const amountCentsOverride: number | undefined =
      typeof body?.amount_cents === "number" ? body.amount_cents : undefined;

    if (!bookingId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing booking_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    log("Capture requested", { bookingId, amountCentsOverride });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .select("*, customer:customers!bookings_customer_id_fkey(*)")
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

    // Idempotency short-circuits.
    if (booking.balance_auth_status === "captured") {
      return ok({
        success: true,
        skipped: "already_captured",
        booking_id: bookingId,
        path: "noop",
      });
    }
    if (booking.balance_auth_status === "released" || booking.status === "cancelled") {
      return ok({
        success: true,
        skipped: `booking_${booking.status}_or_released`,
        booking_id: bookingId,
        path: "noop",
      });
    }

    const slug = slugFromBookingColumn(booking.stripe_account_slug);
    const stripe = new Stripe(requireStripeSecretKey(slug), {
      apiVersion: "2023-10-16",
    });

    const fullAmount =
      booking.balance_auth_amount_cents ||
      Math.round(Number(booking.balance_due || 0) * 100);
    const captureAmount = amountCentsOverride ?? fullAmount;
    if (captureAmount < 50) {
      await supabase
        .from("bookings")
        .update({
          balance_auth_status: "released",
          balance_auth_released_at: new Date().toISOString(),
        })
        .eq("id", bookingId);
      return ok({
        success: true,
        skipped: "below_stripe_minimum",
        booking_id: bookingId,
        path: "noop",
      });
    }

    // ===================== PATH 1: capture existing hold =====================
    if (booking.balance_auth_payment_intent_id && booking.balance_auth_status === "authorized") {
      try {
        const captured = await stripe.paymentIntents.capture(
          booking.balance_auth_payment_intent_id,
          captureAmount !== fullAmount
            ? { amount_to_capture: captureAmount }
            : undefined,
        );
        if (captured.status === "succeeded") {
          await markCaptured(supabase, bookingId, captured.id, captureAmount);
          await markBookingFullyPaid(supabase, bookingId);
          log("Hold captured successfully", {
            bookingId,
            pi: captured.id,
            amount: captureAmount,
          });
          return ok({
            success: true,
            booking_id: bookingId,
            payment_intent_id: captured.id,
            amount_cents: captureAmount,
            path: "capture",
          });
        }
        log(
          `Capture returned unexpected status="${captured.status}" — falling through to fresh charge`,
        );
      } catch (err: unknown) {
        const msg = (err as Error)?.message || String(err);
        log("Capture failed — falling through to fresh off-session charge", {
          error: msg,
        });
      }
    }

    // ===================== PATH 2: fresh off-session charge =====================
    //
    // Hold expired or was released — try to charge the saved card
    // off-session for the captureAmount.
    const stripeCustomerId =
      booking.customer?.stripe_customer_id ||
      (await resolveStripeCustomerId(stripe, booking, supabase));
    const paymentMethodId =
      booking.customer?.stripe_default_payment_method_id ||
      (await resolveDefaultPm(stripe, stripeCustomerId));

    if (stripeCustomerId && paymentMethodId) {
      try {
        const freshPi = await stripe.paymentIntents.create({
          amount: captureAmount,
          currency: "usd",
          customer: stripeCustomerId,
          payment_method: paymentMethodId,
          payment_method_types: ["card"],
          capture_method: "automatic",
          confirm: true,
          off_session: true,
          description: `AlphaLux balance — booking ${booking.id.slice(0, 8).toUpperCase()}`,
          metadata: {
            booking_id: bookingId,
            purpose: "balance_capture_fresh",
            fallback_from_hold:
              booking.balance_auth_payment_intent_id || "",
          },
        });
        if (freshPi.status === "succeeded") {
          await markCaptured(supabase, bookingId, freshPi.id, captureAmount);
          await markBookingFullyPaid(supabase, bookingId);
          log("Fresh off-session charge succeeded", {
            bookingId,
            pi: freshPi.id,
          });
          return ok({
            success: true,
            booking_id: bookingId,
            payment_intent_id: freshPi.id,
            amount_cents: captureAmount,
            path: "fresh_charge",
          });
        }
        log(`Fresh charge returned status="${freshPi.status}"`);
      } catch (err: unknown) {
        log(
          "Fresh off-session charge failed — falling through to hosted invoice",
          { error: (err as Error)?.message },
        );
      }
    }

    // ===================== PATH 3: hosted-invoice fallback =====================
    //
    // Last resort — email the customer a hosted invoice link via
    // the existing send-balance-invoice function.
    try {
      const inv = await supabase.functions.invoke("send-balance-invoice", {
        body: { bookingId },
      });
      log("Fell back to hosted-invoice email", { ok: !inv.error });
      return ok({
        success: true,
        booking_id: bookingId,
        path: "hosted_invoice",
        invoice_response: inv.data,
        invoice_error: inv.error?.message || null,
      });
    } catch (err: unknown) {
      const msg = (err as Error)?.message || String(err);
      return new Response(
        JSON.stringify({
          success: false,
          booking_id: bookingId,
          path: "hosted_invoice_failed",
          error: msg,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
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

async function markCaptured(
  supabase: ReturnType<typeof createClient>,
  bookingId: string,
  pi: string,
  amountCents: number,
) {
  await supabase
    .from("bookings")
    .update({
      balance_auth_status: "captured",
      balance_auth_captured_at: new Date().toISOString(),
      balance_auth_payment_intent_id: pi,
      balance_auth_amount_cents: amountCents,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);
}

async function markBookingFullyPaid(
  supabase: ReturnType<typeof createClient>,
  bookingId: string,
) {
  await supabase
    .from("bookings")
    .update({
      payment_status: "paid",
      balance_due: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);
}

async function resolveStripeCustomerId(
  stripe: Stripe,
  booking: { customer?: { email?: string | null } },
  _supabase: ReturnType<typeof createClient>,
): Promise<string | null> {
  const email = booking.customer?.email;
  if (!email) return null;
  const list = await stripe.customers.list({ email, limit: 1 });
  return list.data[0]?.id || null;
}

async function resolveDefaultPm(
  stripe: Stripe,
  stripeCustomerId: string | null,
): Promise<string | null> {
  if (!stripeCustomerId) return null;
  const sc = await stripe.customers.retrieve(stripeCustomerId);
  if (!("deleted" in sc) || !sc.deleted) {
    const explicit =
      (sc as { invoice_settings?: { default_payment_method?: unknown } })
        ?.invoice_settings?.default_payment_method;
    const id =
      typeof explicit === "string"
        ? explicit
        : (explicit as { id?: string } | null)?.id || null;
    if (id) return id;
  }
  const pms = await stripe.paymentMethods.list({
    customer: stripeCustomerId,
    type: "card",
    limit: 1,
  });
  return pms.data[0]?.id || null;
}
