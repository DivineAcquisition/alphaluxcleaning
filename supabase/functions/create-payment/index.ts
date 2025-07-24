import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { 
      amount, 
      squareFootage, 
      cleaningType, 
      frequency, 
      addOns,
      customerName,
      customerEmail,
      customerPhone 
    } = await req.json();

    if (!amount || !customerEmail) {
      throw new Error("Missing required fields: amount and customerEmail");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if a Stripe customer record exists for this email
    const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create a one-time payment session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: `Bay Area Cleaning Pros - ${cleaningType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Cleaning`,
              description: `${squareFootage} sq ft • ${frequency?.replace(/_/g, ' ')} service${addOns?.length ? ` • Add-ons: ${addOns.join(', ')}` : ''}`
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/`,
      metadata: {
        squareFootage: squareFootage?.toString() || "",
        cleaningType: cleaningType || "",
        frequency: frequency || "",
        addOns: addOns?.join(",") || "",
      }
    });

    // Create order record in Supabase
    const orderData = {
      stripe_session_id: session.id,
      amount: Math.round(amount * 100), // Store in cents
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      square_footage: squareFootage,
      cleaning_type: cleaningType,
      frequency: frequency,
      add_ons: addOns,
      service_details: {
        squareFootage,
        cleaningType,
        frequency,
        addOns,
        totalAmount: amount
      },
      status: "pending",
      created_at: new Date().toISOString()
    };

    await supabaseClient.from("orders").insert(orderData);

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