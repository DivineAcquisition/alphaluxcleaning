import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { toast } from 'sonner';

/**
 * Single-account Stripe loader.
 *
 * AlphaLux Cleaning runs on one Stripe account
 * (`acct_1TONej6CLM640Ljs`). This module:
 *
 *   1. Tries the bundled local key (env var on the Next build, or
 *      `window.STRIPE_PUBLISHABLE_KEY` shimmed in tests).
 *   2. Falls back to the Supabase `get-stripe-config` edge function
 *      so ops can rotate the key without redeploying the front end.
 *   3. Falls back to a hard-coded production publishable key so the
 *      payment form never blanks out due to a transient Supabase
 *      outage. Publishable keys are designed to be safe to bundle in
 *      the client.
 */

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
    console.log('🔄 Fetching Stripe configuration from Supabase...');
    const { data, error } = await supabase.functions.invoke('get-stripe-config', {
      body: {},
    });

    if (error) {
      console.error('🔴 Failed to fetch Stripe config:', error);
      return null;
    }

    if (data?.publishableKey && isValidKey(data.publishableKey)) {
      console.log('✅ Stripe publishable key retrieved from Supabase');
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

        let publishableKey =
          (typeof window !== 'undefined' && window.STRIPE_PUBLISHABLE_KEY) ||
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

        if (publishableKey) {
          console.log('🔑 Found local publishable key');
        }

        if (!publishableKey || !isValidKey(publishableKey)) {
          console.log('⬇️ No valid local key, fetching from Supabase...');
          try {
            publishableKey = (await fetchStripeKey()) || undefined;
          } catch (err) {
            console.warn('⚠️ fetchStripeKey threw, will fall back to bundled key', err);
          }
        }

        if (!publishableKey || !isValidKey(publishableKey)) {
          console.warn('⚠️ No remote Stripe key available, using bundled fallback publishable key');
          publishableKey = FALLBACK_PUBLISHABLE_KEY;
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
