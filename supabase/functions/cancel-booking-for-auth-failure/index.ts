// cancel-booking-for-auth-failure — terminal step in the balance
// pre-authorization lifecycle. Invoked by the retry sweep once
// balance_auth_attempts hits 3 with all of them failed.
//
// What it does:
//   1. Refunds the original deposit charge in Stripe (so the
//      customer is made whole — we don't keep $X for a cleaning
//      we're not going to do).
//   2. Cancels any lingering outstanding hold (defensive; should
//      already be in 'failed' state but if a previous successful
//      auth later expired we still clean up the PI).
//   3. Marks the booking row:
//        status = 'cancelled'
//        payment_status = 'refunded'
//        balance_auth_status = 'cancelled_booking'
//        balance_auth_cancelled_at = now
//   4. Fires customer + internal notifications via the existing
//      send-system-email / send-booking-confirmation infrastructure
//      so the customer learns we couldn't reserve their balance and
//      ops sees the cancellation alongside the failed-attempt
//      history.
//   5. Best-effort: tells HCP the job is cancelled (if it was
//      synced) so the dispatcher dashboard reflects reality.
//
// Idempotent — safe to call multiple times. Re-runs short-circuit
// on the cancelled status.
//
// Invocation:
//   POST { booking_id: string, reason?: string }

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
    `[cancel-booking-for-auth-failure] ${step}`,
    data !== undefined ? JSON.stringify(data) : "",
  );

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const bookingId: string | undefined = body?.booking_id || body?.bookingId;
    const reason: string =
      body?.reason ||
      "Balance pre-authorization failed after the maximum allowed retries.";

    if (!bookingId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing booking_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    log("Cancelling booking", { bookingId, reason });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .select("*")
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

    if (booking.status === "cancelled") {
      return ok({
        success: true,
        skipped: "already_cancelled",
        booking_id: bookingId,
      });
    }

    const slug = slugFromBookingColumn(booking.stripe_account_slug);
    let secretKey: string;
    try {
      secretKey = requireStripeSecretKey(slug);
    } catch (err: unknown) {
      throw new Error(
        `Stripe secret key not configured for account "${slug}": ${
          (err as Error)?.message
        }`,
      );
    }
    const stripe = new Stripe(secretKey, { apiVersion: "2023-10-16" });

    // === 1. Refund the deposit ===
    let refundId: string | null = null;
    let refundError: string | null = null;
    if (booking.stripe_payment_intent_id) {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: booking.stripe_payment_intent_id,
          reason: "requested_by_customer",
          metadata: {
            booking_id: bookingId,
            cancellation_reason: "balance_authorization_failed",
          },
        });
        refundId = refund.id;
        log("Deposit refunded", { refundId, paymentIntent: booking.stripe_payment_intent_id });
      } catch (err: unknown) {
        // Refund failure is non-fatal — ops can issue manually.
        refundError = (err as Error)?.message || String(err);
        log("Deposit refund failed (non-fatal)", { error: refundError });
      }
    } else {
      log("No deposit PaymentIntent on booking — skipping refund");
    }

    // === 2. Release any lingering hold ===
    if (booking.balance_auth_payment_intent_id) {
      try {
        await stripe.paymentIntents.cancel(
          booking.balance_auth_payment_intent_id,
          { cancellation_reason: "duplicate" },
        );
        log("Released balance hold", {
          paymentIntent: booking.balance_auth_payment_intent_id,
        });
      } catch (err: unknown) {
        log("Balance hold cancel returned non-fatal error", {
          error: (err as Error)?.message,
        });
      }
    }

    // === 3. Mark the booking cancelled ===
    const now = new Date().toISOString();
    await supabase
      .from("bookings")
      .update({
        status: "cancelled",
        payment_status: refundError ? "refund_failed" : "refunded",
        balance_auth_status: "cancelled_booking",
        balance_auth_cancelled_at: now,
        cancelled_at: now,
        cancellation_reason: reason,
        updated_at: now,
      })
      .eq("id", bookingId);

    // === 4. Notifications (best-effort, fire-and-forget) ===
    const fanOut: Promise<unknown>[] = [];

    fanOut.push(
      supabase.functions
        .invoke("send-system-email", {
          body: {
            type: "booking_cancelled_auth_failed",
            booking_id: bookingId,
            reason,
            refund_id: refundId,
            refund_error: refundError,
          },
        })
        .then(() => log("Customer cancellation email queued"))
        .catch((e) =>
          log("Customer cancellation email failed", {
            error: (e as Error)?.message,
          }),
        ),
    );

    fanOut.push(
      supabase.functions
        .invoke("notify-booking", {
          body: {
            bookingId,
            event: "balance_auth_failed_cancelled",
          },
        })
        .then(() => log("Ops Slack/Sheet notification queued"))
        .catch((e) =>
          log("Ops notification failed", { error: (e as Error)?.message }),
        ),
    );

    // === 5. Cancel any HCP job (best-effort) ===
    if (booking.hcp_job_id) {
      fanOut.push(
        (async () => {
          const hcpKey =
            Deno.env.get("HCP_API_KEY") ||
            Deno.env.get("HOUSECALL_PRO_API_KEY") ||
            Deno.env.get("HCP_LIVE_API_KEY");
          if (!hcpKey) {
            log("HCP_API_KEY not configured — skipping HCP cancel");
            return;
          }
          try {
            await fetch(
              `https://api.housecallpro.com/jobs/${booking.hcp_job_id}/cancel`,
              {
                method: "PUT",
                headers: {
                  Authorization: `Token ${hcpKey}`,
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  cancellation_reason:
                    "Booking cancelled — balance pre-authorization failed",
                }),
              },
            );
            log("HCP job cancellation requested", {
              hcp_job_id: booking.hcp_job_id,
            });
          } catch (err: unknown) {
            log("HCP job cancellation failed (non-fatal)", {
              error: (err as Error)?.message,
            });
          }
        })(),
      );
    }

    // Keep the worker alive long enough for the fan-out to land.
    const settled = Promise.allSettled(fanOut);
    const edgeRuntime = (globalThis as { EdgeRuntime?: { waitUntil?: (p: Promise<unknown>) => void } })
      .EdgeRuntime;
    if (edgeRuntime?.waitUntil) {
      edgeRuntime.waitUntil(settled);
    } else {
      settled.catch(() => {});
    }

    log("Booking cancelled successfully", {
      bookingId,
      refundId,
      refundError,
    });

    return ok({
      success: true,
      booking_id: bookingId,
      cancelled_at: now,
      refund_id: refundId,
      refund_error: refundError,
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
