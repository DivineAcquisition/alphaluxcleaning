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
 * Publishable keys are public by design (they ship to the browser
 * already), so bundling them as a fallback is safe and means a
 * missing Supabase secret can't blank the payment form.
 *
 * `acct_1TONej6CLM640Ljs` — original AlphaLux Cleaning Stripe account
 * (NY operations).
 */
export const FALLBACK_PUBLISHABLE_KEY_TRY =
  "pk_live_51TONej6CLM640LjskzQLH22Fnnw3c1fYFzJ8zodmoCDYSkKAAuFZfpDYFQEQMvMxWXaoiAfDbT0FSlJuFjjqqdoT00PzmRxxat";

/**
 * Hard-coded fallback for the BOOK account's publishable key.
 *
 * `acct_1S6xTvEFKFvC92D7` — new Stripe account that handles every
 * payment from CA + TX customers. The publishable key is public so
 * bundling it is safe; the matching secret + webhook secret live in
 * Supabase env (`STRIPE_SECRET_KEY_BOOK`, `STRIPE_WEBHOOK_SECRET_BOOK`).
 */
export const FALLBACK_PUBLISHABLE_KEY_BOOK =
  "pk_live_51S6xTvEFKFvC92D7wCSKXNX71yE6nc4Kwv2ilwuq2PD7ZDDhdfxvK4OLaJpLNAB8CiKjiLSpNWpw9fugWOdP8Q2300jcYkIDjd";

/** @deprecated Use FALLBACK_PUBLISHABLE_KEY_TRY. Preserved as an
 *  alias so any out-of-tree imports keep compiling. */
export const FALLBACK_PUBLISHABLE_KEY = FALLBACK_PUBLISHABLE_KEY_TRY;

/**
 * Two-letter US state codes that route to the BOOK Stripe account.
 * Anything outside this set (currently NY, plus any unknown / blank
 * state) routes to the legacy TRY account.
 */
const BOOK_ACCOUNT_STATES: ReadonlySet<string> = new Set(["CA", "TX"]);

/**
 * Resolve the Stripe account slug from a customer's US state code.
 *
 * Returns `null` when the state is missing / unknown so the caller
 * can fall back to a different signal (zip prefix, body override,
 * Origin header, etc.). NY explicitly resolves to `try`; everything
 * else returns `null` so the caller can decide.
 */
export function slugFromState(
  state: string | null | undefined,
): StripeAccountSlug | null {
  if (!state) return null;
  const code = state.trim().toUpperCase();
  if (BOOK_ACCOUNT_STATES.has(code)) return "book";
  if (code === "NY") return "try";
  return null;
}

/**
 * Resolve the Stripe account slug from a US zip code's first 3
 * digits. Mirrors the supported-state ranges already used by
 * `/book/zip` for client-side validation.
 *
 *   * NY: 100–149 → try
 *   * TX: 750–799 (+ the 73301 IRS Austin single-box) → book
 *   * CA: 900–961 → book
 *
 * Returns `null` for anything outside those ranges so callers can
 * fall through to other signals (state code, host header, etc.).
 */
export function slugFromZipPrefix(
  zip: string | null | undefined,
): StripeAccountSlug | null {
  if (!zip) return null;
  const digits = String(zip).replace(/\D/g, "");
  if (digits.length < 3) return null;
  const prefix3 = parseInt(digits.slice(0, 3), 10);
  const prefix5 = parseInt(digits.slice(0, 5), 10) || 0;
  if (prefix3 >= 100 && prefix3 <= 149) return "try"; // NY
  if (prefix3 >= 750 && prefix3 <= 799) return "book"; // TX
  if (prefix5 === 73301) return "book"; // TX (Austin IRS)
  if (prefix3 >= 900 && prefix3 <= 961) return "book"; // CA
  return null;
}

/**
 * Resolve the Stripe account slug strictly from a customer's
 * location (state code or zip). State wins; zip is a fallback only
 * when the state is missing or unrecognized. Returns `null` if
 * neither signal is conclusive.
 *
 * This is the AUTHORITATIVE routing function for payments at
 * checkout. Subdomain / Origin headers are intentionally ignored
 * here so that a customer whose ZIP says CA can never be charged
 * against the NY-only `try` account, even if they somehow landed on
 * `try.alphaluxcleaning.com`.
 */
export function slugFromCustomerLocation(
  state: string | null | undefined,
  zip: string | null | undefined,
): StripeAccountSlug | null {
  return slugFromState(state) ?? slugFromZipPrefix(zip);
}

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
 * Both accounts ship with a bundled fallback so a missing Supabase
 * secret can't blank the payment form. Publishable keys are public
 * by design, so this is safe.
 *
 *   * try  → STRIPE_PUBLISHABLE_KEY_OVERRIDE → bundled try fallback
 *   * book → STRIPE_PUBLISHABLE_KEY_BOOK    → bundled book fallback
 *
 * Returns the bundled fallback when no env override is set so this
 * function never returns null. (Earlier behavior returned null for
 * book when the env var was missing; with the BOOK pk now bundled
 * that failure mode is gone.)
 */
export function getStripePublishableKey(
  slug: StripeAccountSlug = "try",
): string {
  if (slug === "book") {
    const k = firstEnv("STRIPE_PUBLISHABLE_KEY_BOOK");
    if (k && isValidPublishableKey(k)) return k;
    return FALLBACK_PUBLISHABLE_KEY_BOOK;
  }
  const override = firstEnv("STRIPE_PUBLISHABLE_KEY_OVERRIDE");
  if (override && isValidPublishableKey(override)) return override;
  return FALLBACK_PUBLISHABLE_KEY_TRY;
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
