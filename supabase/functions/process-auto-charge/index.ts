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

  try {
    const { orderId } = await req.json();

    // Create Supabase client with service role for admin operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Initialize Stripe
    const stripe = new Stripe((Deno.env.get("STRIPE_SECRET_KEY") || Deno.env.get("STRIPE_SECRET_KEY_ALPHALUX")) || "", {
      apiVersion: "2023-10-16",
    });

    // Get order details
    const { data: order, error: orderError } = await supabaseService
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    // Check if order is already charged
    if (order.status === "paid") {
      return new Response(
        JSON.stringify({ message: "Order already charged" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the customer's payment method from Stripe session
    if (!order.stripe_session_id) {
      throw new Error("No Stripe session found for this order");
    }

    const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
    
    if (!session.customer) {
      throw new Error("No customer found in Stripe session");
    }

    // Get customer's default payment method
    const customer = await stripe.customers.retrieve(session.customer as string);
    if (!customer || customer.deleted) {
      throw new Error("Customer not found in Stripe");
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: session.customer as string,
      type: "card",
    });

    if (paymentMethods.data.length === 0) {
      throw new Error("No payment method found for customer");
    }

    // Create payment intent for auto-charge
    const paymentIntent = await stripe.paymentIntents.create({
      amount: order.amount,
      currency: order.currency || "usd",
      customer: session.customer as string,
      payment_method: paymentMethods.data[0].id,
      confirm: true,
      return_url: `${req.headers.get("origin")}/payment-success`,
      description: `Auto-charge for completed service - Order ${order.id}`,
    });

    // Update order status
    await supabaseService
      .from("orders")
      .update({
        status: "paid",
        completed_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    // Send confirmation email
    await supabaseService.functions.invoke("send-order-confirmation", {
      body: {
        customerEmail: order.customer_email,
        customerName: order.customer_name,
        orderId: order.id,
        amount: order.amount,
        isAutoCharge: true,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        paymentIntentId: paymentIntent.id,
        message: "Auto-charge processed successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Auto-charge error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});