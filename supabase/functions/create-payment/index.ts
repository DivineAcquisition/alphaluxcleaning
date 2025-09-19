import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("Create payment function called with method:", req.method);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log("Request body received:", requestBody);
    
    const { 
      fullAmount,
      booking_data,
      customerName,
      customerEmail
    } = requestBody;

    // Extract customer info
    const finalCustomerEmail = booking_data?.customerEmail || customerEmail;
    const finalCustomerName = booking_data?.customerName || customerName || 'Customer';

    console.log("Validating required fields...");
    
    if (!fullAmount || !finalCustomerEmail || !booking_data) {
      console.error("Missing required fields:", { fullAmount, finalCustomerEmail, booking_data });
      throw new Error("Missing required fields: fullAmount, customerEmail, and booking_data");
    }

    // Normalize amount handling - assume fullAmount comes in dollars, convert to cents
    const fullAmountCents = fullAmount >= 1000 ? fullAmount : Math.round(fullAmount * 100);
    const depositAmountCents = Math.round(fullAmountCents * 0.2); // 20% deposit
    
    console.log("Payment calculation:", {
      originalFullAmount: fullAmount,
      fullAmountCents,
      depositAmountCents: depositAmountCents
    });

    console.log("Initializing Stripe...");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("STRIPE_SECRET_KEY not found in environment");
      throw new Error("Stripe configuration error");
    }
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    console.log("Checking for existing Stripe customer...");
    // Check if customer exists
    const customers = await stripe.customers.list({ email: finalCustomerEmail, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("Found existing customer:", customerId);
    } else {
      console.log("No existing customer found, will create new one");
    }

    console.log("Creating 20% deposit payment intent...");
    
    // Create or retrieve customer
    if (!customerId) {
      console.log("Creating new Stripe customer...");
      const customer = await stripe.customers.create({
        email: finalCustomerEmail,
        name: finalCustomerName,
      });
      customerId = customer.id;
      console.log("Created new customer:", customerId);
    }
    
    // Create a PaymentIntent for 20% deposit (embedded payment form)
    // Compact metadata to stay under 500 char limit
    const compactBookingData = {
      serviceType: booking_data.serviceType,
      homeSize: booking_data.homeSize,
      serviceDate: booking_data.serviceDate,
      serviceTime: booking_data.serviceTime,
      zipCode: booking_data.zipCode,
      totalPrice: booking_data.totalPrice
    };
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: depositAmountCents,
      currency: "usd",
      customer: customerId,
      description: `20% deposit for ${booking_data.serviceType} cleaning service • Full amount: $${(fullAmountCents / 100).toFixed(2)}`,
      metadata: {
        payment_type: 'deposit_20',
        full_amount_cents: fullAmountCents.toString(),
        deposit_amount_cents: depositAmountCents.toString(),
        booking_data: JSON.stringify(compactBookingData),
        customer_name: finalCustomerName,
        customer_email: finalCustomerEmail
      },
      payment_method_types: ['card'],
    });
    
    console.log("20% deposit payment intent created:", paymentIntent.id);

    console.log("Returning client secret for embedded payment");

    return new Response(JSON.stringify({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});