// ─── reconcile-ghl ───────────────────────────────────────────────────────
// Safety-net cron that runs every 5 minutes (scheduled in pg_cron).
// Finds bookings whose GHL sync is stale, errored, or never happened and
// re-fires ghl-sync-booking for each. Three "needs sync" signals:
//
//   1. ghl_synced_at IS NULL AND status IN (confirmed,completed,active)
//                                              — booking is past the
//                                                deposit gate but has
//                                                never been pushed to
//                                                GHL.
//   2. ghl_synced_at < updated_at - 60s        — booking was modified
//                                                AFTER the last sync
//                                                stamp, so GHL is now
//                                                stale.
//   3. ghl_sync_error IS NOT NULL              — last sync failed.
//
// Caps each run to a small batch (10 rows × 4 concurrent) so we don't
// hammer GHL during a backlog spike. Subsequent cron ticks pick up the
// rest. Stops retrying after 5 failed attempts to avoid hot-loops.
//
// Always returns 200 + a summary so pg_cron doesn't log spurious errors.

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const log = (step: string, details?: unknown) =>
  console.log(
    `[reconcile-ghl] ${step}`,
    details !== undefined ? JSON.stringify(details) : '',
  );

// Tunables — keep small so a single run never DDoSes GHL.
// 10 per pass × 4 concurrent → ~10-15s wall time, well under the
// 150s edge-function idle-timeout. Cron runs every 5 minutes so even
// a 100-row backlog clears in well under an hour.
const BATCH_SIZE = 10;
const CONCURRENCY = 4;
const STALE_GRACE_SECONDS = 60;
const LOOKBACK_HOURS = 24 * 14; // never reconcile bookings older than 2 weeks
const MAX_ATTEMPTS = 5;

// Bookings in these statuses are eligible for sync. Pending bookings
// (status='pending', payment_status='pending') haven't paid yet so
// ghl-sync-booking would silently no-op on them — keep them out of the
// reconcile pool.
const SYNCABLE_STATUSES = ['confirmed', 'completed', 'active', 'recurring'];

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  );

  try {
    const body = req.method === 'POST'
      ? await req.json().catch(() => ({}))
      : {};
    const dryRun = !!body?.dry_run;
    const limit = Math.max(1, Math.min(Number(body?.limit) || BATCH_SIZE, 50));

    const cutoff = new Date(Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000).toISOString();

    // Pass 1 — never-synced or last-attempt-errored.
    const { data: rows, error } = await supabase
      .from('bookings')
      .select('id, ghl_synced_at, ghl_sync_attempts, ghl_sync_error, updated_at, status, payment_status')
      .in('status', SYNCABLE_STATUSES)
      .or('ghl_synced_at.is.null,ghl_sync_error.not.is.null')
      .lt('ghl_sync_attempts', MAX_ATTEMPTS)
      .gt('updated_at', cutoff)
      .order('updated_at', { ascending: true })
      .limit(limit);
    if (error) throw new Error(`fetch never-synced: ${error.message}`);

    // Pass 2 — stale rows (column-to-column comparison can't go in
    // PostgREST's filter, so we fetch a larger window and filter in JS).
    const { data: staleRows } = await supabase
      .from('bookings')
      .select('id, ghl_synced_at, ghl_sync_attempts, ghl_sync_error, updated_at, status, payment_status')
      .in('status', SYNCABLE_STATUSES)
      .not('ghl_synced_at', 'is', null)
      .lt('ghl_sync_attempts', MAX_ATTEMPTS)
      .gt('updated_at', cutoff)
      .order('updated_at', { ascending: true })
      .limit(limit * 3);

    const candidates = new Map<string, any>();
    for (const r of rows || []) candidates.set(r.id, r);
    for (const r of staleRows || []) {
      const synced = r.ghl_synced_at ? new Date(r.ghl_synced_at).getTime() : 0;
      const updated = r.updated_at ? new Date(r.updated_at).getTime() : 0;
      if (updated > synced + STALE_GRACE_SECONDS * 1000) {
        candidates.set(r.id, r);
      }
    }

    const batch = Array.from(candidates.values()).slice(0, limit);
    log('candidates', { count: batch.length, lookbackHours: LOOKBACK_HOURS, dryRun });

    if (dryRun) {
      return json({
        success: true,
        dry_run: true,
        ready: batch.length,
        rows: batch.map((r: any) => ({
          id: r.id,
          status: r.status,
          attempts: r.ghl_sync_attempts,
          synced_at: r.ghl_synced_at,
          updated_at: r.updated_at,
          error: r.ghl_sync_error,
        })),
      });
    }

    let succeeded = 0;
    let failed = 0;
    const results: Array<Record<string, unknown>> = [];

    // Process in CONCURRENCY-sized waves so GHL sees a steady trickle.
    for (let i = 0; i < batch.length; i += CONCURRENCY) {
      const wave = batch.slice(i, i + CONCURRENCY);
      await Promise.all(wave.map(async (row: any) => {
        try {
          const { data, error: invokeErr } = await supabase.functions.invoke(
            'ghl-sync-booking',
            {
              body: {
                booking_id: row.id,
                source: 'reconcile_cron',
                trigger_op: 'reconcile',
              },
            },
          );
          if (invokeErr) throw new Error(invokeErr.message || String(invokeErr));
          const ok = !!(data as any)?.success;
          if (ok) {
            succeeded += 1;
          } else {
            failed += 1;
            // ghl-sync-booking already stamped ghl_sync_error +
            // ghl_sync_attempts in its failure branch — no extra
            // stamping needed here.
          }
          results.push({ id: row.id, status: ok ? 'sent' : 'failed' });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          log('invoke failed', { bookingId: row.id, error: msg });
          failed += 1;
          // Stamp directly when ghl-sync-booking itself couldn't be
          // invoked (network error, function offline, etc.).
          try {
            await supabase
              .from('bookings')
              .update({
                ghl_sync_attempts: (row.ghl_sync_attempts || 0) + 1,
                ghl_sync_error: msg.slice(0, 500),
              })
              .eq('id', row.id);
            await supabase.from('ghl_sync_log').insert({
              stage: 'booking',
              booking_id: row.id,
              status: 'failed',
              source: 'reconcile_cron',
              trigger_op: 'reconcile',
              succeeded: false,
              error_message: msg.slice(0, 500),
              last_error: msg,
            });
          } catch (_) { /* best effort */ }
          results.push({ id: row.id, status: 'failed', error: msg });
        }
      }));
    }

    log('done', { processed: results.length, succeeded, failed });
    return json({
      success: true,
      batch_size: batch.length,
      succeeded,
      failed,
      lookback_hours: LOOKBACK_HOURS,
      results,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log('ERROR', { msg });
    return json({ success: false, error: msg }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
