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
    console.log('🧪 Testing email and webhook systems...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const results = {
      email_worker_test: null,
      webhook_test: null,
      email_queue_status: null,
      order_details_test: null
    };

    // 1. Test email worker by processing queued emails
    console.log('📧 Testing email worker...');
    try {
      const { data: emailWorkerResult, error: emailWorkerError } = await supabase.functions.invoke('emails-worker', {
        body: {}
      });
      
      results.email_worker_test = {
        success: !emailWorkerError,
        result: emailWorkerResult,
        error: emailWorkerError?.message
      };
      console.log('✅ Email worker test completed:', results.email_worker_test);
    } catch (error) {
      results.email_worker_test = { success: false, error: error.message };
      console.error('❌ Email worker test failed:', error);
    }

    // 2. Check email queue status
    console.log('📊 Checking email queue status...');
    const { data: emailJobs, error: emailJobsError } = await supabase
      .from('email_jobs')
      .select('status, count(*)')
      .order('status');
    
    results.email_queue_status = {
      success: !emailJobsError,
      jobs: emailJobs,
      error: emailJobsError?.message
    };

    // 3. Test webhook system with a booking
    console.log('🔗 Testing webhook system...');
    try {
      const { data: webhookResult, error: webhookError } = await supabase.functions.invoke('enhanced-booking-webhook-v2', {
        body: {
          booking_id: '2aff012e-f1fd-4bdd-93e1-5cd2f982e764',
          action: 'test_webhook'
        }
      });
      
      results.webhook_test = {
        success: !webhookError,
        result: webhookResult,
        error: webhookError?.message
      };
      console.log('✅ Webhook test completed:', results.webhook_test);
    } catch (error) {
      results.webhook_test = { success: false, error: error.message };
      console.error('❌ Webhook test failed:', error);
    }

    // 4. Test order details lookup
    console.log('🔍 Testing order details lookup...');
    try {
      const { data: orderResult, error: orderError } = await supabase.functions.invoke('get-order-details', {
        body: {
          payment_intent: 'pi_3SBpGBEFKFvC92D71DhrJIar'
        }
      });
      
      results.order_details_test = {
        success: !orderError,
        found_order: !!orderResult?.order,
        order_id: orderResult?.order?.id,
        error: orderError?.message
      };
      console.log('✅ Order details test completed:', results.order_details_test);
    } catch (error) {
      results.order_details_test = { success: false, error: error.message };
      console.error('❌ Order details test failed:', error);
    }

    // 5. Summary
    const allTests = Object.values(results);
    const successCount = allTests.filter(test => test?.success).length;
    
    console.log(`🏁 System test completed: ${successCount}/${allTests.length} tests passed`);

    return new Response(JSON.stringify({
      success: successCount === allTests.length,
      message: `System test completed: ${successCount}/${allTests.length} tests passed`,
      results,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('💥 System test error:', error);
    
    return new Response(JSON.stringify({
      error: error.message,
      success: false,
      function: 'test-email-webhook-system'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});