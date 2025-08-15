import { loadStripe } from '@stripe/stripe-js';

// Use environment variable for Stripe publishable key
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Validate the key format
if (!stripePublishableKey) {
  console.error('STRIPE_PUBLISHABLE_KEY environment variable is required but not set');
  throw new Error('Stripe publishable key is required. Please set VITE_STRIPE_PUBLISHABLE_KEY environment variable.');
}

if (!stripePublishableKey.startsWith('pk_test_') && !stripePublishableKey.startsWith('pk_live_')) {
  console.error('Invalid Stripe publishable key format. Please provide a valid key starting with pk_test_ or pk_live_');
  throw new Error('Invalid Stripe publishable key format');
}

export const stripePromise = loadStripe(stripePublishableKey).catch(error => {
  console.error('Failed to load Stripe:', error);
  return null;
});