import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Map a `bookings.time_slot` id to a US wall-clock "HH:MM-HH:MM"
 * window. Mirrors the customer-facing `TIME_SLOTS` definition in
 * `src/components/booking/OfferDateTimePicker.tsx` so the HCP job
 * lands at the same arrival window the customer saw on the offer
 * page. Falls back to a safe daytime block if the column is null
 * or holds an unknown id (legacy bookings).
 */
const TIME_SLOT_WINDOWS: Record<string, string> = {
  early_morning: "07:00-09:00",
  morning: "09:00-11:00",
  late_morning: "11:00-13:00",
  afternoon: "13:00-15:00",
  late_afternoon: "15:00-17:00",
  evening: "17:00-19:00",
};

/**
 * Map a US-state two-letter code to the IANA timezone customers
 * across that state most commonly land in. Used as a fallback
 * when `bookings.timezone` is missing — the booking flow doesn't
 * currently capture the customer's timezone reliably, so older
 * rows have either UTC or `America/Chicago` regardless of the
 * actual service address. Routing on state is the next-best
 * heuristic for a single-state-per-customer service like
 * residential cleaning.
 */
function timezoneForState(state: string | null | undefined): string {
  switch ((state || "").toUpperCase()) {
    case "NY":
      return "America/New_York";
    case "CA":
      return "America/Los_Angeles";
    case "TX":
      return "America/Chicago";
    default:
      return "America/New_York";
  }
}

/**
 * Build the payload `sync-booking-to-hcp` expects from a joined
 * booking + customer row. Centralised here so this function and any
 * future backfill / retry tooling produce identical shapes.
 */
function buildHcpPayload(booking: any, customer: any) {
  // Time window — prefer the canonical `time_slot` id, fall back to
  // the legacy `service_time_window` text column, then to a safe
  // morning default if both are missing.
  const slotId: string | undefined = booking?.time_slot;
  const windowFromSlot = slotId ? TIME_SLOT_WINDOWS[slotId] : undefined;
  const time_window =
    windowFromSlot ||
    (typeof booking?.service_time_window === "string" && booking.service_time_window) ||
    "09:00-11:00";

  const state = customer?.state || booking?.state || "NY";
  const timezone = booking?.timezone && /[A-Za-z]+\/[A-Za-z_]+/.test(booking.timezone)
    ? booking.timezone
    : timezoneForState(state);

  // Service date — prefer the explicit column, fall back to the
  // legacy `preferred_date`. Without a date HCP can't schedule.
  const service_date = booking?.service_date || booking?.preferred_date;

  // Address: prefer the booking's snapshot, otherwise fall back to
  // the customer record. HCP rejects empty `line1`, so we coerce
  // missing values to a safe string the dispatcher can correct.
  const addr_line1 = booking?.address_line1 || customer?.address_line1 || "";
  const addr_line2 = booking?.address_line2 || customer?.address_line2 || "";
  const addr_city = customer?.city || booking?.city || "";
  const addr_state = state;
  const addr_postal = customer?.postal_code || booking?.zip_code || "";

  // Pricing — for one-time bookings we charge full price up front,
  // so `est_price` IS the total. The 90-day plan stamps total in
  // `pricing_breakdown.finalPrice` (the contract value across all
  // three months), so we honour that when present.
  const pricingBreakdown = booking?.pricing_breakdown || {};
  const total =
    Number(pricingBreakdown?.finalPrice) ||
    Number(booking?.base_price) ||
    Number(booking?.est_price) ||
    0;

  // Add-ons — column is jsonb, may be null / array of names / array
  // of { name, price } objects. Normalise to two arrays so we can
  // ship both human-readable names and the per-line pricing
  // breakdown HCP wants for line items.
  const rawAddons = Array.isArray(booking?.addons) ? booking.addons : [];
  const addonNames = rawAddons
    .map((a: any) => (typeof a === "string" ? a : a?.name))
    .filter(Boolean);
  const addonsBreakdown = rawAddons
    .map((a: any) => {
      if (typeof a === "string") return { name: a, price: 0 };
      if (a && typeof a === "object" && a.name) {
        return { name: String(a.name), price: Number(a.price) || 0 };
      }
      return null;
    })
    .filter(Boolean);

  const firstName =
    customer?.first_name ||
    (booking?.full_name ? String(booking.full_name).split(" ")[0] : "Customer");
  const lastName =
    customer?.last_name ||
    (booking?.full_name
      ? String(booking.full_name).split(" ").slice(1).join(" ")
      : "");

  return {
    booking_id: booking.id,
    customer: {
      first_name: String(firstName).trim() || "Customer",
      last_name: String(lastName).trim(),
      email: String(customer?.email || "").trim(),
      phone: String(customer?.phone || "").trim(),
    },
    address: {
      line1: String(addr_line1).trim(),
      line2: String(addr_line2 || "").trim(),
      city: String(addr_city).trim(),
      state: String(addr_state).trim(),
      postal_code: String(addr_postal).trim(),
    },
    service: {
      type: booking?.service_type || "deep",
      frequency: booking?.frequency || "one_time",
      sqft_range: booking?.sqft_or_bedrooms || booking?.home_size || "",
      addons: addonNames,
    },
    schedule: {
      date: service_date || "",
      time_window,
      timezone,
    },
    pricing: {
      total,
      mrr_est: Number(booking?.mrr) || 0,
      arr_est: Number(booking?.arr) || 0,
      currency: "USD",
      addons_breakdown: addonsBreakdown,
    },
    source: booking?.source_channel || booking?.source || "UI_DIRECT",
    special_instructions: booking?.special_instructions || booking?.notes || "",
    property_details: booking?.property_details || undefined,
    first_booking: Boolean(booking?.first_booking),
    recurring_active: Boolean(booking?.recurring_active),
  };
}

serve(async (req) => {
  console.log("Confirm booking payment function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      bookingId,
      paymentIntentId,
      subscriptionId,
      paymentStatus = "deposit_paid",
    } = await req.json();

    console.log("Confirming payment for booking:", bookingId);

    if (!bookingId) {
      throw new Error("Missing required field: bookingId");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const updateData: Record<string, any> = {
      status: "confirmed",
      payment_status: paymentStatus,
      paid_at: new Date().toISOString(),
    };

    if (paymentIntentId) updateData.stripe_payment_intent_id = paymentIntentId;
    if (subscriptionId) updateData.stripe_subscription_id = subscriptionId;

    const { data: booking, error: updateError } = await supabase
      .from("bookings")
      .update(updateData)
      .eq("id", bookingId)
      .select("*")
      .single();

    if (updateError) {
      console.error("Error updating booking:", updateError);
      throw new Error(`Failed to update booking: ${updateError.message}`);
    }

    console.log("Booking confirmed successfully:", booking.id);

    // Look up the linked customer separately so we don't depend on a
    // FK alias the schema may not expose to PostgREST.
    let customer: any = null;
    if (booking.customer_id) {
      const { data: customerRow } = await supabase
        .from("customers")
        .select(
          "id, email, phone, first_name, last_name, name, address_line1, address_line2, city, state, postal_code, stripe_customer_id",
        )
        .eq("id", booking.customer_id)
        .maybeSingle();
      customer = customerRow;
    }

    // -------- Fan out to integrations --------
    //
    // 1) GHL / Zapier webhooks (existing behaviour).
    try {
      const webhookResult = await supabase.functions.invoke(
        "enhanced-booking-webhook-v2",
        {
          body: { booking_id: booking.id, action: "payment_confirmed" },
        },
      );
      if (webhookResult.error) {
        console.error("Webhook trigger error:", webhookResult.error);
      } else {
        console.log("Webhook triggered successfully");
      }
    } catch (webhookError) {
      console.error("Failed to trigger webhook:", webhookError);
    }

    // 2) Housecall Pro sync — creates / updates the HCP customer +
    //    schedules the job at the customer's chosen arrival window
    //    in their local timezone. Idempotent on `booking_id` via
    //    the `hcp_sync_log` table; safe to retry. We swallow errors
    //    here so a transient HCP outage doesn't fail the booking
    //    confirmation — `retry-failed-hcp-syncs` picks them up.
    let hcpResult: { customerId?: string; jobId?: string; error?: string } | null = null;
    try {
      const hcpPayload = buildHcpPayload(booking, customer);
      const { data, error } = await supabase.functions.invoke(
        "sync-booking-to-hcp",
        { body: hcpPayload },
      );
      if (error) {
        console.error("HCP sync error:", error.message || error);
        hcpResult = { error: error.message || "HCP sync failed" };
      } else if (data?.success) {
        hcpResult = { customerId: data.customerId, jobId: data.jobId };
        console.log("HCP sync succeeded", hcpResult);
      } else {
        console.error("HCP sync returned non-success:", data);
        hcpResult = { error: data?.error || "HCP sync returned non-success" };
      }
    } catch (hcpError) {
      console.error("HCP sync threw:", hcpError);
      hcpResult = {
        error: hcpError instanceof Error ? hcpError.message : String(hcpError),
      };
    }

    // 3) Booking notification fan-out — Slack + Google Sheet (via
    //    notify-booking). The function reads SLACK_WEBHOOK_URL and
    //    BOOKING_TRACKER_WEBHOOK_URL from Supabase secrets and is a
    //    no-op for any destination that isn't configured. Errors
    //    are swallowed here for the same reason as the HCP sync —
    //    a Slack outage shouldn't block a paid booking.
    try {
      const notifyResult = await supabase.functions.invoke("notify-booking", {
        body: { bookingId: booking.id, event: "payment_confirmed" },
      });
      if (notifyResult.error) {
        console.error("notify-booking error:", notifyResult.error.message || notifyResult.error);
      } else {
        console.log("notify-booking dispatched", notifyResult.data?.results);
      }
    } catch (notifyError) {
      console.error("notify-booking threw:", notifyError);
    }

    // 4) Send a balance invoice if there's a remaining balance and
    //    one hasn't been created yet. After the deposit removal this
    //    only fires for the 90-day plan.
    const balanceDue = booking.balance_due || 0;
    if (balanceDue > 0 && !booking.stripe_balance_invoice_id) {
      console.log("Balance due detected, sending invoice:", balanceDue);
      try {
        const invoiceResult = await supabase.functions.invoke(
          "send-balance-invoice",
          { body: { bookingId: booking.id, daysUntilDue: 7 } },
        );
        if (invoiceResult.error) {
          console.error("Balance invoice error:", invoiceResult.error);
        } else {
          console.log("Balance invoice sent successfully:", invoiceResult.data);
        }
      } catch (invoiceError) {
        console.error("Failed to trigger balance invoice:", invoiceError);
      }
    } else {
      console.log("Skipping balance invoice", {
        balanceDue,
        alreadyInvoiced: !!booking.stripe_balance_invoice_id,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        booking,
        balanceInvoiceTriggered: balanceDue > 0,
        hcp: hcpResult,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Confirm booking payment error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        success: false,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
