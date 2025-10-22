import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { RecurringSignupForm } from '@/components/recurring/RecurringSignupForm';
import { WarmUpStep } from '@/components/typeform/WarmUpStep';
import { DeepCleanWarning } from '@/components/recurring/DeepCleanWarning';
import { getDeepCleanRecommendation } from '@/lib/booking-recommendations';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface BookingData {
  id: string;
  service_type: string;
  est_price: number;
  service_date: string;
  frequency: string | null;
  property_details: any;
  customers: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    postal_code: string;
  };
}

export default function StartRecurring() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get('booking');

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [lastCleanedTimeline, setLastCleanedTimeline] = useState<string>('');
  const [showWarning, setShowWarning] = useState(false);
  const [acknowledgedWarning, setAcknowledgedWarning] = useState(false);
  const [proceedToSignup, setProceedToSignup] = useState(false);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    } else {
      setLoading(false);
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          id,
          service_type,
          est_price,
          service_date,
          frequency,
          property_details,
          customers (
            id,
            name,
            email,
            phone,
            address_line1,
            address_line2,
            city,
            state,
            postal_code
          )
        `)
        .eq('id', bookingId)
        .single();

      if (fetchError) throw fetchError;
      if (!data) throw new Error('Booking not found');

      setBooking(data as any);
    } catch (err: any) {
      console.error('Error fetching booking:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTimelineSelect = (value: string) => {
    setLastCleanedTimeline(value);
    
    const recommendation = getDeepCleanRecommendation(value);
    
    if (recommendation.shouldRecommend) {
      setShowWarning(true);
      setProceedToSignup(false);
    } else {
      setShowWarning(false);
      setProceedToSignup(true);
    }
  };

  const handleContinueAnyway = () => {
    setAcknowledgedWarning(true);
    setProceedToSignup(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Setup Recurring Service
            </h1>
            <p className="text-lg text-muted-foreground">
              Save time and money with automatic cleaning
            </p>
          </div>

          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              We couldn't find your booking information.
            </p>
            <Button onClick={() => navigate('/')}>
              Book a Service First
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const firstName = booking.customers.name.split(' ')[0];
  const recommendation = getDeepCleanRecommendation(lastCleanedTimeline);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Welcome back, {firstName}! 🎉
          </h1>
          <p className="text-lg text-muted-foreground">
            {!lastCleanedTimeline && "Let's make sure recurring service is right for you"}
            {lastCleanedTimeline && !proceedToSignup && "Almost there..."}
            {proceedToSignup && "Let's set up your recurring service"}
          </p>
        </div>

        {/* Step 1: When was last cleaned? */}
        {!lastCleanedTimeline && (
          <WarmUpStep 
            value={lastCleanedTimeline}
            onSelect={handleTimelineSelect}
          />
        )}

        {/* Step 2: Show result based on answer */}
        {lastCleanedTimeline && !proceedToSignup && (
          <div className="space-y-6">
            {showWarning ? (
              <DeepCleanWarning
                urgency={recommendation.urgency}
                reason={recommendation.reason}
                onContinueAnyway={handleContinueAnyway}
              />
            ) : (
              <Card className="p-8 text-center border-2 border-green-200 bg-green-50">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold mb-3">Perfect! You're Ready for Recurring Service</h2>
                <p className="text-muted-foreground mb-6">
                  Your home was recently cleaned, making it ideal for a recurring maintenance schedule.
                </p>
                <Button size="lg" onClick={() => setProceedToSignup(true)}>
                  Continue to Signup
                </Button>
              </Card>
            )}
          </div>
        )}

        {/* Step 3: Recurring signup form */}
        {proceedToSignup && booking && (
          <div className="space-y-8">
            {/* Last Service Summary */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Your Last Service</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service:</span>
                  <span className="font-medium">
                    {booking.service_type.charAt(0).toUpperCase() + booking.service_type.slice(1)} Cleaning
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">
                    {new Date(booking.service_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-medium">${booking.est_price.toFixed(2)}</span>
                </div>
              </div>
            </Card>

            {/* Recurring signup form */}
            <RecurringSignupForm 
              booking={booking}
              lastCleanedTimeline={lastCleanedTimeline}
              acknowledgedWarning={acknowledgedWarning}
            />
          </div>
        )}
      </div>
    </div>
  );
}
