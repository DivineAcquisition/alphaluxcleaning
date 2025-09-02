import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JobNotificationRequest {
  assignment_id: string;
  subcontractor_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { assignment_id, subcontractor_id }: JobNotificationRequest = await req.json();

    if (!assignment_id || !subcontractor_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing assignment_id or subcontractor_id' 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    console.log(`Sending job notification for assignment: ${assignment_id} to contractor: ${subcontractor_id}`);

    // Use the database function to queue notifications
    const { data: result, error } = await supabase.rpc('queue_job_assignment_notification', {
      p_assignment_id: assignment_id,
      p_subcontractor_id: subcontractor_id
    });

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to queue notifications' 
        }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    if (!result.success) {
      console.log('Failed to queue notifications:', result.error);
      return new Response(
        JSON.stringify(result),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    console.log('Job notifications queued successfully');

    // Trigger the message queue processor
    try {
      await supabase.functions.invoke('process-message-queue');
    } catch (error) {
      console.log('Note: Message queue processor invocation failed, but notifications are queued:', error);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Job notifications sent successfully'
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error('Error in send-job-notifications:', error);
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

serve(handler);