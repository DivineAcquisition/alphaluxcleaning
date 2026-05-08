import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { toast } from 'sonner';

/**
 * Dual-account Stripe loader with STRICT state-based routing.
 *
 * AlphaLux Cleaning runs on TWO Stripe accounts split by the
 * customer's state — independent of which subdomain they happen to
 * be on:
 *
 *   * NY customers       → `try`  account (legacy AlphaLux NY ops).
 *   * CA + TX customers  → `book` account (new CA/TX ops).
 *
 * The slug is derived from the booking's state code (preferred) or
 * zip prefix (fallback). The host (`book.alphaluxclean.com` vs
 * `try.alphaluxcleaning.com`) is only consulted when no state / zip
 * is available yet — a CA customer who happens to land on
 * `try.alphaluxcleaning.com` will still be charged against the
 * book account once they enter their zip.
 *
 * Most call sites don't hit `get-stripe-config` —
 * `create-payment-intent` returns the publishable key inline next
 * to the client secret, and the embedded form boots Stripe via
 * `getStripeForKey(publishableKey)`. The fallbacks below are a UI
 * safety net for paths that need Stripe.js before a booking exists.
 */

export type StripeAccountSlug = 'try' | 'book';

/**
 * Bundled fallback publishable key for the BOOK account
 * (`acct_1S6xTvEFKFvC92D7` — handles all CA + TX payments).
 * Publishable keys are public, so bundling is safe.
 */
const FALLBACK_PUBLISHABLE_KEY_BOOK =
  'pk_live_51S6xTvEFKFvC92D7wCSKXNX71yE6nc4Kwv2ilwuq2PD7ZDDhdfxvK4OLaJpLNAB8CiKjiLSpNWpw9fugWOdP8Q2300jcYkIDjd';

/** Two-letter US state codes that route to the BOOK Stripe account.
 *  NY (and any unknown / blank state) routes to the legacy TRY. */
const BOOK_ACCOUNT_STATES = new Set(['CA', 'TX']);

/**
 * Resolve the Stripe slug from a US state code. Returns null when
 * the state is missing / unknown so the caller can fall back to a
 * different signal (zip prefix, host, etc.).
 */
export const slugFromState = (
  state: string | null | undefined,
): StripeAccountSlug | null => {
  if (!state) return null;
  const code = state.trim().toUpperCase();
  if (BOOK_ACCOUNT_STATES.has(code)) return 'book';
  if (code === 'NY') return 'try';
  return null;
};

/**
 * Resolve the Stripe slug from a US zip's first 3 digits — mirrors
 * the supported-state ranges that `/book/zip` already validates
 * against. Returns null for zips outside those ranges.
 */
export const slugFromZipPrefix = (
  zip: string | null | undefined,
): StripeAccountSlug | null => {
  if (!zip) return null;
  const digits = String(zip).replace(/\D/g, '');
  if (digits.length < 3) return null;
  const prefix3 = parseInt(digits.slice(0, 3), 10);
  const prefix5 = parseInt(digits.slice(0, 5), 10) || 0;
  if (prefix3 >= 100 && prefix3 <= 149) return 'try'; // NY
  if (prefix3 >= 750 && prefix3 <= 799) return 'book'; // TX
  if (prefix5 === 73301) return 'book'; // TX (Austin IRS)
  if (prefix3 >= 900 && prefix3 <= 961) return 'book'; // CA
  return null;
};

/**
 * Strict authoritative slug resolution from the booking's location.
 * State wins; zip is a fallback when the state is missing. Returns
 * null only when neither signal is conclusive — callers should then
 * fall back to host detection.
 */
export const slugFromCustomerLocation = (
  state: string | null | undefined,
  zip: string | null | undefined,
): StripeAccountSlug | null => slugFromState(state) ?? slugFromZipPrefix(zip);

/**
 * Host-based slug fallback. Only used as a last resort when no
 * state / zip is available yet. NEVER consulted at /book/checkout
 * once a customer has entered a zip — at that point
 * `slugFromCustomerLocation` is authoritative.
 */
const slugFromHost = (): StripeAccountSlug => {
  if (typeof window === 'undefined') return 'try';
  const host = (window.location.hostname || '').toLowerCase();
  if (host === 'book.alphaluxclean.com') return 'book';
  return 'try';
};

/**
 * Resolve the Stripe account slug for this booking. Pass any state /
 * zip you have; the function falls back to host detection only when
 * neither signal is available.
 */
export const getStripeAccountSlug = (
  state?: string | null,
  zip?: string | null,
): StripeAccountSlug => {
  const fromLocation = slugFromCustomerLocation(state, zip);
  if (fromLocation) return fromLocation;
  return slugFromHost();
};

const FALLBACK_PUBLISHABLE_KEY =
  'pk_live_51TONej6CLM640LjskzQLH22Fnnw3c1fYFzJ8zodmoCDYSkKAAuFZfpDYFQEQMvMxWXaoiAfDbT0FSlJuFjjqqdoT00PzmRxxat';

declare global {
  interface Window {
    STRIPE_PUBLISHABLE_KEY?: string;
  }
}

const isValidKey = (k: string) =>
  typeof k === 'string' && (k.startsWith('pk_test_') || k.startsWith('pk_live_'));

import { supabase } from '@/integrations/supabase/client';

const fetchStripeKey = async (): Promise<string | null> => {
  try {
    const account = getStripeAccountSlug();
    console.log(
      `🔄 Fetching Stripe configuration from Supabase for account=${account}…`,
    );
    const { data, error } = await supabase.functions.invoke('get-stripe-config', {
      body: { account },
    });

    if (error) {
      console.error('🔴 Failed to fetch Stripe config:', error);
      return null;
    }

    if (data?.publishableKey && isValidKey(data.publishableKey)) {
      console.log(
        `✅ Stripe publishable key retrieved from Supabase (account=${data.account || account})`,
      );
      return data.publishableKey;
    }

    console.error('🔴 Invalid or missing Stripe publishable key in response:', data);
    return null;
  } catch (error) {
    console.error('🔴 Error fetching Stripe configuration:', error);
    return null;
  }
};

let stripeInstancePromise: Promise<Stripe | null> | null = null;

const createStripePromise = (): Promise<Stripe | null> => {
  if (stripeInstancePromise) {
    return stripeInstancePromise;
  }

  stripeInstancePromise = (async (): Promise<Stripe | null> => {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🚀 Starting Stripe initialization (attempt ${attempt}/${maxRetries})...`);

        const accountSlug = getStripeAccountSlug();

        // Local-bundled key + `window.STRIPE_PUBLISHABLE_KEY` are
        // only safe for the legacy `try` account. The book subdomain
        // MUST get its key from `get-stripe-config?account=book` so
        // we never accidentally boot Stripe.js with the try-account's
        // publishable key (which would mismatch the book-account's
        // client_secret at confirm time).
        let publishableKey: string | undefined;
        if (accountSlug === 'try') {
          publishableKey =
            (typeof window !== 'undefined' && window.STRIPE_PUBLISHABLE_KEY) ||
            process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
          if (publishableKey) {
            console.log('🔑 Found local publishable key (try account)');
          }
        }

        if (!publishableKey || !isValidKey(publishableKey)) {
          console.log(
            `⬇️ No valid local key, fetching from Supabase (account=${accountSlug})…`,
          );
          try {
            publishableKey = (await fetchStripeKey()) || undefined;
          } catch (err) {
            console.warn('⚠️ fetchStripeKey threw', err);
          }
        }

        if (!publishableKey || !isValidKey(publishableKey)) {
          console.warn(
            `⚠️ No remote Stripe key available, using bundled ${accountSlug}-account fallback publishable key`,
          );
          publishableKey =
            accountSlug === 'book'
              ? FALLBACK_PUBLISHABLE_KEY_BOOK
              : FALLBACK_PUBLISHABLE_KEY;
        }

        if (!publishableKey || !isValidKey(publishableKey)) {
          throw new Error('No valid Stripe publishable key found');
        }

        if (attempt > 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }

        const stripe = await loadStripe(publishableKey);

        if (!stripe) {
          throw new Error('Stripe failed to load');
        }

        console.log('🎉 Stripe initialized successfully');
        return stripe;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`🔴 Stripe initialization attempt ${attempt} failed:`, lastError);

        if (attempt === maxRetries) {
          break;
        }
      }
    }

    // Clear the cached promise so a subsequent call (e.g. after the
    // Supabase secret is added) can try again without forcing a hard
    // reload.
    console.error('🔴 All Stripe initialization attempts failed:', lastError);
    stripeInstancePromise = null;
    if (typeof window !== 'undefined') {
      toast.error('Payment system unavailable. Please refresh the page.', {
        description:
          lastError?.message ||
          'Failed to initialize payment processing. Check that STRIPE_PUBLISHABLE_KEY is set in Supabase secrets.',
      });
    }
    return null;
  })();

  return stripeInstancePromise;
};

export const stripePromise = createStripePromise();

if (typeof window !== 'undefined') {
  // Preload Stripe early in the application lifecycle.
  stripePromise.catch(() => {
    // Silently catch preload errors; actual usage will handle them.
  });
}

export const hasStripeKey = async (): Promise<boolean> => {
  const stripe = await stripePromise;
  return stripe !== null;
};

/**
 * Returns the cached Stripe.js promise. Required by the React Stripe
 * `<Elements>` component. If a previous initialization resolved to
 * null we kick off a fresh attempt so the form self-heals once the
 * network or Supabase secrets come back.
 */
export const getStripePromise = (): Promise<Stripe | null> => {
  if (!stripeInstancePromise) {
    return createStripePromise();
  }
  return stripeInstancePromise.then((s) => {
    if (s === null) {
      stripeInstancePromise = null;
      return createStripePromise();
    }
    return s;
  });
};

/**
 * Boot Stripe.js with an explicit publishable key (e.g. one returned
 * inline from `create-payment-intent`). Each distinct key gets its
 * own cached Promise so re-renders don't tear down + re-mount
 * Elements. Falls through to the global cached promise when no key
 * is supplied.
 *
 * Now that AlphaLux runs on a single Stripe account this almost
 * always reuses the same cache slot as `getStripePromise()`, but the
 * separate cache map is preserved so call sites passing an explicit
 * key continue to work without changes.
 */
const stripeByKeyCache = new Map<string, Promise<Stripe | null>>();

export const getStripeForKey = (key: string | null | undefined): Promise<Stripe | null> => {
  if (!key || !isValidKey(key)) return getStripePromise();
  const cached = stripeByKeyCache.get(key);
  if (cached) {
    return cached.then((s) => {
      if (s === null) {
        stripeByKeyCache.delete(key);
        return getStripeForKey(key);
      }
      return s;
    });
  }
  const p = loadStripe(key).catch((err) => {
    console.error('🔴 getStripeForKey failed to load Stripe', err);
    stripeByKeyCache.delete(key);
    return null;
  });
  stripeByKeyCache.set(key, p);
  return p;
};

export const checkStripeReady = async (): Promise<boolean> => {
  try {
    const stripe = await stripePromise;
    return stripe !== null;
  } catch (error) {
    console.error('Stripe readiness check failed:', error);
    return false;
  }
};
