import { useState, useEffect } from 'react';

/**
 * Hook to check if the application is in test/demo mode
 * Test mode bypasses payment processing while maintaining full booking flow
 */
function readTestMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('booking_test_mode') === 'true';
}

export function useTestMode() {
  // Read synchronously. Checkout decides whether to create a live
  // Stripe PaymentIntent on the first effect, and the default `false`
  // raced ahead of a post-mount localStorage read — test mode then
  // opened a real payment before the flag flipped on.
  const [isTestMode, setIsTestMode] = useState(readTestMode);

  useEffect(() => {
    const checkTestMode = () => {
      setIsTestMode(readTestMode());
    };

    checkTestMode();

    // Listen for storage changes (in case test mode is toggled in another tab)
    window.addEventListener('storage', checkTestMode);
    return () => window.removeEventListener('storage', checkTestMode);
  }, []);

  return { isTestMode };
}
