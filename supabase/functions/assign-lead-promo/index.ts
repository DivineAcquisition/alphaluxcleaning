// assign-lead-promo — issue a single, per-email ALCxxx promo code.
//
// Guarantees:
//   - Idempotent on normalized email: calling this endpoint 100 times for
//     the same lead returns the *same* code.
//   - Code format: `ALC` + 3 digits (total 6 chars) for a maximum of 1000
//     unique codes. When the 3-digit space is exhausted we fall back to
//     `ALC` + base-36 suffix (still 6 chars) so the generator never blocks.
//   - Code is materialized into the public.promo_codes table as a PERCENT
//     code (50% off by default, `new_customers_only: true`,
//     `once_per_customer: true`) so the existing promo-system edge
//     function will validate and redeem it server-side.
//   - The lead\u2019s GHL contact is upserted and its "Promo Code" custom
//     field is populated with the assigned code.
//
// Inputs (JSON body):
//   {
//     email: string,              // required
//     firstName?, lastName?, phone?, zipCode?, city?, state?,
//     utms?: Record<string, string>,
//     percentOff?: number          // defaults to 50
//   }
//
// Response:
//   {
//     success: true,
//     code: "ALC347",
//     is_new: true|false,
//     promo_code_id: uuid,
//     ghl_contact_id?: string
//   }

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import {
  buildCustomFieldMap,
  createGhlClient,
  resolveFieldIdWithFallback as resolveFieldId,
} from '../_shared/ghl-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const DEFAULT_PERCENT_OFF = 50;
const MAX_GEN_ATTEMPTS = 40;

function log(step: string, details?: unknown) {
  console.log(
    `[assign-lead-promo] ${step}${
      details !== undefined ? ' ' + JSON.stringify(details) : ''
    }`,
  );
}

function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}

/**
 * Generate a candidate `ALCxxx` code. We try the 3-digit space first
 * (ALC000..ALC999) for aesthetics, then fall back to a 3-char base-36
 * suffix so the total code length stays at 6 characters.
 */
function generateCandidate(attempt: number): string {
  if (attempt < MAX_GEN_ATTEMPTS / 2) {
    const n = Math.floor(Math.random() * 1000);
    return `ALC${n.toString().padStart(3, '0')}`;
  }
  // Base-36 3-char suffix, uppercase — preserves 6-char length.
  const s = Math.floor(Math.random() * 36 ** 3)
    .toString(36)
    .padStart(3, '0')
    .toUpperCase();
  return `ALC${s}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const email = normalizeEmail(body?.email || '');
    if (!email) {
      return json({ success: false, error: 'email is required' }, 400);
    }

    const percentOff = Number(body?.percentOff ?? DEFAULT_PERCENT_OFF);
    const firstName = (body?.firstName || '').trim() || null;
    const lastName = (body?.lastName || '').trim() || null;
    const phone = (body?.phone || '').trim() || null;
    const zipCode = (body?.zipCode || body?.zip_code || '').trim() || null;
    const city = (body?.city || '').trim() || null;
    const state = (body?.state || '').trim() || null;
    const utms = body?.utms || null;

    log('request', { email, hasUtms: !!utms });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    );

    // 1. Look up existing assignment for this email.
    const { data: existing, error: lookupError } = await supabase
      .from('lead_promo_assignments')
      .select('*')
      .eq('email_normalized', email)
      .maybeSingle();

    if (lookupError && lookupError.code !== 'PGRST116') {
      log('lookup error', { code: lookupError.code, message: lookupError.message });
    }

    let code = existing?.code as string | undefined;
    let isNew = false;

    if (!code) {
      // 2. Generate an unused code. We collision-check against both
      //    lead_promo_assignments (per-email registry) and promo_codes
      //    (the global redeemable code table) so we never hand out a
      //    code that collides with an existing campaign code.
      for (let attempt = 0; attempt < MAX_GEN_ATTEMPTS; attempt++) {
        const candidate = generateCandidate(attempt);
        const { data: assignedRow } = await supabase
          .from('lead_promo_assignments')
          .select('id')
          .eq('code', candidate)
          .maybeSingle();
        if (assignedRow) continue;
        const { data: codeRow } = await supabase
          .from('promo_codes')
          .select('id')
          .eq('code', candidate)
          .maybeSingle();
        if (codeRow) continue;
        code = candidate;
        break;
      }

      if (!code) {
        return json(
          { success: false, error: 'Unable to generate a unique promo code' },
          500,
        );
      }

      isNew = true;
    }

    // 3. Persist (or update) the assignment row. Using `upsert` on
    //    email_normalized means a concurrent second call with the same
    //    email will still converge on a single row.
    const { data: upserted, error: upsertError } = await supabase
      .from('lead_promo_assignments')
      .upsert(
        {
          email,
          code,
          percent_off: percentOff,
          first_name: firstName,
          last_name: lastName,
          phone,
          zip_code: zipCode,
          city,
          state,
          utms,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email_normalized' },
      )
      .select('*')
      .single();

    if (upsertError) {
      log('upsert assignment error', upsertError);
      throw new Error(`Failed to persist assignment: ${upsertError.message}`);
    }

    code = upserted.code;

    // 4. Ensure the promo code itself exists in public.promo_codes so
    //    the existing promo-system edge function (used by checkout) can
    //    validate and redeem it.
    const { data: existingCode } = await supabase
      .from('promo_codes')
      .select('id')
      .eq('code', code!)
      .maybeSingle();

    let promoCodeId = existingCode?.id as string | undefined;
    if (!promoCodeId) {
      const { data: insertedCode, error: insertCodeError } = await supabase
        .from('promo_codes')
        .insert({
          code,
          type: 'PERCENT',
          percent_off: percentOff,
          amount_cents: 0,
          currency: 'USD',
          max_redemptions: 1,
          redemptions: 0,
          applies_to: 'ANY',
          min_subtotal_cents: 0,
          active: true,
          metadata: {
            description: `Personal ${percentOff}% off for ${email}`,
            source: 'assign-lead-promo',
            once_per_customer: true,
            new_customers_only: true,
            assigned_to_email: email,
          },
        })
        .select('id')
        .single();

      if (insertCodeError) {
        log('insert promo_code error', insertCodeError);
        throw new Error(`Failed to insert promo code: ${insertCodeError.message}`);
      }
      promoCodeId = insertedCode.id;
    }

    // 5. Push to GHL (best-effort — never block the promo on GHL outage).
    let ghlContactId = upserted.ghl_contact_id as string | null;
    try {
      const ghl = createGhlClient();
      const fieldsRes = await ghl.listCustomFields();
      const fieldMap = buildCustomFieldMap(fieldsRes.fields);
      const promoFieldId = resolveFieldId(fieldMap, [
        'promo_code',
        'promocode',
        'customer_promo_code',
        'personal_promo_code',
        'promo',
      ]);

      const customFields = [] as Array<{ id: string; field_value: unknown }>;
      if (promoFieldId) {
        customFields.push({ id: promoFieldId, field_value: code });
      }

      const utmFields = [
        ['utm_source', utms?.utm_source],
        ['utm_medium', utms?.utm_medium],
        ['utm_campaign', utms?.utm_campaign],
        ['utm_content', utms?.utm_content],
        ['utm_term', utms?.utm_term],
        ['landing_page', utms?.landing_page],
        ['referrer', utms?.referrer],
      ] as const;
      for (const [name, value] of utmFields) {
        if (!value) continue;
        const id = resolveFieldId(fieldMap, [name]);
        if (id) customFields.push({ id, field_value: value });
      }
      const zipFieldId = resolveFieldId(fieldMap, ['zip_code', 'zipcode', 'postal_code']);
      if (zipFieldId && zipCode) {
        customFields.push({ id: zipFieldId, field_value: zipCode });
      }

      const upsert = await ghl.upsertContact({
        email,
        phone: phone || undefined,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        name: [firstName, lastName].filter(Boolean).join(' ') || undefined,
        city: city || undefined,
        state: state || undefined,
        postalCode: zipCode || undefined,
        source: 'AlphaLuxClean TX/CA — ZIP form',
        tags: ['lead', 'alphaluxclean-txca', `promo-${code!.toLowerCase()}`],
        customFields,
      });

      if (upsert.ok && upsert.contactId) {
        ghlContactId = upsert.contactId;
        await supabase
          .from('lead_promo_assignments')
          .update({ ghl_contact_id: ghlContactId })
          .eq('id', upserted.id);
      } else {
        log('ghl upsert non-ok', { status: upsert.data });
      }
    } catch (ghlErr) {
      log('ghl sync skipped', {
        error: ghlErr instanceof Error ? ghlErr.message : String(ghlErr),
      });
    }

    return json({
      success: true,
      code,
      is_new: isNew,
      percent_off: percentOff,
      promo_code_id: promoCodeId,
      ghl_contact_id: ghlContactId,
      email,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[assign-lead-promo] error', msg);
    return json({ success: false, error: msg }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
