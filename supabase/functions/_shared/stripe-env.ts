/**
 * Shared helper for resolving the Stripe API keys from Supabase
 * edge function environment variables.
 *
 * Historically this codebase stored the keys under
 * `STRIPE_SECRET_KEY_ALPHALUX` / `STRIPE_PUBLISHABLE_KEY_ALPHALUX`.
 * New deployments just use the conventional `STRIPE_SECRET_KEY` /
 * `STRIPE_PUBLISHABLE_KEY` names. This resolver accepts either so a
 * missing legacy suffix can't silently knock out payments again.
 *
 * Restricted keys (rk_live_...) are also accepted in place of a
 * secret key — the Stripe SDK treats them as ordinary API keys.
 */
export function getStripeSecretKey(): string | null {
  const candidates = [
    "STRIPE_SECRET_KEY",
    "STRIPE_SECRET_KEY_ALPHALUX",
    "STRIPE_RESTRICTED_KEY",
  ];
  for (const name of candidates) {
    const v = Deno.env.get(name);
    if (v && typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return null;
}

export function getStripePublishableKey(): string | null {
  const candidates = [
    "STRIPE_PUBLISHABLE_KEY",
    "STRIPE_PUBLISHABLE_KEY_ALPHALUX",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  ];
  for (const name of candidates) {
    const v = Deno.env.get(name);
    if (v && typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return null;
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
