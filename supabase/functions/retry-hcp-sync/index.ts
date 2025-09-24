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
    console.log("Retrying HCP sync for booking:", booking_id);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        customers!inner(*)
      `)
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      throw new Error(`Booking not found: ${booking_id}`);
    }

    // Build payload for retry
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
        currency: 'USD'
      },
      source: booking.source_channel || 'AGP Booking UI'
    };

    // Reset sync log to pending
    const { error: resetError } = await supabase
      .from('hcp_sync_log')
      .update({
        status: 'pending',
        last_error: null,
        attempts: 0,
        updated_at: new Date().toISOString()
      })
      .eq('booking_id', booking_id);

    if (resetError) {
      console.error("Failed to reset sync log:", resetError);
    }

    // Call sync function
    const syncResponse = await supabase.functions.invoke('sync-booking-to-hcp', {
      body: payload
    });

    if (syncResponse.error) {
      throw new Error(`Sync failed: ${syncResponse.error.message}`);
    }

    console.log("Successfully retried HCP sync for booking:", booking_id);

    return new Response(JSON.stringify({
      success: true,
      message: "Retry initiated successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Retry HCP sync error:", error);
    
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});