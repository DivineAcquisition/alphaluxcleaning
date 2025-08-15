import { loadStripe, type Stripe } from '@stripe/stripe-js';

// Robust, non-crashing Stripe loader for frontend-only environments
// Avoids relying on VITE_* envs (not supported here) and never throws at import time.

declare global {
  interface Window {
    STRIPE_PUBLISHABLE_KEY?: string;
  }
}

// Try multiple sources for a publishable key (safe to expose):
const candidateKey = (
  typeof window !== 'undefined' && window.STRIPE_PUBLISHABLE_KEY
) || (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_STRIPE_PUBLISHABLE_KEY) || '';

const isValidKey = (k: string) => typeof k === 'string' && (k.startsWith('pk_test_') || k.startsWith('pk_live_'));

if (!isValidKey(candidateKey)) {
  console.warn(
    'Stripe publishable key missing or invalid. Payment UI will be disabled until a valid key is provided.'
  );
}

// Always export a promise to keep <Elements stripe={...}> stable
export const stripePromise: Promise<Stripe | null> = isValidKey(candidateKey)
  ? loadStripe(candidateKey).catch((error) => {
      console.error('Failed to load Stripe:', error);
      return null;
    })
  : Promise.resolve(null);

export const hasStripeKey = isValidKey(candidateKey);
