import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const signature = req.headers.get("stripe-signature");
    const body = await req.text();
    
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature!,
        Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response("Webhook signature verification failed", { status: 400 });
    }

    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Update payment status
        await supabase.functions.invoke('update-payment-status', {
          body: {
            payment_intent_id: paymentIntent.id,
            status: 'succeeded',
            metadata: paymentIntent.metadata
          }
        });

        // Track conversion analytics
        await supabase.functions.invoke('payment-analytics', {
          body: {
            action: 'track',
            event_type: 'payment_conversion',
            payment_data: {
              payment_intent_id: paymentIntent.id,
              amount: paymentIntent.amount,
              currency: paymentIntent.currency,
              payment_method_types: paymentIntent.payment_method_types,
              metadata: paymentIntent.metadata
            }
          }
        });

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        await supabase.functions.invoke('update-payment-status', {
          body: {
            payment_intent_id: paymentIntent.id,
            status: 'failed',
            failure_reason: paymentIntent.last_payment_error?.message,
            metadata: paymentIntent.metadata
          }
        });

        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        await supabase.functions.invoke('update-payment-status', {
          body: {
            payment_intent_id: paymentIntent.id,
            status: 'canceled',
            metadata: paymentIntent.metadata
          }
        });

        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Update order with session details
        const { error } = await supabase
          .from('orders')
          .update({
            status: 'paid',
            stripe_payment_intent_id: session.payment_intent as string,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_session_id', session.id);

        if (error) {
          console.error('Order update error:', error);
        }

        // Track checkout completion
        await supabase.functions.invoke('payment-analytics', {
          body: {
            action: 'track',
            event_type: 'checkout_completed',
            payment_data: {
              session_id: session.id,
              payment_intent_id: session.payment_intent,
              amount: session.amount_total,
              currency: session.currency,
              metadata: session.metadata
            }
          }
        });

        break;
      }

      case 'payment_method.attached': {
        const paymentMethod = event.data.object as Stripe.PaymentMethod;
        
        // Track payment method preferences
        await supabase.functions.invoke('payment-analytics', {
          body: {
            action: 'track',
            event_type: 'payment_method_attached',
            payment_data: {
              payment_method_id: paymentMethod.id,
              type: paymentMethod.type,
              card_brand: paymentMethod.card?.brand,
              customer_id: paymentMethod.customer
            }
          }
        });

        break;
      }

      case 'radar.early_fraud_warning.created': {
        const fraudWarning = event.data.object;
        
        // Track fraud incidents
        await supabase.functions.invoke('payment-analytics', {
          body: {
            action: 'track',
            event_type: 'fraud_warning',
            payment_data: {
              payment_intent_id: fraudWarning.payment_intent,
              fraud_type: fraudWarning.fraud_type,
              actionable: fraudWarning.actionable
            }
          }
        });

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});