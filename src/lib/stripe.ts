import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { toast } from 'sonner';

/**
 * Dual-account Stripe loader.
 *
 * AlphaLux Cleaning now runs on TWO Stripe accounts split by
 * subdomain:
 *
 *   * `book.alphaluxclean.com` → `book` account (new). Publishable
 *     key comes from `get-stripe-config?account=book` (which reads
 *     `STRIPE_PUBLISHABLE_KEY_BOOK` from Supabase secrets) or, more
 *     commonly, inline from `create-payment-intent`'s response.
 *   * everything else (including the legacy `try.alphaluxcleaning.com`)
 *     → `try` account. Keeps the existing hard-coded fallback +
 *     env-var soup so the legacy flow is unchanged.
 *
 * Most call sites no longer hit `get-stripe-config` —
 * `create-payment-intent` returns the publishable key inline next
 * to the client secret, and the embedded payment form boots Stripe
 * via `getStripeForKey(publishableKey)`. The fallbacks below are a
 * UI safety net for paths that need to load Stripe.js before they
 * know which booking the session belongs to.
 */

export type StripeAccountSlug = 'try' | 'book';

/**
 * Detect which Stripe account this browser session belongs to based
 * on the host. Anything served from `book.alphaluxclean.com` runs
 * on the `book` account; every other host (including
 * `try.alphaluxcleaning.com`, `localhost`, Lovable previews, etc.)
 * runs on the legacy `try` account. The check is intentionally
 * conservative — a missing/unknown host falls through to `try` so a
 * detection bug can never accidentally reroute legacy customers
 * onto the new account.
 */
export const getStripeAccountSlug = (): StripeAccountSlug => {
  if (typeof window === 'undefined') return 'try';
  const host = (window.location.hostname || '').toLowerCase();
  if (host === 'book.alphaluxclean.com') return 'book';
  return 'try';
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
          if (accountSlug === 'try') {
            console.warn(
              '⚠️ No remote Stripe key available, using bundled try-account fallback publishable key',
            );
            publishableKey = FALLBACK_PUBLISHABLE_KEY;
          } else {
            // Don't fall back to the try-account key on book.* —
            // that would silently misroute payments. Bail loudly.
            throw new Error(
              'No valid Stripe publishable key for the BOOK account. Set STRIPE_PUBLISHABLE_KEY_BOOK in Supabase secrets.',
            );
          }
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
