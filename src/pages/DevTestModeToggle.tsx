import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTestMode } from '@/hooks/useTestMode';
import { useState, useEffect } from 'react';
import { TestTube, AlertTriangle, CheckCircle } from 'lucide-react';

export default function DevTestModeToggle() {
  const { isTestMode } = useTestMode();
  const [localValue, setLocalValue] = useState('');
  
  useEffect(() => {
    setLocalValue(localStorage.getItem('booking_test_mode') || 'not set');
  }, [isTestMode]);
  
  const toggle = () => {
    const newValue = !isTestMode;
    localStorage.setItem('booking_test_mode', String(newValue));
    window.location.reload();
  };
  
  const clearTestMode = () => {
    localStorage.removeItem('booking_test_mode');
    window.location.reload();
  };
  
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Developer Tools</h1>
          <p className="text-muted-foreground">
            Manage test mode and debugging settings
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Test Mode Status
            </CardTitle>
            <CardDescription>
              Control whether payment processing is bypassed for testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className={isTestMode ? 'border-orange-500 bg-orange-50' : 'border-green-500 bg-green-50'}>
              {isTestMode ? (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Test Mode ENABLED ⚠️</strong>
                    <p className="mt-1 text-sm">
                      All bookings will be created WITHOUT processing payments. 
                      Square payment forms will not appear. This is for testing only.
                    </p>
                  </AlertDescription>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Test Mode DISABLED ✅</strong>
                    <p className="mt-1 text-sm">
                      Normal operation mode. All payments will be processed through Square.
                    </p>
                  </AlertDescription>
                </>
              )}
            </Alert>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Status:</span>
                <span className="text-sm font-mono">
                  {isTestMode ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">localStorage value:</span>
                <span className="text-sm font-mono">{localValue}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={toggle} 
                variant={isTestMode ? "default" : "destructive"}
                className="flex-1"
              >
                {isTestMode ? 'Disable Test Mode' : 'Enable Test Mode'}
              </Button>
              
              <Button 
                onClick={clearTestMode}
                variant="outline"
              >
                Clear & Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What is Test Mode?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>When ENABLED:</strong> Bookings are created with status "confirmed" 
              without processing any payment through Square. The Square payment form will not load.
            </p>
            <p>
              <strong>When DISABLED:</strong> Normal operation - all payments are processed 
              through Square and bookings require valid payment.
            </p>
            <p className="text-xs mt-4 p-3 bg-muted rounded">
              ⚠️ <strong>Important:</strong> Always disable test mode in production! 
              Test mode should only be used during development and testing.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
