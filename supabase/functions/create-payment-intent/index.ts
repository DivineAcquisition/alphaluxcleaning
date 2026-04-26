import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  getStripePublishableKey,
  requireStripeSecretKey,
} from "../_shared/stripe-env.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Bump this when debugging deployment mismatches
const FUNCTION_VERSION = "2026-04-26-single-account";

/**
 * Single-account Stripe integration.
 *
 * AlphaLux Cleaning runs on one Stripe account
 * (`acct_1TONej6CLM640Ljs`). The previous ZIP-based router has been
 * removed — `_shared/stripe-env.ts` is the single source of truth
 * for the secret key and publishable key.
 *
 * The `stripe_account_slug` column on `bookings` is preserved at the
 * DB level for historical reasons (column has a NOT NULL default of
 * `alphalux_ny`); we keep stamping it for forward compatibility but
 * nothing reads it for routing anymore.
 */
const ACCOUNT_SLUG = "alphalux_ny";

/**
 * `bookings.source` has a CHECK constraint that only accepts a small
 * fixed set of values. Any other source (e.g. `probe`, `typeform`,
 * `recurring_upgrade`) previously caused the booking insert to fail
 * and the whole payment flow to 500. We coerce anything outside the
 * allow-list down to `customer_web` so the booking goes through.
 */
const ALLOWED_SOURCES = new Set(["customer_web", "csr_phone", "admin_manual"]);
function safeSource(raw: unknown): string {
  if (typeof raw !== "string") return "customer_web";
  return ALLOWED_SOURCES.has(raw) ? raw : "customer_web";
}

const logStep = (step: string, data?: any) => {
  console.log(`🔄 [create-payment-intent] ${step}`, data ? JSON.stringify(data, null, 2) : '');
};

serve(async (req) => {
  logStep("Request received", { method: req.method, url: req.url, version: FUNCTION_VERSION });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    logStep("Supabase client initialized with service role");

    const body = await req.json();
    logStep("Request body parsed", {
      hasAmount: !!body.amount,
      hasCustomerEmail: !!body.customerEmail,
      paymentType: body.paymentType,
      hasCustomerData: !!body.customerData,
      hasBookingData: !!body.bookingData
    });

    const {
      amount,
      customerEmail,
      customerName,
      customerPhone,
      paymentType,
      bookingId: existingBookingId,
      customerData,
      bookingData,
      metadata
    } = body;

    const email = customerEmail || customerData?.email;
    if (!email) {
      logStep("Validation failed - missing email");
      return new Response(
        JSON.stringify({
          error: "Customer email is required",
          details: "A valid email address must be provided for payment processing"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    let secretKey: string;
    try {
      secretKey = requireStripeSecretKey();
    } catch (err: any) {
      logStep("Configuration error - Stripe secret key missing");
      return new Response(
        JSON.stringify({
          error: "Payment system not configured",
          details: err?.message ||
            "STRIPE_SECRET_KEY (or STRIPE_SECRET_KEY_ALPHALUX) must be set in Supabase secrets.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
      );
    }

    // Publishable key is hard-coded in `_shared/stripe-env.ts` — it's
    // public, never expires, and is always tied to the same Stripe
    // account as the secret key resolved above. Returning it inline
    // means the client never has to round-trip to /get-stripe-config
    // and can't accidentally boot Elements with a foreign-account key.
    const publishableKey = getStripePublishableKey();

    const stripe = new Stripe(secretKey, { apiVersion: "2023-10-16" });

    let customerId: string | null = null;
    let bookingId: string | null = existingBookingId || null;
    let stripeCustomerId: string;

    // === STEP 1: Upsert Customer (using service role - bypasses RLS) ===
    if (customerData) {
      logStep("Upserting customer with service role", { email: customerData.email });

      const { data: existingCustomer } = await supabaseClient
        .from('customers')
        .select('id, stripe_customer_id')
        .eq('email', customerData.email)
        .single();

      if (existingCustomer) {
        const { error: updateError } = await supabaseClient
          .from('customers')
          .update({
            first_name: customerData.firstName,
            last_name: customerData.lastName,
            name: `${customerData.firstName} ${customerData.lastName}`.trim(),
            phone: customerData.phone,
            address_line1: customerData.address1,
            address_line2: customerData.address2,
            city: customerData.city,
            state: customerData.state,
            postal_code: customerData.zip,
          })
          .eq('id', existingCustomer.id)
          .select()
          .single();

        if (updateError) {
          logStep("Customer update error", { error: updateError });
          throw new Error(`Failed to update customer: ${updateError.message}`);
        }

        customerId = existingCustomer.id;
        logStep("Customer updated", { customerId });
      } else {
        const { data: newCustomer, error: insertError } = await supabaseClient
          .from('customers')
          .insert({
            email: customerData.email,
            first_name: customerData.firstName,
            last_name: customerData.lastName,
            name: `${customerData.firstName} ${customerData.lastName}`.trim(),
            phone: customerData.phone,
            address_line1: customerData.address1,
            address_line2: customerData.address2,
            city: customerData.city,
            state: customerData.state,
            postal_code: customerData.zip,
          })
          .select()
          .single();

        if (insertError) {
          logStep("Customer insert error", { error: insertError });
          throw new Error(`Failed to create customer: ${insertError.message}`);
        }

        customerId = newCustomer.id;
        logStep("Customer created", { customerId });
      }
    }

    // === STEP 2: Create or update Booking if data provided ===
    if (bookingData && customerId) {
      const safeBookingStatus: "pending" = "pending";
      const bookingFields = {
        customer_id: customerId,
        service_type: bookingData.serviceType || 'standard',
        frequency: bookingData.frequency || 'one-time',
        sqft_or_bedrooms: bookingData.sqftOrBedrooms || '',
        home_size: bookingData.homeSize,
        zip_code: bookingData.zipCode,
        est_price: bookingData.estPrice || amount,
        deposit_amount: bookingData.depositAmount || amount,
        base_price: bookingData.basePrice || bookingData.estPrice || amount,
        balance_due: bookingData.balanceDue,
        offer_name: bookingData.offerName,
        offer_type: bookingData.offerType,
        visit_count: bookingData.visitCount,
        is_recurring: bookingData.isRecurring || false,
        promo_code: bookingData.promoCode,
        promo_discount_cents: bookingData.promoDiscountCents || 0,
        pricing_breakdown: bookingData.pricingBreakdown,
        service_date: bookingData.serviceDate || null,
        time_slot: bookingData.timeSlot || null,
        special_instructions: bookingData.specialInstructions || null,
        property_details: bookingData.propertyDetails || null,
        addons: bookingData.addons || null,
        address_line1: bookingData.addressLine1 || null,
        address_line2: bookingData.addressLine2 || null,
        full_name: bookingData.fullName || null,
        source: safeSource(bookingData.source),
        // The DB column is NOT NULL with a default of 'alphalux_ny'.
        // We continue to write it explicitly so the value is stable
        // even if the default ever changes.
        stripe_account_slug: ACCOUNT_SLUG,
      };

      if (bookingId) {
        logStep("Updating existing booking", { bookingId });
        const { error: updateError } = await supabaseClient
          .from('bookings')
          .update(bookingFields)
          .eq('id', bookingId);
        if (updateError) {
          logStep("Booking update error, will create new", { error: updateError });
          bookingId = null;
        }
      }

      if (!bookingId) {
        logStep("Creating booking with service role", { customerId });
        const { data: newBooking, error: bookingError } = await supabaseClient
          .from('bookings')
          .insert({
            ...bookingFields,
            status: safeBookingStatus,
            payment_status: 'pending',
          })
          .select()
          .single();

        if (bookingError) {
          logStep("Booking creation error", { error: bookingError });
          throw new Error(`Failed to create booking: ${bookingError.message}`);
        }
        bookingId = newBooking.id;
        logStep("Booking created", { bookingId });
      }
    }

    // === STEP 3: Find or Create Stripe Customer ===
    const name = customerName || (customerData ? `${customerData.firstName} ${customerData.lastName}`.trim() : '');
    const phone = customerPhone || customerData?.phone;

    try {
      const customers = await stripe.customers.list({ email, limit: 1 });

      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id;
        logStep("Found existing Stripe customer", { stripeCustomerId });
      } else {
        const customer = await stripe.customers.create({
          email,
          name,
          phone,
          metadata: {
            supabase_customer_id: customerId || '',
          }
        });
        stripeCustomerId = customer.id;
        logStep("Created new Stripe customer", { stripeCustomerId });

        if (customerId) {
          await supabaseClient
            .from('customers')
            .update({ stripe_customer_id: stripeCustomerId })
            .eq('id', customerId);
        }
      }
    } catch (stripeErr: any) {
      const msg = stripeErr?.message || String(stripeErr);
      const code = stripeErr?.code || stripeErr?.raw?.code;
      const isAuthIssue =
        code === "api_key_expired" ||
        code === "authentication_required" ||
        /expired api key|invalid api key|authentication/i.test(msg);
      logStep("Stripe customers.list/create failed", { code, message: msg, isAuthIssue });
      return new Response(
        JSON.stringify({
          success: false,
          error: isAuthIssue
            ? "Our payment processor is temporarily unavailable. Please try again in a moment or contact support."
            : `Payment could not be initialized: ${msg}`,
          code: isAuthIssue ? "stripe_auth_error" : (code || "stripe_error"),
          details: isAuthIssue
            ? "The Stripe API key configured on the server is expired or invalid. Ops needs to rotate STRIPE_SECRET_KEY in Supabase secrets."
            : msg,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: isAuthIssue ? 503 : 502,
        },
      );
    }

    // === STEP 4: Create Payment Intent ===
    const paymentAmount = amount || bookingData?.depositAmount || 0;

    if (paymentAmount <= 0) {
      logStep("Invalid amount", { paymentAmount });
      return new Response(
        JSON.stringify({
          error: "Invalid payment amount",
          details: "Amount must be greater than 0"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    logStep("Creating PaymentIntent", { amount: paymentAmount });
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(paymentAmount * 100),
        currency: 'usd',
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        capture_method: 'automatic',
        metadata: {
          booking_id: bookingId || '',
          customer_id: customerId || '',
          customer_email: email,
          payment_type: paymentType || 'deposit',
          ...(metadata || {})
        }
      });
    } catch (stripeErr: any) {
      const msg = stripeErr?.message || String(stripeErr);
      const code = stripeErr?.code || stripeErr?.raw?.code;
      const isAuthIssue =
        code === "api_key_expired" ||
        code === "authentication_required" ||
        /expired api key|invalid api key|authentication/i.test(msg);
      logStep("Stripe paymentIntents.create failed", { code, message: msg, isAuthIssue });
      return new Response(
        JSON.stringify({
          success: false,
          error: isAuthIssue
            ? "Our payment processor is temporarily unavailable. Please try again in a moment or contact support."
            : `Payment could not be initialized: ${msg}`,
          code: isAuthIssue ? "stripe_auth_error" : (code || "stripe_error"),
          details: isAuthIssue
            ? "The Stripe API key configured on the server is expired or invalid. Ops needs to rotate STRIPE_SECRET_KEY in Supabase secrets."
            : msg,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: isAuthIssue ? 503 : 502,
        },
      );
    }

    logStep("PaymentIntent created", { id: paymentIntent.id, amount: paymentIntent.amount });

    if (bookingId) {
      await supabaseClient
        .from('bookings')
        .update({
          stripe_payment_intent_id: paymentIntent.id,
          stripe_account_slug: ACCOUNT_SLUG,
        })
        .eq('id', bookingId);
      logStep("Booking updated with payment intent", { bookingId });
    }

    return new Response(JSON.stringify({
      success: true,
      clientSecret: paymentIntent.client_secret,
      client_secret: paymentIntent.client_secret, // Legacy support
      paymentIntentId: paymentIntent.id,
      customerId: customerId,
      bookingId: bookingId,
      stripeCustomerId: stripeCustomerId,
      amount: paymentIntent.amount,
      // Returned alongside the client secret so the front-end can
      // boot Stripe.js against the same account that owns this PI in
      // a single round-trip — no separate /get-stripe-config call
      // needed.
      publishableKey,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage, stack: error instanceof Error ? error.stack : undefined });

    return new Response(JSON.stringify({
      error: errorMessage,
      success: false,
      details: "Payment processing failed. Please try again or contact support if the issue persists."
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
