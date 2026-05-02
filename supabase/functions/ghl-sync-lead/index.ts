// ghl-sync-lead — STAGE 1 of the GHL pipeline.
// Fires the moment a customer submits the ZIP/contact form at the top
// of the funnel (before they've selected a service or paid). Pushes
// the lead to GoHighLevel as a lead-tagged contact, kicks the
// existing assign-lead-promo flow to mint their personal ALCxxx code,
// and writes a durable row to public.ghl_sync_log so a transient
// LeadConnector outage can be replayed by retry-ghl-syncs later.
//
// Input shape mirrors emit-lead-webhook so the front-end doesn't need
// to change — emit-lead-webhook now invokes us inline.
//
// Idempotent on email. Calling repeatedly is safe and converges to a
// single GHL contact + a single lead_promo_assignments row + the
// latest ghl_sync_log row updated in place.

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import {
  buildCustomFieldMap,
  createGhlClient,
  resolveFieldIdWithFallback as resolveFieldId,
  type GHLCustomFieldValue,
} from '../_shared/ghl-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface LeadInput {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  zipCode?: string;
  city?: string;
  state?: string;
  utms?: Record<string, string | undefined>;
  // Skip retry log when set true (used by replay worker)
  _from_retry?: boolean;
}

const log = (step: string, data?: unknown) =>
  console.log(
    `[ghl-sync-lead] ${step}`,
    data !== undefined ? JSON.stringify(data) : '',
  );

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  );

  let logRowId: string | null = null;
  let body: LeadInput;

  try {
    body = await req.json();
    if (!body?.email) return json({ success: false, error: 'email is required' }, 400);

    const email = body.email.trim().toLowerCase();
    log('start', { email, hasUtms: !!body.utms });

    // 1. Open / reuse a durable sync-log row keyed on (stage, email).
    if (!body._from_retry) {
      const { data: existing } = await supabase
        .from('ghl_sync_log')
        .select('id, status, attempts')
        .eq('stage', 'lead')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing && existing.status === 'success') {
        // Already synced — safe to short-circuit but still try to refresh
        // the contact's promo + UTMs in GHL. Just don't open a new log row.
        logRowId = existing.id;
      } else if (existing) {
        logRowId = existing.id;
        await supabase
          .from('ghl_sync_log')
          .update({
            status: 'pending',
            attempts: (existing.attempts ?? 0) + 1,
            payload: body,
            updated_at: new Date().toISOString(),
          })
          .eq('id', logRowId);
      } else {
        const { data: newRow } = await supabase
          .from('ghl_sync_log')
          .insert({
            stage: 'lead',
            email,
            status: 'pending',
            attempts: 1,
            payload: body,
          })
          .select('id')
          .single();
        logRowId = newRow?.id ?? null;
      }
    }

    // 2. Mint / fetch the lead's personal ALCxxx promo code. This also
    //    upserts the GHL contact internally — but we re-upsert below
    //    with a richer custom-field set to backfill anything that
    //    assign-lead-promo doesn't carry.
    let promoCode: string | undefined;
    let promoNew = false;
    try {
      const { data: promoRes, error: promoErr } = await supabase.functions.invoke(
        'assign-lead-promo',
        {
          body: {
            email,
            firstName: body.firstName,
            lastName: body.lastName,
            phone: body.phone,
            zipCode: body.zipCode,
            city: body.city,
            state: body.state,
            utms: body.utms,
          },
        },
      );
      if (promoErr) throw new Error(promoErr.message);
      promoCode = (promoRes as any)?.code;
      promoNew = !!(promoRes as any)?.is_new;
      log('promo', { code: promoCode, isNew: promoNew });
    } catch (e) {
      log('assign-lead-promo failed', {
        error: e instanceof Error ? e.message : String(e),
      });
    }

    // 3. Upsert the GHL contact directly with full custom-field payload.
    const ghl = createGhlClient();
    const fieldsRes = await ghl.listCustomFields();
    const fieldMap = buildCustomFieldMap(fieldsRes.fields);
    const push = (
      acc: GHLCustomFieldValue[],
      candidates: string[],
      value: unknown,
    ) => {
      if (value === undefined || value === null || value === '') return;
      const id = resolveFieldId(fieldMap, candidates);
      if (id) acc.push({ id, field_value: value });
    };

    const customFields: GHLCustomFieldValue[] = [];
    push(customFields, ['promo_code'], promoCode);
    push(customFields, ['utm_source'], body.utms?.utm_source);
    push(customFields, ['utm_medium'], body.utms?.utm_medium);
    push(customFields, ['utm_campaign'], body.utms?.utm_campaign);
    push(customFields, ['utm_content'], body.utms?.utm_content);
    push(customFields, ['landing_page'], body.utms?.landing_page);
    push(customFields, ['tracking_attribution'], body.utms?.referrer);
    if (body.utms) push(customFields, ['utm_fields'], JSON.stringify(body.utms));

    const fullName = [body.firstName, body.lastName].filter(Boolean).join(' ') || undefined;

    const upsert = await ghl.upsertContact({
      email,
      phone: body.phone || undefined,
      firstName: body.firstName || undefined,
      lastName: body.lastName || undefined,
      name: fullName,
      city: body.city || undefined,
      state: body.state || undefined,
      postalCode: body.zipCode || undefined,
      source: 'AlphaLuxClean — ZIP form (lead)',
      tags: [
        'lead',
        'alphaluxclean',
        promoCode ? `promo-${promoCode.toLowerCase()}` : '',
      ].filter(Boolean) as string[],
      customFields,
    });

    if (!upsert.contactId) {
      throw new Error(
        `GHL upsert did not return a contact id: ${JSON.stringify(upsert.data).slice(0, 400)}`,
      );
    }

    log('contact upserted', {
      contactId: upsert.contactId,
      customFieldsSent: customFields.length,
    });

    // 4. Mark the sync-log row successful so the retry worker leaves it alone.
    if (logRowId) {
      await supabase
        .from('ghl_sync_log')
        .update({
          status: 'success',
          ghl_contact_id: upsert.contactId,
          custom_fields_synced: customFields.length,
          last_error: null,
          next_retry_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', logRowId);
    }

    return json({
      success: true,
      ghl_contact_id: upsert.contactId,
      promo_code: promoCode,
      promo_is_new: promoNew,
      custom_fields_synced: customFields.length,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log('ERROR', { msg });

    if (logRowId) {
      // Schedule a retry with exponential backoff (5m, 15m, 1h, 4h, 24h).
      const { data: row } = await supabase
        .from('ghl_sync_log')
        .select('attempts')
        .eq('id', logRowId)
        .maybeSingle();
      const attempts = (row?.attempts ?? 1) as number;
      const delays = [5, 15, 60, 240, 1440] as const;
      const minutes = delays[Math.min(attempts - 1, delays.length - 1)];
      const next = new Date(Date.now() + minutes * 60 * 1000);
      await supabase
        .from('ghl_sync_log')
        .update({
          status: attempts >= 5 ? 'abandoned' : 'failed',
          last_error: msg,
          next_retry_at: attempts >= 5 ? null : next.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', logRowId);
    }

    return json({ success: false, error: msg }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
