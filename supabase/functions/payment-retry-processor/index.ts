import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RetryPaymentRequest {
  payment_intent_id: string;
  retry_reason: string;
  max_retries?: number;
  retry_interval?: number; // seconds
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY_ALPHALUX") || "", {
      apiVersion: "2023-10-16",
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { 
      payment_intent_id, 
      retry_reason, 
      max_retries = 3,
      retry_interval = 30 
    }: RetryPaymentRequest = await req.json();

    // Get existing retry count from database
    const { data: retryData } = await supabase
      .from('payment_retries')
      .select('retry_count, last_retry_at')
      .eq('payment_intent_id', payment_intent_id)
      .single();

    const currentRetryCount = retryData?.retry_count || 0;

    if (currentRetryCount >= max_retries) {
      return new Response(
        JSON.stringify({ 
          error: 'Maximum retry attempts exceeded',
          retry_count: currentRetryCount,
          max_retries 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Check if enough time has passed since last retry
    if (retryData?.last_retry_at) {
      const lastRetryTime = new Date(retryData.last_retry_at).getTime();
      const now = new Date().getTime();
      const timeSinceLastRetry = (now - lastRetryTime) / 1000;

      if (timeSinceLastRetry < retry_interval) {
        const waitTime = retry_interval - timeSinceLastRetry;
        return new Response(
          JSON.stringify({ 
            error: `Please wait ${Math.ceil(waitTime)} seconds before retrying`,
            wait_time: waitTime 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
        );
      }
    }

    // Get payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    if (paymentIntent.status === 'succeeded') {
      return new Response(
        JSON.stringify({ 
          message: 'Payment already succeeded',
          status: paymentIntent.status 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Implement retry strategy based on failure reason
    let retryStrategy = 'standard';
    const lastError = paymentIntent.last_payment_error;

    if (lastError?.decline_code === 'insufficient_funds') {
      retryStrategy = 'delayed';
    } else if (lastError?.decline_code === 'card_declined') {
      retryStrategy = 'immediate';
    } else if (lastError?.type === 'authentication_required') {
      retryStrategy = 'authentication';
    }

    // Update retry count in database
    await supabase
      .from('payment_retries')
      .upsert({
        payment_intent_id,
        retry_count: currentRetryCount + 1,
        last_retry_at: new Date().toISOString(),
        retry_reason,
        retry_strategy,
        failure_code: lastError?.decline_code || lastError?.code
      });

    // Track retry analytics
    await supabase.functions.invoke('payment-analytics', {
      body: {
        action: 'track',
        event_type: 'payment_retry_attempted',
        payment_data: {
          payment_intent_id,
          retry_count: currentRetryCount + 1,
          retry_reason,
          retry_strategy,
          failure_code: lastError?.decline_code || lastError?.code
        }
      }
    });

    // Try to confirm the payment intent again based on strategy
    let result;
    
    switch (retryStrategy) {
      case 'immediate':
        // For card declined, try again immediately
        result = await stripe.paymentIntents.confirm(payment_intent_id);
        break;
        
      case 'authentication':
        // For authentication required, return the client secret for 3D Secure
        result = {
          payment_intent: paymentIntent,
          requires_action: true,
          client_secret: paymentIntent.client_secret
        };
        break;
        
      case 'delayed':
        // For insufficient funds, schedule for later retry
        result = {
          payment_intent: paymentIntent,
          scheduled_retry: true,
          next_retry_at: new Date(Date.now() + (retry_interval * 2 * 1000)).toISOString()
        };
        break;
        
      default:
        result = await stripe.paymentIntents.confirm(payment_intent_id);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        retry_count: currentRetryCount + 1,
        retry_strategy,
        result
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Payment retry error:', error);

    // Track failed retry
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    await supabase.functions.invoke('payment-analytics', {
      body: {
        action: 'track',
        event_type: 'payment_retry_failed',
        payment_data: {
          error: error.message
        }
      }
    });

    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});