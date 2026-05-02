// retry-ghl-syncs — cron-driven worker that picks up every
// ghl_sync_log row left in 'failed' (or stale 'pending') state with
// `next_retry_at <= now()` and replays it through the appropriate
// stage function (ghl-sync-lead or ghl-sync-booking). Backoff schedule
// (5m → 15m → 1h → 4h → 24h) lives in the producing functions; this
// worker just respects next_retry_at and abandons after 5 attempts.
//
// pg_cron calls this every 5 minutes via the same scheduler that
// dispatches scheduled emails (see migration). Safe to run manually:
//   POST {} → claims due rows, dispatches them, returns counts.

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const log = (step: string, data?: unknown) =>
  console.log(
    `[retry-ghl-syncs] ${step}`,
    data !== undefined ? JSON.stringify(data) : '',
  );

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = req.method === 'POST'
      ? await req.json().catch(() => ({}))
      : {};
    const limit = Math.max(1, Math.min(Number(body?.limit) || 25, 100));
    const dryRun = !!body?.dry_run;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    );

    const nowIso = new Date().toISOString();
    const { data: due, error } = await supabase
      .from('ghl_sync_log')
      .select('id, stage, booking_id, email, payload, attempts')
      .in('status', ['failed', 'pending'])
      .lte('next_retry_at', nowIso)
      .order('next_retry_at', { ascending: true })
      .limit(limit);
    if (error) throw new Error(`fetch due: ${error.message}`);

    if (!due || due.length === 0) {
      return json({ success: true, processed: 0, ready: 0 });
    }
    if (dryRun) {
      return json({
        success: true,
        dry_run: true,
        ready: due.length,
        rows: due.map((r) => ({
          id: r.id,
          stage: r.stage,
          attempts: r.attempts,
          ref: r.booking_id || r.email,
        })),
      });
    }

    const results: Array<Record<string, unknown>> = [];
    for (const row of due) {
      const payload = (row.payload as Record<string, unknown>) || {};
      // Prevent the dispatched function from opening a fresh log row
      // (we want it to update THIS one).
      payload._from_retry = true;

      const fnSlug =
        row.stage === 'lead' ? 'ghl-sync-lead' : 'ghl-sync-booking';

      try {
        const { data, error: invokeErr } = await supabase.functions.invoke(
          fnSlug,
          { body: payload },
        );
        if (invokeErr) throw new Error(invokeErr.message);
        const success = !!(data as any)?.success;
        await supabase
          .from('ghl_sync_log')
          .update({
            status: success ? 'success' : 'failed',
            ghl_contact_id: (data as any)?.ghl_contact_id ?? null,
            ghl_opportunity_id: (data as any)?.opportunity_id ?? null,
            ghl_appointment_id: (data as any)?.appointment_id ?? null,
            custom_fields_synced: (data as any)?.custom_fields_synced ?? null,
            last_error: success ? null : (data as any)?.error || 'unknown',
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id);
        results.push({
          id: row.id,
          stage: row.stage,
          status: success ? 'sent' : 'failed',
          contact_id: (data as any)?.ghl_contact_id,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await supabase
          .from('ghl_sync_log')
          .update({
            status: 'failed',
            last_error: msg,
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id);
        results.push({ id: row.id, stage: row.stage, status: 'failed', error: msg });
      }
    }

    log('processed', { processed: results.length });
    return json({ success: true, processed: results.length, results });
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
