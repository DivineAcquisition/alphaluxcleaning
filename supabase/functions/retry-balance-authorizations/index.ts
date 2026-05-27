// retry-balance-authorizations — cron-callable sweep that drives
// the balance pre-authorization lifecycle to completion.
//
// Runs the four ongoing maintenance tasks:
//
//   1. RETRY FAILED — bookings with balance_auth_status='failed'
//      AND balance_auth_attempts < 3 AND balance_auth_next_retry_at
//      <= now() → reauthorize via authorize-booking-balance.
//
//   2. RE-AUTH BEFORE EXPIRY — bookings with status='authorized'
//      whose hold expires before (service_date - 24h). Stripe's
//      7-day window means a hold placed at checkout will expire
//      before the cleaning lands when service is > 7 days out
//      (common for combo bundle's 2nd visit and recurring visits
//      2+3). We re-authorize so the funds are still reserved when
//      the cleaning happens.
//
//   3. RESCUE STUCK PENDING — bookings with status='pending' (the
//      initial post-deposit fan-out call never completed; common
//      symptom when Lovable's deploy is mid-rollout). Same
//      authorize-booking-balance invocation.
//
//   4. EXHAUSTED → CANCEL — bookings with attempts >= 3 and no
//      successful hold. Calls cancel-booking-for-auth-failure
//      which refunds the deposit, marks the booking cancelled,
//      notifies the customer and ops, and tells HCP to cancel
//      the job.
//
// Idempotent — every step short-circuits inside the called
// functions. Safe to run on a tight cron (e.g. every 15 minutes).
//
// Recommended schedule (pg_cron, scheduled task, or external):
//   */15 * * * *   (every 15 minutes)
//
// Invocation:
//   POST { dry_run?: boolean, limit?: number }
//   - dry_run: just report what would happen, don't call the
//     downstream functions
//   - limit: cap per-task batch size (default 100)

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  BALANCE_AUTH_MAX_ATTEMPTS,
  shouldReauthorizeBeforeExpiry,
  type BookingBalanceAuthRow,
} from "../_shared/balance-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, data?: unknown) =>
  console.log(
    `[retry-balance-authorizations] ${step}`,
    data !== undefined ? JSON.stringify(data) : "",
  );

interface SweepRow extends BookingBalanceAuthRow {
  status: string | null;
  payment_status: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const dryRun = !!body?.dry_run;
    const limit = Math.max(1, Math.min(500, Number(body?.limit) || 100));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    log("Sweep started", { dryRun, limit });

    const nowIso = new Date().toISOString();
    const summary: Record<string, number> = {
      retry_failed: 0,
      reauth_before_expiry: 0,
      rescue_pending: 0,
      cancel_exhausted: 0,
      errors: 0,
      skipped_cancelled: 0,
    };
    const details: Array<{
      bookingId: string;
      task: string;
      ok: boolean;
      response?: unknown;
      error?: string;
    }> = [];

    // Don't touch bookings the customer or ops already cancelled.
    const baseSelect =
      `id, balance_due, service_date, paid_at, stripe_account_slug,
       status, payment_status,
       balance_auth_payment_intent_id, balance_auth_status,
       balance_auth_amount_cents, balance_auth_attempts,
       balance_auth_last_attempt_at, balance_auth_last_error,
       balance_auth_last_error_code, balance_auth_authorized_at,
       balance_auth_expires_at, balance_auth_next_retry_at`;

    // ====== 1. RETRY FAILED ======
    const { data: failedRows, error: failedErr } = await supabase
      .from("bookings")
      .select(baseSelect)
      .eq("balance_auth_status", "failed")
      .lt("balance_auth_attempts", BALANCE_AUTH_MAX_ATTEMPTS)
      .not("balance_auth_next_retry_at", "is", null)
      .lte("balance_auth_next_retry_at", nowIso)
      .neq("status", "cancelled")
      .order("balance_auth_next_retry_at", { ascending: true })
      .limit(limit);
    if (failedErr) throw new Error(`failed-query: ${failedErr.message}`);
    for (const row of (failedRows || []) as SweepRow[]) {
      await invokeRetry(
        supabase,
        row.id,
        "retry",
        dryRun,
        summary,
        details,
        "retry_failed",
      );
    }

    // ====== 2. RE-AUTH BEFORE EXPIRY ======
    const { data: authorizedRows, error: authErr } = await supabase
      .from("bookings")
      .select(baseSelect)
      .eq("balance_auth_status", "authorized")
      .not("service_date", "is", null)
      .neq("status", "cancelled")
      .order("balance_auth_expires_at", { ascending: true })
      .limit(limit);
    if (authErr) throw new Error(`authorized-query: ${authErr.message}`);
    for (const row of (authorizedRows || []) as SweepRow[]) {
      if (
        shouldReauthorizeBeforeExpiry({
          balance_auth_expires_at: row.balance_auth_expires_at,
          service_date: row.service_date,
        })
      ) {
        await invokeRetry(
          supabase,
          row.id,
          "reauth_before_expiry",
          dryRun,
          summary,
          details,
          "reauth_before_expiry",
        );
      }
    }

    // ====== 3. RESCUE STUCK PENDING ======
    //
    // 'pending' rows shouldn't sit there for long — the immediate
    // post-deposit call sets either 'authorized' or 'failed'. If
    // we find a 'pending' row older than 15 minutes, assume the
    // initial call was lost and retry. Younger pending rows are
    // left alone so we don't race the in-flight initial call.
    const pendingCutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: pendingRows, error: pendingErr } = await supabase
      .from("bookings")
      .select(baseSelect)
      .eq("balance_auth_status", "pending")
      .lt("created_at", pendingCutoff)
      .neq("status", "cancelled")
      .order("created_at", { ascending: true })
      .limit(limit);
    if (pendingErr) throw new Error(`pending-query: ${pendingErr.message}`);
    for (const row of (pendingRows || []) as SweepRow[]) {
      await invokeRetry(
        supabase,
        row.id,
        "rescue_pending",
        dryRun,
        summary,
        details,
        "rescue_pending",
      );
    }

    // ====== 4. EXHAUSTED → CANCEL ======
    //
    // Bookings that hit MAX attempts and still aren't authorized.
    // We don't want to cancel a booking the second its third
    // attempt fails — give it a small grace window (1 hour) in
    // case ops manually retries.
    const exhaustedCutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: exhaustedRows, error: exhaustedErr } = await supabase
      .from("bookings")
      .select(baseSelect)
      .eq("balance_auth_status", "failed")
      .gte("balance_auth_attempts", BALANCE_AUTH_MAX_ATTEMPTS)
      .lt("balance_auth_last_attempt_at", exhaustedCutoff)
      .neq("status", "cancelled")
      .limit(limit);
    if (exhaustedErr) throw new Error(`exhausted-query: ${exhaustedErr.message}`);
    for (const row of (exhaustedRows || []) as SweepRow[]) {
      await invokeCancel(supabase, row.id, dryRun, summary, details);
    }

    log("Sweep complete", summary);

    return new Response(
      JSON.stringify({ success: true, dryRun, summary, details }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

async function invokeRetry(
  supabase: ReturnType<typeof createClient>,
  bookingId: string,
  reason: string,
  dryRun: boolean,
  summary: Record<string, number>,
  details: Array<{
    bookingId: string;
    task: string;
    ok: boolean;
    response?: unknown;
    error?: string;
  }>,
  task: string,
) {
  if (dryRun) {
    summary[task] = (summary[task] || 0) + 1;
    details.push({ bookingId, task: `${task}:dry_run`, ok: true });
    return;
  }
  try {
    const { data, error } = await supabase.functions.invoke(
      "authorize-booking-balance",
      { body: { booking_id: bookingId, reason } },
    );
    if (error) throw error;
    summary[task] = (summary[task] || 0) + 1;
    details.push({ bookingId, task, ok: true, response: data });
  } catch (err: unknown) {
    summary.errors = (summary.errors || 0) + 1;
    details.push({
      bookingId,
      task,
      ok: false,
      error: (err as Error)?.message || String(err),
    });
  }
}

async function invokeCancel(
  supabase: ReturnType<typeof createClient>,
  bookingId: string,
  dryRun: boolean,
  summary: Record<string, number>,
  details: Array<{
    bookingId: string;
    task: string;
    ok: boolean;
    response?: unknown;
    error?: string;
  }>,
) {
  if (dryRun) {
    summary.cancel_exhausted = (summary.cancel_exhausted || 0) + 1;
    details.push({
      bookingId,
      task: "cancel_exhausted:dry_run",
      ok: true,
    });
    return;
  }
  try {
    const { data, error } = await supabase.functions.invoke(
      "cancel-booking-for-auth-failure",
      {
        body: {
          booking_id: bookingId,
          reason:
            "Balance pre-authorization failed after 3 attempts before the cleaning date.",
        },
      },
    );
    if (error) throw error;
    summary.cancel_exhausted = (summary.cancel_exhausted || 0) + 1;
    details.push({
      bookingId,
      task: "cancel_exhausted",
      ok: true,
      response: data,
    });
  } catch (err: unknown) {
    summary.errors = (summary.errors || 0) + 1;
    details.push({
      bookingId,
      task: "cancel_exhausted",
      ok: false,
      error: (err as Error)?.message || String(err),
    });
  }
}
