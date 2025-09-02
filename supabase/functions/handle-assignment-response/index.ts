import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssignmentResponseRequest {
  token: string;
  action: 'accept' | 'decline';
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

    const { token, action }: AssignmentResponseRequest = await req.json();

    if (!token || !action || !['accept', 'decline'].includes(action)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid token or action' 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    console.log(`Processing assignment response: ${action} with token: ${token.substring(0, 8)}...`);

    // Use the database function to validate and process the token
    const { data: result, error } = await supabase.rpc('use_assignment_token', {
      p_token: token,
      p_action: action
    });

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Database error processing request' 
        }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    if (!result.success) {
      console.log('Token validation failed:', result.error);
      return new Response(
        JSON.stringify(result),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    console.log(`Assignment ${result.assignment_id} ${action}ed successfully`);

    // Cancel any pending reminders for this assignment
    await supabase
      .from('reminder_queue')
      .update({ status: 'cancelled' })
      .eq('assignment_id', result.assignment_id)
      .eq('status', 'pending');

    // Return a mobile-friendly success response
    const successMessage = action === 'accept' 
      ? '✅ Job accepted successfully! You will receive further details soon.'
      : '❌ Job declined. Thank you for your response.';

    return new Response(
      JSON.stringify({
        success: true,
        message: successMessage,
        assignment_id: result.assignment_id,
        new_status: result.new_status
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error('Error in handle-assignment-response:', error);
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