import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Processing reminders...');

    // Get pending reminders that are due
    const { data: reminders, error: fetchError } = await supabase
      .from('reminder_queue')
      .select(`
        *,
        subcontractor_job_assignments!inner(
          id,
          subcontractor_id,
          status,
          booking_id,
          subcontractors(full_name, email, phone)
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .limit(100);

    if (fetchError) {
      console.error('Error fetching reminders:', fetchError);
      throw fetchError;
    }

    if (!reminders || reminders.length === 0) {
      console.log('No reminders to process');
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log(`Processing ${reminders.length} reminders`);

    let processed = 0;

    for (const reminder of reminders) {
      try {
        const assignment = reminder.subcontractor_job_assignments;
        
        // Skip if assignment is no longer pending
        if (assignment.status !== 'pending') {
          await supabase
            .from('reminder_queue')
            .update({ status: 'cancelled' })
            .eq('id', reminder.id);
          console.log(`Cancelled reminder for assignment ${assignment.id} - no longer pending`);
          continue;
        }

        // Mark reminder as sent
        await supabase
          .from('reminder_queue')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', reminder.id);

        if (reminder.reminder_type === '2hour') {
          // Send 2-hour reminder
          await send2HourReminder(supabase, assignment);
          
          // Schedule expiry reminder for 24 hours from assignment creation
          const assignmentCreated = new Date(assignment.created_at);
          const expiresAt = new Date(assignmentCreated.getTime() + (24 * 60 * 60 * 1000));
          
          await supabase
            .from('reminder_queue')
            .insert({
              assignment_id: assignment.id,
              reminder_type: 'expiry',
              scheduled_for: expiresAt.toISOString()
            });
          
          console.log(`✅ Sent 2-hour reminder for assignment ${assignment.id}`);
          
        } else if (reminder.reminder_type === 'expiry') {
          // Handle expiry - mark assignment as expired if still pending
          if (assignment.status === 'pending') {
            await supabase
              .from('subcontractor_job_assignments')
              .update({ 
                status: 'expired',
                expired_at: new Date().toISOString()
              })
              .eq('id', assignment.id);

            // Send expiry notification
            await sendExpiryNotification(supabase, assignment);
            
            console.log(`⏰ Expired assignment ${assignment.id}`);
          }
        }

        processed++;

      } catch (error) {
        console.error(`Error processing reminder ${reminder.id}:`, error);
        
        await supabase
          .from('reminder_queue')
          .update({
            status: 'failed',
            sent_at: new Date().toISOString()
          })
          .eq('id', reminder.id);
      }
    }

    console.log(`Reminder processing complete: ${processed} processed`);

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        total: reminders.length
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error('Error in process-reminders:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
};

async function send2HourReminder(supabase: any, assignment: any) {
  const subcontractor = assignment.subcontractors;
  
  // Generate fresh tokens for the reminder
  const { data: acceptToken } = await supabase.rpc('generate_assignment_token', {
    p_assignment_id: assignment.id,
    p_action: 'accept',
    p_expires_hours: 22 // 22 more hours from now
  });
  
  const { data: declineToken } = await supabase.rpc('generate_assignment_token', {
    p_assignment_id: assignment.id,
    p_action: 'decline',
    p_expires_hours: 22
  });

  const payload = {
    assignment_id: assignment.id,
    subcontractor_name: subcontractor.full_name,
    job_details: assignment,
    accept_token: acceptToken,
    decline_token: declineToken,
    expires_at: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
    reminder_type: '2hour'
  };

  // Queue reminder messages
  if (subcontractor.email) {
    await supabase
      .from('message_queue')
      .insert({
        channel: 'email',
        template_code: 'REMINDER_2H',
        recipient_id: assignment.subcontractor_id,
        recipient_email: subcontractor.email,
        payload_json: payload
      });
  }

  if (subcontractor.phone) {
    await supabase
      .from('message_queue')
      .insert({
        channel: 'sms',
        template_code: 'REMINDER_2H',
        recipient_id: assignment.subcontractor_id,
        recipient_phone: subcontractor.phone,
        payload_json: payload
      });
  }

  // Trigger message processor
  try {
    await supabase.functions.invoke('process-message-queue');
  } catch (error) {
    console.log('Note: Message queue processor invocation failed:', error);
  }
}

async function sendExpiryNotification(supabase: any, assignment: any) {
  const subcontractor = assignment.subcontractors;
  
  const payload = {
    assignment_id: assignment.id,
    subcontractor_name: subcontractor.full_name,
    job_details: assignment,
    notification_type: 'expiry'
  };

  // Queue expiry notification
  if (subcontractor.email) {
    await supabase
      .from('message_queue')
      .insert({
        channel: 'email',
        template_code: 'OFFER_EXPIRED',
        recipient_id: assignment.subcontractor_id,
        recipient_email: subcontractor.email,
        payload_json: payload
      });
  }

  // Trigger message processor
  try {
    await supabase.functions.invoke('process-message-queue');
  } catch (error) {
    console.log('Note: Message queue processor invocation failed:', error);
  }
}

serve(handler);