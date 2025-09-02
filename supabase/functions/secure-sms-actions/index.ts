import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SecureSMSRequest {
  to: string;
  action: 'accept_job' | 'decline_job' | 'confirm_timesheet' | 'approve_payout';
  userId: string;
  resourceId: string;
  templateData?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

interface HMACTokenData {
  action: string;
  userId: string;
  resourceId: string;
  expiresAt: number;
  timestamp: number;
}

async function generateHMACToken(data: Omit<HMACTokenData, 'timestamp' | 'expiresAt'>): Promise<string> {
  const timestamp = Date.now();
  const expiresAt = timestamp + (24 * 60 * 60 * 1000); // 24 hours
  
  const tokenData: HMACTokenData = {
    ...data,
    timestamp,
    expiresAt
  };
  
  const payload = btoa(JSON.stringify(tokenData));
  
  // Use server-side secret for HMAC (more secure than client-side)
  const secret = Deno.env.get('HMAC_SECRET') || 'fallback-secret-for-dev';
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${payload}.${signature}`;
}

async function sendTwilioSMS(to: string, message: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

  if (!accountSid || !authToken || !fromNumber) {
    return { success: false, error: 'Twilio credentials not configured' };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  
  const body = new URLSearchParams({
    To: to,
    From: fromNumber,
    Body: message
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const result = await response.json();
    
    if (response.ok) {
      return { success: true, sid: result.sid };
    } else {
      return { success: false, error: result.message || 'SMS sending failed' };
    }
  } catch (error) {
    return { success: false, error: `Twilio API error: ${error.message}` };
  }
}

function generateSecureActionUrl(baseUrl: string, token: string, action: string): string {
  return `${baseUrl}/secure-action?token=${encodeURIComponent(token)}&action=${action}`;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { to, action, userId, resourceId, templateData = {}, priority = 'normal' }: SecureSMSRequest = await req.json();

    // Generate secure HMAC token
    const token = await generateHMACToken({ action, userId, resourceId });
    
    // Create secure action URL
    const baseUrl = req.headers.get('origin') || 'https://contractor.bayareacleaningpros.com';
    const actionUrl = generateSecureActionUrl(baseUrl, token, action);

    // Create message based on action type
    let message = '';
    switch (action) {
      case 'accept_job':
        message = `🏠 New job available! Location: ${templateData.location || 'TBD'}, Date: ${templateData.date || 'TBD'}. Click to accept: ${actionUrl}`;
        break;
      case 'decline_job':
        message = `❌ Need to decline job #${resourceId}? Click here: ${actionUrl}`;
        break;
      case 'confirm_timesheet':
        message = `⏰ Please confirm your timesheet for ${templateData.date || 'today'}. Hours: ${templateData.hours || 'N/A'}. Confirm: ${actionUrl}`;
        break;
      case 'approve_payout':
        message = `💰 Payout ready for approval: $${templateData.amount || 'TBD'}. Review and approve: ${actionUrl}`;
        break;
      default:
        message = `🔔 Action required. Complete here: ${actionUrl}`;
    }

    // Send SMS via Twilio
    const smsResult = await sendTwilioSMS(to, message);

    if (!smsResult.success) {
      console.error('SMS sending failed:', smsResult.error);
      return new Response(
        JSON.stringify({ success: false, error: smsResult.error }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Log the secure SMS action
    const logResult = await supabase
      .from('security_audit_log')
      .insert({
        user_id: userId,
        action_type: 'secure_sms_sent',
        resource_type: 'sms_notification',
        resource_id: resourceId,
        new_values: {
          action,
          to: to.replace(/(\d{3})\d{6}(\d{4})/, '$1****$2'), // Mask phone number
          sms_sid: smsResult.sid,
          priority,
          token_generated: true
        },
        risk_level: priority === 'urgent' ? 'high' : 'medium'
      });

    if (logResult.error) {
      console.error('Failed to log security event:', logResult.error);
    }

    // Store SMS delivery record  
    const deliveryResult = await supabase
      .from('notification_deliveries')
      .insert({
        user_id: userId,
        delivery_method: 'sms',
        destination: to,
        message_content: message.substring(0, 500), // Truncate for storage
        provider: 'twilio',
        provider_message_id: smsResult.sid,
        status: 'sent',
        metadata: {
          action,
          resource_id: resourceId,
          token_generated: true,
          priority,
          url_included: true
        }
      });

    if (deliveryResult.error) {
      console.error('Failed to store delivery record:', deliveryResult.error);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Secure SMS sent successfully',
        sms_sid: smsResult.sid,
        token_generated: true,
        action_url: actionUrl
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in secure-sms-actions function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});