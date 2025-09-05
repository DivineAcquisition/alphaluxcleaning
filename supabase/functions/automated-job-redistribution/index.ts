import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RedistributionRequest {
  booking_id: string;
  declined_assignment_id: string;
  reason?: string;
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

    const { booking_id, declined_assignment_id, reason }: RedistributionRequest = await req.json();

    console.log('Starting automated redistribution for booking:', booking_id);

    // Get booking details and current priority level
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        subcontractor_job_assignments!inner (
          priority,
          assigned_at
        )
      `)
      .eq('id', booking_id)
      .single();

    if (bookingError || !bookingData) {
      throw new Error('Booking not found');
    }

    // Calculate escalation based on time and decline count
    const assignedAt = new Date(bookingData.subcontractor_job_assignments[0].assigned_at);
    const hoursElapsed = (new Date().getTime() - assignedAt.getTime()) / (1000 * 60 * 60);
    
    // Count previous declines for this booking
    const { data: declineCount } = await supabase
      .from('subcontractor_job_assignments')
      .select('id')
      .eq('booking_id', booking_id)
      .eq('status', 'declined');

    const totalDeclines = (declineCount?.length || 0) + 1; // +1 for current decline
    
    // Determine new priority and timeout
    let newPriority = bookingData.priority || 'normal';
    let responseTimeMinutes = 30; // Default 30 minutes
    
    if (totalDeclines >= 3 || hoursElapsed >= 4) {
      newPriority = 'urgent';
      responseTimeMinutes = 15;
    } else if (totalDeclines >= 2 || hoursElapsed >= 2) {
      newPriority = 'high';
      responseTimeMinutes = 20;
    }

    // Update booking priority if escalated
    if (newPriority !== bookingData.priority) {
      await supabase
        .from('bookings')
        .update({ priority: newPriority })
        .eq('id', booking_id);
    }

    // Get next available subcontractors using smart assignment logic
    const { data: nextSubcontractors, error: nextError } = await supabase
      .rpc('get_available_subcontractors_for_booking', {
        p_booking_id: booking_id,
        p_service_date: bookingData.service_date,
        p_exclude_subcontractor_ids: [
          // Get all previously assigned subcontractors for this booking
          ...(await supabase
            .from('subcontractor_job_assignments')
            .select('subcontractor_id')
            .eq('booking_id', booking_id)
            .then(({ data }) => data?.map(a => a.subcontractor_id) || [])
          )
        ]
      });

    if (nextError) {
      console.error('Error getting next subcontractors:', nextError);
      throw nextError;
    }

    if (!nextSubcontractors || nextSubcontractors.length === 0) {
      console.log('No more available subcontractors for booking:', booking_id);
      
      // Escalate to admin notification
      await supabase.functions.invoke('send-admin-alert', {
        body: {
          type: 'no_available_subcontractors',
          booking_id,
          message: `Booking ${booking_id} has no available subcontractors after ${totalDeclines} declines`,
          priority: 'critical'
        }
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'No available subcontractors - escalated to admin',
          escalated: true
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create assignment queue for multiple backup options
    const assignmentQueue = nextSubcontractors.slice(0, 3).map((sub: any, index: number) => ({
      booking_id,
      subcontractor_id: sub.id,
      priority_order: index + 1,
      status: index === 0 ? 'assigned' : 'pending',
      expires_at: new Date(Date.now() + (responseTimeMinutes * 60 * 1000 * (index + 1))).toISOString()
    }));

    // Insert into assignment queue
    const { error: queueError } = await supabase
      .from('assignment_queue')
      .insert(assignmentQueue);

    if (queueError) throw queueError;

    // Create primary assignment (first in queue)
    const primarySubcontractor = nextSubcontractors[0];
    const expiresAt = new Date(Date.now() + (responseTimeMinutes * 60 * 1000));

    const { data: newAssignment, error: assignmentError } = await supabase
      .from('subcontractor_job_assignments')
      .insert({
        booking_id,
        subcontractor_id: primarySubcontractor.id,
        status: 'pending',
        priority: newPriority,
        assigned_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        assignment_method: 'automated_redistribution',
        notes: `Redistributed after decline. Attempt ${totalDeclines + 1}. Priority: ${newPriority}`
      })
      .select()
      .single();

    if (assignmentError) throw assignmentError;

    // Send enhanced assignment notification
    await supabase.functions.invoke('enhanced-job-assignment', {
      body: {
        assignmentId: newAssignment.id,
        bookingId: booking_id,
        subcontractorId: primarySubcontractor.id,
        priority: newPriority,
        urgentFlags: {
          isRedistribution: true,
          declineCount: totalDeclines,
          escalatedPriority: newPriority !== bookingData.priority
        },
        notificationMethods: newPriority === 'urgent' ? ['sms', 'email', 'push'] : ['sms', 'email'],
        responseTimeMinutes
      }
    });

    // Log analytics
    await supabase
      .from('assignment_analytics')
      .insert({
        booking_id,
        subcontractor_id: primarySubcontractor.id,
        assignment_sent_at: new Date().toISOString(),
        response_type: null,
        metadata: {
          redistribution_reason: reason,
          decline_count: totalDeclines,
          original_priority: bookingData.priority,
          escalated_priority: newPriority,
          hours_elapsed: hoursElapsed
        }
      });

    // Schedule automatic escalation if needed
    if (newPriority !== 'urgent') {
      await supabase.functions.invoke('schedule-assignment-escalation', {
        body: {
          assignment_id: newAssignment.id,
          escalate_at: new Date(Date.now() + (responseTimeMinutes * 60 * 1000 * 0.75)).toISOString() // 75% of timeout
        }
      });
    }

    console.log('Automated redistribution completed:', {
      booking_id,
      new_assignment_id: newAssignment.id,
      subcontractor_id: primarySubcontractor.id,
      priority: newPriority,
      queue_length: assignmentQueue.length
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Job redistributed successfully',
        assignment_id: newAssignment.id,
        subcontractor_name: primarySubcontractor.full_name,
        priority: newPriority,
        response_time_minutes: responseTimeMinutes,
        queue_length: assignmentQueue.length,
        escalated: newPriority !== bookingData.priority
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in automated-job-redistribution function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});