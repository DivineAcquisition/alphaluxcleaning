import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, Sparkles, Search, Calendar } from 'lucide-react';
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
  
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<BookingData[]>([]);
  const [searching, setSearching] = useState(false);

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

  const handleEmailSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setSearching(true);
    try {
      const { data, error: searchError } = await supabase
        .from('bookings')
        .select(`
          id,
          service_type,
          est_price,
          service_date,
          frequency,
          property_details,
          customers!inner (
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
        .eq('customers.email', searchEmail.trim().toLowerCase())
        .order('service_date', { ascending: false })
        .limit(5);

      if (searchError) throw searchError;

      if (!data || data.length === 0) {
        toast.error('No bookings found for this email address');
        setSearchResults([]);
      } else {
        setSearchResults(data as any);
        toast.success(`Found ${data.length} booking(s)`);
      }
    } catch (err: any) {
      console.error('Error searching bookings:', err);
      toast.error('Failed to search bookings');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectBooking = (selectedBookingId: string) => {
    navigate(`/start-recurring?booking=${selectedBookingId}`);
  };

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
              Ready for Recurring Service? 🎉
            </h1>
            <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              Never worry about cleaning again. Find your booking and set up your recurring schedule.
            </p>
          </div>
        </div>

        {/* Search Section */}
        <div className="max-w-2xl mx-auto px-4 -mt-8 mb-8">
          <Card className="p-6 border-2 border-primary/20 bg-card shadow-lg">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Search className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Find Your Booking</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Enter the email address you used when booking your service
                  </p>
                  
                  <form onSubmit={handleEmailSearch} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                        disabled={searching}
                      />
                    </div>
                    <Button type="submit" disabled={searching} className="w-full">
                      {searching ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Find My Bookings
                        </>
                      )}
                    </Button>
                  </form>
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-3 pt-4 border-t">
                  <h4 className="font-semibold text-sm text-muted-foreground">
                    Select a booking to continue:
                  </h4>
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelectBooking(result.id)}
                      className="w-full text-left p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="font-medium">
                            {result.service_type.charAt(0).toUpperCase() + result.service_type.slice(1)} Cleaning
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {result.service_date ? (
                              <>
                                <Calendar className="h-3 w-3 inline mr-1" />
                                {new Date(result.service_date).toLocaleDateString()}
                              </>
                            ) : (
                              'Date pending'
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">${result.est_price.toFixed(2)}</div>
                          <div className="text-xs text-primary">
                            ${(result.est_price * 0.85).toFixed(2)}/visit recurring
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* No Previous Booking Section */}
        <div className="max-w-2xl mx-auto px-4 pb-16">
          <Card className="p-6 bg-muted/50">
            <div className="text-center space-y-3">
              <h3 className="font-semibold">No Previous Booking?</h3>
              <p className="text-sm text-muted-foreground">
                We recommend completing your first clean before setting up recurring service. 
                This helps us understand your space and preferences better.
              </p>
              <Button variant="outline" onClick={() => navigate('/')} className="mt-2">
                Schedule Your First Clean
              </Button>
            </div>
          </Card>
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
