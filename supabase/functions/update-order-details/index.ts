import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { session_id, order_id, service_details, customer_email, customer_name, customer_phone } = body || {};

    if (!session_id && !order_id) {
      return new Response(JSON.stringify({ error: "Missing session_id or order_id" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    console.log('🔄 [update-order-details] Processing request:', JSON.stringify({
      session_id: !!session_id,
      order_id: !!order_id,
      hasServiceDetails: !!service_details,
      hasScheduledDate: !!body.scheduled_date,
      hasScheduledTime: !!body.scheduled_time
    }));

    const updates: Record<string, unknown> = {};
    if (service_details) updates.service_details = service_details;
    if (customer_email) updates.customer_email = customer_email;
    if (customer_name) updates.customer_name = customer_name;
    if (customer_phone) updates.customer_phone = customer_phone;
    
    // Handle scheduling fields
    if (body.scheduled_date) updates.scheduled_date = body.scheduled_date;
    if (body.scheduled_time) updates.scheduled_time = body.scheduled_time;

    if (Object.keys(updates).length === 0) {
      return new Response(JSON.stringify({ error: "No update fields provided" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    let query = supabase.from("orders").update(updates).select("id, service_details, customer_email, customer_name, customer_phone").single();

    if (session_id) {
      query = query.eq("stripe_session_id", session_id);
    } else if (order_id) {
      query = query.eq("id", order_id);
    }

    console.log('🔄 [update-order-details] Executing query with updates:', JSON.stringify(updates));
    
    const { data, error } = await query;

    if (error) {
      console.error('❌ [update-order-details] Database error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log('✅ [update-order-details] Successfully updated order:', data?.id);
    
    return new Response(JSON.stringify({ success: true, order: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
