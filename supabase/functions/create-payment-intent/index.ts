import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYMENT-INTENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Initialize Supabase client with service role key for database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { 
      amount,
      customerEmail,
      customerName,
      customerPhone,
      cleaningType,
      frequency,
      squareFootage,
      addOns = [],
      bedrooms,
      bathrooms,
      serviceAddress,
      city,
      state,
      zipCode,
      paymentType = "full"
    } = await req.json();

    logStep("Request data received", { 
      amount, 
      customerEmail, 
      customerName,
      paymentType 
    });

    // Validate required fields
    if (!amount || !customerEmail || !customerName) {
      throw new Error("Missing required fields: amount, customerEmail, or customerName");
    }

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    logStep("Stripe initialized");

    // Always create or find Stripe customer
    let customer;
    const existingCustomers = await stripe.customers.list({ 
      email: customerEmail, 
      limit: 1 
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      logStep("Found existing customer", { customerId: customer.id });
      
      // Update customer with latest information
      customer = await stripe.customers.update(customer.id, {
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
      logStep("Updated existing customer");
    } else {
      // Create new customer
      customer = await stripe.customers.create({
        email: customerEmail,
        name: customerName,
        phone: customerPhone,
        address: serviceAddress ? {
          line1: serviceAddress,
          city: city,
          state: state,
          postal_code: zipCode,
          country: 'US'
        } : undefined,
        metadata: {
          source: 'bay_area_cleaning',
          cleaning_type: cleaningType || '',
          frequency: frequency || ''
        }
      });
      logStep("Created new customer", { customerId: customer.id });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      customer: customer.id,
      payment_method_types: ['card'],
      capture_method: 'automatic',
      setup_future_usage: frequency !== 'one-time' ? 'off_session' : undefined,
      metadata: {
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone || '',
        cleaning_type: cleaningType || '',
        frequency: frequency || '',
        square_footage: squareFootage?.toString() || '',
        bedrooms: bedrooms?.toString() || '',
        bathrooms: bathrooms?.toString() || '',
        add_ons: JSON.stringify(addOns),
        payment_type: paymentType,
        service_address: serviceAddress || '',
        city: city || '',
        state: state || '',
        zip_code: zipCode || ''
      }
    });

    logStep("Payment intent created", { 
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount 
    });

    // Create order record in Supabase
    const orderData = {
      amount: Math.round(amount * 100), // Store in cents
      customer_email: customerEmail,
      customer_name: customerName,
      customer_phone: customerPhone,
      service_details: {
        cleaningType: cleaningType || '',
        frequency: frequency || '',
        squareFootage: squareFootage || 0,
        bedrooms: bedrooms || 0,
        bathrooms: bathrooms || 0,
        addOns: addOns || [],
        paymentType: paymentType,
        serviceAddress: serviceAddress || '',
        city: city || '',
        state: state || '',
        zipCode: zipCode || ''
      },
      stripe_session_id: paymentIntent.id,
      stripe_customer_id: customer.id,
      status: 'pending_payment',
      payment_method: 'payment_intent'
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
      customer_id: customer.id,
      order_id: order.id,
      amount: paymentIntent.amount
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});