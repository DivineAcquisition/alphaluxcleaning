import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// GoHighLevel webhook URL (primary)
const GHL_WEBHOOK_URL = 'https://services.leadconnectorhq.com/hooks/Lvvq87zxxbYFnaTEklYX/webhook-trigger/a265536b-eeaf-48ff-b967-6d3aa1d82643';

// Zapier webhook URL (backup/logging)
const ZAPIER_WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/24603039/uaji3ls/';

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface LeadPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  zipCode: string;
  city?: string;
  state?: string;
  landingPage?: string;
  referrer?: string;
  timestamp?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  message?: string;
}

function logStep(step: string, details?: any) {
  console.log(`[LEAD-WEBHOOK] ${step}`, details ? JSON.stringify(details) : '');
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Received lead webhook request');
    
    const payload: LeadPayload = await req.json();
    logStep('Parsed payload', { 
      firstName: payload.firstName, 
      lastName: payload.lastName,
      email: payload.email,
      zipCode: payload.zipCode 
    });

    // Validate required fields
    if (!payload.firstName || !payload.lastName || !payload.email || !payload.phone) {
      logStep('Validation failed - missing required fields');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fullName = `${payload.firstName} ${payload.lastName}`.trim();

    // Format payload for GoHighLevel (primary destination)
    const ghlPayload = {
      name: fullName,
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      message: payload.message || `New lead from ${payload.city || ''}, ${payload.state || ''} ${payload.zipCode}`.trim(),
      utm_source: payload.utmSource || '',
      utm_medium: payload.utmMedium || '',
      utm_campaign: payload.utmCampaign || '',
      utm_content: payload.utmContent || '',
      utm_term: payload.utmTerm || '',
      landing_page: payload.landingPage || '',
      timestamp: payload.timestamp || new Date().toISOString(),
      // Additional useful fields for GHL custom fields
      zip_code: payload.zipCode,
      city: payload.city || '',
      state: payload.state || '',
      referrer: payload.referrer || '',
    };

    logStep('Sending to GoHighLevel', ghlPayload);

    // Send to GoHighLevel (primary)
    const ghlResponse = await fetch(GHL_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ghlPayload),
    });

    const ghlStatus = ghlResponse.status;
    let ghlResponseText = '';
    try {
      ghlResponseText = await ghlResponse.text();
    } catch (e) {
      ghlResponseText = 'Could not read response';
    }

    logStep('GHL response', { status: ghlStatus, body: ghlResponseText });

    // Also send to Zapier for backup/logging (non-blocking)
    const zapierPayload = {
      date: new Date().toISOString(),
      name: fullName,
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      zip_code: payload.zipCode,
      city: payload.city || '',
      state: payload.state || '',
      source_ad: payload.utmContent || '',
      landing_page: payload.landingPage || '',
      referrer: payload.referrer || '',
      first_visit_timestamp: payload.timestamp || '',
      utm_source: payload.utmSource || '',
      utm_medium: payload.utmMedium || '',
      utm_campaign: payload.utmCampaign || '',
      utm_content: payload.utmContent || '',
      utm_term: payload.utmTerm || '',
    };

    // Fire and forget to Zapier
    fetch(ZAPIER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(zapierPayload),
    }).then(res => {
      logStep('Zapier backup sent', { status: res.status });
    }).catch(err => {
      logStep('Zapier backup failed (non-critical)', { error: err.message });
    });

    // Send lead welcome email via send-email-system (non-blocking)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const appUrl = Deno.env.get("APP_URL") || "https://app.alphaluxclean.com";
    
    supabase.functions.invoke('send-email-system', {
      body: {
        template: 'lead_welcome',
        to: payload.email,
        data: {
          first_name: payload.firstName,
          email: payload.email,
          app_url: appUrl
        },
        category: 'marketing'
      }
    }).then(res => {
      if (res.error) {
        logStep('Lead welcome email failed', { error: res.error.message });
      } else {
        logStep('Lead welcome email sent successfully', { data: res.data });
      }
    }).catch(err => {
      logStep('Lead welcome email error', { error: err.message });
    });

    // Return based on GHL response
    if (!ghlResponse.ok) {
      logStep('GHL webhook failed', { status: ghlStatus });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Webhook delivery failed',
          status: ghlStatus 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep('Lead webhook sent successfully to GHL');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Lead captured and sent to GoHighLevel',
        ghlStatus: ghlStatus
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logStep('Error processing lead webhook', { error: error.message });
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
