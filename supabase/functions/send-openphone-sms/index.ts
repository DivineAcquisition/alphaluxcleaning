import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';
import { sendSmsViaOpenPhone } from '../_shared/sms.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSRequest {
  to: string;
  message: string;
  state?: string;   // picks the state-routed OpenPhone "from" number
  zip?: string;     // ZIP fallback for state inference
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
    const { to, message, state, zip, notificationId, customerId, templateId, variables }: SMSRequest = await req.json();

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

    console.log(`Sending SMS via OpenPhone to ${to} (state: ${state || 'auto'})`);

    // Send through the shared state-routed OpenPhone sender so the
    // "from" number matches the customer's state (NJ / TX / CA / NY).
    const sendResult = await sendSmsViaOpenPhone(to, processedMessage, { state, zip });
    if (!sendResult.ok) {
      console.error('OpenPhone SMS error:', sendResult.error);
      throw new Error(`SMS failed: ${sendResult.error || 'Unknown error'}`);
    }
    const result = { id: sendResult.messageId, from: sendResult.from, state: sendResult.stateCode };

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
