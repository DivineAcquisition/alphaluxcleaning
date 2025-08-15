import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { toast } from 'sonner';

// Robust, non-crashing Stripe loader with better error handling and fallback options

declare global {
  interface Window {
    STRIPE_PUBLISHABLE_KEY?: string;
  }
}

// Try multiple sources for a publishable key (safe to expose):
const candidateKey = (
  typeof window !== 'undefined' && window.STRIPE_PUBLISHABLE_KEY
) || (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_STRIPE_PUBLISHABLE_KEY) || 
// Fallback test key for development (replace with your actual test key)
'pk_test_51234567890abcdef' || '';

const isValidKey = (k: string) => typeof k === 'string' && (k.startsWith('pk_test_') || k.startsWith('pk_live_'));

// Enhanced error reporting
if (!isValidKey(candidateKey)) {
  const errorMessage = 'Stripe publishable key missing or invalid. Payment processing unavailable.';
  console.error('🔴 STRIPE CONFIG ERROR:', errorMessage);
  
  // Show user-friendly notification
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      toast.error('Payment system configuration needed. Please contact support.');
    }, 1000);
  }
} else {
  console.log('✅ Stripe configuration loaded successfully');
}

// Enhanced promise with better error handling
export const stripePromise: Promise<Stripe | null> = isValidKey(candidateKey)
  ? loadStripe(candidateKey).catch((error) => {
      console.error('🔴 Failed to initialize Stripe:', error);
      toast.error('Unable to load payment system. Please refresh the page.');
      return null;
    })
  : Promise.resolve(null);

export const hasStripeKey = isValidKey(candidateKey);

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
