import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookingProgressBar } from '@/components/booking/BookingProgressBar';
import { useTestMode } from '@/hooks/useTestMode';
import { Loader2, Calendar, Home as HomeIcon, Building2, Building } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type DwellingType =
  | 'house'
  | 'apartment'
  | 'condo'
  | 'townhouse'
  | 'studio'
  | 'other';

const DWELLING_OPTIONS: Array<{ value: DwellingType; label: string; icon: typeof HomeIcon }> = [
  { value: 'house', label: 'Single-family house', icon: HomeIcon },
  { value: 'apartment', label: 'Apartment', icon: Building2 },
  { value: 'condo', label: 'Condo', icon: Building },
  { value: 'townhouse', label: 'Townhouse', icon: HomeIcon },
  { value: 'studio', label: 'Studio', icon: Building2 },
  { value: 'other', label: 'Other', icon: HomeIcon },
];

/**
 * Convert a date (YYYY-MM-DD) + time block ("morning"/"afternoon"/
 * "evening") into an ISO-8601 scheduled_start and scheduled_end that
 * Housecall Pro can consume.
 */
import {
  TIME_SLOTS,
  DEFAULT_MIN_LEAD_DAYS,
  timeSlotToIsoWindow,
  type TimeSlotId,
} from '@/components/booking/OfferDateTimePicker';

function timeBlockToIsoWindow(dateStr: string, block: string) {
  // Legacy helper kept for call sites that still pass strings — the
  // canonical implementation now lives in OfferDateTimePicker.
  return timeSlotToIsoWindow(dateStr, (block as TimeSlotId) || 'morning');
}

function computeEarliestBookableYmd(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + DEFAULT_MIN_LEAD_DAYS);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function BookingDetails() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('booking_id');

  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);
  const [submitState, setSubmitState] = useState<
    | { kind: 'idle' }
    | { kind: 'submitting' }
    | { kind: 'error'; message: string }
    | { kind: 'success'; jobId?: string }
  >({ kind: 'idle' });
  const { isTestMode } = useTestMode();

  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [dwellingType, setDwellingType] = useState<DwellingType>('house');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [hasPets, setHasPets] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTimeBlock, setPreferredTimeBlock] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!bookingId) {
      toast.error('No booking found');
      navigate('/book/zip');
      return;
    }

    fetchBookingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, navigate]);

  const fetchBookingData = async () => {
    try {
      // Preferred: hit the service-role edge function so guest users
      // (no Supabase auth session) can still load their booking + the
      // customer row after paying the deposit.
      const edge = await supabase.functions.invoke('get-booking-details', {
        body: { booking_id: bookingId },
      });
      if (!edge.error && edge.data?.success && edge.data?.booking) {
        applyBooking(edge.data.booking);
        return;
      }

      console.warn(
        '[book/details] get-booking-details edge function missed, falling back to direct select',
        edge.error,
      );

      // Fallback: direct select. `bookings` has two FKs to `customers`
      // (customer_id + referrer_customer_id) so PostgREST refuses to
      // embed `customers(*)` without disambiguation (PGRST201). Use
      // the pinned FK, and if RLS on `customers` hides the row, fall
      // back again to a two-step fetch.
      const { data, error } = await supabase
        .from('bookings')
        .select('*, customers:customers!bookings_customer_id_fkey(*)')
        .eq('id', bookingId)
        .maybeSingle();

      if (error || !data) {
        const { data: bookingOnly, error: bookingErr } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .maybeSingle();
        if (bookingErr || !bookingOnly) {
          throw bookingErr || new Error('Booking not found');
        }
        let customer: any = null;
        if (bookingOnly.customer_id) {
          const { data: cust } = await supabase
            .from('customers')
            .select('*')
            .eq('id', bookingOnly.customer_id)
            .maybeSingle();
          customer = cust || null;
        }
        applyBooking({ ...bookingOnly, customers: customer });
        return;
      }

      applyBooking(data);
    } catch (error: any) {
      console.error('Error fetching booking:', error);
      toast.error(
        error?.message ? `Couldn't load booking: ${error.message}` : 'Failed to load booking data',
      );
      navigate('/book/zip');
    }
  };

  const applyBooking = (data: any) => {
    // Accept any of the post-deposit payment states. Guests who
    // haven't paid yet can still see /book/details without being
    // bounced — we just skip the "payment required" gate instead of
    // crashing if the status isn't a known enum value.
    const paidStates = ['deposit_paid', 'paid', 'fully_paid'];
    const isPaid = paidStates.includes(data?.payment_status ?? '');
    if (!isPaid) {
      toast.error('Deposit not confirmed yet — please finish checkout.');
      navigate(`/book/checkout`);
      return;
    }

    setBookingData(data);

    // Pre-fill address from customer / booking
    setAddressLine1(
      data.address_line1 ||
        data.customers?.address_line1 ||
        data.customers?.address ||
        '',
    );
    setAddressLine2(
      data.address_line2 || data.customers?.address_line2 || '',
    );
    setCity(data.customers?.city || '');
    setState(data.customers?.state || 'NY');
    setZipCode(data.zip_code || data.customers?.postal_code || '');
    if (data.property_details?.dwelling_type) {
      setDwellingType(data.property_details.dwelling_type as DwellingType);
    }
    if (data.property_details?.bedrooms) {
      setBedrooms(String(data.property_details.bedrooms));
    }
    if (data.property_details?.bathrooms) {
      setBathrooms(String(data.property_details.bathrooms));
    }
    // Pre-fill date + arrival window from whatever the customer
    // picked on /book/offer (they'll persist across the checkout and
    // show up here so the customer can confirm or change them).
    const preSelectedDate = data.service_date || data.preferred_date || '';
    if (preSelectedDate) {
      // Supabase `date` type comes back as YYYY-MM-DD already.
      setPreferredDate(String(preSelectedDate).slice(0, 10));
    }
    const preSelectedTime = data.time_slot || data.preferred_time_block || '';
    if (preSelectedTime) {
      setPreferredTimeBlock(String(preSelectedTime));
    }
  };

  const customerName = useMemo(() => {
    if (!bookingData) return '';
    const c = bookingData.customers;
    if (c?.name) return c.name;
    return [c?.first_name, c?.last_name].filter(Boolean).join(' ');
  }, [bookingData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!addressLine1 || !city || !state || !zipCode || !preferredDate || !preferredTimeBlock) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setSubmitState({ kind: 'submitting' });

    const propertyDetails = {
      dwelling_type: dwellingType,
      bedrooms: bedrooms ? Number(bedrooms) : null,
      bathrooms: bathrooms ? Number(bathrooms) : null,
      pets: hasPets,
    };

    try {
      // 1. Persist the service address + schedule on the booking row.
      const { data, error } = await supabase.functions.invoke(
        'save-booking-details',
        {
          body: {
            bookingId,
            addressLine1,
            addressLine2: addressLine2 || null,
            city,
            state,
            zipCode,
            serviceDate: preferredDate,
            timeSlot: preferredTimeBlock,
            specialInstructions: notes || null,
            propertyDetails,
          },
        },
      );

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Failed to save details');
      }

      // 2. Push the job into Housecall Pro. If HCP is unavailable the
      //    customer still gets a confirmation — the ops team retries
      //    out-of-band via `retry-failed-hcp-syncs`.
      try {
        const schedule = timeBlockToIsoWindow(preferredDate, preferredTimeBlock);
        const resp = await fetch('/api/create-job', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer: {
              name: customerName,
              first_name: bookingData.customers?.first_name,
              last_name: bookingData.customers?.last_name,
              email: bookingData.customers?.email,
              phone: bookingData.customers?.phone,
            },
            address: {
              street: addressLine1,
              street_line_2: addressLine2 || null,
              city,
              state,
              zip: zipCode,
            },
            service: {
              type: bookingData.service_type || 'deep',
              description:
                bookingData.offer_name ||
                bookingData.service_type ||
                'Cleaning service',
              sqft: bookingData.home_size || bookingData.sqft_or_bedrooms || null,
              dwelling_type: dwellingType,
              bedrooms: propertyDetails.bedrooms,
              bathrooms: propertyDetails.bathrooms,
              notes: notes || null,
            },
            schedule: {
              start: schedule.start,
              end: schedule.end,
              arrival_window_minutes: 30,
            },
            line_items: [
              {
                name: bookingData.offer_name || 'Cleaning service',
                unit_price: Number(bookingData.est_price || 0),
                quantity: 1,
                kind: 'labor',
              },
              bookingData.promo_discount_cents && bookingData.promo_discount_cents > 0
                ? {
                    name: `Promo ${bookingData.promo_code || 'discount'}`,
                    unit_price: -(bookingData.promo_discount_cents / 100),
                    quantity: 1,
                    kind: 'discount' as const,
                  }
                : null,
            ].filter(Boolean) as any,
            notes: `Deposit paid: $${Number(bookingData.deposit_amount || 0).toFixed(
              2,
            )} · Balance due: $${Number(bookingData.balance_due || 0).toFixed(2)}`,
            booking_id: bookingData.id,
          }),
        });

        const payload = await resp.json().catch(() => ({}));

        if (resp.ok && payload?.success && payload?.job_id) {
          // Record the HCP job id on the booking row so support can
          // open it in the HCP dashboard.
          await supabase
            .from('bookings')
            .update({
              hcp_job_id: payload.job_id,
              hcp_customer_id: payload.customer_id || null,
            })
            .eq('id', bookingData.id);
          setSubmitState({ kind: 'success', jobId: payload.job_id });
        } else {
          console.warn('HCP job creation failed:', payload);
          // Still succeed the booking — ops can retry.
          setSubmitState({ kind: 'success' });
        }
      } catch (hcpErr) {
        console.error('HCP create-job threw:', hcpErr);
        setSubmitState({ kind: 'success' });
      }

      toast.success('Booking confirmed!');
      navigate(`/book/confirmation?booking_id=${bookingId}`);
    } catch (error: any) {
      console.error('Error updating booking:', error);
      const message = error?.message || 'Failed to update booking details';
      setSubmitState({ kind: 'error', message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <BookingProgressBar currentStep={5} totalSteps={6} />

      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Almost done — tell us about your home
          </h1>
          <p className="text-lg text-muted-foreground">
            Your deposit is secured. Finalize your address, home details, and
            scheduling window to confirm the booking.
          </p>
        </div>

        {submitState.kind === 'error' && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{submitState.message}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Address */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Service Address
            </h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="address1">Address Line 1 *</Label>
                <Input
                  id="address1"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="123 Main Street"
                  required
                />
              </div>

              <div>
                <Label htmlFor="address2">Apt / Suite / Unit</Label>
                <Input
                  id="address2"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Apt, Suite, Unit (optional)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    maxLength={2}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="zip">ZIP Code *</Label>
                <Input
                  id="zip"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  required
                />
              </div>
            </div>
          </Card>

          {/* Home details */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Home Details
            </h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="dwellingType">Dwelling type *</Label>
                <Select
                  value={dwellingType}
                  onValueChange={(v) => setDwellingType(v as DwellingType)}
                >
                  <SelectTrigger id="dwellingType">
                    <SelectValue placeholder="Select a dwelling type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DWELLING_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    min={0}
                    max={12}
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    placeholder="e.g. 3"
                  />
                </div>
                <div>
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    min={0}
                    max={12}
                    step="0.5"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    placeholder="e.g. 2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="pets">Any pets on site?</Label>
                <Select value={hasPets} onValueChange={setHasPets}>
                  <SelectTrigger id="pets">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No pets</SelectItem>
                    <SelectItem value="dog">Dog(s)</SelectItem>
                    <SelectItem value="cat">Cat(s)</SelectItem>
                    <SelectItem value="both">Both dogs and cats</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Scheduling */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Preferred Scheduling
            </h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="date">Preferred Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  min={computeEarliestBookableYmd()}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {DEFAULT_MIN_LEAD_DAYS === 0
                    ? 'Same-day booking available.'
                    : `${DEFAULT_MIN_LEAD_DAYS}-day minimum lead time.`}
                </p>
              </div>

              <div>
                <Label htmlFor="timeBlock">Preferred Time Block *</Label>
                <Select
                  value={preferredTimeBlock}
                  onValueChange={setPreferredTimeBlock}
                >
                  <SelectTrigger id="timeBlock">
                    <SelectValue placeholder="Select a time window" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((slot) => (
                      <SelectItem key={slot.id} value={slot.id}>
                        {slot.label} ({slot.window})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Our crew lands anywhere in the 2-hour window.
                </p>
              </div>
            </div>
          </Card>

          {/* Additional Notes */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Additional Notes
            </h2>

            <div>
              <Label htmlFor="notes">
                Anything we should know before arriving?
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Gate code, parking instructions, special requests, areas to prioritize..."
                rows={4}
                className="mt-2"
              />
            </div>
          </Card>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={loading || submitState.kind === 'submitting'}
          >
            {loading || submitState.kind === 'submitting' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Completing Booking…
              </>
            ) : (
              'Complete Booking'
            )}
          </Button>

          {isTestMode && (
            <p className="text-xs text-center text-muted-foreground">
              Test mode is on — no real HCP job is created, the API route is
              still called for smoke-testing.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
