import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Enhanced logging utility
const logStep = (step: string, data?: any) => {
  console.log(`🔄 [create-payment-intent] ${step}`, data ? JSON.stringify(data, null, 2) : '');
};

serve(async (req) => {
  logStep("Request received", { method: req.method, url: req.url });
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    
    logStep("Supabase client initialized");

    // Parse request body
    const body = await req.json();
    logStep("Request body parsed", { 
      hasAmount: !!body.amount,
      hasCustomerEmail: !!body.customerEmail,
      paymentType: body.paymentType 
    });
    
    const {
      amount,
      customerEmail,
      customerName,
      customerPhone,
      paymentType,
      booking_data,
      cleaningType,
      frequency,
      serviceAddress,
      city,
      state,
      zipCode
    } = body;

    // Validate required fields
    if (!customerEmail) {
      logStep("Validation failed - missing email");
      return new Response(
        JSON.stringify({ 
          error: "Customer email is required",
          details: "A valid email address must be provided for payment processing" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Check Stripe configuration
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      logStep("Configuration error - missing Stripe key");
      return new Response(
        JSON.stringify({ 
          error: "Payment system not configured",
          details: "Stripe secret key is missing from server configuration" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Initialize Stripe
    logStep("Initializing Stripe");
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
    let customerId: string;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      const customer = await stripe.customers.create({
        email: customerEmail,
        name: customerName,
        phone: customerPhone,
        address: serviceAddress ? {
          line1: serviceAddress,
          city: city,
          state: state,
          postal_code: zipCode,
          country: 'US'
        } : undefined
      });
      customerId = customer.id;
      logStep("Created new customer", { customerId });
    }

    // Determine if this is a setup intent (pay after service) or payment intent
    const isSetupIntent = paymentType === 'pay_after_service' || amount === 0;
    logStep("Payment type determined", { isSetupIntent, paymentType, amount });

    if (isSetupIntent) {
      // Create SetupIntent for $0 authorization (pay after service)
      logStep("Creating SetupIntent for card authorization");
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session',
        metadata: {
          customer_email: customerEmail,
          customer_name: customerName || '',
          customer_phone: customerPhone || '',
          payment_type: paymentType || 'pay_after_service',
          cleaning_type: cleaningType || '',
          frequency: frequency || '',
          service_address: serviceAddress || '',
          city: city || '',
          state: state || '',
          zip_code: zipCode || ''
        }
      });
      
      logStep("SetupIntent created successfully", { id: setupIntent.id });

      // Create order record with setup intent
      const orderData = {
        amount: 0, // No charge for pay after service
        customer_email: customerEmail,
        customer_name: customerName,
        customer_phone: customerPhone,
        service_details: {
          cleaningType: cleaningType || '',
          frequency: frequency || '',
          paymentType: paymentType,
          serviceAddress: serviceAddress || '',
          city: city || '',
          state: state || '',
          zipCode: zipCode || '',
          bookingData: booking_data || {}
        },
        stripe_setup_intent_id: setupIntent.id,
        status: 'authorized'
      };

      const { data: order, error: orderError } = await supabaseClient
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        logStep("Order creation error", { error: orderError });
        throw new Error(`Failed to create order: ${orderError.message}`);
      }

      logStep("Order created successfully", { orderId: order.id });

      return new Response(JSON.stringify({
        success: true,
        client_secret: setupIntent.client_secret,
        setup_intent_id: setupIntent.id,
        customer_id: customerId,
        order_id: order.id,
        amount: 0,
        payment_type: paymentType,
        is_setup_intent: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else {
      // Create PaymentIntent for immediate payment
      logStep("Creating PaymentIntent for immediate payment");
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        customer: customerId,
        payment_method_types: ['card'],
        capture_method: 'automatic',
        setup_future_usage: frequency !== 'one-time' ? 'off_session' : undefined,
        metadata: {
          customer_email: customerEmail,
          customer_name: customerName || '',
          customer_phone: customerPhone || '',
          payment_type: paymentType || 'immediate',
          cleaning_type: cleaningType || '',
          frequency: frequency || '',
          service_address: serviceAddress || '',
          city: city || '',
          state: state || '',
          zip_code: zipCode || ''
        }
      });
      
      logStep("PaymentIntent created successfully", { id: paymentIntent.id, amount: paymentIntent.amount });

      // Create order record with payment intent
      const orderData = {
        amount: paymentIntent.amount, // Amount in cents
        customer_email: customerEmail,
        customer_name: customerName,
        customer_phone: customerPhone,
        service_details: {
          cleaningType: cleaningType || '',
          frequency: frequency || '',
          paymentType: paymentType,
          serviceAddress: serviceAddress || '',
          city: city || '',
          state: state || '',
          zipCode: zipCode || '',
          bookingData: booking_data || {}
        },
        stripe_payment_intent_id: paymentIntent.id,
        status: 'pending_payment'
      };

      const { data: order, error: orderError } = await supabaseClient
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        logStep("Order creation error", { error: orderError });
        throw new Error(`Failed to create order: ${orderError.message}`);
      }

      logStep("Order created successfully", { orderId: order.id });

      return new Response(JSON.stringify({
        success: true,
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        customer_id: customerId,
        order_id: order.id,
        amount: paymentIntent.amount,
        payment_type: paymentType,
        is_setup_intent: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

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