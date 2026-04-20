import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Navigation } from '@/components/Navigation';
import { TestTube, Check, ChevronRight, Sparkles, Home } from 'lucide-react';
import { useBooking } from '@/contexts/BookingContext';

export default function DemoBooking() {
  const navigate = useNavigate();
  const { updateBookingData } = useBooking();
  const [testModeEnabled, setTestModeEnabled] = useState(false);

  useEffect(() => {
    // Enable test mode automatically
    localStorage.setItem('booking_test_mode', 'true');
    setTestModeEnabled(true);
    
    // Dispatch storage event for other components
    window.dispatchEvent(new Event('storage'));
  }, []);

  const startDemoFlow = (serviceType: 'standard' | 'tester_deep' | '90_day_plan') => {
    // Pre-configure booking data
    updateBookingData({
      zipCode: '75201',
      city: 'New York',
      state: 'TX',
      homeSizeId: '1000-1499',
      sqft: 1200,
    });

    // Navigate to offer page with pre-selected service
    navigate('/book/offer');
  };

  const disableTestMode = () => {
    localStorage.removeItem('booking_test_mode');
    setTestModeEnabled(false);
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <TestTube className="h-8 w-8 text-orange-600" />
            <h1 className="text-4xl font-bold">Demo Booking Flow</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Complete end-to-end booking demonstration with no payment processing
          </p>
        </div>

        {testModeEnabled && (
          <Alert className="mb-6 border-orange-500 bg-orange-50 dark:bg-orange-950/30">
            <TestTube className="h-4 w-4" />
            <AlertDescription>
              <strong>Test Mode Active</strong> - All bookings created will bypass payment processing.
              Data will be tagged as test bookings.
            </AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Quick Start Demo Flows</CardTitle>
            <CardDescription>
              Each flow will pre-fill data and guide you through the complete booking process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => startDemoFlow('standard')}>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1">Standard Clean</h3>
                      <p className="text-sm text-muted-foreground">One-time service</p>
                    </div>
                    <Badge variant="outline">~$150-200</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => startDemoFlow('tester_deep')}>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Home className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1">Tester Deep Clean</h3>
                      <p className="text-sm text-muted-foreground">≤1,499 sqft only</p>
                    </div>
                    <Badge variant="outline">~$200-250</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => startDemoFlow('90_day_plan')}>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Check className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1">90-Day Plan</h3>
                      <p className="text-sm text-muted-foreground">4 visits bundled</p>
                    </div>
                    <Badge variant="outline">~$600-800</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Demo Flow Steps</CardTitle>
            <CardDescription>Complete booking process verification</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { step: 1, label: 'Zip Code & Service Area', path: '/book/zip' },
                { step: 2, label: 'Home Size Selection', path: '/book/sqft' },
                { step: 3, label: 'Offer Selection', path: '/book/offer' },
                { step: 4, label: 'Checkout & Payment', path: '/book/checkout' },
                { step: 5, label: 'Service Details', path: '/book/details' },
                { step: 6, label: 'Confirmation', path: '/book/confirmation' },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                    {item.step}
                  </div>
                  <span className="flex-1 font-medium">{item.label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Mode Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                <span>No real payment processing - Stripe payment form bypassed</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                <span>Complete booking records created in database</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                <span>Webhooks trigger normally (LEAD_CREATED, BOOKING_CONFIRMED)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                <span>Test bookings tagged with stripe_payment_intent_id starting with "test_"</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                <span>Demo data auto-fill available at checkout & details pages</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <div className="flex justify-between items-center">
          <Button variant="outline" asChild>
            <a href="/dev-test/test-mode">Manage Test Mode</a>
          </Button>
          {testModeEnabled && (
            <Button variant="destructive" onClick={disableTestMode}>
              Disable Test Mode
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
