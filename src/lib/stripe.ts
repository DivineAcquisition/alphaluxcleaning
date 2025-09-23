import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';

// Dynamic Stripe loader that fetches publishable key from Supabase

declare global {
  interface Window {
    STRIPE_PUBLISHABLE_KEY?: string;
  }
}

const isValidKey = (k: string) => typeof k === 'string' && (k.startsWith('pk_test_') || k.startsWith('pk_live_'));

// Use the existing Supabase client to avoid multiple instances
import { supabase } from '@/integrations/supabase/client';

// Function to fetch Stripe publishable key from Supabase
const fetchStripeKey = async (): Promise<string | null> => {
  try {
    console.log('🔄 Fetching Stripe configuration from Supabase...');
    console.log('🔍 Using Supabase URL:', "https://yltvknkqnzdeiqckqjha.supabase.co");
    
    const { data, error } = await supabase.functions.invoke('get-stripe-config');
    
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
        let publishableKey = (
          typeof window !== 'undefined' && window.STRIPE_PUBLISHABLE_KEY
        ) || (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_STRIPE_PUBLISHABLE_KEY);

        if (publishableKey) {
          console.log('🔑 Found local publishable key');
        }

        // If no local key, fetch from Supabase
        if (!publishableKey || !isValidKey(publishableKey)) {
          console.log('⬇️ No valid local key, fetching from Supabase...');
          publishableKey = await fetchStripeKey();
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

    // All attempts failed
    console.error('🔴 All Stripe initialization attempts failed:', lastError);
    if (typeof window !== 'undefined') {
      toast.error('Payment system unavailable. Please refresh the page.', {
        description: lastError?.message || 'Failed to initialize payment processing'
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
