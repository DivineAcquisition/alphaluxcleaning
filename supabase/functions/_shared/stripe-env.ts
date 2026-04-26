/**
 * Shared helper for resolving the (single) Stripe account's API keys
 * and webhook signing secret from Supabase edge function secrets.
 *
 * AlphaLux Cleaning runs on a single Stripe account
 * (`acct_1TONej6CLM640Ljs`). The previous multi-account router has
 * been removed; this module is the only place edge functions read
 * Stripe credentials. Multiple env-var names are accepted so a
 * legacy suffix mismatch can't silently break payments — the first
 * non-empty value wins.
 *
 * Restricted keys (`rk_live_...`) are accepted in place of a secret
 * key — the Stripe SDK treats them as ordinary API keys.
 *
 * Values are run through `normalizeSecret` to strip the kind of
 * copy-paste damage Supabase's secrets UI sometimes captures
 * (surrounding whitespace, matched quotes, trailing punctuation).
 * Without this, a key stored as `rk_live_...25dh.` gets rejected by
 * Stripe as "Invalid API Key" and the whole payment flow 500s.
 */

/**
 * Hard-coded fallback for the single Stripe account's publishable
 * key. Publishable keys are designed to be safe to ship to the
 * client (they're already bundled in `src/lib/stripe.ts`), so this
 * fallback exists purely as a UI safety net: if the Supabase secret
 * is missing or holds the wrong value, `get-stripe-config` returns
 * this so Stripe.js still loads against the right account.
 */
export const FALLBACK_PUBLISHABLE_KEY =
  "pk_live_51TONej6CLM640LjskzQLH22Fnnw3c1fYFzJ8zodmoCDYSkKAAuFZfpDYFQEQMvMxWXaoiAfDbT0FSlJuFjjqqdoT00PzmRxxat";

function normalizeSecret(raw: string): string {
  let s = raw.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  s = s.replace(/[\s.,;:`'"]+$/g, "");
  return s;
}

function firstEnv(...names: string[]): string | null {
  for (const n of names) {
    const v = Deno.env.get(n);
    if (v && typeof v === "string") {
      const cleaned = normalizeSecret(v);
      if (cleaned.length > 0) return cleaned;
    }
  }
  return null;
}

/**
 * Resolve the Stripe secret (or restricted) API key. Accepts
 * `STRIPE_SECRET_KEY` first, then legacy / restricted-key fallbacks,
 * so freshly-rotated secrets under any historical name continue to
 * work without coordinated edge-function redeploys.
 */
export function getStripeSecretKey(): string | null {
  return firstEnv(
    "STRIPE_SECRET_KEY",
    "STRIPE_SECRET_KEY_ALPHALUX",
    "STRIPE_SECRET_KEY_NY",
    "STRIPE_RESTRICTED_KEY",
    "STRIPE_RESTRICTED_KEY_ALPHALUX",
  );
}

/**
 * Resolve the Stripe publishable key. Returns `null` only if no env
 * var is set; callers that need to never blank out the UI should
 * fall through to `FALLBACK_PUBLISHABLE_KEY`.
 */
export function getStripePublishableKey(): string | null {
  return firstEnv(
    "STRIPE_PUBLISHABLE_KEY",
    "STRIPE_PUBLISHABLE_KEY_ALPHALUX",
    "STRIPE_PUBLISHABLE_KEY_NY",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  );
}

/**
 * Resolve the Stripe webhook signing secret. Returns `null` if not
 * configured; the webhook handler treats that as a 400 since it
 * can't verify signatures.
 */
export function getStripeWebhookSecret(): string | null {
  return firstEnv(
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_WEBHOOK_SECRET_ALPHALUX",
    "STRIPE_WEBHOOK_SECRET_NY",
  );
}

export function requireStripeSecretKey(): string {
  const key = getStripeSecretKey();
  if (!key) {
    throw new Error(
      "Stripe secret key is not configured. Set STRIPE_SECRET_KEY (or STRIPE_SECRET_KEY_ALPHALUX) in Supabase secrets.",
    );
  }
  return key;
}

/**
 * Validate that a string looks like a Stripe publishable key. Used
 * by callers that surface the key to the browser.
 */
export function isValidPublishableKey(key: string | null | undefined): key is string {
  return (
    typeof key === "string" &&
    (key.startsWith("pk_live_") || key.startsWith("pk_test_"))
  );
}
