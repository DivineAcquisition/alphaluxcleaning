import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GHL_WEBHOOK_URL = (Deno.env.get('GHL_LEAD_WEBHOOK_URL') || '').trim();
const ZAPIER_WEBHOOK_URL = (Deno.env.get('ZAPIER_LEAD_WEBHOOK_URL') || Deno.env.get('ZAPIER_WEBHOOK_URL') || '').trim();

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

    let ghlStatus = 0;
    let ghlResponseText = '';
    if (GHL_WEBHOOK_URL) {
      logStep('Sending to GoHighLevel', ghlPayload);
      const ghlResponse = await fetch(GHL_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ghlPayload),
      });
      ghlStatus = ghlResponse.status;
      try {
        ghlResponseText = await ghlResponse.text();
      } catch {
        ghlResponseText = 'Could not read response';
      }
      logStep('GHL response', { status: ghlStatus, body: ghlResponseText });
    } else {
      logStep('GHL_LEAD_WEBHOOK_URL not configured — skipping GHL webhook');
    }

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

    if (ZAPIER_WEBHOOK_URL) {
      fetch(ZAPIER_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zapierPayload),
      }).then(res => {
        logStep('Zapier backup sent', { status: res.status });
      }).catch(err => {
        logStep('Zapier backup failed (non-critical)', { error: err.message });
      });
    }

    // Send lead welcome email via send-email-system (non-blocking)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const appUrl = Deno.env.get("APP_URL") || "https://app.alphaluxclean.com";

    // Stage 1 GHL sync: ghl-sync-lead handles the GHL contact upsert,
    // mints the per-customer ALCxxx promo, opens a durable
    // ghl_sync_log row, and schedules a retry if LeadConnector is
    // down. We invoke it inline so we can return the assigned promo
    // code in the response (the front-end uses it to surface "code
    // sent to your email" copy at the next step).
    let assignedPromo: {
      code?: string;
      is_new?: boolean;
      ghl_contact_id?: string | null;
    } = {};
    try {
      const syncRes = await supabase.functions.invoke('ghl-sync-lead', {
        body: {
          email: payload.email,
          firstName: payload.firstName,
          lastName: payload.lastName,
          phone: payload.phone,
          zipCode: payload.zipCode,
          city: payload.city,
          state: payload.state,
          utms: {
            utm_source: payload.utmSource,
            utm_medium: payload.utmMedium,
            utm_campaign: payload.utmCampaign,
            utm_content: payload.utmContent,
            utm_term: payload.utmTerm,
            landing_page: payload.landingPage,
            referrer: payload.referrer,
          },
        },
      });
      if (syncRes.error) {
        logStep('ghl-sync-lead error (queued for retry)', { error: syncRes.error.message });
      } else {
        const d = (syncRes.data as any) || {};
        assignedPromo = {
          code: d.promo_code,
          is_new: d.promo_is_new,
          ghl_contact_id: d.ghl_contact_id || null,
        };
        logStep('ghl-sync-lead success', assignedPromo);
      }
    } catch (err) {
      logStep('ghl-sync-lead call failed (queued for retry)', {
        error: (err as Error).message,
      });
    }

    supabase.functions.invoke('send-email-system', {
      body: {
        template: 'lead_welcome',
        to: payload.email,
        data: {
          first_name: payload.firstName,
          email: payload.email,
          app_url: appUrl,
          promo_code: assignedPromo.code || ''
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

    // Speed-to-lead fan-out: intro SMS to the lead from the OpenPhone
    // number matching their state, plus the internal ops notification
    // email. Delegated to `lead-intro-comms`, which owns the
    // idempotency ledger (lead_intro_notifications) so a double-submit
    // can't double-text or double-email.
    //
    // AWAITED on purpose: the edge runtime tears down pending promises
    // once we return a response, so the previous fire-and-forget
    // invocation of the owner notification was silently dropped
    // whenever the response won the race.
    const submittedAt = payload.timestamp || new Date().toISOString();
    let leadIntro: unknown = null;
    try {
      const introRes = await supabase.functions.invoke('lead-intro-comms', {
        body: {
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email,
          phone: payload.phone,
          zipCode: payload.zipCode,
          city: payload.city,
          state: payload.state,
          promoCode: assignedPromo.code || '',
          landingPage: payload.landingPage,
          referrer: payload.referrer,
          submittedAt,
          utms: {
            utm_source: payload.utmSource,
            utm_medium: payload.utmMedium,
            utm_campaign: payload.utmCampaign,
            utm_content: payload.utmContent,
            utm_term: payload.utmTerm,
          },
        },
      });
      leadIntro = introRes.error ? { error: introRes.error.message } : introRes.data;
      logStep('lead-intro-comms result', leadIntro);
    } catch (err) {
      leadIntro = { error: (err as Error).message };
      logStep('lead-intro-comms failed (non-blocking)', leadIntro);
    }

    // The lead is captured at this point regardless of the GHL *webhook*
    // (the durable contact upsert happens in ghl-sync-lead, which has its
    // own retry, and the intro SMS + ops alert have already gone out).
    // A failed webhook is an integration warning, not a customer-facing
    // failure — reporting it as one made the funnel show a scary error
    // toast on leads that actually saved fine.
    if (!ghlResponse.ok) {
      logStep('GHL webhook failed (lead still captured)', { status: ghlStatus });
    } else {
      logStep('Lead webhook sent successfully to GHL');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Lead captured',
        ghlDelivered: ghlResponse.ok,
        ghlStatus: ghlStatus,
        promo: assignedPromo,
        leadIntro,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep('Error processing lead webhook', { error: msg });
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
