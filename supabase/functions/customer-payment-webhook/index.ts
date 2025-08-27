import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const WEBHOOK_URL = 'https://services.leadconnectorhq.com/hooks/jWh1TtlCjUDeZZ27RkkI/webhook-trigger/dc258af1-b167-4439-9616-c6b853925f29'

const logStep = (step: string, data?: any) => {
  console.log(`[customer-payment-webhook] ${step}`, data ? JSON.stringify(data) : '');
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Processing customer payment webhook');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { 
      orderId, 
      paymentIntentId, 
      amount, 
      customerEmail, 
      customerName, 
      serviceDetails,
      paymentStatus = 'completed'
    } = await req.json();

    if (!orderId || !paymentIntentId || !amount || !customerEmail) {
      logStep('Missing required webhook parameters');
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    logStep('Preparing webhook payload', { 
      orderId, 
      paymentIntentId, 
      amount, 
      customerEmail 
    });

    // Prepare webhook payload
    const webhookPayload = {
      event_type: 'customer_payment_completed',
      timestamp: new Date().toISOString(),
      payment_data: {
        order_id: orderId,
        payment_intent_id: paymentIntentId,
        amount_paid: amount,
        currency: 'usd',
        payment_status: paymentStatus,
        payment_method: 'card',
        payment_source: 'customer_portal'
      },
      customer_data: {
        email: customerEmail,
        name: customerName || 'N/A'
      },
      service_data: {
        service_type: serviceDetails?.serviceType || 'cleaning',
        service_address: serviceDetails?.address || 'N/A',
        service_date: serviceDetails?.serviceDate || null,
        cleaning_type: serviceDetails?.cleaningType || 'general'
      },
      metadata: {
        processed_at: new Date().toISOString(),
        webhook_source: 'lovable_customer_portal',
        environment: Deno.env.get('SUPABASE_URL')?.includes('localhost') ? 'development' : 'production'
      }
    };

    logStep('Sending webhook to GHL', { webhookUrl: WEBHOOK_URL });

    // Send webhook to GHL
    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'BayAreaCleaning-CustomerPortal/1.0'
      },
      body: JSON.stringify(webhookPayload)
    });

    const webhookSuccess = webhookResponse.ok;
    const webhookStatusCode = webhookResponse.status;
    
    logStep('Webhook response received', { 
      success: webhookSuccess, 
      statusCode: webhookStatusCode 
    });

    // Log webhook attempt in database
    try {
      await supabase.from('webhook_logs').insert({
        event_type: 'customer_payment_webhook',
        webhook_url: WEBHOOK_URL,
        payload: webhookPayload,
        response_status: webhookStatusCode,
        success: webhookSuccess,
        error_message: webhookSuccess ? null : `HTTP ${webhookStatusCode}`,
        metadata: {
          order_id: orderId,
          payment_intent_id: paymentIntentId,
          customer_email: customerEmail,
          source: 'customer_portal'
        }
      });
    } catch (logError) {
      logStep('Failed to log webhook attempt', { error: logError.message });
      // Don't fail the webhook response for logging errors
    }

    if (!webhookSuccess) {
      logStep('Webhook failed', { statusCode: webhookStatusCode });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Webhook failed with status ${webhookStatusCode}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    logStep('Customer payment webhook completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Payment webhook sent successfully',
        webhook_status: webhookStatusCode
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    logStep('Unexpected webhook error', { error: error.message });
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal webhook error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});