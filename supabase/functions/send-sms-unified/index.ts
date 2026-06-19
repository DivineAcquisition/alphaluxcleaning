import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { sendSms } from '../_shared/sms.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSRequest {
  to: string;
  message: string;
  notificationId?: string;
  customerId?: string;
  contactId?: string;
  email?: string;
  name?: string;
  templateId?: string;
  variables?: Record<string, any>;
  // Retained for backwards compatibility; routing is now always
  // GHL-first → OpenPhone-fallback regardless of this value.
  provider?: 'openphone' | 'twilio' | 'ghl' | 'auto';
  enableFallback?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      to,
      message,
      notificationId,
      customerId,
      contactId,
      email,
      name,
      templateId,
      variables,
      enableFallback = true,
    }: SMSRequest = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Render a template first if requested (keeps the old template path working).
    let finalMessage = message;
    if (templateId && variables) {
      try {
        const { data: renderResult } = await supabase.functions.invoke('template-renderer', {
          body: { templateId, variables, deliveryMethod: 'sms' },
        });
        if ((renderResult as any)?.renderedContent) {
          finalMessage = (renderResult as any).renderedContent;
        }
      } catch (e) {
        console.warn('[send-sms-unified] template render failed, using raw message', e);
      }
    }

    // GHL is the core channel; OpenPhone is the fallback.
    const result = await sendSms({
      to,
      message: finalMessage,
      contactId,
      email,
      name,
      enableFallback,
    });

    // Best-effort: mark the notification row sent/failed.
    if (notificationId) {
      try {
        await supabase
          .from('notification_queue')
          .update({
            status: result.success ? 'sent' : 'failed',
            sent_at: result.success ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
            metadata: {
              provider: result.provider,
              fallback: result.fallback,
              message_id: result.messageId,
              error: result.error,
            },
          })
          .eq('id', notificationId);
      } catch (e) {
        console.warn('[send-sms-unified] notification_queue update failed', e);
      }

      if (customerId && result.success) {
        try {
          await supabase.from('notification_analytics').insert({
            notification_id: notificationId,
            customer_id: customerId,
            event_type: 'sent',
            delivery_method: 'sms',
            metadata: { provider: result.provider, fallback: result.fallback },
            created_at: new Date().toISOString(),
          });
        } catch (_) { /* non-critical */ }
      }
    }

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Unified SMS Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
