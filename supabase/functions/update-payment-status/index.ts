import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdatePaymentStatusRequest {
  payment_intent_id: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  metadata?: any;
  failure_reason?: string;
  fraud_score?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { 
      payment_intent_id, 
      status, 
      metadata, 
      failure_reason, 
      fraud_score 
    }: UpdatePaymentStatusRequest = await req.json();

    // Update payment status in orders table
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .update({
        status: status === 'succeeded' ? 'paid' : 'failed',
        updated_at: new Date().toISOString(),
        payment_metadata: metadata
      })
      .eq('stripe_payment_intent_id', payment_intent_id)
      .select()
      .single();

    if (orderError && orderError.code !== 'PGRST116') {
      console.error('Order update error:', orderError);
    }

    // Track payment analytics
    await supabase.functions.invoke('payment-analytics', {
      body: {
        action: 'track',
        event_type: status === 'succeeded' ? 'payment_success' : 'payment_failed',
        payment_data: {
          payment_intent_id,
          status,
          metadata,
          failure_reason,
          fraud_score,
          order_id: orderData?.id
        }
      }
    });

    // If fraud detected, track separately
    if (fraud_score && fraud_score > 0.7) {
      await supabase.functions.invoke('payment-analytics', {
        body: {
          action: 'track',
          event_type: 'fraud_detected',
          payment_data: {
            payment_intent_id,
            fraud_score,
            metadata
          }
        }
      });
    }

    // Send real-time update via channel
    const channel = supabase.channel(`payment_${payment_intent_id}`);
    await channel.send({
      type: 'broadcast',
      event: 'payment_status_update',
      payload: {
        payment_intent_id,
        status,
        order_id: orderData?.id,
        timestamp: new Date().toISOString()
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Payment status updated',
        order_id: orderData?.id,
        status 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Update payment status error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});