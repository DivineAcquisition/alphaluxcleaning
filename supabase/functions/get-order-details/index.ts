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

    let data = null;
    let error = null;

    // Priority search: exact UUID -> stripe session -> payment intent -> setup intent -> partial ID -> email
    if (order_id) {
      console.log("Searching by order_id:", order_id);
      
      // Try exact UUID match first
      const { data: bookingMatch, error: bookingError } = await supabase
        .from("bookings")
        .select(`
          id, 
          stripe_payment_intent_id, 
          stripe_checkout_session_id,
          stripe_subscription_id,
          est_price, 
          status,
          created_at, 
          updated_at, 
          service_date, 
          time_slot, 
          service_type, 
          frequency, 
          sqft_or_bedrooms,
          special_instructions,
          addons,
          property_details,
          deposit_amount,
          balance_due,
          customer_id
        `)
        .eq("id", order_id)
        .single();
      
      if (bookingMatch) {
        // Get customer data separately
        const { data: customerData } = await supabase
          .from("customers")
          .select("name, email, phone, address, city, state, postal_code")
          .eq("id", bookingMatch.customer_id)
          .single();
        
        data = { ...bookingMatch, customer_data: customerData };
        console.log("Found exact UUID match");
      } else {
        console.log("No exact UUID match, trying partial match for:", order_id);
        // Try partial ID match if exact fails
        const { data: partialMatch, error: partialError } = await supabase
          .from("bookings")
          .select(`
            id, 
            stripe_payment_intent_id, 
            stripe_checkout_session_id,
            stripe_subscription_id,
            est_price, 
            status,
            created_at, 
            updated_at, 
            service_date, 
            time_slot, 
            service_type, 
            frequency, 
            sqft_or_bedrooms,
            special_instructions,
            addons,
            property_details,
            deposit_amount,
            balance_due,
            customer_id
          `)
          .ilike("id", `%${order_id}%`)
          .single();
        
        if (partialMatch) {
          const { data: customerData } = await supabase
            .from("customers")
            .select("name, email, phone, address, city, state, postal_code")
            .eq("id", partialMatch.customer_id)
            .single();
          
          data = { ...partialMatch, customer_data: customerData };
          console.log("Found partial UUID match");
        } else {
          console.log("No partial match found");
          error = partialError || bookingError;
        }
      }
    } else if (session_id) {
      console.log("Searching by session_id:", session_id);
      const { data: sessionMatch, error: sessionError } = await supabase
        .from("bookings")
        .select(`
          id, 
          stripe_payment_intent_id, 
          stripe_checkout_session_id,
          stripe_subscription_id,
          est_price, 
          status,
          created_at, 
          updated_at, 
          service_date, 
          time_slot, 
          service_type, 
          frequency, 
          sqft_or_bedrooms,
          special_instructions,
          addons,
          property_details,
          deposit_amount,
          balance_due,
          customer_id
        `)
        .or(`stripe_checkout_session_id.eq.${session_id},stripe_payment_intent_id.eq.${session_id},stripe_subscription_id.eq.${session_id}`)
        .single();
      
      if (sessionMatch) {
        const { data: customerData } = await supabase
          .from("customers")
          .select("name, email, phone, address, city, state, postal_code")
          .eq("id", sessionMatch.customer_id)
          .single();
        
        data = { ...sessionMatch, customer_data: customerData };
        console.log("Found booking by session_id/intent_id:", sessionMatch.id);
      } else {
        console.log("No match found for session_id:", session_id);
      }
      error = sessionError;
    } else if (payment_intent) {
      console.log("Searching by payment_intent:", payment_intent);
      const { data: intentMatch, error: intentError } = await supabase
        .from("bookings")
        .select(`
          id, 
          stripe_payment_intent_id, 
          stripe_checkout_session_id,
          stripe_subscription_id,
          est_price, 
          status,
          created_at, 
          updated_at, 
          service_date, 
          time_slot, 
          service_type, 
          frequency, 
          sqft_or_bedrooms,
          special_instructions,
          addons,
          property_details,
          deposit_amount,
          balance_due,
          customer_id
        `)
        .eq("stripe_payment_intent_id", payment_intent)
        .single();
      
      if (intentMatch) {
        const { data: customerData } = await supabase
          .from("customers")
          .select("name, email, phone, address, city, state, postal_code")
          .eq("id", intentMatch.customer_id)
          .single();
        
        data = { ...intentMatch, customer_data: customerData };
        console.log("Found booking by payment_intent:", intentMatch.id);
      } else {
        console.log("No match found for payment_intent:", payment_intent);
      }
      error = intentError;
    } else if (setup_intent) {
      console.log("Searching by setup_intent:", setup_intent);
      const { data: setupMatch, error: setupError } = await supabase
        .from("bookings")
        .select(`
          id, 
          stripe_payment_intent_id, 
          stripe_checkout_session_id,
          stripe_subscription_id,
          est_price, 
          status,
          created_at, 
          updated_at, 
          service_date, 
          time_slot, 
          service_type, 
          frequency, 
          sqft_or_bedrooms,
          special_instructions,
          addons,
          property_details,
          deposit_amount,
          balance_due,
          customer_id
        `)
        .eq("stripe_subscription_id", setup_intent)
        .single();
      
      if (setupMatch) {
        const { data: customerData } = await supabase
          .from("customers")
          .select("name, email, phone, address, city, state, postal_code")
          .eq("id", setupMatch.customer_id)
          .single();
        
        data = { ...setupMatch, customer_data: customerData };
        console.log("Found booking by setup_intent:", setupMatch.id);
      } else {
        console.log("No match found for setup_intent:", setup_intent);
      }
      error = setupError;
    } else if (code) {
      console.log("Searching by code:", code);
      const { data: codeMatch, error: codeError } = await supabase
        .from("bookings")
        .select(`
          id, 
          stripe_payment_intent_id, 
          stripe_checkout_session_id,
          stripe_subscription_id,
          est_price, 
          status,
          created_at, 
          updated_at, 
          service_date, 
          time_slot, 
          service_type, 
          frequency, 
          sqft_or_bedrooms,
          special_instructions,
          addons,
          property_details,
          deposit_amount,
          balance_due,
          customer_id
        `)
        .or(`id.ilike.%${code}%,stripe_checkout_session_id.ilike.%${code}%`)
        .single();
      
      if (codeMatch) {
        const { data: customerData } = await supabase
          .from("customers")
          .select("name, email, phone, address, city, state, postal_code")
          .eq("id", codeMatch.customer_id)
          .single();
        
        data = { ...codeMatch, customer_data: customerData };
      }
      error = codeError;
    } else if (email) {
      console.log("Searching by email:", email);
      // First find customer by email
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("id, name, email, phone, address, city, state, postal_code")
        .ilike("email", `%${email}%`)
        .single();
      
      if (customerData) {
        // Then find their most recent booking
        const { data: emailMatch, error: emailError } = await supabase
          .from("bookings")
          .select(`
            id, 
            stripe_payment_intent_id, 
            stripe_checkout_session_id,
            stripe_subscription_id,
            est_price, 
            status,
            created_at, 
            updated_at, 
            service_date, 
            time_slot, 
            service_type, 
            frequency, 
            sqft_or_bedrooms,
            special_instructions,
            addons,
            property_details,
            deposit_amount,
            balance_due,
            customer_id
          `)
          .eq("customer_id", customerData.id)
          .order("created_at", { ascending: false })
          .single();
        
        if (emailMatch) {
          data = { ...emailMatch, customer_data: customerData };
        }
        error = emailError;
      } else {
        error = customerError;
      }
    }

    if (error || !data) {
      console.log("Booking not found:", { error: error?.message, data });
      return new Response(JSON.stringify({ error: error?.message || "Order not found. Please check your Order ID, Session ID, or email address." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    console.log("Booking found successfully:", data.id);
    
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
    const formatServiceAddress = (serviceDetails: any, customerData: any): string => {
      if (serviceDetails?.serviceAddress && typeof serviceDetails.serviceAddress === 'string') {
        return serviceDetails.serviceAddress;
      }
      
      const parts = [];
      if (serviceDetails?.street_address) parts.push(serviceDetails.street_address);
      if (serviceDetails?.city) parts.push(serviceDetails.city);
      if (serviceDetails?.state) parts.push(serviceDetails.state);
      if (serviceDetails?.zip_code) parts.push(serviceDetails.zip_code);
      
      // Fall back to customer address
      if (parts.length === 0 && customerData) {
        if (customerData.address) parts.push(customerData.address);
        if (customerData.city) parts.push(customerData.city);
        if (customerData.state) parts.push(customerData.state);
        if (customerData.postal_code) parts.push(customerData.postal_code);
      }
      
      return parts.length > 0 ? parts.join(', ') : 'Address on file';
    };

    // Helper function to extract correct amount
    const extractAmount = (data: any): number => {
      // Amount is stored in cents in bookings.est_price
      if (data.est_price && data.est_price > 0) {
        // Convert from cents to dollars
        return parseFloat(data.est_price) / 100;
      }
      
      // Try other possible locations for the amount
      if (data.property_details?.totalPrice) return parseFloat(data.property_details.totalPrice);
      if (data.property_details?.finalTotal) return parseFloat(data.property_details.finalTotal);
      if (data.property_details?.final_total) return parseFloat(data.property_details.final_total);
      if (data.property_details?.total_price) return parseFloat(data.property_details.total_price);
      
      return 0;
    };

    // Enhance booking data with proper structure and fallbacks
    const enhancedOrder = {
      id: data.id,
      stripe_session_id: data.stripe_checkout_session_id,
      stripe_payment_intent_id: data.stripe_payment_intent_id,
      stripe_setup_intent_id: data.stripe_subscription_id,
      amount: extractAmount(data),
      currency: 'usd',
      status: data.status,
      created_at: data.created_at,
      updated_at: data.updated_at,
      scheduled_date: data.service_date,
      scheduled_time: data.time_slot,
      cleaning_type: (() => {
        if (data.service_type && data.service_type !== data.property_details?.homeSize) {
          return data.service_type;
        }
        if (data.property_details?.cleaningType && data.property_details.cleaningType !== data.property_details?.homeSize) {
          return data.property_details.cleaningType;
        }
        // Map square footage to cleaning type
        const homeSize = data.property_details?.homeSize || data.sqft_or_bedrooms;
        return mapSquareFootageToCleaningType(homeSize);
      })(),
      frequency: data.frequency || data.property_details?.frequency || 'One-Time',
      square_footage: data.sqft_or_bedrooms,
      customer_name: data.customer_data?.name || 'Customer',
      customer_email: data.customer_data?.email || '',
      customer_phone: data.customer_data?.phone || '',
      service_details: data.property_details || {},
      add_ons: data.addons || [],
      user_id: data.customer_id,
      service_address: formatServiceAddress(data.property_details, data.customer_data),
      payment_type: data.property_details?.payment_type || 'pay_after_service',
      final_total: extractAmount(data),
      deposit_amount: data.deposit_amount ? data.deposit_amount / 100 : 0,
      balance_due: data.balance_due ? data.balance_due / 100 : 0
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