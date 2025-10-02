import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyticsEvent {
  eventType: 'BOOKING_CONFIRMED' | 'REWARD_ISSUED' | 'PROMO_APPLIED' | 'DEEP_CLEAN_RECOMMENDED';
  bookingId?: string;
  customerId?: string;
  data: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const zapierWebhookUrl = Deno.env.get('ZAPIER_WEBHOOK_URL');
    
    const event: AnalyticsEvent = await req.json();
    console.log('Tracking analytics event:', event.eventType);

    // Build the payload for Zapier
    const payload = {
      timestamp: new Date().toISOString(),
      event_type: event.eventType,
      booking_id: event.bookingId,
      customer_id: event.customerId,
      ...event.data
    };

    // Send to Zapier if configured
    if (zapierWebhookUrl) {
      try {
        await fetch(zapierWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        console.log('Event sent to Zapier');
      } catch (error) {
        console.error('Failed to send to Zapier:', error);
      }
    }

    // Store event in Supabase for internal tracking
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (supabaseUrl && supabaseServiceKey) {
      await fetch(`${supabaseUrl}/rest/v1/attribution_events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          event: event.eventType,
          payload: payload
        })
      });
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error tracking analytics:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});