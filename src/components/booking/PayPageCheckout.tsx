// Deposit form for /pay/<token>.
//
// Deliberately not the shared `InstantPaymentForm`: that one posts an
// amount from the browser to `create-payment-intent`, which is fine
// inside the funnel where the browser already owns the cart, but wrong
// here. On a link we emailed, the amount is a fact about the booking,
// not an input — so the client secret comes back from
// `booking-pay-page` with the amount already fixed server-side and this
// component only confirms it.

import { useEffect, useMemo, useState } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getStripePromise } from '@/lib/stripe';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertTriangle } from 'lucide-react';

const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

function CheckoutForm({
  amount,
  onSuccess,
}: {
  amount: number;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      // Keep the customer on the page unless the card demands 3DS.
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message || 'That card was declined. Please try another.');
      setSubmitting(false);
      return;
    }
    if (paymentIntent && ['succeeded', 'processing'].includes(paymentIntent.status)) {
      onSuccess();
      return;
    }
    setError('Payment did not complete. Please try again.');
    setSubmitting(false);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" className="w-full" size="lg" disabled={!stripe || submitting}>
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitting ? 'Processing…' : `Pay ${money(amount)}`}
      </Button>
    </form>
  );
}

export function PayPageCheckout({
  token,
  amount,
  onSuccess,
}: {
  token: string;
  amount: number;
  onSuccess: () => void;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke('booking-pay-page', {
          body: { action: 'intent', token },
        });
        if (cancelled) return;
        if (fnError || !data?.clientSecret) {
          setError(
            data?.error === 'already_paid'
              ? 'This deposit has already been paid.'
              : 'We could not start the payment. Please refresh and try again.',
          );
          return;
        }
        setClientSecret(data.clientSecret as string);
      } catch {
        if (!cancelled) setError('We could not reach the payment service.');
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const options = useMemo(
    () => (clientSecret ? { clientSecret, appearance: { theme: 'stripe' as const } } : null),
    [clientSecret],
  );

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!options) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Preparing secure payment…
      </div>
    );
  }

  return (
    <Elements stripe={getStripePromise()} options={options}>
      <CheckoutForm amount={amount} onSuccess={onSuccess} />
    </Elements>
  );
}
