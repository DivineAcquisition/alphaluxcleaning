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
    
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
    const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      console.error('Missing Twilio credentials');
      throw new Error('Twilio credentials not configured');
    }

    // Process message with template variables if provided
    let processedMessage = message;
    if (templateId && variables) {
      // Call template renderer function
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

    console.log(`Sending SMS to ${to}: ${processedMessage}`);

    // Send SMS via Twilio
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    
    const formData = new URLSearchParams();
    formData.append('From', TWILIO_PHONE_NUMBER);
    formData.append('To', to);
    formData.append('Body', processedMessage);

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('Twilio SMS error:', result);
      throw new Error(`SMS failed: ${result.message || 'Unknown error'}`);
    }

    console.log('SMS sent successfully:', result.sid);

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
            updated_at: new Date().toISOString()
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
              created_at: new Date().toISOString()
            }),
          });
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message_sid: result.sid,
      status: result.status,
      processed_message: processedMessage
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Enhanced SMS Error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});