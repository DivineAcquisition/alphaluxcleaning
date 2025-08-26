import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey || !webhookSecret) {
      throw new Error("Missing Stripe configuration");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get the raw body and signature
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err.message });
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    logStep("Event received", { type: event.type, id: event.id });

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object, supabaseClient);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object, supabaseClient);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object, supabaseClient);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object, supabaseClient);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, supabaseClient);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, supabaseClient);
        break;
      
      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handlePaymentSucceeded(paymentIntent: any, supabaseClient: any) {
  logStep("Processing payment success", { paymentIntentId: paymentIntent.id });
  
  // Find order by payment intent ID
  const { data: orders, error } = await supabaseClient
    .from('orders')
    .select('*')
    .eq('stripe_payment_intent_id', paymentIntent.id);

  if (error || !orders?.length) {
    logStep("Order not found for payment intent", { paymentIntentId: paymentIntent.id });
    return;
  }

  const order = orders[0];
  
  // Update order status
  await supabaseClient
    .from('orders')
    .update({ 
      status: 'paid',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', order.id);

  // Generate invoice
  await supabaseClient.functions.invoke('generate-invoice', {
    body: { order_id: order.id }
  });

  // Send GHL payment webhook for successful payments
  try {
    const ghlPaymentData = {
      event_type: 'payment_successful',
      paymentIntentId: paymentIntent.id,
      order_id: order.id,
      amount: paymentIntent.amount / 100, // Convert from cents
      finalTotal: paymentIntent.amount / 100,
      paymentAmount: paymentIntent.amount / 100,
      customer: {
        name: order.customer_name || 'Unknown Customer',
        email: order.customer_email || '',
        phone: order.customer_phone || ''
      },
      serviceType: order.service_details?.service_type || 'residential_cleaning',
      homeSize: order.service_details?.cleaningType || '',
      frequency: order.service_details?.frequency || 'one-time',
      serviceDate: order.service_details?.serviceDate || order.scheduled_date,
      serviceTime: order.service_details?.serviceTime || order.scheduled_time,
      userAuthenticated: !!order.user_id
    };

    await supabaseClient.functions.invoke('send-ghl-payment-webhook', {
      body: ghlPaymentData
    });

    logStep("GHL payment webhook sent", { orderId: order.id });
  } catch (error) {
    logStep("Failed to send GHL payment webhook", { error: error.message, orderId: order.id });
  }

  logStep("Payment success processed", { orderId: order.id });
}

async function handlePaymentFailed(paymentIntent: any, supabaseClient: any) {
  logStep("Processing payment failure", { paymentIntentId: paymentIntent.id });
  
  // Find order by payment intent ID
  const { data: orders, error } = await supabaseClient
    .from('orders')
    .select('*')
    .eq('stripe_payment_intent_id', paymentIntent.id);

  if (error || !orders?.length) {
    logStep("Order not found for payment intent", { paymentIntentId: paymentIntent.id });
    return;
  }

  const order = orders[0];
  
  // Update order status
  await supabaseClient
    .from('orders')
    .update({ 
      status: 'failed',
      updated_at: new Date().toISOString()
    })
    .eq('id', order.id);

  // Log failed payment attempt
  await supabaseClient
    .from('payment_failures')
    .insert({
      order_id: order.id,
      payment_intent_id: paymentIntent.id,
      failure_reason: paymentIntent.last_payment_error?.message || 'Unknown error',
      created_at: new Date().toISOString()
    });

  logStep("Payment failure processed", { orderId: order.id });
}

async function handleInvoicePaymentSucceeded(invoice: any, supabaseClient: any) {
  logStep("Processing invoice payment success", { invoiceId: invoice.id });
  
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;
  
  if (subscriptionId) {
    // Update subscription status
    await supabaseClient
      .from('subscribers')
      .update({
        subscribed: true,
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_customer_id', customerId);
  }
}

async function handleInvoicePaymentFailed(invoice: any, supabaseClient: any) {
  logStep("Processing invoice payment failure", { invoiceId: invoice.id });
  
  const customerId = invoice.customer;
  
  // Update subscription status
  await supabaseClient
    .from('subscribers')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', customerId);
}

async function handleSubscriptionUpdated(subscription: any, supabaseClient: any) {
  logStep("Processing subscription update", { subscriptionId: subscription.id });
  
  const customerId = subscription.customer;
  
  await supabaseClient
    .from('subscribers')
    .update({
      subscription_status: subscription.status,
      subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', customerId);
}

async function handleSubscriptionDeleted(subscription: any, supabaseClient: any) {
  logStep("Processing subscription deletion", { subscriptionId: subscription.id });
  
  const customerId = subscription.customer;
  
  await supabaseClient
    .from('subscribers')
    .update({
      subscribed: false,
      subscription_status: 'canceled',
      subscription_end: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', customerId);
}