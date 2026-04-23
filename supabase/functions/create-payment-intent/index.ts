import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  resolveAccountForZip,
  resolveSlugForZip,
  getCredentials,
} from "../_shared/stripe-accounts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Bump this when debugging deployment mismatches
const FUNCTION_VERSION = "2026-01-24-01";

const logStep = (step: string, data?: any) => {
  console.log(`🔄 [create-payment-intent] ${step}`, data ? JSON.stringify(data, null, 2) : '');
};

serve(async (req) => {
  logStep("Request received", { method: req.method, url: req.url, version: FUNCTION_VERSION });
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with SERVICE ROLE (bypasses RLS)
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
      // New fields for customer/booking creation
      customerData,
      bookingData,
      metadata
    } = body;

    // Validate required fields
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

    // Resolve which Stripe account should receive this payment based
    // on the service ZIP. Falls back to the NY account if the ZIP is
    // unmapped or the target account isn't configured — the ZIP
    // allow-list in `validate-zip` should stop foreign ZIPs upstream,
    // but this is belt-and-suspenders.
    const serviceZip =
      bookingData?.zipCode ||
      customerData?.zip ||
      body.zipCode ||
      body.serviceZip ||
      null;
    const account = resolveAccountForZip(serviceZip);
    if (!account) {
      logStep("Configuration error - no Stripe account configured", { serviceZip });
      return new Response(
        JSON.stringify({
          error: "Payment system not configured",
          details:
            "No Stripe account is configured. Set STRIPE_SECRET_KEY_NY (and STRIPE_SECRET_KEY_CATX if serving CA/TX).",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
      );
    }
    const resolvedSlug = account.slug;
    logStep("Resolved Stripe account for booking", {
      serviceZip,
      slug: resolvedSlug,
      account: account.displayName,
    });

    // Initialize Stripe with the account-specific secret.
    const stripe = new Stripe(account.secretKey, {
      apiVersion: "2023-10-16",
    });

    let customerId: string | null = null;
    let bookingId: string | null = existingBookingId || null;
    let stripeCustomerId: string;

    // === STEP 1: Upsert Customer (using service role - bypasses RLS) ===
    if (customerData) {
      logStep("Upserting customer with service role", { email: customerData.email });
      
      // Check if customer exists
      const { data: existingCustomer } = await supabaseClient
        .from('customers')
        .select('id, stripe_customer_id')
        .eq('email', customerData.email)
        .single();

      if (existingCustomer) {
        // Update existing customer
        const { data: updatedCustomer, error: updateError } = await supabaseClient
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
        // Create new customer
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
      // booking_status enum does NOT include 'payment_pending'
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
        source: bookingData.source || 'customer_web',
        stripe_account_slug: resolvedSlug,
      };

      // Reuse the booking row if the client passed one in (typical
      // when the customer applies / removes a promo code and we need
      // to recreate the PaymentIntent without duplicating the booking).
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

      // Update customer record with Stripe ID
      if (customerId) {
        await supabaseClient
          .from('customers')
          .update({ stripe_customer_id: stripeCustomerId })
          .eq('id', customerId);
      }
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
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(paymentAmount * 100), // Convert to cents
      currency: 'usd',
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      capture_method: 'automatic',
      metadata: {
        booking_id: bookingId || '',
        customer_id: customerId || '',
        customer_email: email,
        payment_type: paymentType || 'deposit',
        stripe_account_slug: resolvedSlug,
        ...(metadata || {})
      }
    });
    
    logStep("PaymentIntent created", { id: paymentIntent.id, amount: paymentIntent.amount });

    // Update booking with payment intent ID and the resolved account
    // slug, so every downstream flow (webhook, balance invoice,
    // refund) hits the same Stripe account this PaymentIntent lives on.
    if (bookingId) {
      await supabaseClient
        .from('bookings')
        .update({
          stripe_payment_intent_id: paymentIntent.id,
          stripe_account_slug: resolvedSlug,
        })
        .eq('id', bookingId);
      logStep("Booking updated with payment intent", { bookingId, slug: resolvedSlug });
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
      stripeAccountSlug: resolvedSlug,
      // Publishable key is safe to return alongside the client secret —
      // the client needs it to boot stripe.js against the correct
      // account. Null only when the account row has no publishable
      // key configured, in which case the client falls back to
      // `/get-stripe-config` and its own hard-coded fallback.
      publishableKey: account.publishableKey,
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