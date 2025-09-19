import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("Create booking function called with method:", req.method);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log("Request body received:", requestBody);
    
    const { 
      bookingData,
      paymentType,
      customerEmail,
      customerName
    } = requestBody;

    if (!bookingData || !paymentType || !customerEmail || !customerName) {
      throw new Error("Missing required fields: bookingData, paymentType, customerEmail, customerName");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Create or find customer
    let customer;
    const { data: existingCustomer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', customerEmail)
      .single();

    if (existingCustomer) {
      customer = existingCustomer;
      console.log("Found existing customer:", customer.id);
    } else {
      console.log("Creating new customer");
      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert({
          email: customerEmail,
          name: customerName,
          phone: bookingData.contactNumber || '',
          address: bookingData.address?.street || '',
          city: bookingData.address?.city || '',
          state: bookingData.address?.state || '',
          postal_code: bookingData.address?.zipCode || bookingData.zipCode || '',
          first_name: customerName.split(' ')[0] || '',
          last_name: customerName.split(' ').slice(1).join(' ') || ''
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating customer:", createError);
        throw new Error(`Failed to create customer: ${createError.message}`);
      }
      customer = newCustomer;
      console.log("Created new customer:", customer.id);
    }

    // Calculate pricing
    const basePrice = bookingData.basePrice || bookingData.totalPrice || 0;
    const totalPrice = bookingData.totalPrice || basePrice;

    // Create booking
    console.log("Creating booking");
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        customer_id: customer.id,
        service_type: bookingData.serviceType || 'standard',
        frequency: bookingData.frequency || 'one_time',
        sqft_or_bedrooms: bookingData.homeSize || 'unknown',
        est_price: totalPrice,
        service_date: bookingData.serviceDate || null,
        time_slot: bookingData.serviceTime || null,
        zip_code: bookingData.zipCode || bookingData.address?.zipCode || '',
        special_instructions: bookingData.specialInstructions || '',
        status: paymentType === 'pay_after_service' ? 'pending' : 'confirmed',
        source_channel: 'UI_DIRECT',
        addons: bookingData.addOns || [],
        property_details: {
          bedrooms: bookingData.bedrooms || '',
          bathrooms: bookingData.bathrooms || '',
          dwellingType: bookingData.dwellingType || '',
          flooringType: bookingData.flooringType || ''
        },
        deposit_amount: paymentType === 'deposit_20' ? totalPrice * 0.2 : 0,
        balance_due: paymentType === 'deposit_20' ? totalPrice * 0.8 : totalPrice
      })
      .select()
      .single();

    if (bookingError) {
      console.error("Error creating booking:", bookingError);
      throw new Error(`Failed to create booking: ${bookingError.message}`);
    }

    console.log("Booking created successfully:", booking.id);

    return new Response(JSON.stringify({ 
      success: true,
      booking: booking,
      customer: customer
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Booking creation error:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});