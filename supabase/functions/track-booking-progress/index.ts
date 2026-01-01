import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface TrackingPayload {
  email: string;
  step: string;
  data?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    zip_code?: string;
    city?: string;
    state?: string;
    home_size?: string;
    service_type?: string;
    frequency?: string;
    preferred_date?: string;
    preferred_time?: string;
    base_price?: number;
    session_id?: string;
    utms?: Record<string, string>;
  };
}

function logStep(step: string, details?: any) {
  console.log(`[TRACK-PROGRESS] ${step}`, details ? JSON.stringify(details) : '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: TrackingPayload = await req.json();
    logStep('Received tracking request', { email: payload.email, step: payload.step });

    if (!payload.email || !payload.step) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing email or step' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if we have an existing partial booking for this email
    const { data: existing } = await supabase
      .from('partial_bookings')
      .select('id, last_step')
      .eq('email', payload.email)
      .is('completed_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const updateData = {
      last_step: payload.step,
      updated_at: new Date().toISOString(),
      ...(payload.data?.first_name && { first_name: payload.data.first_name }),
      ...(payload.data?.last_name && { last_name: payload.data.last_name }),
      ...(payload.data?.phone && { phone: payload.data.phone }),
      ...(payload.data?.zip_code && { zip_code: payload.data.zip_code }),
      ...(payload.data?.city && { city: payload.data.city }),
      ...(payload.data?.state && { state: payload.data.state }),
      ...(payload.data?.home_size && { home_size: payload.data.home_size }),
      ...(payload.data?.service_type && { service_type: payload.data.service_type }),
      ...(payload.data?.frequency && { frequency: payload.data.frequency }),
      ...(payload.data?.preferred_date && { preferred_date: payload.data.preferred_date }),
      ...(payload.data?.preferred_time && { preferred_time: payload.data.preferred_time }),
      ...(payload.data?.base_price && { base_price: payload.data.base_price }),
      ...(payload.data?.session_id && { session_id: payload.data.session_id }),
      ...(payload.data?.utms && { utms: payload.data.utms }),
    };

    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from('partial_bookings')
        .update(updateData)
        .eq('id', existing.id);

      if (error) {
        logStep('Error updating partial booking', { error: error.message });
        throw error;
      }
      logStep('Updated partial booking', { id: existing.id, step: payload.step });
    } else {
      // Create new record
      const insertData = {
        email: payload.email,
        ...updateData,
      };

      const { error } = await supabase
        .from('partial_bookings')
        .insert(insertData);

      if (error) {
        logStep('Error creating partial booking', { error: error.message });
        throw error;
      }
      logStep('Created partial booking', { email: payload.email, step: payload.step });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logStep('Error in track-booking-progress', { error: error.message });
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});