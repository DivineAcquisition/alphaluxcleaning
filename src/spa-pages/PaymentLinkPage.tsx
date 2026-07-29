// /pay/<token> — the customer-facing deposit page.
//
// Addressed by pay token, never by booking id. The previous version read
// `bookings` straight from the browser with the anon key using the raw
// UUID from the URL, so anyone holding an id could pull up a customer's
// name, service address and price. Booking ids travel through webhooks,
// logs and admin URLs; they are identifiers, not credentials.
//
// Everything now goes through the `booking-pay-page` edge function,
// which is the only thing that can exchange a token for booking details
// and the only place the deposit amount is decided — so the amount
// cannot be tampered with from the browser.
//
// Paying here saves the card, which is what lets the balance be
// authorized before the clean and captured after it.

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { PayPageCheckout } from '@/components/booking/PayPageCheckout';
import { BrandedLoader } from '@/components/BrandedLoader';
import { CheckCircle, ShieldCheck, CalendarDays, MapPin, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface PaySummary {
  bookingId: string;
  reference: string;
  customerName: string | null;
  serviceLabel: string;
  serviceDate: string | null;
  timeWindow: string | null;
  address: string | null;
  total: number;
  depositDue: number;
  balanceDue: number;
  paid: boolean;
}

const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

function fmtDate(iso: string | null): string {
  if (!iso) return 'To be scheduled';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );
}

export default function PaymentLinkPage() {
  // The route param is a pay token, not a booking id.
  const { bookingId: token } = useParams<{ bookingId: string }>();
  const [summary, setSummary] = useState<PaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'not_found' | 'cancelled' | 'server' | null>(null);
  const [paid, setPaid] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      setError('not_found');
      setLoading(false);
      return;
    }
    try {
      const { data, error: fnError } = await supabase.functions.invoke('booking-pay-page', {
        body: { action: 'get', token },
      });
      if (fnError || !data?.success) {
        setError(data?.error === 'cancelled' ? 'cancelled' : 'not_found');
        return;
      }
      setSummary(data.booking as PaySummary);
      setPaid(Boolean(data.booking?.paid));
    } catch {
      setError('server');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  // The webhook is the source of truth for marking the booking paid —
  // the browser only refreshes what it is allowed to see. The previous
  // version wrote status/payment_status straight from the client, which
  // both trusted the browser and skipped the confirmation pipeline.
  const handlePaymentSuccess = async () => {
    setPaid(true);
    toast.success('Payment received. A confirmation email is on its way.');
    void load();
  };

  if (loading) return <BrandedLoader caption="Loading your booking…" />;

  if (error) {
    const copy = {
      not_found: {
        title: 'This link is no longer valid',
        body: 'It may have expired or already been used. Please ask us for a fresh payment link.',
      },
      cancelled: {
        title: 'This booking was cancelled',
        body: 'No payment is due. Get in touch if you think this is a mistake.',
      },
      server: {
        title: 'Something went wrong',
        body: 'We could not load this booking. Please try again in a moment.',
      },
    }[error];
    return (
      <Shell>
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <AlertTriangle className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>{copy.title}</CardTitle>
            <CardDescription>{copy.body}</CardDescription>
          </CardHeader>
        </Card>
      </Shell>
    );
  }

  if (!summary) return null;

  if (paid) {
    return (
      <Shell>
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/15">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <CardTitle>You're all set</CardTitle>
            <CardDescription>
              Deposit received for {summary.reference}. We've emailed your confirmation.
              {summary.balanceDue > 0 && (
                <>
                  {' '}The remaining {money(summary.balanceDue)} is charged after your clean is
                  complete — nothing else to do now.
                </>
              )}
            </CardDescription>
          </CardHeader>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Complete your booking</CardTitle>
          <CardDescription>
            {summary.customerName ? `${summary.customerName} · ` : ''}
            {summary.reference}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span>
                <span className="font-medium">{summary.serviceLabel}</span>
                <br />
                {fmtDate(summary.serviceDate)}
                {summary.timeWindow ? ` · ${summary.timeWindow}` : ''}
              </span>
            </div>
            {summary.address && (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{summary.address}</span>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Total for this clean</span>
              <span>{money(summary.total)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <span>Due today</span>
              <span>{money(summary.depositDue)}</span>
            </div>
            {summary.balanceDue > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>After your clean</span>
                <span>{money(summary.balanceDue)}</span>
              </div>
            )}
          </div>

          {summary.balanceDue > 0 && (
            <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
              We save your card to place a hold for the remaining{' '}
              {money(summary.balanceDue)} shortly before your appointment. You are only
              charged for it once the clean is finished.
            </p>
          )}

          <PayPageCheckout
            token={token as string}
            amount={summary.depositDue}
            onSuccess={handlePaymentSuccess}
          />

          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure payment powered by Stripe
          </p>
        </CardContent>
      </Card>
    </Shell>
  );
}
