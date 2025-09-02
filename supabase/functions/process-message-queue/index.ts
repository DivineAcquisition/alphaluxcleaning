import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuth = Deno.env.get('TWILIO_AUTH_TOKEN');

    console.log('Processing message queue...');

    // Get pending messages from queue
    const { data: messages, error: fetchError } = await supabase
      .from('message_queue')
      .select('*')
      .eq('status', 'queued')
      .lte('scheduled_for', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error('Error fetching messages:', fetchError);
      throw fetchError;
    }

    if (!messages || messages.length === 0) {
      console.log('No messages to process');
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log(`Processing ${messages.length} messages`);

    let processed = 0;
    let errors = 0;

    for (const message of messages) {
      try {
        // Mark as processing
        await supabase
          .from('message_queue')
          .update({ status: 'processing' })
          .eq('id', message.id);

        let success = false;
        let externalId = null;
        let errorMessage = null;

        if (message.channel === 'email') {
          success = await sendEmail(message, resend);
        } else if (message.channel === 'sms') {
          const result = await sendSMS(message, twilioSid, twilioAuth);
          success = result.success;
          externalId = result.externalId;
          errorMessage = result.error;
        }

        // Update message status
        const updateData: any = {
          status: success ? 'sent' : 'failed',
          sent_at: success ? new Date().toISOString() : null,
          failed_at: success ? null : new Date().toISOString(),
          retries: message.retries + 1
        };

        if (externalId) updateData.external_id = externalId;
        if (errorMessage) updateData.error_message = errorMessage;

        await supabase
          .from('message_queue')
          .update(updateData)
          .eq('id', message.id);

        if (success) {
          processed++;
          console.log(`✅ Sent ${message.channel} to ${message.recipient_email || message.recipient_phone}`);
        } else {
          errors++;
          console.log(`❌ Failed to send ${message.channel} to ${message.recipient_email || message.recipient_phone}: ${errorMessage}`);
        }

      } catch (error) {
        console.error(`Error processing message ${message.id}:`, error);
        
        await supabase
          .from('message_queue')
          .update({
            status: 'failed',
            failed_at: new Date().toISOString(),
            retries: message.retries + 1,
            error_message: error.message
          })
          .eq('id', message.id);
        
        errors++;
      }
    }

    console.log(`Message queue processing complete: ${processed} sent, ${errors} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        errors,
        total: messages.length
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error('Error in process-message-queue:', error);
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

async function sendEmail(message: any, resend: any): Promise<boolean> {
  try {
    const payload = message.payload_json;
    
    let subject = 'New Job Assignment';
    let html = `
      <h2>New Job Assignment</h2>
      <p>Hello ${payload.subcontractor_name},</p>
      <p>You have been assigned a new job. Please review the details and respond:</p>
      
      <div style="margin: 20px 0; padding: 20px; background: #f5f5f5; border-radius: 8px;">
        <h3>Job Details</h3>
        <p><strong>Date:</strong> ${payload.job_details?.scheduled_date || 'TBD'}</p>
        <p><strong>Time:</strong> ${payload.job_details?.scheduled_time || 'TBD'}</p>
        <p><strong>Address:</strong> ${payload.job_details?.service_address || 'TBD'}</p>
      </div>
      
      <div style="margin: 30px 0;">
        <a href="https://kqoezqzogleaaupjzxch.supabase.co/functions/v1/handle-assignment-response?token=${payload.accept_token}&action=accept" 
           style="background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-right: 10px;">
          ✅ Accept Job
        </a>
        <a href="https://kqoezqzogleaaupjzxch.supabase.co/functions/v1/handle-assignment-response?token=${payload.decline_token}&action=decline" 
           style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          ❌ Decline Job
        </a>
      </div>
      
      <p><small>This offer expires at ${new Date(payload.expires_at).toLocaleString()}</small></p>
    `;

    await resend.emails.send({
      from: 'Bay Area Cleaning Pros <jobs@bayareacleaningpros.com>',
      to: [message.recipient_email],
      subject,
      html,
    });

    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

async function sendSMS(message: any, twilioSid: string, twilioAuth: string): Promise<{ success: boolean; externalId?: string; error?: string }> {
  try {
    const payload = message.payload_json;
    
    const acceptUrl = `https://kqoezqzogleaaupjzxch.supabase.co/functions/v1/handle-assignment-response?token=${payload.accept_token}&action=accept`;
    const declineUrl = `https://kqoezqzogleaaupjzxch.supabase.co/functions/v1/handle-assignment-response?token=${payload.decline_token}&action=decline`;
    
    const text = `🧹 New job assignment for ${payload.subcontractor_name}!\n\n` +
                 `📅 ${payload.job_details?.scheduled_date || 'TBD'} at ${payload.job_details?.scheduled_time || 'TBD'}\n` +
                 `📍 ${payload.job_details?.service_address || 'Address TBD'}\n\n` +
                 `Accept: ${acceptUrl}\n` +
                 `Decline: ${declineUrl}\n\n` +
                 `Expires: ${new Date(payload.expires_at).toLocaleString()}`;

    const twilioResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${twilioSid}:${twilioAuth}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: '+1234567890', // Replace with your Twilio phone number
        To: message.recipient_phone,
        Body: text,
      }),
    });

    if (!twilioResponse.ok) {
      const error = await twilioResponse.text();
      return { success: false, error };
    }

    const result = await twilioResponse.json();
    return { success: true, externalId: result.sid };
    
  } catch (error) {
    console.error('SMS send error:', error);
    return { success: false, error: error.message };
  }
}

serve(handler);