import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, webhook-signature',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const webhookSecret = Deno.env.get('EMAIL_WEBHOOK_SECRET');

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
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers.entries());
    
    console.log('Received webhook:', { headers, payload: payload.substring(0, 200) });

    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      try {
        const wh = new Webhook(webhookSecret);
        wh.verify(payload, headers);
      } catch (error) {
        console.error('Webhook verification failed:', error);
        return new Response('Unauthorized', { 
          status: 401,
          headers: corsHeaders
        });
      }
    }

    // Parse the webhook payload
    let event;
    try {
      event = JSON.parse(payload);
    } catch (error) {
      console.error('Failed to parse webhook payload:', error);
      return new Response('Invalid JSON', { 
        status: 400,
        headers: corsHeaders
      });
    }

    console.log('Parsed event:', event);

    // Handle different event types from Resend
    const { type, data } = event;
    
    if (!data || !data.id) {
      console.error('Missing required data in webhook:', event);
      return new Response('Invalid webhook data', { 
        status: 400,
        headers: corsHeaders
      });
    }

    const messageId = data.id;
    const eventType = type;

    // Map Resend event types to our status values
    const statusMap: Record<string, string> = {
      'email.sent': 'sent',
      'email.delivered': 'delivered',
      'email.delivery_delayed': 'delayed',
      'email.bounced': 'bounced',
      'email.complained': 'complained',
      'email.opened': 'opened',
      'email.clicked': 'clicked',
      'email.delivery_failed': 'failed'
    };

    const status = statusMap[eventType] || 'unknown';

    // Store webhook receipt
    const { error: receiptError } = await supabase
      .from('email_webhook_receipts')
      .insert({
        provider_event: eventType,
        message_id: messageId,
        payload: event,
        company_id: null // We'll try to match this below
      });

    if (receiptError) {
      console.error('Error storing webhook receipt:', receiptError);
    }

    // Update corresponding email event status
    const { data: emailEvent, error: updateError } = await supabase
      .from('email_events')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('message_id', messageId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating email event:', updateError);
      // Don't fail the webhook for this - the receipt is still stored
    } else if (emailEvent) {
      console.log('Updated email event:', emailEvent.id, 'to status:', status);
      
      // Update the webhook receipt with company_id now that we have it
      if (emailEvent.company_id) {
        await supabase
          .from('email_webhook_receipts')
          .update({ company_id: emailEvent.company_id })
          .eq('message_id', messageId);
      }
    } else {
      console.log('No matching email event found for message_id:', messageId);
    }

    // Handle specific event types for additional processing
    switch (eventType) {
      case 'email.bounced':
      case 'email.complained':
      case 'email.delivery_failed':
        // Log as error for investigation
        console.error('Email delivery issue:', {
          type: eventType,
          messageId,
          data
        });
        break;
      
      case 'email.opened':
      case 'email.clicked':
        // Track engagement metrics
        console.log('Email engagement:', {
          type: eventType,
          messageId,
          timestamp: data.created_at
        });
        break;
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Webhook processed successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    console.error('Error processing webhook:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
};

serve(handler);