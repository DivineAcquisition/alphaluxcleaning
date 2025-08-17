import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get booking details
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    // Get available subcontractors with intelligent scoring
    const { data: subcontractors, error: subError } = await supabaseClient
      .from('subcontractors')
      .select('*')
      .eq('is_available', true)
      .eq('account_status', 'active');

    if (subError) {
      throw subError;
    }

    // Smart assignment algorithm
    const scoredSubcontractors = subcontractors.map(sub => {
      let score = 0;
      
      // Rating score (0-40 points)
      score += (sub.rating || 0) * 8;
      
      // Experience score (0-30 points) 
      score += Math.min((sub.completed_jobs_count || 0) * 0.5, 30);
      
      // Tier bonus (0-20 points)
      score += (sub.tier_level || 1) * 6;
      
      // Location proximity (simplified - 0-10 points)
      // In production, this would use actual distance calculation
      if (sub.city === booking.service_address?.split(',')[1]?.trim()) {
        score += 10;
      } else if (sub.state === booking.service_address?.split(',')[2]?.trim()) {
        score += 5;
      }

      return { ...sub, assignmentScore: score };
    });

    // Sort by score and pick the best match
    const bestMatch = scoredSubcontractors
      .sort((a, b) => b.assignmentScore - a.assignmentScore)[0];

    if (!bestMatch) {
      throw new Error('No suitable subcontractor found');
    }

    // Create job assignment
    const { data: assignment, error: assignmentError } = await supabaseClient
      .from('subcontractor_job_assignments')
      .insert({
        booking_id: bookingId,
        subcontractor_id: bestMatch.id,
        status: 'assigned',
        assigned_at: new Date().toISOString()
      })
      .select()
      .single();

    if (assignmentError) {
      throw assignmentError;
    }

    // Update booking with assigned employee
    const { error: updateError } = await supabaseClient
      .from('bookings')
      .update({ assigned_employee_id: bestMatch.id })
      .eq('id', bookingId);

    if (updateError) {
      throw updateError;
    }

    // Send notification email
    try {
      await supabaseClient.functions.invoke('send-job-assignment-notification', {
        body: {
          subcontractorId: bestMatch.id,
          bookingId: bookingId,
          assignmentId: assignment.id
        }
      });
    } catch (emailError) {
      console.error('Failed to send assignment notification:', emailError);
      // Don't fail the whole assignment for email errors
    }

    console.log(`Smart assignment completed: ${bestMatch.full_name} (score: ${bestMatch.assignmentScore})`);

    return new Response(
      JSON.stringify({
        success: true,
        assignment: assignment,
        subcontractorName: bestMatch.full_name,
        assignmentScore: bestMatch.assignmentScore
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in smart-job-assignment function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})