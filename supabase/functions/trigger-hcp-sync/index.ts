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
    const { booking_id } = await req.json();
    console.log("Triggering HCP sync for booking:", booking_id);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get booking with customer details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        customers!inner(*)
      `)
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      console.error("Booking not found:", booking_id);
      throw new Error(`Booking not found: ${booking_id}`);
    }

    // Only sync confirmed bookings
    if (booking.status !== 'confirmed') {
      console.log("Booking not confirmed, skipping HCP sync:", booking.status);
      return new Response(JSON.stringify({
        success: true,
        message: "Booking not confirmed, sync skipped"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Build enhanced HCP sync payload
    const addonsBreakdown = booking.pricing_breakdown?.addons 
      ? Object.entries(booking.pricing_breakdown.addons).map(([name, price]) => ({
          name,
          price: typeof price === 'number' ? price : parseFloat(price as string)
        }))
      : [];

    const payload = {
      booking_id: booking.id,
      customer: {
        first_name: booking.customers.first_name || booking.customers.name.split(' ')[0] || '',
        last_name: booking.customers.last_name || booking.customers.name.split(' ').slice(1).join(' ') || '',
        email: booking.customers.email,
        phone: booking.customers.phone
      },
      address: {
        line1: booking.customers.address_line1 || booking.customers.address || '',
        line2: booking.customers.address_line2 || '',
        city: booking.customers.city || '',
        state: booking.customers.state || '',
        postal_code: booking.customers.postal_code || booking.zip_code || ''
      },
      service: {
        type: booking.service_type || 'Standard',
        frequency: booking.frequency || 'One-time',
        sqft_range: booking.sqft_or_bedrooms || 'Unknown',
        addons: booking.addons || []
      },
      schedule: {
        date: booking.service_date || new Date().toISOString().split('T')[0],
        time_window: booking.time_slot || '09:00-17:00',
        timezone: booking.timezone || 'America/Chicago'
      },
      pricing: {
        total: Number(booking.est_price) || 0,
        mrr_est: Number(booking.mrr) || 0,
        arr_est: Number(booking.arr) || 0,
        currency: 'USD',
        addons_breakdown: addonsBreakdown
      },
      source: booking.source_channel || 'AGP Booking UI',
      special_instructions: booking.special_instructions,
      property_details: booking.property_details || {},
      first_booking: booking.first_booking,
      recurring_active: booking.recurring_active
    };

    console.log("HCP sync payload prepared for booking:", booking_id);

    // Call the sync function
    const syncResponse = await supabase.functions.invoke('sync-booking-to-hcp', {
      body: payload
    });

    if (syncResponse.error) {
      throw new Error(`HCP sync failed: ${syncResponse.error.message}`);
    }

    console.log("HCP sync completed successfully for booking:", booking_id);

    return new Response(JSON.stringify({
      success: true,
      data: syncResponse.data
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("HCP sync trigger error:", error);
    
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});