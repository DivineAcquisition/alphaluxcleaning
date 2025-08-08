import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-REFUND] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    const { order_id, amount, reason } = await req.json();
    if (!order_id || !amount || !reason) {
      throw new Error("Missing required fields: order_id, amount, reason");
    }

    logStep("Refund request received", { order_id, amount, reason });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    logStep("Order found", { orderId: order.id, stripeSessionId: order.stripe_session_id });

    // Get payment intent from checkout session
    const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
    const paymentIntentId = session.payment_intent as string;

    if (!paymentIntentId) {
      throw new Error("No payment intent found for this order");
    }

    // Create refund
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount, // Amount in cents
      reason: 'requested_by_customer',
      metadata: {
        order_id: order_id,
        refund_reason: reason,
        processed_by: user.id
      }
    });

    logStep("Refund created", { refundId: refund.id, amount: refund.amount });

    // Update order status
    await supabaseClient
      .from('orders')
      .update({ 
        status: amount >= order.amount ? 'refunded' : 'partially_refunded',
        updated_at: new Date().toISOString()
      })
      .eq('id', order_id);

    // Log refund in database
    await supabaseClient
      .from('refunds')
      .insert({
        order_id: order_id,
        stripe_refund_id: refund.id,
        amount: refund.amount,
        reason: reason,
        processed_by: user.id,
        status: refund.status,
        created_at: new Date().toISOString()
      });

    logStep("Refund processed successfully", { refundId: refund.id });

    return new Response(JSON.stringify({ 
      success: true, 
      refund_id: refund.id,
      amount: refund.amount,
      status: refund.status
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in process-refund", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});