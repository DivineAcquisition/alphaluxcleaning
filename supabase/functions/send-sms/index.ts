// send-sms — canonical outbound SMS endpoint.
//
// Routes through OpenPhone first — from the business number matching the
// customer's state (NJ / TX / CA / NY) — and falls back to GoHighLevel
// only when OpenPhone fails, via the shared _shared/sms.ts helper.
// Opt-outs (STOP) are enforced globally inside sendSms().
//
// Body: {
//   to?: string,            // destination phone (any format)
//   message: string,        // required
//   state?: string,         // customer state — picks the OpenPhone "from" number
//   zip?: string,           // ZIP fallback for state inference
//   context?: string,       // caller tag for the sms_logs ledger
//   contactId?: string,     // known GHL contact id (optional, fallback path)
//   email?, firstName?, lastName?, name?,  // used to resolve/create the GHL contact
//   fromNumber?: string,    // override GHL "from" number (fallback path)
//   enableFallback?: bool,  // default true
//   enableGhl?: bool        // default true
// }

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { sendSms, type SendSmsInput } from '../_shared/sms.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as SendSmsInput;
    if (!body?.message || (!body.to && !body.contactId)) {
      return json({ success: false, error: 'message and (to or contactId) are required' }, 400);
    }

    const result = await sendSms(body);
    return json(result, result.success ? 200 : 502);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[send-sms] error', msg);
    return json({ success: false, error: msg }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
