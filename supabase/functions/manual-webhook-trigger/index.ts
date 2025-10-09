import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { booking_id } = await req.json();
    
    if (!booking_id) {
      throw new Error('booking_id is required');
    }

    console.log(`🎯 Manual webhook trigger requested for booking: ${booking_id}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify booking exists
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, status, customer_id')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      throw new Error(`Booking not found: ${booking_id}`);
    }

    console.log(`✅ Booking found: ${booking.id}, status: ${booking.status}`);

    // Call enhanced webhook function
    console.log('📡 Calling enhanced-booking-webhook-v2...');
    const webhookResponse = await supabase.functions.invoke('enhanced-booking-webhook-v2', {
      body: {
        booking_id: booking_id,
        action: 'manual_trigger'
      }
    });

    if (webhookResponse.error) {
      console.error('❌ Webhook call failed:', webhookResponse.error);
    } else {
      console.log('✅ Webhook call succeeded:', webhookResponse.data);
    }

    // Call HCP sync function
    console.log('📡 Calling trigger-hcp-sync...');
    const hcpResponse = await supabase.functions.invoke('trigger-hcp-sync', {
      body: {
        booking_id: booking_id
      }
    });

    if (hcpResponse.error) {
      console.error('❌ HCP sync failed:', hcpResponse.error);
    } else {
      console.log('✅ HCP sync succeeded:', hcpResponse.data);
    }

    return new Response(JSON.stringify({
      success: true,
      booking_id,
      webhook_result: webhookResponse.data || { error: webhookResponse.error?.message },
      hcp_result: hcpResponse.data || { error: hcpResponse.error?.message }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('💥 Manual trigger error:', error);
    
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
