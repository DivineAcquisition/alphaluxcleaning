
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
    const { session_id, order_id, code, email, payment_intent, setup_intent } = await req.json();
    console.log("Received request:", { session_id, order_id, code, email, payment_intent, setup_intent });

    if (!session_id && !order_id && !code && !email && !payment_intent && !setup_intent) {
      return new Response(JSON.stringify({ error: "Missing session_id, order_id, code, email, payment_intent, or setup_intent" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Select only columns that actually exist in the orders table
    const selectFields = `
      id, stripe_session_id, stripe_payment_intent_id, stripe_setup_intent_id, amount, currency, 
      status,
      created_at, updated_at, scheduled_date, scheduled_time, 
      cleaning_type, frequency, square_footage, 
      customer_name, customer_email, customer_phone,
      service_details, add_ons, user_id
    `;

    let data = null;
    let error = null;

    // Priority search: exact UUID -> stripe session -> payment intent -> setup intent -> partial ID -> email
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
      // Try session_id, then payment_intent_id, then setup_intent_id
      const { data: sessionMatch, error: sessionError } = await supabase
        .from("orders")
        .select(selectFields)
        .or(`stripe_session_id.eq.${session_id},stripe_payment_intent_id.eq.${session_id},stripe_setup_intent_id.eq.${session_id}`)
        .maybeSingle();
      
      if (sessionMatch) {
        console.log("Found order by session_id/intent_id:", sessionMatch.id);
        data = sessionMatch;
        error = sessionError;
      } else {
        console.log("No match found for session_id:", session_id);
        data = sessionMatch;
        error = sessionError;
      }
    } else if (payment_intent) {
      console.log("Searching by payment_intent:", payment_intent);
      const { data: intentMatch, error: intentError } = await supabase
        .from("orders")
        .select(selectFields)
        .eq("stripe_payment_intent_id", payment_intent)
        .maybeSingle();
      
      if (intentMatch) {
        console.log("Found order by payment_intent:", intentMatch.id);
      } else {
        console.log("No match found for payment_intent:", payment_intent);
      }
      data = intentMatch;
      error = intentError;
    } else if (setup_intent) {
      console.log("Searching by setup_intent:", setup_intent);
      const { data: setupMatch, error: setupError } = await supabase
        .from("orders")
        .select(selectFields)
        .eq("stripe_setup_intent_id", setup_intent)
        .maybeSingle();
      
      if (setupMatch) {
        console.log("Found order by setup_intent:", setupMatch.id);
      } else {
        console.log("No match found for setup_intent:", setup_intent);
      }
      data = setupMatch;
      error = setupError;
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
    
    // Helper function to map square footage to cleaning type
    const mapSquareFootageToCleaningType = (sqft: string | number): string => {
      if (typeof sqft === 'string') {
        if (sqft.includes('1200')) return 'Studio/1BR Deep Cleaning';
        if (sqft.includes('1500')) return '1-2BR Deep Cleaning';
        if (sqft.includes('2000')) return '2-3BR Deep Cleaning';
        if (sqft.includes('2401') || sqft.includes('2800')) return '3-4BR Deep Cleaning';
        if (sqft.includes('3200')) return '4-5BR Deep Cleaning';
        if (sqft.includes('4000')) return '5+BR Deep Cleaning';
      }
      return 'Residential Deep Cleaning';
    };

    // Helper function to format service address
    const formatServiceAddress = (serviceDetails: any): string => {
      if (serviceDetails?.serviceAddress && typeof serviceDetails.serviceAddress === 'string') {
        return serviceDetails.serviceAddress;
      }
      
      const parts = [];
      if (serviceDetails?.street_address) parts.push(serviceDetails.street_address);
      if (serviceDetails?.city) parts.push(serviceDetails.city);
      if (serviceDetails?.state) parts.push(serviceDetails.state);
      if (serviceDetails?.zip_code) parts.push(serviceDetails.zip_code);
      
      return parts.length > 0 ? parts.join(', ') : 'Address on file';
    };

    // Helper function to extract correct amount
    const extractAmount = (data: any): number => {
      // Try multiple possible locations for the amount
      if (data.service_details?.totalPrice) return parseFloat(data.service_details.totalPrice);
      if (data.service_details?.finalTotal) return parseFloat(data.service_details.finalTotal);
      if (data.service_details?.final_total) return parseFloat(data.service_details.final_total);
      if (data.service_details?.total_price) return parseFloat(data.service_details.total_price);
      if (data.amount && data.amount > 0) return parseFloat(data.amount);
      
      // If amount is in cents, convert to dollars
      if (data.service_details?.amount_in_cents) return data.service_details.amount_in_cents / 100;
      
      return 0;
    };

    // Enhance order data with proper structure and fallbacks
    const enhancedOrder = {
      ...data,
      // Ensure service_details has proper structure
      service_details: data.service_details || {},
      // Extract and map cleaning type properly
      cleaning_type: (() => {
        if (data.cleaning_type && data.cleaning_type !== data.service_details?.homeSize) {
          return data.cleaning_type;
        }
        if (data.service_details?.cleaningType && data.service_details.cleaningType !== data.service_details?.homeSize) {
          return data.service_details.cleaningType;
        }
        // Map square footage to cleaning type
        const homeSize = data.service_details?.homeSize || data.square_footage;
        return mapSquareFootageToCleaningType(homeSize);
      })(),
      // Extract frequency with better fallbacks
      frequency: data.frequency || data.service_details?.frequency || (data.service_details?.serviceType === 'recurring' ? 'Weekly' : 'One-Time'),
      // Extract scheduled date/time from service_details if not in main fields
      scheduled_date: data.scheduled_date || data.service_details?.service_date || data.service_details?.serviceDateSeparate,
      scheduled_time: data.scheduled_time || data.service_details?.service_time || data.service_details?.serviceTimeSeparate,
      // Extract correct amount
      amount: extractAmount(data),
      // Format service address properly
      service_address: formatServiceAddress(data.service_details),
      // Add payment info for post-service payment display
      payment_type: data.service_details?.payment_type || 'pay_after_service',
      final_total: extractAmount(data)
    };
    
    return new Response(JSON.stringify({ order: enhancedOrder }), {
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
