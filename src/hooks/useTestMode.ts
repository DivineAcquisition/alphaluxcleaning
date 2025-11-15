import { useState, useEffect } from 'react';

/**
 * Hook to check if the application is in test/demo mode
 * Test mode bypasses payment processing while maintaining full booking flow
 */
export function useTestMode() {
  const [isTestMode, setIsTestMode] = useState(false);

  useEffect(() => {
    const checkTestMode = () => {
      const testMode = localStorage.getItem('booking_test_mode') === 'true';
      setIsTestMode(testMode);
      
      // Auto-disable test mode on mount if it's enabled
      if (testMode) {
        console.log('🔧 Disabling test mode...');
        localStorage.removeItem('booking_test_mode');
        setIsTestMode(false);
      }
    };

    checkTestMode();

    // Listen for storage changes (in case test mode is toggled in another tab)
    window.addEventListener('storage', checkTestMode);
    return () => window.removeEventListener('storage', checkTestMode);
  }, []);

  return { isTestMode };
}
