import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  bookingColumnFromSlug,
  getStripePublishableKey,
  requireStripeSecretKey,
  resolveStripeAccount,
  slugFromCustomerLocation,
  type StripeAccountSlug,
} from "../_shared/stripe-env.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Bump this when debugging deployment mismatches
const FUNCTION_VERSION = "2026-05-08-state-strict";

/**
 * Dual-account Stripe integration with STRICT state-based routing.
 *
 *   * NY customers           → `try`  account (legacy AlphaLux NY ops)
 *                               Stamped as `alphalux_ny` on bookings.
 *   * CA + TX customers      → `book` account (new CA/TX ops)
 *                               Stamped as `book` on bookings.
 *
 * Routing priority (most authoritative first — first non-null wins):
 *
 *   1. `customerData.state` (e.g. "CA", "NY", "TX"). Strict — a CA
 *      customer can never be charged against the NY-only `try`
 *      account, regardless of which subdomain they happen to be on.
 *   2. `customerData.zip` first 3 digits, mapped to the same state
 *      ranges that `/book/zip` already validates against.
 *   3. The request body's explicit `account` override (legacy / dev).
 *   4. The Origin / Referer / Host header.
 *   5. Falls through to `try` (the legacy default — safe backstop).
 *
 * The selected slug is stamped on the booking row so downstream
 * functions (send-balance-invoice, stripe-webhook, etc.) know which
 * account to use for the saved card / future charges.
 */

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
      metadata,
      account: accountOverride,
    } = body;

    // STRICT state-based routing. The customer's state / zip is the
    // single most authoritative signal — neither subdomain nor body
    // override is allowed to move a CA/TX customer onto the NY-only
    // try account (or vice versa). Host detection only matters when
    // the request literally has no location info attached (e.g. an
    // out-of-band probe with no customer payload yet).
    const customerState =
      customerData?.state ?? bookingData?.customerState ?? null;
    const customerZip =
      customerData?.zip ??
      customerData?.postal_code ??
      bookingData?.zipCode ??
      null;

    const stateSlug = slugFromCustomerLocation(customerState, customerZip);
    let accountSlug: StripeAccountSlug;
    let routingSource: "state" | "zip" | "override" | "host" | "default";
    if (stateSlug) {
      accountSlug = stateSlug;
      routingSource = customerState ? "state" : "zip";
    } else {
      // No conclusive location info — fall back to the override + host
      // detection chain (the dual-subdomain v1 behaviour).
      accountSlug = resolveStripeAccount(req, accountOverride);
      routingSource = accountOverride ? "override" : "host";
    }

    const accountColumnValue = bookingColumnFromSlug(accountSlug);
    logStep("Resolved Stripe account", {
      slug: accountSlug,
      routingSource,
      customerState,
      customerZip,
      bookingColumn: accountColumnValue,
      accountOverride,
      origin: req.headers.get("origin"),
    });

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
      secretKey = requireStripeSecretKey(accountSlug);
    } catch (err: any) {
      logStep("Configuration error - Stripe secret key missing", {
        slug: accountSlug,
      });
      return new Response(
        JSON.stringify({
          error: "Payment system not configured",
          details:
            err?.message ||
            (accountSlug === "book"
              ? "STRIPE_SECRET_KEY_BOOK must be set in Supabase secrets for the book.alphaluxclean.com subdomain."
              : "STRIPE_SECRET_KEY (or STRIPE_SECRET_KEY_ALPHALUX) must be set in Supabase secrets."),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
      );
    }

    // Publishable key for THIS account. Returning it inline alongside
    // the client secret means the client can boot Stripe.js against
    // the correct account in a single round-trip, and we can never
    // mismatch it with the secret key resolved above. Both accounts
    // bundle a fallback pk in `_shared/stripe-env.ts` so this is
    // always non-null.
    const publishableKey = getStripePublishableKey(accountSlug);

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
        // Stamp the resolved account slug so downstream functions
        // (send-balance-invoice, stripe-webhook, etc.) know which
        // Stripe account this booking belongs to. `try` rows keep the
        // legacy `alphalux_ny` literal for backwards compat;
        // `book` rows stamp `book`.
        stripe_account_slug: accountColumnValue,
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
        // Save the card to the Stripe Customer after this payment so we
        // can charge the remaining balance off-session (e.g. the 50%
        // post-service balance for one-time bookings, or any future
        // recurring/upsell). Stripe will automatically attach the
        // PaymentMethod to the Customer on success when this is set.
        setup_future_usage: 'off_session',
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
          stripe_account_slug: accountColumnValue,
        })
        .eq('id', bookingId);
      logStep("Booking updated with payment intent", {
        bookingId,
        slug: accountSlug,
      });
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
      // Account slug + publishable key for this PaymentIntent. The
      // client uses `publishableKey` to boot Stripe.js against the
      // correct account in a single round-trip; `account` is echoed
      // back so the client can sanity-check it ended up on the same
      // account it asked for.
      account: accountSlug,
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
