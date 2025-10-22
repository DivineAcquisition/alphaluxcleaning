import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { RecurringSignupForm } from '@/components/recurring/RecurringSignupForm';
import { toast } from 'sonner';

interface BookingData {
  id: string;
  service_type: string;
  est_price: number;
  service_date: string;
  frequency: string;
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

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) {
        setError('No booking ID provided');
        setLoading(false);
        return;
      }

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
        setError(err.message || 'Failed to load booking');
        toast.error('Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading your details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center space-y-4">
          <h2 className="text-2xl font-bold">Booking Not Found</h2>
          <p className="text-muted-foreground">
            We couldn't find the booking you're looking for. Please check your link or contact support.
          </p>
          <button
            onClick={() => navigate('/')}
            className="text-primary hover:underline"
          >
            Return to homepage
          </button>
        </Card>
      </div>
    );
  }

  const firstName = booking.customers.name.split(' ')[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="bg-primary text-primary-foreground py-12 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-6 w-6" />
            <Badge variant="secondary" className="text-sm">
              Save up to 15%
            </Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">
            Welcome back, {firstName}! 🎉
          </h1>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            Turn your one-time clean into a regular routine and never worry about cleaning again
          </p>
        </div>
      </div>

      {/* Last Service Card */}
      <div className="max-w-4xl mx-auto px-4 -mt-8 mb-8">
        <Card className="p-6 border-2 border-primary/20 bg-card shadow-lg">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">Your Last Service</h3>
              <p className="text-muted-foreground">
                {booking.service_type.charAt(0).toUpperCase() + booking.service_type.slice(1)} Cleaning
                {booking.service_date && ` on ${new Date(booking.service_date).toLocaleDateString()}`}
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold">${booking.est_price.toFixed(2)}</span>
                <span className="text-muted-foreground">→</span>
                <span className="text-2xl font-bold text-primary">
                  ${(booking.est_price * 0.85).toFixed(2)}/visit
                </span>
                <Badge variant="secondary" className="ml-2">15% off</Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Signup Form */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <RecurringSignupForm booking={booking} />
      </div>

      {/* Trust Signals */}
      <div className="border-t bg-muted/30 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <CheckCircle2 className="h-8 w-8 mx-auto text-primary" />
              <h4 className="font-semibold">Skip Anytime</h4>
              <p className="text-sm text-muted-foreground">
                No questions asked. Pause or cancel with one click.
              </p>
            </div>
            <div className="space-y-2">
              <CheckCircle2 className="h-8 w-8 mx-auto text-primary" />
              <h4 className="font-semibold">Satisfaction Guarantee</h4>
              <p className="text-sm text-muted-foreground">
                Not happy? We'll re-clean for free or refund you.
              </p>
            </div>
            <div className="space-y-2">
              <CheckCircle2 className="h-8 w-8 mx-auto text-primary" />
              <h4 className="font-semibold">Secure Payments</h4>
              <p className="text-sm text-muted-foreground">
                Bank-level encryption. Your data is safe with us.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
