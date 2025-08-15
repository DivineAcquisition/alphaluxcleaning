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

// Initialize Supabase client
const supabase = createClient(
  "https://kqoezqzogleaaupjzxch.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtxb2V6cXpvZ2xlYWF1cGp6eGNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzOTA4MDQsImV4cCI6MjA2ODk2NjgwNH0.UIHq6w9SPXq_D6Fwx_BOa-THHCR94sJ4vvuXxR7QuMI"
);

// Function to fetch Stripe publishable key from Supabase
const fetchStripeKey = async (): Promise<string | null> => {
  try {
    console.log('🔄 Fetching Stripe configuration from Supabase...');
    
    const { data, error } = await supabase.functions.invoke('get-stripe-config');
    
    if (error) {
      console.error('🔴 Failed to fetch Stripe config:', error);
      return null;
    }
    
    if (data?.publishableKey && isValidKey(data.publishableKey)) {
      console.log('✅ Stripe publishable key retrieved successfully');
      return data.publishableKey;
    }
    
    console.error('🔴 Invalid or missing Stripe publishable key in response');
    return null;
  } catch (error) {
    console.error('🔴 Error fetching Stripe configuration:', error);
    return null;
  }
};

// Create a promise that resolves to the Stripe instance
const createStripePromise = async (): Promise<Stripe | null> => {
  try {
    // Try local sources first (for development)
    let publishableKey = (
      typeof window !== 'undefined' && window.STRIPE_PUBLISHABLE_KEY
    ) || (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_STRIPE_PUBLISHABLE_KEY);

    // If no local key, fetch from Supabase
    if (!publishableKey || !isValidKey(publishableKey)) {
      publishableKey = await fetchStripeKey();
    }

    if (!publishableKey || !isValidKey(publishableKey)) {
      console.error('🔴 No valid Stripe publishable key found');
      if (typeof window !== 'undefined') {
        toast.error('Payment system configuration needed. Please contact support.');
      }
      return null;
    }

    console.log('✅ Initializing Stripe with valid key');
    return await loadStripe(publishableKey);
  } catch (error) {
    console.error('🔴 Failed to initialize Stripe:', error);
    if (typeof window !== 'undefined') {
      toast.error('Unable to load payment system. Please refresh the page.');
    }
    return null;
  }
};

// Enhanced promise with better error handling
export const stripePromise: Promise<Stripe | null> = createStripePromise();

// Function to check if we have a Stripe key available
export const hasStripeKey = async (): Promise<boolean> => {
  const stripe = await stripePromise;
  return stripe !== null;
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
