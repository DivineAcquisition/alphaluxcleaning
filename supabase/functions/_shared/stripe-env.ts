/**
 * Shared helper for resolving Stripe API keys + webhook signing
 * secrets across two distinct Stripe accounts.
 *
 *   * `try`  — the legacy / current AlphaLux Cleaning Stripe account
 *              (`acct_1TONej6CLM640Ljs`). Used by every host EXCEPT
 *              `book.alphaluxclean.com`. Keys come from the existing
 *              env-var soup (STRIPE_SECRET_KEY*, STRIPE_RESTRICTED_KEY*,
 *              STRIPE_WEBHOOK_SECRET*) so the legacy try.* flow keeps
 *              working with zero ops change.
 *   * `book` — the new Stripe account dedicated to the
 *              `book.alphaluxclean.com` subdomain. Keys come from
 *              `STRIPE_*_BOOK` env vars set by ops in Supabase
 *              secrets.
 *
 * Resolution order at request time:
 *   1. Caller passes an explicit `account` slug (preferred — typically
 *      from the request body / a stored `bookings.stripe_account_slug`).
 *   2. We sniff the request `Origin` / `Referer` header. Anything from
 *      `book.alphaluxclean.com` resolves to `book`; everything else
 *      (including server-to-server calls with no Origin) resolves to
 *      `try`.
 *
 * This module is the single source of truth for which Stripe account
 * a request runs against.
 *
 * Restricted keys (`rk_live_...`) are accepted in place of a secret
 * key — the Stripe SDK treats them as ordinary API keys.
 *
 * Values are run through `normalizeSecret` to strip the kind of
 * copy-paste damage Supabase's secrets UI sometimes captures
 * (surrounding whitespace, matched quotes, trailing punctuation).
 */

export type StripeAccountSlug = "try" | "book";

/** Slug stamped on `bookings.stripe_account_slug` for new try-account
 *  bookings. Preserved as `alphalux_ny` for backwards compatibility
 *  with historical rows + downstream tooling that already keys off
 *  this exact value. */
export const TRY_ACCOUNT_SLUG_LEGACY = "alphalux_ny";

/** Slug stamped on `bookings.stripe_account_slug` for new book-account
 *  bookings (the `book.alphaluxclean.com` subdomain). */
export const BOOK_ACCOUNT_SLUG = "book";

/**
 * Hard-coded fallback for the TRY account's publishable key.
 * Publishable keys are designed to be safe to ship to the client
 * (they're already bundled in `src/lib/stripe.ts`), so this fallback
 * exists purely as a UI safety net: if the Supabase secret is missing
 * or holds the wrong value, `get-stripe-config` returns this so
 * Stripe.js still loads against the right account.
 *
 * The BOOK account intentionally has no hard-coded fallback — its
 * publishable key MUST come from the `STRIPE_PUBLISHABLE_KEY_BOOK`
 * env var so we never accidentally serve the try-account's key on
 * the book subdomain (which would produce a "client_secret does not
 * match the publishable key used" error at confirm time).
 */
export const FALLBACK_PUBLISHABLE_KEY =
  "pk_live_51TONej6CLM640LjskzQLH22Fnnw3c1fYFzJ8zodmoCDYSkKAAuFZfpDYFQEQMvMxWXaoiAfDbT0FSlJuFjjqqdoT00PzmRxxat";

function normalizeSecret(raw: string): string {
  let s = raw.trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
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
 * Resolve which Stripe account a request belongs to.
 *
 * `override` wins when present and valid (this is what flows in via
 * the request body, e.g. `{ account: 'book' }`, or via a previously-
 * stamped `bookings.stripe_account_slug`).
 *
 * Otherwise we sniff the `Origin` / `Referer` headers and look for
 * the `book.alphaluxclean.com` host. Anything else falls through to
 * `try` so the legacy flow can never accidentally start charging the
 * wrong account.
 */
export function resolveStripeAccount(
  req: Request | null,
  override?: string | null,
): StripeAccountSlug {
  if (override === "book" || override === BOOK_ACCOUNT_SLUG) return "book";
  if (
    override === "try" ||
    override === TRY_ACCOUNT_SLUG_LEGACY ||
    override === "alphalux" ||
    override === "alphalux_ny"
  ) {
    return "try";
  }

  if (!req) return "try";
  const origin = (req.headers.get("origin") || "").toLowerCase();
  const referer = (req.headers.get("referer") || "").toLowerCase();
  const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "")
    .toLowerCase();

  const haystack = `${origin} ${referer} ${host}`;
  if (/book\.alphaluxclean\.com/.test(haystack)) return "book";
  return "try";
}

/**
 * Translate the `bookings.stripe_account_slug` column value (which
 * uses the legacy `alphalux_ny` literal for the try account) into our
 * runtime slug. Preserves backwards compatibility for old rows.
 */
export function slugFromBookingColumn(
  raw: string | null | undefined,
): StripeAccountSlug {
  if (raw === BOOK_ACCOUNT_SLUG) return "book";
  return "try";
}

/**
 * Convert our runtime slug back to the literal we stamp on the
 * `bookings.stripe_account_slug` column. Try keeps `alphalux_ny` so
 * historical reporting and triggers don't break.
 */
export function bookingColumnFromSlug(slug: StripeAccountSlug): string {
  return slug === "book" ? BOOK_ACCOUNT_SLUG : TRY_ACCOUNT_SLUG_LEGACY;
}

/**
 * Resolve the Stripe secret (or restricted) API key for the given
 * account. Lookup order:
 *
 *   * book → STRIPE_SECRET_KEY_BOOK, STRIPE_RESTRICTED_KEY_BOOK
 *   * try  → existing legacy soup (unchanged)
 */
export function getStripeSecretKey(
  slug: StripeAccountSlug = "try",
): string | null {
  if (slug === "book") {
    return firstEnv(
      "STRIPE_SECRET_KEY_BOOK",
      "STRIPE_RESTRICTED_KEY_BOOK",
    );
  }
  return firstEnv(
    "STRIPE_SECRET_KEY_ALPHALUX",
    "STRIPE_SECRET_KEY",
    "STRIPE_SECRET_KEY_NY",
    "STRIPE_RESTRICTED_KEY_ALPHALUX",
    "STRIPE_RESTRICTED_KEY",
  );
}

/**
 * Resolve the Stripe publishable key for the given account.
 *
 * `try` keeps its hard-coded fallback (the bundled production key
 * tied to the existing single-account Stripe). `book` MUST have
 * `STRIPE_PUBLISHABLE_KEY_BOOK` configured — there is no fallback
 * because returning the try-account's pk on the book subdomain would
 * produce a clientSecret/publishable mismatch and silently misroute
 * payments. Callers should treat a `null` return for `book` as a
 * hard configuration error and surface a 503 instead of falling
 * through.
 *
 * Returns `string | null` — `null` only ever happens for `book`
 * when the env var is missing.
 */
export function getStripePublishableKey(
  slug: StripeAccountSlug = "try",
): string | null {
  if (slug === "book") {
    const k = firstEnv("STRIPE_PUBLISHABLE_KEY_BOOK");
    return k && isValidPublishableKey(k) ? k : null;
  }
  const override = firstEnv("STRIPE_PUBLISHABLE_KEY_OVERRIDE");
  if (override && isValidPublishableKey(override)) return override;
  return FALLBACK_PUBLISHABLE_KEY;
}

/**
 * Resolve the Stripe webhook signing secret for the given account.
 * Returns `null` if not configured.
 */
export function getStripeWebhookSecret(
  slug: StripeAccountSlug = "try",
): string | null {
  if (slug === "book") {
    return firstEnv("STRIPE_WEBHOOK_SECRET_BOOK");
  }
  return firstEnv(
    "STRIPE_WEBHOOK_SECRET_ALPHALUX",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_WEBHOOK_SECRET_NY",
  );
}

/** All configured webhook signing secrets, slug-tagged. Used by the
 *  webhook handler to try-each-then-pick-the-matching-one when an
 *  inbound event comes in (the single function URL is shared by both
 *  Stripe accounts' webhook endpoints). */
export function getAllConfiguredWebhookSecrets(): Array<{
  slug: StripeAccountSlug;
  secret: string;
}> {
  const out: Array<{ slug: StripeAccountSlug; secret: string }> = [];
  const trySecret = getStripeWebhookSecret("try");
  if (trySecret) out.push({ slug: "try", secret: trySecret });
  const bookSecret = getStripeWebhookSecret("book");
  if (bookSecret) out.push({ slug: "book", secret: bookSecret });
  return out;
}

export function requireStripeSecretKey(
  slug: StripeAccountSlug = "try",
): string {
  const key = getStripeSecretKey(slug);
  if (!key) {
    if (slug === "book") {
      throw new Error(
        "Stripe secret key for the BOOK account is not configured. Set STRIPE_SECRET_KEY_BOOK in Supabase secrets.",
      );
    }
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
export function isValidPublishableKey(
  key: string | null | undefined,
): key is string {
  return (
    typeof key === "string" &&
    (key.startsWith("pk_live_") || key.startsWith("pk_test_"))
  );
}
