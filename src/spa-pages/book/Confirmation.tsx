import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Check } from 'lucide-react';
import { BrandedLoader } from '@/components/BrandedLoader';
import { TIME_SLOTS, type TimeSlotId } from '@/components/booking/OfferDateTimePicker';

/** Date-only strings (`YYYY-MM-DD`) parse as UTC midnight, which renders
 *  as the previous evening in US timezones. Format them in UTC so the
 *  calendar day the customer picked is the day we show. */
function formatServiceDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return String(value);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function formatTimeWindow(slot: string | null | undefined): string | null {
  if (!slot) return null;
  const def = TIME_SLOTS.find((s) => s.id === slot);
  return def ? `${def.label} (${def.window})` : slot;
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function googleCalendarHref(opts: {
  serviceDate: string;
  timeSlot: string;
  title: string;
  location: string;
}) {
  const ymd = opts.serviceDate.slice(0, 10).replace(/-/g, '');
  const def =
    TIME_SLOTS.find((s) => s.id === (opts.timeSlot as TimeSlotId)) ??
    TIME_SLOTS[1];
  const start = `${ymd}T${pad2(def.startHour)}${pad2(def.startMinute ?? 0)}00`;
  const end = `${ymd}T${pad2(def.endHour)}${pad2(def.endMinute ?? 0)}00`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: opts.title,
    dates: `${start}/${end}`,
    details: 'AlphaLux Cleaning appointment',
    location: opts.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default function BookingConfirmation() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // Support both /booking/:bookingId and /book/confirmation?booking_id=...
  const bookingId = params.bookingId || searchParams.get('booking_id');
  const [booking, setBooking] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      // Guests have no Supabase session. `customers` SELECT is denied
      // by RLS (anon gets 0 rows / 406), so a direct read leaves the
      // receipt with a blank email and address even though both were
      // saved. The service-role edge function is the same path
      // /book/details already uses.
      const edge = await supabase.functions.invoke('get-booking-details', {
        body: { booking_id: bookingId },
      });

      let bookingData = edge.data?.booking;
      let customerData = edge.data?.customer || bookingData?.customers || null;

      if (edge.error || !edge.data?.success || !bookingData) {
        const { data, error: bookingError } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .single();
        if (bookingError) throw bookingError;
        bookingData = data;
        customerData = null;
      }

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
      setCustomer(customerData);
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
    return <BrandedLoader caption="Loading your confirmation…" />;
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
  const serviceDateLabel = formatServiceDate(booking.service_date);
  const timeWindowLabel = formatTimeWindow(booking.time_slot);
  const addressLine1 = booking.address_line1 || customer?.address_line1 || '';
  const addressLine2 = booking.address_line2 || customer?.address_line2 || '';
  const cityLine = [customer?.city, customer?.state].filter(Boolean).join(', ');
  const zip = booking.zip_code || customer?.postal_code || '';
  const cityZip = [cityLine, zip].filter(Boolean).join(' ');
  const addressSingle = [addressLine1, addressLine2, cityZip].filter(Boolean).join(', ');
  const calendarHref =
    booking.service_date && booking.time_slot
      ? googleCalendarHref({
          serviceDate: String(booking.service_date),
          timeSlot: String(booking.time_slot),
          title: `AlphaLux ${booking.offer_name || 'Cleaning'}`,
          location: addressSingle,
        })
      : null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-background">
      <Card className="max-w-2xl w-full">
        <CardContent className="pt-8">
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
              {customer?.email
                ? ` A confirmation has been sent to ${customer.email}.`
                : ' A confirmation is on its way.'}
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
                
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Service Date:</span>
                  <span className="font-medium text-right">
                    {serviceDateLabel || (
                      <span className="text-muted-foreground">To be scheduled</span>
                    )}
                  </span>
                </div>
                
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Time Window:</span>
                  <span className="font-medium text-right">
                    {timeWindowLabel || (
                      <span className="text-muted-foreground">To be scheduled</span>
                    )}
                  </span>
                </div>
                
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Address:</span>
                  <span className="font-medium text-right">
                    {addressLine1 || (
                      <span className="text-muted-foreground">Address on file</span>
                    )}
                    {addressLine2 ? <><br />{addressLine2}</> : null}
                    {cityZip ? <><br />{cityZip}</> : null}
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
          
          {calendarHref && (
            <div className="space-y-3 mb-6">
              <Button size="lg" className="w-full" variant="outline" asChild>
                <a href={calendarHref} target="_blank" rel="noreferrer">
                  <Calendar className="h-4 w-4 mr-2" />
                  Add to Calendar
                </a>
              </Button>
            </div>
          )}
          
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
