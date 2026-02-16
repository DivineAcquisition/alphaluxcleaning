import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTestMode } from '@/hooks/useTestMode';
import { useState, useEffect } from 'react';
import { TestTube, AlertTriangle, CheckCircle, Zap, ExternalLink, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';

export default function DevTestModeToggle() {
  const { isTestMode } = useTestMode();
  const [localValue, setLocalValue] = useState('');
  const [testBookingCount, setTestBookingCount] = useState(0);
  const [todayBookingCount, setTodayBookingCount] = useState(0);
  
  useEffect(() => {
    setLocalValue(localStorage.getItem('booking_test_mode') || 'not set');
    if (isTestMode) {
      fetchTestBookingStats();
    }
  }, [isTestMode]);

  const fetchTestBookingStats = async () => {
    try {
      // Get total test bookings
      const { count: totalCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .or('stripe_payment_intent_id.like.test_%,stripe_payment_intent_id.eq.test-mode-payment');
      
      setTestBookingCount(totalCount || 0);

      // Get today's test bookings
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: todayCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .or('stripe_payment_intent_id.like.test_%,stripe_payment_intent_id.eq.test-mode-payment')
        .gte('created_at', today.toISOString());
      
      setTodayBookingCount(todayCount || 0);
    } catch (error) {
      console.error('Failed to fetch test booking stats:', error);
    }
  };
  
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
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-2xl mx-auto p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Developer Tools</h1>
          <p className="text-muted-foreground">
            Manage test mode and debugging settings
          </p>
        </div>

        {isTestMode && (
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Test Bookings Today</p>
                  <p className="text-3xl font-bold text-primary">{todayBookingCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Total Test Bookings</p>
                  <p className="text-3xl font-bold text-primary">{testBookingCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Status</p>
                  <Badge className="text-sm">Active</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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
                      Stripe payment forms will not appear. This is for testing only.
                    </p>
                  </AlertDescription>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Test Mode DISABLED ✅</strong>
                    <p className="mt-1 text-sm">
                      Normal operation mode. All payments will be processed through Stripe.
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

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Fast access to demo flows and testing tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/demo-booking">
                <ExternalLink className="h-4 w-4 mr-2" />
                Start Demo Booking Flow
              </Link>
            </Button>
            {testBookingCount > 0 && (
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/dev-test/cleanup">
                  <Database className="h-4 w-4 mr-2" />
                  View & Cleanup Test Bookings ({testBookingCount})
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/dev-test/webhooks">
                <TestTube className="h-4 w-4 mr-2" />
                Webhook Testing
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/booking-debug">
                <TestTube className="h-4 w-4 mr-2" />
                Booking Flow Debug
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What is Test Mode?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
               <strong>When ENABLED:</strong> Bookings are created with status "confirmed" 
               without processing any payment through Stripe. The Stripe payment form will not load.
            </p>
            <p>
               <strong>When DISABLED:</strong> Normal operation - all payments are processed 
               through Stripe and bookings require valid payment.
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
