import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ZAPIER_WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/24603039/uaji3ls/';

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

    // Format the data for Zapier - matching requested field names exactly
    const zapierPayload = {
      // Core contact info
      date: new Date().toISOString(),
      name: `${payload.firstName} ${payload.lastName}`.trim(),
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      
      // Location
      zip_code: payload.zipCode,
      city: payload.city || '',
      state: payload.state || '',
      
      // Attribution & UTM data
      source_ad: payload.utmContent || '', // utm_content is the ad identifier
      landing_page: payload.landingPage || '',
      referrer: payload.referrer || '',
      first_visit_timestamp: payload.timestamp || '',
      utm_source: payload.utmSource || '',
      utm_medium: payload.utmMedium || '',
      utm_campaign: payload.utmCampaign || '',
      utm_content: payload.utmContent || '',
      utm_term: payload.utmTerm || '',
    };

    logStep('Formatted Zapier payload', zapierPayload);

    // Send to Zapier webhook
    const zapierResponse = await fetch(ZAPIER_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(zapierPayload),
    });

    const responseStatus = zapierResponse.status;
    let responseText = '';
    try {
      responseText = await zapierResponse.text();
    } catch (e) {
      responseText = 'Could not read response';
    }

    logStep('Zapier response', { status: responseStatus, body: responseText });

    if (!zapierResponse.ok) {
      logStep('Zapier webhook failed', { status: responseStatus });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Webhook delivery failed',
          status: responseStatus 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep('Lead webhook sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Lead captured and sent to Zapier',
        zapierStatus: responseStatus
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
