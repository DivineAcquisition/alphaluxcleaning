import { loadStripe } from '@stripe/stripe-js';

// Stripe publishable key for live mode
const stripePublishableKey = 'pk_live_51LS4ARKugxYY6ADiKfpWzGBiGMykyaFxmI9oKZVqzWvsizE8cWYXEv50v9oPOcJQ5CsFcBIjtnHwCkUCq9COiaeu00ElMa1ni2';

// Validate the key format
if (!stripePublishableKey || (!stripePublishableKey.startsWith('pk_test_') && !stripePublishableKey.startsWith('pk_live_'))) {
  console.error('Invalid Stripe publishable key format. Please provide a valid key starting with pk_test_ or pk_live_');
}

export const stripePromise = loadStripe(stripePublishableKey).catch(error => {
  console.error('Failed to load Stripe:', error);
  return null;
});