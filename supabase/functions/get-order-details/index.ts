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
    const { session_id, order_id } = await req.json();

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

    let query = supabase.from("orders").select(
      "id, stripe_session_id, amount, currency, status, created_at, scheduled_date, scheduled_time, cleaning_type, frequency, square_footage, customer_name, customer_email, customer_phone, service_details"
    ).single();

    if (session_id) {
      query = query.eq("stripe_session_id", session_id);
    } else if (order_id) {
      query = query.eq("id", order_id);
    }

    const { data, error } = await query;

    if (error || !data) {
      return new Response(JSON.stringify({ error: error?.message || "Order not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    return new Response(JSON.stringify({ order: data }), {
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
