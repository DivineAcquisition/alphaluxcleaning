import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Fetches a booking + its customer using the service role so guest
 * users on /book/details can load the record they just paid for
 * without needing a Supabase auth session.
 *
 * The booking_id (UUID) is effectively a capability token — it was
 * just minted by the create-payment-intent flow for this exact user.
 * We redact columns that customers shouldn't see (internal notes,
 * subcontractor info, referrer chain) via an allowlist.
 */

const SAFE_BOOKING_FIELDS = [
  "id",
  "customer_id",
  "service_type",
  "frequency",
  "sqft_or_bedrooms",
  "est_price",
  "status",
  "service_date",
  "service_time_window",
  "addons",
  "pricing_breakdown",
  "zip_code",
  "time_slot",
  "property_details",
  "deposit_amount",
  "balance_due",
  "special_instructions",
  "stripe_payment_intent_id",
  "stripe_balance_invoice_id",
  "balance_invoice_url",
  "hcp_customer_id",
  "hcp_job_id",
  "payment_status",
  "full_name",
  "address_line1",
  "address_line2",
  "home_size",
  "offer_type",
  "offer_name",
  "base_price",
  "visit_count",
  "is_recurring",
  "preferred_date",
  "preferred_time_block",
  "notes",
  "promo_code",
  "promo_discount_cents",
  "first_booking",
  "paid_at",
  "timezone",
  "updated_at",
  "created_at",
];

const SAFE_CUSTOMER_FIELDS = [
  "id",
  "name",
  "first_name",
  "last_name",
  "email",
  "phone",
  "address",
  "address_line1",
  "address_line2",
  "city",
  "state",
  "postal_code",
  "referral_code",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let bookingId =
      url.searchParams.get("booking_id") || url.searchParams.get("id");
    if (!bookingId && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      bookingId = body?.booking_id || body?.id || null;
    }
    if (!bookingId) {
      return new Response(
        JSON.stringify({ success: false, error: "booking_id is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    // Basic UUID shape check so we don't hammer the DB with junk.
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        bookingId,
      )
    ) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid booking_id format" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data: booking, error } = await supabase
      .from("bookings")
      .select(SAFE_BOOKING_FIELDS.join(","))
      .eq("id", bookingId)
      .maybeSingle();

    if (error) {
      console.error("get-booking-details error:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
      );
    }

    if (!booking) {
      return new Response(
        JSON.stringify({ success: false, error: "Booking not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 },
      );
    }

    let customer: Record<string, any> | null = null;
    if (booking.customer_id) {
      const { data: cust } = await supabase
        .from("customers")
        .select(SAFE_CUSTOMER_FIELDS.join(","))
        .eq("id", booking.customer_id)
        .maybeSingle();
      customer = cust ?? null;
    }

    return new Response(
      JSON.stringify({
        success: true,
        booking: { ...booking, customers: customer },
        customer,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("get-booking-details exception:", msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
