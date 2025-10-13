import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSRequest {
  to: string;
  message: string;
  notificationId?: string;
  customerId?: string;
  templateId?: string;
  variables?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, message, notificationId, customerId, templateId, variables }: SMSRequest = await req.json();
    
    const OPENPHONE_API_KEY = Deno.env.get('OPENPHONE_API_KEY');
    const OPENPHONE_PHONE_NUMBER_ID = Deno.env.get('OPENPHONE_PHONE_NUMBER_ID');

    if (!OPENPHONE_API_KEY || !OPENPHONE_PHONE_NUMBER_ID) {
      console.error('Missing OpenPhone credentials');
      throw new Error('OpenPhone credentials not configured');
    }

    // Process message with template variables if provided
    let processedMessage = message;
    if (templateId && variables) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { data: renderResult } = await supabase.functions.invoke('template-renderer', {
        body: { templateId, variables, deliveryMethod: 'sms' }
      });

      if (renderResult?.renderedContent) {
        processedMessage = renderResult.renderedContent;
      }
    }

    console.log(`Sending SMS via OpenPhone to ${to}: ${processedMessage}`);

    // Send SMS via OpenPhone API
    const response = await fetch('https://api.openphone.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENPHONE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: processedMessage,
        phoneNumberId: OPENPHONE_PHONE_NUMBER_ID,
        to: [to],
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('OpenPhone SMS error:', result);
      throw new Error(`SMS failed: ${result.message || result.error || 'Unknown error'}`);
    }

    console.log('SMS sent successfully via OpenPhone:', result.id);

    // Update notification queue status if notification ID provided
    if (notificationId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (supabaseUrl && supabaseServiceKey) {
        await fetch(`${supabaseUrl}/rest/v1/notification_queue?id=eq.${notificationId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
          },
          body: JSON.stringify({
            status: 'sent',
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            metadata: { provider: 'openphone', message_id: result.id }
          }),
        });

        // Track analytics
        if (customerId) {
          await fetch(`${supabaseUrl}/rest/v1/notification_analytics`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
            },
            body: JSON.stringify({
              notification_id: notificationId,
              customer_id: customerId,
              event_type: 'sent',
              delivery_method: 'sms',
              metadata: { provider: 'openphone' },
              created_at: new Date().toISOString()
            }),
          });
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message_id: result.id,
      status: 'queued', // OpenPhone queues messages
      provider: 'openphone',
      processed_message: processedMessage
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('OpenPhone SMS Error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      provider: 'openphone'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
