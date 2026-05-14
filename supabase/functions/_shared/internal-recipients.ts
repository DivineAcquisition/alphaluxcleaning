/**
 * Canonical internal recipient list for booking + ops notifications.
 *
 * Every booking-related internal email (new booking, job-assignment
 * needed, balance invoice receipts, etc.) should go to these two
 * addresses — both ops mailboxes ops actually reads. One sits on the
 * legacy `alphaluxcleaning.com` domain, the other on the new
 * `alphaluxclean.com` domain so the same notification lands in both
 * inboxes regardless of which domain the booking flow used.
 *
 *   info@alphaluxclean.com      → CA/TX ops mailbox (book.alphaluxclean.com)
 *   info@alphaluxcleaning.com   → NY ops mailbox      (try.alphaluxcleaning.com)
 *
 * Override at deploy time with `INTERNAL_RECIPIENT_EMAILS` (comma- or
 * semicolon-separated) if ops needs to silence one inbox or add a
 * temporary on-call address — but the default is intentionally
 * locked to just these two so no booking notification leaks to a
 * stale personal mailbox or hard-coded gmail.
 */
export const DEFAULT_INTERNAL_RECIPIENTS: ReadonlyArray<string> = [
  "info@alphaluxclean.com",
  "info@alphaluxcleaning.com",
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Resolve the active internal recipients. Reads the
 * `INTERNAL_RECIPIENT_EMAILS` env var if set, otherwise falls back
 * to `DEFAULT_INTERNAL_RECIPIENTS`. Always returns at least one
 * valid email (defaults if the env value parses empty).
 */
export function getInternalRecipients(): string[] {
  const raw = (Deno.env.get("INTERNAL_RECIPIENT_EMAILS") || "").trim();
  if (!raw) return [...DEFAULT_INTERNAL_RECIPIENTS];

  const parsed = raw
    .split(/[,;\n]/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => EMAIL_REGEX.test(s));

  return parsed.length > 0 ? parsed : [...DEFAULT_INTERNAL_RECIPIENTS];
}

/**
 * Branded default `from` address for internal/admin notifications.
 * Mirrors `EMAIL_FROM_ADMIN` if set, falling back to a sensible
 * branded sender on the verified Resend domain. Always coerced
 * to the "AlphaLux Ops <…>" friendly-name format so admin inboxes
 * see a recognisable sender.
 */
export function getInternalFromAddress(): string {
  const fromEnv =
    Deno.env.get("EMAIL_FROM_ADMIN") ||
    Deno.env.get("EMAIL_FROM_OPS") ||
    Deno.env.get("EMAIL_FROM") ||
    "";
  if (fromEnv.trim().length > 0) return fromEnv.trim();
  return "AlphaLux Bookings <noreply@info.alphaluxcleaning.com>";
}
