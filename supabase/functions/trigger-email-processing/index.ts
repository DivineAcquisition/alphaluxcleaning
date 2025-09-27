import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    console.log('🚀 Triggering email processing...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check how many queued emails we have
    const { data: queuedEmails, error: queueError } = await supabase
      .from('email_jobs')
      .select('*')
      .eq('status', 'queued')
      .order('created_at', { ascending: true });

    if (queueError) {
      throw new Error(`Failed to fetch queued emails: ${queueError.message}`);
    }

    console.log(`📧 Found ${queuedEmails?.length || 0} queued emails`);

    if (!queuedEmails || queuedEmails.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No queued emails to process',
        processed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Process emails by calling the emails-worker function
    console.log('⚙️ Calling emails-worker function...');
    const { data: workerResult, error: workerError } = await supabase.functions.invoke('emails-worker', {
      body: {}
    });

    if (workerError) {
      console.error('❌ Email worker failed:', workerError);
      return new Response(JSON.stringify({
        success: false,
        error: `Email worker failed: ${workerError.message}`,
        queued_count: queuedEmails.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    console.log('✅ Email worker completed:', workerResult);

    // Check updated queue status
    const { data: remainingEmails } = await supabase
      .from('email_jobs')
      .select('status, count(*)')
      .eq('status', 'queued');

    return new Response(JSON.stringify({
      success: true,
      message: 'Email processing triggered successfully',
      initial_queued: queuedEmails.length,
      worker_result: workerResult,
      remaining_queued: remainingEmails?.length || 0,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('💥 Email processing trigger error:', error);
    
    return new Response(JSON.stringify({
      error: error.message,
      success: false,
      function: 'trigger-email-processing'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});