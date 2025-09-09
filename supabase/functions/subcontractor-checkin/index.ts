import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckinRequest {
  booking_id: string;
  subcontractor_id?: string;
  lat?: number;
  lng?: number;
  notes?: string;
  photos?: string[];
  type: 'check_in' | 'check_out';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { booking_id, subcontractor_id, lat, lng, notes, photos, type }: CheckinRequest = await req.json();

    if (!booking_id || !type) {
      throw new Error('Missing required fields: booking_id and type');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get booking details
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*, services(name)')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    // Use subcontractor from booking if not provided
    const finalSubcontractorId = subcontractor_id || booking.assigned_employee_id;
    
    if (!finalSubcontractorId) {
      throw new Error('No subcontractor assigned to this booking');
    }

    // Get subcontractor details
    const { data: subcontractor, error: subError } = await supabaseClient
      .from('subcontractors')
      .select('*')
      .eq('id', finalSubcontractorId)
      .single();

    if (subError || !subcontractor) {
      throw new Error('Subcontractor not found');
    }

    // Check if already checked in/out
    const { data: existingCheckpoint } = await supabaseClient
      .from('checkpoints')
      .select('*')
      .eq('booking_id', booking_id)
      .eq('subcontractor_id', finalSubcontractorId)
      .eq('type', type)
      .single();

    if (existingCheckpoint) {
      throw new Error(`Already ${type.replace('_', ' ')}ed for this job`);
    }

    // Create checkpoint record
    const { data: checkpoint, error: checkpointError } = await supabaseClient
      .from('checkpoints')
      .insert({
        booking_id,
        subcontractor_id: finalSubcontractorId,
        company_id: booking.company_id || '550e8400-e29b-41d4-a716-446655440000',
        type,
        lat,
        lng,
        notes,
        photos: photos || []
      })
      .select()
      .single();

    if (checkpointError) {
      throw new Error('Failed to record checkpoint');
    }

    // Update booking status based on checkpoint type
    let newBookingStatus = booking.status;
    if (type === 'check_in') {
      newBookingStatus = 'in_progress';
    } else if (type === 'check_out') {
      newBookingStatus = 'completed';
    }

    await supabaseClient
      .from('bookings')
      .update({ status: newBookingStatus })
      .eq('id', booking_id);

    // Create status update notification
    await supabaseClient
      .from('order_status_updates')
      .insert({
        order_id: booking.order_id,
        subcontractor_id: finalSubcontractorId,
        status_message: type === 'check_in' 
          ? `${subcontractor.full_name} has arrived and started the cleaning service`
          : `${subcontractor.full_name} has completed the cleaning service`,
      });

    // TODO: Send push notification to customer
    // TODO: Send SMS notification if enabled

    const responseMessage = type === 'check_in'
      ? `Successfully checked in to ${booking.service_address}`
      : `Successfully checked out from ${booking.service_address}`;

    return new Response(JSON.stringify({
      success: true,
      message: responseMessage,
      checkpoint,
      booking_status: newBookingStatus,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in subcontractor-checkin:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to process check-in/out"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);