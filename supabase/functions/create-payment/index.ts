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

    console.log("Creating 20% deposit checkout session...");
    
    // Create a Stripe checkout session for 20% deposit
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : finalCustomerEmail,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: `Bay Area Cleaning Pros - 20% Deposit`,
              description: `20% deposit for ${booking_data.serviceType} cleaning service • Full amount: $${(fullAmountCents / 100).toFixed(2)}`
            },
            unit_amount: depositAmountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/booking-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/`,
      metadata: {
        payment_type: 'deposit_20',
        full_amount_cents: fullAmountCents.toString(),
        deposit_amount_cents: depositAmountCents.toString(),
        booking_data: JSON.stringify(booking_data),
        customer_name: finalCustomerName,
        customer_email: finalCustomerEmail
      }
    });
    
    console.log("20% deposit checkout session created:", session.id);

    console.log("Returning checkout URL");

    return new Response(JSON.stringify({ url: session.url }), {
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