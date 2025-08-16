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
    const { session_id, order_id, code, email } = await req.json();
    console.log("Received request:", { session_id, order_id, code, email });

    if (!session_id && !order_id && !code && !email) {
      return new Response(JSON.stringify({ error: "Missing session_id, order_id, code, or email" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const selectFields = "id, stripe_session_id, amount, currency, status, created_at, scheduled_date, scheduled_time, cleaning_type, frequency, square_footage, customer_name, customer_email, customer_phone, service_details";

    let data = null;
    let error = null;

    // Priority search: exact UUID -> stripe session -> partial ID -> email
    if (order_id) {
      console.log("Searching by order_id:", order_id);
      
      // Try exact UUID match first
      const { data: exactMatch, error: exactError } = await supabase
        .from("orders")
        .select(selectFields)
        .eq("id", order_id)
        .maybeSingle();
      
      if (exactMatch) {
        console.log("Found exact UUID match");
        data = exactMatch;
      } else {
        console.log("No exact UUID match, trying partial match for:", order_id);
        // Always try partial ID match if exact fails (for short order IDs)
        const { data: partialMatch, error: partialError } = await supabase
          .from("orders")
          .select(selectFields)
          .ilike("id", `%${order_id}%`)
          .maybeSingle();
        
        if (partialMatch) {
          console.log("Found partial UUID match");
          data = partialMatch;
        } else {
          console.log("No partial match found");
          error = partialError || exactError;
        }
      }
    } else if (session_id) {
      console.log("Searching by session_id:", session_id);
      const { data: sessionMatch, error: sessionError } = await supabase
        .from("orders")
        .select(selectFields)
        .eq("stripe_session_id", session_id)
        .maybeSingle();
      
      data = sessionMatch;
      error = sessionError;
    } else if (code) {
      console.log("Searching by code:", code);
      // Search by partial order ID or session ID
      const { data: codeMatch, error: codeError } = await supabase
        .from("orders")
        .select(selectFields)
        .or(`id.ilike.%${code}%,stripe_session_id.ilike.%${code}%`)
        .maybeSingle();
      
      data = codeMatch;
      error = codeError;
    } else if (email) {
      console.log("Searching by email:", email);
      // Search by customer email
      const { data: emailMatch, error: emailError } = await supabase
        .from("orders")
        .select(selectFields)
        .ilike("customer_email", `%${email}%`)
        .order("created_at", { ascending: false })
        .maybeSingle();
      
      data = emailMatch;
      error = emailError;
    }

    if (error || !data) {
      console.log("Order not found:", { error: error?.message, data });
      return new Response(JSON.stringify({ error: error?.message || "Order not found. Please check your Order ID, Session ID, or email address." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    console.log("Order found successfully:", data.id);
    return new Response(JSON.stringify({ order: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Error in get-order-details:", err);
    const message = err instanceof Error ? err.message : "Unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});