import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TestTube } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function TestModeToggle() {
  const [isTestMode, setIsTestMode] = useState(false);

  useEffect(() => {
    // Check localStorage for test mode
    const testMode = localStorage.getItem('booking_test_mode') === 'true';
    setIsTestMode(testMode);
  }, []);

  const handleToggle = (checked: boolean) => {
    localStorage.setItem('booking_test_mode', checked.toString());
    setIsTestMode(checked);
    
    // Reload page to apply changes
    if (checked !== isTestMode) {
      window.location.reload();
    }
  };

  return (
    <Card className="border-orange-200 dark:border-orange-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TestTube className="h-5 w-5 text-orange-600" />
            <CardTitle>Test/Demo Mode</CardTitle>
          </div>
          {isTestMode && (
            <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
              Active
            </Badge>
          )}
        </div>
        <CardDescription>
          Test the complete booking flow without processing real payments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="test-mode" className="cursor-pointer">
            Enable Test Mode
          </Label>
          <Switch
            id="test-mode"
            checked={isTestMode}
            onCheckedChange={handleToggle}
          />
        </div>

        {isTestMode && (
          <Alert className="bg-orange-50 dark:bg-orange-950/30 border-orange-200">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-sm text-orange-800 dark:text-orange-200">
              <strong>Test Mode Active:</strong>
              <ul className="mt-2 ml-4 list-disc space-y-1 text-xs">
                <li>Payment processing is bypassed (Square won't be charged)</li>
                <li>Bookings are still created in the database</li>
                <li>All webhooks fire normally</li>
                <li>Perfect for testing integrations and flows</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
