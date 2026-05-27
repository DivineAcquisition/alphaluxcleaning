/**
 * Shared types + helpers for the balance pre-authorization flow.
 *
 * AlphaLux's balance hold flow (introduced 2026-05-27):
 *
 *   1. Customer pays 50% deposit at /book/checkout — regular
 *      PaymentIntent, captured immediately. (Existing flow.)
 *   2. Right after deposit success, `authorize-booking-balance`
 *      fires off-session and places a Stripe authorization-only
 *      hold (PaymentIntent with `capture_method: 'manual'`) on the
 *      saved card for the remaining 50%. No charge happens; the
 *      funds are just reserved on the card for ~7 days.
 *   3. After the cleaning, `capture-booking-balance` captures the
 *      hold — turning it into a real charge — without any
 *      hosted-invoice email round-trip.
 *   4. If the off-session auth fails (insufficient funds, decline,
 *      SCA required), the retry sweep re-attempts up to 3 times
 *      before the cleaning date. After 3 strikes,
 *      `cancel-booking-for-auth-failure` refunds the deposit,
 *      marks the booking cancelled, and notifies the customer +
 *      ops.
 *   5. Stripe's auth window is 7 days. For bookings whose service
 *      date is further out (combo bundle's 2nd visit, recurring
 *      visits 2+3), the retry sweep also re-authorizes whenever
 *      an existing hold is about to expire before service.
 */

export const BALANCE_AUTH_MAX_ATTEMPTS = 3;

/** Stripe auth holds expire after 7 days for normal merchants. */
export const STRIPE_AUTH_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export type BalanceAuthStatus =
  | "pending"
  | "authorized"
  | "failed"
  | "captured"
  | "released"
  | "cancelled_booking";

export interface BookingBalanceAuthRow {
  id: string;
  balance_due: number | null;
  service_date: string | null;
  paid_at: string | null;
  stripe_account_slug: string | null;
  balance_auth_payment_intent_id: string | null;
  balance_auth_status: BalanceAuthStatus | null;
  balance_auth_amount_cents: number | null;
  balance_auth_attempts: number;
  balance_auth_last_attempt_at: string | null;
  balance_auth_last_error: string | null;
  balance_auth_last_error_code: string | null;
  balance_auth_authorized_at: string | null;
  balance_auth_expires_at: string | null;
  balance_auth_next_retry_at: string | null;
}

/**
 * When should we next attempt to (re)authorize the balance?
 *
 * Strategy: cluster retries near the service date so the hold is
 * fresh when the cleaning lands. Stripe holds expire after 7 days,
 * so retrying 14 days out doesn't help — the hold would expire
 * before service. We bias all attempts into the last 72 hours
 * before service.
 *
 *   attempts = 0  → schedule now (attempt 1 fires immediately
 *                   from the checkout fan-out, this is just the
 *                   defensive fallback if the immediate call
 *                   never landed)
 *   attempts = 1  → max(now + 1h, service_date - 72h)
 *   attempts = 2  → max(now + 1h, service_date - 24h)
 *   attempts ≥ 3  → null (no more retries — sweep cancels booking)
 *
 * Returns ISO timestamp string (or null if exhausted).
 */
export function computeNextRetryAt(
  attemptsSoFar: number,
  serviceDateYmd: string | null | undefined,
  nowMs: number = Date.now(),
): string | null {
  if (attemptsSoFar >= BALANCE_AUTH_MAX_ATTEMPTS) return null;

  const minNextMs = nowMs + 60 * 60 * 1000; // never sooner than 1h from now

  if (!serviceDateYmd) {
    // No service date yet (/book/details not completed). Schedule
    // for 1 hour out and the sweep will re-check; once the date
    // lands we'll pick the right window.
    return new Date(minNextMs).toISOString();
  }

  // Treat YYYY-MM-DD as local-noon-ish — without a tz we use noon
  // UTC which works as a safe anchor for the relative offsets.
  const serviceMs = new Date(serviceDateYmd + "T12:00:00Z").getTime();
  if (!Number.isFinite(serviceMs)) {
    return new Date(minNextMs).toISOString();
  }

  if (attemptsSoFar === 0) {
    // Defensive: the immediate post-deposit call SHOULD have
    // already run. If the sweep finds a 'pending' row, retry
    // right away.
    return new Date(minNextMs).toISOString();
  }

  // attempt 2 — try at T-72h (or right away if we're already inside that window)
  if (attemptsSoFar === 1) {
    const target = serviceMs - 72 * 60 * 60 * 1000;
    return new Date(Math.max(target, minNextMs)).toISOString();
  }

  // attempt 3 — try at T-24h
  if (attemptsSoFar === 2) {
    const target = serviceMs - 24 * 60 * 60 * 1000;
    return new Date(Math.max(target, minNextMs)).toISOString();
  }

  return null;
}

/**
 * Should an `authorized` hold be re-authorized before the cleaning
 * because it's about to expire? Returns true when the hold expires
 * inside `safetyWindowMs` of the service date.
 */
export function shouldReauthorizeBeforeExpiry(
  row: Pick<
    BookingBalanceAuthRow,
    "balance_auth_expires_at" | "service_date"
  >,
  safetyWindowMs: number = 24 * 60 * 60 * 1000,
  nowMs: number = Date.now(),
): boolean {
  if (!row.balance_auth_expires_at || !row.service_date) return false;
  const expiresMs = new Date(row.balance_auth_expires_at).getTime();
  const serviceMs = new Date(row.service_date + "T12:00:00Z").getTime();
  if (!Number.isFinite(expiresMs) || !Number.isFinite(serviceMs)) return false;
  // If the existing hold expires before (service_date - safetyWindow)
  // we need a fresh hold before the cleaning lands.
  return expiresMs < serviceMs - safetyWindowMs && expiresMs > nowMs - 1;
}

/** Convert a Stripe `last_payment_error` shape into a normalized
 *  pair of (message, code) we can stamp on the booking row for
 *  ops to read at a glance. */
export function summarizeStripeError(err: unknown): {
  message: string;
  code: string | null;
} {
  const e = err as {
    message?: string;
    code?: string;
    decline_code?: string;
    raw?: { message?: string; code?: string; decline_code?: string };
  };
  return {
    message:
      e?.message ||
      e?.raw?.message ||
      (typeof err === "string" ? err : "Unknown error"),
    code: e?.decline_code || e?.raw?.decline_code || e?.code || e?.raw?.code || null,
  };
}
