/**
 * Multi-account Stripe router.
 *
 * AlphaLux currently operates two Stripe accounts:
 *
 *   - `alphalux_ny`   → New York bookings (primary, always enabled).
 *   - `alphalux_catx` → California + Texas bookings (gated behind
 *                        STRIPE_ACCOUNT_CATX_ENABLED=true so the
 *                        plumbing can ship before the ZIP allow-list
 *                        is flipped on).
 *
 * The router resolves state codes / ZIP codes into a slug, then the
 * slug into a set of credentials pulled from Supabase secrets.
 *
 * Credentials are looked up per-slug. Legacy (single-account)
 * environment variable names are still accepted as fallbacks for
 * `alphalux_ny` so nothing changes for the NY account until ops
 * rotates the names.
 */

export type StripeAccountSlug = "alphalux_ny" | "alphalux_catx";

export interface StripeAccountCredentials {
  slug: StripeAccountSlug;
  secretKey: string;
  publishableKey: string | null;
  webhookSecret: string | null;
  /**
   * Human-readable name surfaced in logs and Stripe metadata so we
   * can reconcile which account a row belongs to when eyeballing the
   * dashboard.
   */
  displayName: string;
}

function firstEnv(...names: string[]): string | null {
  for (const n of names) {
    const v = Deno.env.get(n);
    if (v && typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return null;
}

function flagOn(name: string): boolean {
  const v = (Deno.env.get(name) || "").trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes" || v === "on";
}

/** Two-letter USPS state codes this router knows about. */
const STATE_TO_SLUG: Record<string, StripeAccountSlug> = {
  NY: "alphalux_ny",
  CA: "alphalux_catx",
  TX: "alphalux_catx",
};

/**
 * Resolve a ZIP prefix into a state code. We only need to cover the
 * states we route to — anything else returns null and bubbles up as
 * "unsupported" from `resolveSlugForZip`.
 *
 * Numeric ranges are canonical USPS prefix blocks.
 */
function stateFromZip(zipNum: number): string | null {
  // NY: 10000–14999
  if (zipNum >= 10000 && zipNum <= 14999) return "NY";
  // CA: 90000–96199
  if (zipNum >= 90000 && zipNum <= 96199) return "CA";
  // TX: 73301 (single-box), 75000–79999, 88510–88589 (TX corner of NM)
  if (zipNum === 73301) return "TX";
  if (zipNum >= 75000 && zipNum <= 79999) return "TX";
  if (zipNum >= 88510 && zipNum <= 88589) return "TX";
  return null;
}

export function resolveSlugForState(
  stateRaw: string | null | undefined,
): StripeAccountSlug | null {
  if (!stateRaw) return null;
  const code = stateRaw.trim().toUpperCase();
  return STATE_TO_SLUG[code] ?? null;
}

export function resolveSlugForZip(
  zipRaw: string | number | null | undefined,
): StripeAccountSlug | null {
  if (zipRaw === null || zipRaw === undefined) return null;
  const zipNum = typeof zipRaw === "number"
    ? zipRaw
    : parseInt(String(zipRaw).trim().slice(0, 5), 10);
  if (!zipNum || Number.isNaN(zipNum)) return null;
  const state = stateFromZip(zipNum);
  return state ? resolveSlugForState(state) : null;
}

/**
 * Whether the CA/TX account is currently allowed to accept live
 * bookings. Controlled by the `STRIPE_ACCOUNT_CATX_ENABLED` env var.
 * While disabled, attempts to route to `alphalux_catx` fall back to
 * `alphalux_ny` — but the ZIP validator should be rejecting those
 * ZIPs already, so this is strictly a belt-and-suspenders guard.
 */
export function isSlugEnabled(slug: StripeAccountSlug): boolean {
  if (slug === "alphalux_catx") return flagOn("STRIPE_ACCOUNT_CATX_ENABLED");
  return true;
}

function credsForNy(): StripeAccountCredentials | null {
  const secretKey = firstEnv(
    "STRIPE_SECRET_KEY_NY",
    "STRIPE_SECRET_KEY",
    "STRIPE_SECRET_KEY_ALPHALUX",
    "STRIPE_RESTRICTED_KEY",
  );
  if (!secretKey) return null;
  return {
    slug: "alphalux_ny",
    secretKey,
    publishableKey: firstEnv(
      "STRIPE_PUBLISHABLE_KEY_NY",
      "STRIPE_PUBLISHABLE_KEY",
      "STRIPE_PUBLISHABLE_KEY_ALPHALUX",
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    ),
    webhookSecret: firstEnv(
      "STRIPE_WEBHOOK_SECRET_NY",
      "STRIPE_WEBHOOK_SECRET",
      "STRIPE_WEBHOOK_SECRET_ALPHALUX",
    ),
    displayName: "AlphaLux NY",
  };
}

function credsForCatx(): StripeAccountCredentials | null {
  const secretKey = firstEnv("STRIPE_SECRET_KEY_CATX");
  if (!secretKey) return null;
  return {
    slug: "alphalux_catx",
    secretKey,
    publishableKey: firstEnv("STRIPE_PUBLISHABLE_KEY_CATX"),
    webhookSecret: firstEnv("STRIPE_WEBHOOK_SECRET_CATX"),
    displayName: "AlphaLux CA/TX",
  };
}

/**
 * Fetch credentials for a specific slug. Returns null if the slug is
 * unknown or its required secrets aren't present. The caller is
 * responsible for deciding whether to surface an error or fall back
 * to the NY account (see `resolveAccountForZip`).
 */
export function getCredentials(
  slug: StripeAccountSlug,
): StripeAccountCredentials | null {
  switch (slug) {
    case "alphalux_ny":
      return credsForNy();
    case "alphalux_catx":
      return credsForCatx();
    default:
      return null;
  }
}

/**
 * Resolve an account for a booking based on its service ZIP.
 *
 * Resolution order:
 *   1. Use the ZIP's state to pick a slug.
 *   2. If the slug is gated off (kill-switch), fall back to NY.
 *   3. If credentials for the target slug are missing, fall back to NY.
 *   4. Return null only if NY itself is unconfigured — a genuine
 *      "payments system is not set up" state that the caller should
 *      raise to the client as an error.
 */
export function resolveAccountForZip(
  zipRaw: string | number | null | undefined,
): StripeAccountCredentials | null {
  const targetSlug = resolveSlugForZip(zipRaw) ?? "alphalux_ny";

  if (!isSlugEnabled(targetSlug)) {
    return getCredentials("alphalux_ny");
  }

  const creds = getCredentials(targetSlug);
  if (creds) return creds;

  // Target account is unconfigured — fall back to NY so we don't
  // break the booking flow. The ZIP allow-list should catch this
  // before we ever get here.
  return getCredentials("alphalux_ny");
}

/**
 * Resolve an account by explicit slug, used by flows that already
 * know which account a booking belongs to (e.g. the balance invoice
 * flow reads `stripe_account_slug` off the booking row).
 */
export function resolveAccountBySlug(
  slug: string | null | undefined,
): StripeAccountCredentials | null {
  if (!slug) return getCredentials("alphalux_ny");
  if (slug === "alphalux_ny" || slug === "alphalux_catx") {
    return getCredentials(slug);
  }
  return getCredentials("alphalux_ny");
}

/**
 * Returns whichever configured accounts exist. Used by the webhook
 * handler to try every known signing secret until one verifies.
 */
export function getAllConfiguredAccounts(): StripeAccountCredentials[] {
  const out: StripeAccountCredentials[] = [];
  const ny = credsForNy();
  if (ny) out.push(ny);
  const catx = credsForCatx();
  if (catx) out.push(catx);
  return out;
}
