import { Alert, AlertDescription } from '@/components/ui/alert';
import { TestTube } from 'lucide-react';
import { useTestMode } from '@/hooks/useTestMode';
import { Link } from 'react-router-dom';

/**
 * Global banner that appears when test mode is active
 * Shows on all pages to remind users that payments are bypassed
 */
export function TestModeBanner() {
  const { isTestMode } = useTestMode();

  if (!isTestMode) return null;

  return (
    <Alert className="bg-orange-50 dark:bg-orange-950/30 border-orange-300 rounded-none border-x-0 border-t-0">
      <TestTube className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>
          <strong>Test Mode Active:</strong> Payment processing is bypassed. Bookings and webhooks work normally.
        </span>
        <Link 
          to="/dev-test-webhooks" 
          className="text-orange-700 dark:text-orange-400 underline hover:no-underline text-sm"
        >
          Disable in Settings
        </Link>
      </AlertDescription>
    </Alert>
  );
}
