import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';

// Dynamic Stripe loader that fetches publishable key from Supabase.
// A hard-coded fallback publishable key is safe to include in client code
// (it is intentionally public) and lets the payment form initialize even if
// the `get-stripe-config` edge function is unreachable.
const FALLBACK_PUBLISHABLE_KEY =
  'pk_live_51TONej6CLM640LjskzQLH22Fnnw3c1fYFzJ8zodmoCDYSkKAAuFZfpDYFQEQMvMxWXaoiAfDbT0FSlJuFjjqqdoT00PzmRxxat';

declare global {
  interface Window {
    STRIPE_PUBLISHABLE_KEY?: string;
  }
}

const isValidKey = (k: string) => typeof k === 'string' && (k.startsWith('pk_test_') || k.startsWith('pk_live_'));

// Use the existing Supabase client to avoid multiple instances
import { supabase } from '@/integrations/supabase/client';

// Function to fetch Stripe publishable key from Supabase.
// When the booking context has a ZIP locked in, we pass it through so
// the server returns the publishable key for the Stripe account that
// owns that ZIP's state (NY vs CA/TX). Falls back to the NY account
// when no ZIP is available yet.
function readZipFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    // Try the booking context first.
    const ctx = window.localStorage.getItem('alphalux_booking');
    if (ctx) {
      const parsed = JSON.parse(ctx);
      const zip = parsed?.zipCode || parsed?.zip || null;
      if (typeof zip === 'string' && zip.length >= 5) return zip.slice(0, 5);
    }
    // Legacy single-field store.
    const direct = window.localStorage.getItem('booking_zip');
    if (direct && direct.length >= 5) return direct.slice(0, 5);
  } catch {
    // ignore — storage may be unavailable
  }
  return null;
}

const fetchStripeKey = async (): Promise<string | null> => {
  try {
    console.log('🔄 Fetching Stripe configuration from Supabase...');
    console.log('🔍 Using Supabase URL:', "https://yltvknkqnzdeiqckqjha.supabase.co");

    const zipCode = readZipFromStorage();
    const { data, error } = await supabase.functions.invoke('get-stripe-config', {
      body: zipCode ? { zipCode } : {},
    });
    
    console.log('📡 Stripe config response:', { data, error });
    
    if (error) {
      console.error('🔴 Failed to fetch Stripe config:', error);
      return null;
    }
    
    if (data?.publishableKey && isValidKey(data.publishableKey)) {
      console.log('✅ Stripe publishable key retrieved successfully');
      console.log('🔑 Key starts with:', data.publishableKey.substring(0, 15) + '...');
      return data.publishableKey;
    }
    
    console.error('🔴 Invalid or missing Stripe publishable key in response:', data);
    return null;
  } catch (error) {
    console.error('🔴 Error fetching Stripe configuration:', error);
    return null;
  }
};

// Create a cached Stripe promise with retry logic
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
        
        // Try local sources first (for development)
        let publishableKey =
          (typeof window !== 'undefined' && window.STRIPE_PUBLISHABLE_KEY) ||
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

        if (publishableKey) {
          console.log('🔑 Found local publishable key');
        }

        // If no local key, fetch from Supabase
        if (!publishableKey || !isValidKey(publishableKey)) {
          console.log('⬇️ No valid local key, fetching from Supabase...');
          try {
            publishableKey = await fetchStripeKey() || undefined;
          } catch (err) {
            console.warn('⚠️ fetchStripeKey threw, will fall back to bundled key', err);
          }
        }

        // Final fallback – the publishable key is safe to ship to the client.
        if (!publishableKey || !isValidKey(publishableKey)) {
          console.warn('⚠️ No remote Stripe key available, using bundled fallback publishable key');
          publishableKey = FALLBACK_PUBLISHABLE_KEY;
        }

        if (!publishableKey || !isValidKey(publishableKey)) {
          throw new Error('No valid Stripe publishable key found');
        }

        console.log('✅ Initializing Stripe with valid key');
        
        // Add a small delay on retries to avoid rapid failures
        if (attempt > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }

        const stripe = await loadStripe(publishableKey, {
          stripeAccount: undefined, // Ensure we're not passing any undefined values
        });

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

    // All attempts failed — clear the cached promise so a subsequent
    // call (e.g. after the Supabase secret is added) can try again
    // without the user having to hard-reload the page.
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

// Export the promise (created immediately for preloading)
export const stripePromise = createStripePromise();

// Preload Stripe early in the application lifecycle
if (typeof window !== 'undefined') {
  // Start loading Stripe in the background
  stripePromise.catch(() => {
    // Silently catch preload errors, actual usage will handle them
  });
}

// Function to check if we have a Stripe key available
export const hasStripeKey = async (): Promise<boolean> => {
  const stripe = await stripePromise;
  return stripe !== null;
};

// Export a function that returns the stripe promise (required by Elements component)
export const getStripePromise = () => stripePromise;

/**
 * Multi-account helper. `create-payment-intent` returns a
 * `publishableKey` bound to the Stripe account that owns the
 * PaymentIntent; the PaymentForm calls this helper to boot a
 * dedicated Stripe.js instance against *that* account instead of
 * re-using the cached global promise (which is always whichever key
 * loaded first).
 *
 * Each distinct key gets its own cached Promise so that tab flips
 * between two checkouts on different accounts don't re-download
 * stripe.js or re-init Elements.
 */
const stripeByKeyCache = new Map<string, Promise<Stripe | null>>();

export const getStripeForKey = (key: string | null | undefined): Promise<Stripe | null> => {
  if (!key || !isValidKey(key)) return stripePromise;
  const cached = stripeByKeyCache.get(key);
  if (cached) return cached;
  const p = loadStripe(key).catch((err) => {
    console.error('🔴 getStripeForKey failed to load Stripe with account key', err);
    stripeByKeyCache.delete(key);
    return null;
  });
  stripeByKeyCache.set(key, p);
  return p;
};

// Utility function to check if Stripe is ready
export const checkStripeReady = async (): Promise<boolean> => {
  try {
    const stripe = await stripePromise;
    return stripe !== null;
  } catch (error) {
    console.error('Stripe readiness check failed:', error);
    return false;
  }
};
