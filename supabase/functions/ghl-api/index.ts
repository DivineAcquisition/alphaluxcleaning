// GHL API gateway — thin admin wrapper around the shared ghl-client.
//
// Exposed actions:
//   - list_custom_fields    → GET /locations/:locationId/customFields
//   - list_pipelines        → GET /opportunities/pipelines
//   - resolve_booked_stage  → compute AGP "Booked" (or closest equivalent)
//   - upsert_contact        → POST /contacts/upsert
//   - add_tags              → POST /contacts/:id/tags
//   - find_contact          → GET  /contacts/search/duplicate
//   - passthrough           → arbitrary request (debugging)
//
// Uses GHL_PRIVATE_INTEGRATION_TOKEN + GHL_LOCATION_ID env vars if set,
// otherwise falls back to the location-scoped defaults baked into the
// shared ghl-client module.
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createGhlClient, pickBookedPipelineStage } from '../_shared/ghl-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const ghl = createGhlClient();
    const body = await req.json().catch(() => ({}));
    const action = body?.action as string | undefined;

    switch (action) {
      case 'list_custom_fields': {
        const res = await ghl.listCustomFields();
        return json({ success: res.ok, fields: res.fields, raw: res.data });
      }
      case 'list_pipelines': {
        const res = await ghl.listPipelines();
        return json({ success: res.ok, pipelines: res.pipelines, raw: res.data });
      }
      case 'resolve_booked_stage': {
        const res = await pickBookedPipelineStage(ghl);
        return json({ success: !!res.pipelineId, ...res });
      }
      case 'find_contact': {
        if (!body?.email) return json({ success: false, error: 'email required' }, 400);
        const res = await ghl.findContactByEmail(body.email);
        return json({ success: res.ok, contactId: res.contactId, raw: res.data });
      }
      case 'upsert_contact': {
        const res = await ghl.upsertContact(body?.contact || {});
        return json({ success: res.ok, contactId: res.contactId, raw: res.data });
      }
      case 'add_tags': {
        if (!body?.contactId) return json({ success: false, error: 'contactId required' }, 400);
        const res = await ghl.addTags(body.contactId, body.tags || []);
        return json({ success: res.ok, raw: res.data });
      }
      case 'passthrough': {
        const res = await ghl.request(body?.path || '/', {
          method: body?.method || 'GET',
          body: body?.body ? JSON.stringify(body.body) : undefined,
          query: body?.query,
        });
        return json({ success: res.ok, status: res.status, raw: res.data });
      }
      default:
        return json({ success: false, error: `Unknown action: ${action}` }, 400);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[ghl-api] error', msg);
    return json({ success: false, error: msg }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
