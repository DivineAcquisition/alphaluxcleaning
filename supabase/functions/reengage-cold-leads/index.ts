// reengage-cold-leads — win back GHL CRM contacts that have gone quiet.
//
// Finds GoHighLevel contacts whose last activity is older than N days
// (default 30) and sends them a re-engagement SMS through the GHL-first
// channel (OpenPhone fallback). Each contact is tagged so it's only
// re-engaged once per cooldown cycle (idempotent + safe to run on a cron).
//
// Designed to run from pg_cron (see migration) or be invoked manually.
//
// Body (all optional):
//   { days?: 30, limit?: 50, message?: "...", dryRun?: false,
//     skipCustomers?: true, cooldownTag?: "cold-reengage-30d" }

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { createGhlClient, ghlIsConfigured } from '../_shared/ghl-client.ts';
import { sendSms } from '../_shared/sms.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const DEFAULT_MESSAGE =
  "Hi {first_name}, it's AlphaLux Clean 👋 We noticed you were looking into a cleaning a while back. " +
  "Your instant price is still ready and we have openings this week. Want us to lock in a time? Reply YES and we'll take care of it.";

function log(step: string, details?: unknown) {
  console.log(`[reengage-cold-leads] ${step}${details !== undefined ? ' ' + JSON.stringify(details) : ''}`);
}

function contactLastActivityMs(c: any): number {
  const candidates = [c?.lastActivity, c?.dateUpdated, c?.dateAdded];
  for (const v of candidates) {
    if (!v) continue;
    const n = typeof v === 'number' ? v : Date.parse(String(v));
    if (!Number.isNaN(n) && n > 0) return n;
  }
  return 0; // unknown → treated as very stale
}

function firstNameOf(c: any): string {
  return (c?.firstName || (c?.contactName || c?.name || '').split(' ')[0] || 'there').trim();
}

function tagsOf(c: any): string[] {
  const t = c?.tags;
  if (Array.isArray(t)) return t.map((x: any) => String(x).toLowerCase());
  return [];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  );

  try {
    if (!ghlIsConfigured()) {
      return json({ success: false, error: 'GHL not configured (set GHL_PIT_TOKEN / GHL_LOCATION_ID)' }, 200);
    }

    const body = await req.json().catch(() => ({}));
    const days = Number(body?.days ?? 30);
    const limit = Math.min(Number(body?.limit ?? 50), 200);
    const dryRun = body?.dryRun === true;
    const skipCustomers = body?.skipCustomers !== false; // default true
    const cooldownTag = String(body?.cooldownTag || 'cold-reengage-30d').toLowerCase();
    const message: string = body?.message || DEFAULT_MESSAGE;

    const cutoffMs = Date.now() - days * 24 * 60 * 60 * 1000;
    const ghl = createGhlClient();

    // Page through contacts (stalest first) via the v2 search endpoint and
    // collect cold ones client-side. We cap pages so a huge CRM can't run
    // the function past the edge timeout — the cron picks up the rest next
    // run (newly-tagged contacts are skipped).
    const maxPages = 10;
    const pageLimit = 100;
    const cold: any[] = [];
    let scanned = 0;
    let reachedFresh = false;

    for (let page = 1; page <= maxPages && cold.length < limit && !reachedFresh; page++) {
      const res = await ghl.request('/contacts/search', {
        method: 'POST',
        body: JSON.stringify({
          locationId: ghl.locationId,
          page,
          pageLimit,
          sort: [{ field: 'lastActivity', direction: 'asc' }],
        }),
      });
      if (!res.ok) {
        log('contacts/search failed', { status: res.status, page });
        break;
      }
      const contacts: any[] = res.data?.contacts || res.data?.data || [];
      if (contacts.length === 0) break;
      scanned += contacts.length;

      for (const c of contacts) {
        if (cold.length >= limit) break;
        if (contactLastActivityMs(c) > cutoffMs) {
          // Sorted ascending by last activity, so the first fresh contact
          // means every remaining contact is fresh too — stop scanning.
          reachedFresh = true;
          break;
        }
        const tags = tagsOf(c);
        if (tags.includes(cooldownTag)) continue; // already re-engaged this cycle
        if (skipCustomers && (tags.includes('customer') || tags.includes('lead - booked'))) continue;
        if (!c?.phone) continue; // need a number to text
        cold.push(c);
      }
    }

    log('scan complete', { scanned, cold: cold.length, days, dryRun });

    if (dryRun) {
      return json({
        success: true,
        dryRun: true,
        scanned,
        cold_count: cold.length,
        sample: cold.slice(0, 10).map((c) => ({
          id: c.id,
          name: c.contactName || `${c.firstName || ''} ${c.lastName || ''}`.trim(),
          phone: c.phone,
          lastActivity: c.lastActivity || c.dateUpdated || c.dateAdded,
        })),
      });
    }

    let sent = 0;
    let failed = 0;
    const results: any[] = [];

    for (const c of cold) {
      const firstName = firstNameOf(c);
      const personalized = message.replace(/\{first_name\}/g, firstName);
      const sendRes = await sendSms({
        to: c.phone,
        contactId: c.id,
        email: c.email,
        firstName: c.firstName,
        lastName: c.lastName,
        message: personalized,
      });

      if (sendRes.success) {
        sent++;
        // Tag so we don't re-engage again until the cooldown tag is cleared.
        try {
          await ghl.addTags(c.id, [cooldownTag, 'reengaged']);
        } catch (e) {
          log('tag failed', { contactId: c.id, error: e instanceof Error ? e.message : String(e) });
        }
      } else {
        failed++;
      }
      results.push({ contactId: c.id, ok: sendRes.success, provider: sendRes.provider, error: sendRes.error });

      // Log to ghl_sync_log for observability (best-effort).
      try {
        await supabase.from('ghl_sync_log').insert({
          stage: 'reengage',
          email: c.email || null,
          status: sendRes.success ? 'success' : 'failed',
          attempts: 1,
          ghl_contact_id: c.id,
          payload: { days, provider: sendRes.provider },
          last_error: sendRes.error || null,
        });
      } catch (_) { /* table/column shape may differ — non-critical */ }
    }

    log('done', { sent, failed });
    return json({ success: true, scanned, cold_count: cold.length, sent, failed, results });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[reengage-cold-leads] error', msg);
    return json({ success: false, error: msg }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
