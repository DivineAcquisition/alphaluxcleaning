import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Check, Sparkles, Loader2, TestTube } from 'lucide-react';
import { useTestMode } from '@/hooks/useTestMode';

export default function BookingConfirmation() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // Support both /booking/:bookingId and /book/confirmation?booking_id=...
  const bookingId = params.bookingId || searchParams.get('booking_id');
  const [booking, setBooking] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isTestMode } = useTestMode();

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;

      // Routing guard: if deposit was paid but address/schedule are missing,
      // send the user back to /book/details to complete their booking.
      const paymentDone =
        bookingData.payment_status === 'deposit_paid' ||
        bookingData.payment_status === 'paid' ||
        bookingData.payment_status === 'fully_paid';
      const missingDetails =
        !bookingData.address_line1 || !bookingData.service_date || !bookingData.time_slot;

      if (paymentDone && missingDetails) {
        navigate(`/book/details?booking_id=${bookingId}`, { replace: true });
        return;
      }

      setBooking(bookingData);

      if (bookingData.customer_id) {
        const { data: customerData } = await supabase
          .from('customers')
          .select('*')
          .eq('id', bookingData.customer_id)
          .single();

        setCustomer(customerData);
      }
    } catch (error) {
      console.error('Failed to fetch booking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const serviceTypeLabels: Record<string, string> = {
    regular: 'Standard Cleaning',
    deep: 'Deep Cleaning',
    move_in_out: 'Move-In/Out Cleaning',
  };

  const frequencyLabels: Record<string, string> = {
    one_time: 'One-Time',
    weekly: 'Weekly',
    bi_weekly: 'Bi-Weekly',
    monthly: 'Monthly',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 text-center">
            <p className="text-muted-foreground mb-4">Booking not found</p>
            <Button asChild>
              <Link to="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const balanceDue = (booking.est_price || 0) - (booking.deposit_amount || 0);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-background">
      <Card className="max-w-2xl w-full">
        <CardContent className="pt-8">
          {isTestMode && (
            <Alert className="mb-4 border-orange-500 bg-orange-50 dark:bg-orange-950/30">
              <TestTube className="h-4 w-4" />
              <AlertDescription>
                <strong>Demo Mode Active</strong> - This was a test booking. No real charges were made.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-success" />
            </div>
            
            <h1 className="text-3xl font-bold mb-2">
              🎉 {booking.offer_type === '90_day_plan' ? "You're in for 90 days!" : "You're booked!"}
            </h1>
            <p className="text-muted-foreground">
              We've received your ${booking.deposit_amount?.toFixed(2)} deposit for your{' '}
              <strong>{booking.offer_name || 'cleaning service'}</strong>.
              A confirmation has been sent to {customer?.email}.
            </p>
          </div>
          
          <Card className="bg-muted/30 mb-6">
            <CardContent className="pt-6">
              <h3 className="font-bold mb-4">Booking Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Booking ID:</span>
                  <span className="font-mono text-xs">{booking.id.slice(0, 8)}</span>
                </div>
                
                {booking.offer_name && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan:</span>
                    <span className="font-medium">{booking.offer_name}</span>
                  </div>
                )}

                {booking.visit_count && booking.visit_count > 1 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Visits:</span>
                    <span className="font-medium">
                      {booking.visit_count} cleanings over {booking.offer_type === '90_day_plan' ? '90 days' : 'coming months'}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service Type:</span>
                  <span className="font-medium">
                    {booking.offer_type === '90_day_plan' 
                      ? 'Deep Clean + Maintenance Plan'
                      : booking.offer_type === 'tester_deep_clean'
                        ? 'Home Reset Deep Clean (Tester)'
                        : serviceTypeLabels[booking.service_type]
                    }
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service Date:</span>
                  <span className="font-medium">
                    {booking.service_date ? (
                      new Date(booking.service_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })
                    ) : (
                      <span className="text-muted-foreground">To be scheduled</span>
                    )}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time Window:</span>
                  <span className="font-medium">
                    {booking.time_slot || <span className="text-muted-foreground">To be scheduled</span>}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Address:</span>
                  <span className="font-medium text-right">
                    {customer?.address_line1}
                    {customer?.address_line2 && `, ${customer.address_line2}`}
                    <br />
                    {customer?.city}, {customer?.state} {booking.zip_code}
                  </span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-bold text-base">
                  <span>Total Plan Cost:</span>
                  <span>${booking.est_price?.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-success text-sm">
                  <span>✓ Deposit Paid Today:</span>
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                    ${booking.deposit_amount?.toFixed(2)}
                  </Badge>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Balance Due After Service:</span>
                  <span className="font-medium">${balanceDue.toFixed(2)}</span>
                </div>

                {booking.visit_count > 1 && (
                  <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
                    💡 Remaining balance will be charged after each service
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <div className="space-y-3 mb-6">
            <Button size="lg" className="w-full" variant="outline">
              Add to Calendar
            </Button>
          </div>
          
          <Separator className="my-6" />
          
          <div className="space-y-4">
            <h3 className="font-bold">What happens next?</h3>
            <ul className="space-y-3 text-sm">
              {booking.offer_type === '90_day_plan' ? (
                <>
                  <li className="flex gap-3">
                    <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <span>We'll call you within 24 hours to schedule your first deep clean</span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <span>After your deep clean, we'll schedule your 3 maintenance visits over the next 90 days</span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <span>Remaining balance charged after each service completion</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex gap-3">
                    <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <span>We'll call you within 24 hours to confirm your appointment</span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <span>You'll receive a reminder 24 hours before service</span>
                  </li>
                  <li className="flex gap-3">
                    <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <span>Pay remaining balance after service completion</span>
                  </li>
                </>
              )}
            </ul>
          </div>
          
          {customer?.referral_code && (
            <Alert className="mt-6">
              <Sparkles className="h-4 w-4" />
              <AlertTitle>Earn $50 for Every Friend</AlertTitle>
              <AlertDescription>
                Share your referral code <strong>{customer.referral_code}</strong> and get $50 credit when friends book!
              </AlertDescription>
            </Alert>
          )}
          
          <p className="text-sm text-center text-muted-foreground mt-6">
            Need help? Call <strong>(857) 754-4557</strong> or reply to your confirmation email
          </p>
          
          <div className="mt-6 text-center">
            <Button asChild variant="outline">
              <Link to="/">Return Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
