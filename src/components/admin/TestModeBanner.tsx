import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { TestTube, X, ExternalLink } from 'lucide-react';
import { useTestMode } from '@/hooks/useTestMode';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Enhanced test mode banner with step tracking and quick actions
 * Shows on all pages to remind users that payments are bypassed
 */
export function TestModeBanner() {
  const { isTestMode } = useTestMode();
  const location = useLocation();
  const [testBookingCount, setTestBookingCount] = useState(0);

  useEffect(() => {
    if (isTestMode) {
      fetchTestBookingCount();
    }
  }, [isTestMode, location.pathname]);

  const fetchTestBookingCount = async () => {
    try {
      const { count } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .or('stripe_payment_intent_id.like.test_%,stripe_payment_intent_id.eq.test-mode-payment');
      
      setTestBookingCount(count || 0);
    } catch (error) {
      console.error('Failed to fetch test booking count:', error);
    }
  };

  const getCurrentStep = () => {
    const path = location.pathname;
    if (path.includes('/book/zip')) return 'Step 1: Zip Code';
    if (path.includes('/book/sqft')) return 'Step 2: Home Size';
    if (path.includes('/book/offer')) return 'Step 3: Offer Selection';
    if (path.includes('/book/checkout')) return 'Step 4: Checkout';
    if (path.includes('/book/details')) return 'Step 5: Service Details';
    if (path.includes('/book/confirmation')) return 'Step 6: Confirmation';
    return null;
  };

  const disableTestMode = () => {
    localStorage.removeItem('booking_test_mode');
    window.dispatchEvent(new Event('storage'));
    window.location.reload();
  };

  if (!isTestMode) return null;

  const currentStep = getCurrentStep();

  return (
    <Alert className="bg-orange-50 dark:bg-orange-950/30 border-orange-300 rounded-none border-x-0 border-t-0">
      <TestTube className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-1">
          <span>
            <strong>Test Mode Active:</strong> Payment processing bypassed.
            {currentStep && (
              <span className="ml-2 text-sm opacity-80">
                {currentStep}
              </span>
            )}
          </span>
          {testBookingCount > 0 && (
            <span className="text-sm opacity-80">
              {testBookingCount} test booking{testBookingCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            asChild
            className="h-7 text-xs"
          >
            <Link to="/demo-booking">
              <ExternalLink className="h-3 w-3 mr-1" />
              Demo Flow
            </Link>
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            asChild
            className="h-7 text-xs"
          >
            <Link to="/dev-test/cleanup">
              Cleanup ({testBookingCount})
            </Link>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={disableTestMode}
            className="h-7 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Disable
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
