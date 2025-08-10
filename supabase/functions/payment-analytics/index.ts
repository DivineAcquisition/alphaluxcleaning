import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentAnalyticsRequest {
  action: 'track' | 'query';
  event_type?: string;
  payment_data?: any;
  query_type?: string;
  date_range?: { start: string; end: string };
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

    const { action, event_type, payment_data, query_type, date_range }: PaymentAnalyticsRequest = await req.json();

    if (action === 'track') {
      // Track payment events
      const { error } = await supabase.from('payment_analytics').insert({
        event_type,
        payment_data,
        timestamp: new Date().toISOString(),
        user_agent: req.headers.get('user-agent'),
        ip_address: req.headers.get('x-forwarded-for') || 'unknown'
      });

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, message: 'Event tracked' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === 'query') {
      let query = supabase.from('payment_analytics').select('*');
      
      if (date_range) {
        query = query.gte('timestamp', date_range.start).lte('timestamp', date_range.end);
      }

      if (query_type === 'success_rate') {
        const { data: allPayments } = await query.in('event_type', ['payment_success', 'payment_failed']);
        const successCount = allPayments?.filter(p => p.event_type === 'payment_success').length || 0;
        const totalCount = allPayments?.length || 0;
        const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0;

        return new Response(
          JSON.stringify({ 
            success_rate: successRate, 
            total_payments: totalCount,
            successful_payments: successCount 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (query_type === 'fraud_metrics') {
        const { data: fraudEvents } = await query.eq('event_type', 'fraud_detected');
        const { data: allPayments } = await query.in('event_type', ['payment_success', 'payment_failed']);
        
        const fraudRate = allPayments?.length ? (fraudEvents?.length || 0) / allPayments.length * 100 : 0;
        
        return new Response(
          JSON.stringify({ 
            fraud_rate: fraudRate,
            fraud_incidents: fraudEvents?.length || 0,
            total_attempts: allPayments?.length || 0
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (query_type === 'payment_methods') {
        const { data } = await query.eq('event_type', 'payment_success');
        const methodStats = data?.reduce((acc: any, payment: any) => {
          const method = payment.payment_data?.payment_method || 'unknown';
          acc[method] = (acc[method] || 0) + 1;
          return acc;
        }, {}) || {};

        return new Response(
          JSON.stringify({ payment_method_distribution: methodStats }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await query.order('timestamp', { ascending: false }).limit(100);
      if (error) throw error;

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );

  } catch (error) {
    console.error('Payment analytics error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});