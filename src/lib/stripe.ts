import { loadStripe } from '@stripe/stripe-js';

// Stripe publishable key for test mode
// TODO: Replace with your actual Stripe publishable key
const stripePublishableKey = 'YOUR_STRIPE_PUBLISHABLE_KEY_HERE';

// Validate the key format
if (!stripePublishableKey || (!stripePublishableKey.startsWith('pk_test_') && !stripePublishableKey.startsWith('pk_live_'))) {
  console.error('Invalid Stripe publishable key format. Please provide a valid key starting with pk_test_ or pk_live_');
}

export const stripePromise = loadStripe(stripePublishableKey).catch(error => {
  console.error('Failed to load Stripe:', error);
  return null;
});