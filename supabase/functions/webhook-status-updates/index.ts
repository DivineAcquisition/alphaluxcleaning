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

    const url = new URL(req.url);
    const provider = url.searchParams.get('provider') || 'unknown';
    
    console.log(`Received webhook from provider: ${provider}`);

    const body = await req.text();
    let payload: any;
    
    try {
      payload = JSON.parse(body);
    } catch {
      payload = { raw: body };
    }

    console.log('Webhook payload:', JSON.stringify(payload, null, 2));

    // Process based on provider
    if (provider === 'twilio') {
      await processTwilioWebhook(supabase, payload);
    } else if (provider === 'resend') {
      await processResendWebhook(supabase, payload);
    } else {
      console.log(`Unsupported provider: ${provider}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error('Error in webhook-status-updates:', error);
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

async function processTwilioWebhook(supabase: any, payload: any) {
  const messageSid = payload.MessageSid || payload.SmsSid;
  const status = payload.MessageStatus || payload.SmsStatus;
  
  if (!messageSid || !status) {
    console.log('Missing required Twilio fields');
    return;
  }

  console.log(`Twilio status update: ${messageSid} -> ${status}`);

  // Map Twilio status to our status
  let mappedStatus = 'sent';
  let deliveredAt = null;
  let failedAt = null;
  let errorMessage = null;

  switch (status) {
    case 'delivered':
      mappedStatus = 'delivered';
      deliveredAt = new Date().toISOString();
      break;
    case 'failed':
    case 'undelivered':
      mappedStatus = 'failed';
      failedAt = new Date().toISOString();
      errorMessage = payload.ErrorMessage || payload.ErrorCode || 'Delivery failed';
      break;
    case 'sent':
      mappedStatus = 'sent';
      break;
  }

  // Update message status
  const { error } = await supabase
    .from('message_queue')
    .update({
      status: mappedStatus,
      delivered_at: deliveredAt,
      failed_at: failedAt,
      error_message: errorMessage
    })
    .eq('external_id', messageSid);

  if (error) {
    console.error('Error updating Twilio message status:', error);
  } else {
    console.log(`✅ Updated message ${messageSid} status to ${mappedStatus}`);
  }
}

async function processResendWebhook(supabase: any, payload: any) {
  const type = payload.type;
  const data = payload.data;
  
  if (!type || !data) {
    console.log('Missing required Resend fields');
    return;
  }

  const emailId = data.email_id;
  if (!emailId) {
    console.log('Missing email_id in Resend webhook');
    return;
  }

  console.log(`Resend ${type} event for email: ${emailId}`);

  let mappedStatus = 'sent';
  let deliveredAt = null;
  let failedAt = null;
  let errorMessage = null;

  switch (type) {
    case 'email.delivered':
      mappedStatus = 'delivered';
      deliveredAt = new Date().toISOString();
      break;
    case 'email.bounced':
    case 'email.complained':
      mappedStatus = 'failed';
      failedAt = new Date().toISOString();
      errorMessage = `Email ${type.split('.')[1]}`;
      break;
    case 'email.sent':
      mappedStatus = 'sent';
      break;
  }

  // Update message status - look for external_id or try to match by email
  const { error } = await supabase
    .from('message_queue')
    .update({
      status: mappedStatus,
      delivered_at: deliveredAt,
      failed_at: failedAt,
      error_message: errorMessage
    })
    .or(`external_id.eq.${emailId},recipient_email.eq.${data.to}`);

  if (error) {
    console.error('Error updating Resend message status:', error);
  } else {
    console.log(`✅ Updated email ${emailId} status to ${mappedStatus}`);
  }
}

serve(handler);