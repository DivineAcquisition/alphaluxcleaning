import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TokenValidationRequest {
  token: string;
  action: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { token, action }: TokenValidationRequest = await req.json();

    console.log('Validating token:', { token: token.substring(0, 10) + '...', action });

    // Find the token in job_assignment_tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('job_assignment_tokens')
      .select('*')
      .eq('token', token)
      .eq('action', action)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !tokenData) {
      console.log('Token validation failed:', tokenError);
      return new Response(
        JSON.stringify({
          valid: false,
          message: 'Invalid or expired token'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get assignment details
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('subcontractor_job_assignments')
      .select(`
        id,
        booking_id,
        subcontractor_id,
        status,
        priority,
        expires_at,
        bookings!inner (
          id,
          customer_name,
          customer_email,
          customer_phone,
          service_address,
          service_date,
          service_time,
          special_instructions,
          estimated_duration
        ),
        subcontractors!inner (
          id,
          full_name
        )
      `)
      .eq('id', tokenData.assignment_id)
      .single();

    if (assignmentError || !assignmentData) {
      console.log('Assignment fetch failed:', assignmentError);
      return new Response(
        JSON.stringify({
          valid: false,
          message: 'Assignment not found'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if assignment is still pending
    if (assignmentData.status !== 'pending') {
      return new Response(
        JSON.stringify({
          valid: false,
          message: `This assignment has already been ${assignmentData.status}`
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if assignment has expired
    if (new Date(assignmentData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({
          valid: false,
          message: 'This assignment has expired'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Return job details
    const jobDetails = {
      booking: Array.isArray(assignmentData.bookings) 
        ? assignmentData.bookings[0] 
        : assignmentData.bookings,
      assignment: {
        id: assignmentData.id,
        status: assignmentData.status,
        priority: assignmentData.priority,
        expires_at: assignmentData.expires_at
      },
      subcontractor: Array.isArray(assignmentData.subcontractors) 
        ? assignmentData.subcontractors[0] 
        : assignmentData.subcontractors
    };

    console.log('Token validation successful for assignment:', assignmentData.id);

    return new Response(
      JSON.stringify({
        valid: true,
        jobDetails,
        message: 'Token valid'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in validate-job-token function:', error);
    return new Response(
      JSON.stringify({
        valid: false,
        message: 'Internal server error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});