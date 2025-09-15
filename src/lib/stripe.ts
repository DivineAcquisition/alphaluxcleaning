import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { toast } from 'sonner';

// Simplified Stripe configuration for booking flow
declare global {
  interface Window {
    STRIPE_PUBLISHABLE_KEY?: string;
  }
}

const isValidKey = (k: string) => typeof k === 'string' && (k.startsWith('pk_test_') || k.startsWith('pk_live_'));

// Direct Stripe publishable key - replace with your actual key
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51QTXa5DAinHcvxiHaXn1VKwAMnFYLaAHZqWn3z8eMlGQXOHcEJN8YpLTOJxNdUqAGwHxg6cMaKwYCsIKbgkNh5g100c9SaVk7C';

// Create a promise that resolves to the Stripe instance
const createStripePromise = async (): Promise<Stripe | null> => {
  try {
    // Use the direct publishable key
    let publishableKey = STRIPE_PUBLISHABLE_KEY;

    // Allow override from window object for testing
    if (typeof window !== 'undefined' && window.STRIPE_PUBLISHABLE_KEY) {
      publishableKey = window.STRIPE_PUBLISHABLE_KEY;
    }

    if (!publishableKey || !isValidKey(publishableKey)) {
      console.error('🔴 No valid Stripe publishable key configured');
      if (typeof window !== 'undefined') {
        toast.error('Payment system unavailable. Please contact support.', {
          description: 'Payment configuration missing'
        });
      }
      return null;
    }

    console.log('✅ Initializing Stripe with publishable key');
    return await loadStripe(publishableKey);
  } catch (error) {
    console.error('🔴 Failed to initialize Stripe:', error);
    if (typeof window !== 'undefined') {
      toast.error('Payment system error. Please refresh the page.', {
        description: 'Failed to initialize payment processing'
      });
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
