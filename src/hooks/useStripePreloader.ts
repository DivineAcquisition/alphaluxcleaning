import { useEffect } from 'react';
import { stripePromise } from '@/lib/stripe';

/**
 * Hook to preload Stripe in the background
 * This helps reduce loading times when payment forms are needed
 */
export const useStripePreloader = () => {
  useEffect(() => {
    // Start loading Stripe in the background
    const preload = async () => {
      try {
        await stripePromise;
        console.log('✅ Stripe preloaded successfully');
      } catch (error) {
        console.log('⚠️ Stripe preload failed, will retry when needed:', error);
      }
    };

    preload();
  }, []);
};