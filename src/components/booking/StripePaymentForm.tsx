import { useEffect, useRef, useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripePromise, getStripeForKey } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, CreditCard, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface StripePaymentFormProps {
  depositAmount: number;
  totalAmount: number;
  monthlyAmount?: number;
  offerType: string;
  onSuccess: (paymentIntentId: string, subscriptionId?: string) => void;
  onCancel: () => void;
  clientSecret: string;
  /**
   * Publishable key returned by create-payment-intent alongside the
   * client secret. When present, Elements is initialized against the
   * Stripe account that actually owns this PaymentIntent (NY or CA/TX).
   * Optional for backwards compatibility — falls back to the global
   * cached promise when omitted.
   */
  publishableKey?: string | null;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

function PaymentFormContent({
  depositAmount,
  totalAmount,
  monthlyAmount,
  offerType,
  onSuccess,
  onCancel,
  isProcessing,
  setIsProcessing,
}: Omit<StripePaymentFormProps, 'clientSecret'>) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [elementReady, setElementReady] = useState(false);
  const redirectHandledRef = useRef(false);

  // If Stripe bounced the customer back here after a 3-D Secure
  // redirect we'll have `?payment_intent=...&redirect_status=...` in
  // the URL. Pick that up, confirm with Stripe, and propagate success
  // back to the checkout container (which advances to /book/details).
  useEffect(() => {
    if (!stripe || redirectHandledRef.current) return;
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const piSecret =
      url.searchParams.get('payment_intent_client_secret') || undefined;
    if (!piSecret) return;
    redirectHandledRef.current = true;
    setIsProcessing(true);
    stripe
      .retrievePaymentIntent(piSecret)
      .then(({ paymentIntent, error: retrieveError }) => {
        if (retrieveError) {
          setError(retrieveError.message || 'Could not verify payment.');
          toast.error(retrieveError.message || 'Could not verify payment');
          setIsProcessing(false);
          return;
        }
        if (!paymentIntent) {
          setError('Payment status unavailable. Please try again.');
          setIsProcessing(false);
          return;
        }
        // Clean query params so a refresh won't retry confirmation.
        url.searchParams.delete('payment_intent');
        url.searchParams.delete('payment_intent_client_secret');
        url.searchParams.delete('redirect_status');
        window.history.replaceState({}, '', url.pathname + url.search);
        if (paymentIntent.status === 'succeeded') {
          toast.success('Payment successful!');
          onSuccess(paymentIntent.id);
          return;
        }
        if (paymentIntent.status === 'processing') {
          toast.info("We're still processing your payment — hang tight.");
          return;
        }
        setError('Payment was not completed. Please try again.');
        setIsProcessing(false);
      })
      .catch((err) => {
        console.error('retrievePaymentIntent error:', err);
        setError('Could not verify payment. Please try again.');
        setIsProcessing(false);
      });
  }, [stripe, onSuccess, setIsProcessing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Payment system not ready. Please wait...');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Strip any existing query params so Stripe can re-attach its own
          // (payment_intent, payment_intent_client_secret, redirect_status)
          // if the card requires 3-D Secure redirect.
          return_url: `${window.location.origin}${window.location.pathname}`,
        },
        redirect: 'if_required',
      });

      if (submitError) {
        setError(submitError.message || 'Payment failed. Please try again.');
        toast.error(submitError.message || 'Payment failed');
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast.success('Payment successful!');
        onSuccess(paymentIntent.id);
      } else if (paymentIntent && paymentIntent.status === 'processing') {
        toast.info("We're still processing your payment…");
      } else if (paymentIntent && paymentIntent.status === 'requires_action') {
        // Stripe already handled the client-side action path above when
        // `redirect: 'if_required'` is in play — hitting this means we
        // couldn't finish authentication inline. Let the customer try
        // again instead of leaving the button stuck on "Processing".
        setError('Additional verification was cancelled. Please try again.');
        setIsProcessing(false);
      } else {
        setError('Payment not completed. Please try again.');
        setIsProcessing(false);
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'An unexpected error occurred');
      toast.error('Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-foreground font-medium">Deposit Amount</span>
          <span className="font-bold text-lg text-primary">
            ${depositAmount.toFixed(2)}
          </span>
        </div>
        {offerType === '90_day_plan' && monthlyAmount && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Then ${monthlyAmount.toFixed(2)}/month for 3 months</span>
            <span>(auto-billed)</span>
          </div>
        )}
        <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t border-primary/15">
          <span>Total Plan Value</span>
          <span>${totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="rounded-xl border border-border p-4 bg-card">
        {!elementReady && (
          <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
            Loading secure card form…
          </div>
        )}
        <PaymentElement
          onReady={() => setElementReady(true)}
          options={{
            layout: 'tabs',
            paymentMethodOrder: ['card'],
          }}
        />
      </div>

      <div className="flex items-center justify-between gap-3 border border-primary/20 bg-primary/5 text-primary px-3 py-2 rounded-lg">
        <div className="flex items-center gap-2 text-xs font-medium">
          <Lock className="h-4 w-4" />
          <span>Secure Payment via Stripe</span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.18em] text-primary/70">
          256-bit TLS
        </span>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          type="submit"
          disabled={!stripe || !elements || !elementReady || isProcessing}
          className="flex-[2] rounded-lg font-semibold"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay ${depositAmount.toFixed(2)} Deposit
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export function StripePaymentForm(props: StripePaymentFormProps) {
  const { clientSecret, publishableKey, ...formProps } = props;

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Preparing payment form...</span>
      </div>
    );
  }

  // Match the branded Stripe PaymentElement to the AlphaLux Clean
  // palette: navy text, bright-blue focus, warm-gold accent borders.
  // Hex values are intentionally inlined because Stripe's Elements
  // appearance API does not read CSS variables.
  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#0F77CC',          // bright blue CTA + focus
      colorBackground: '#ffffff',
      colorText: '#1B314B',             // brand navy for body copy
      colorTextSecondary: '#5B6B80',
      colorDanger: 'hsl(0, 68%, 46%)',
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      borderRadius: '10px',
      fontSizeBase: '15px',
      spacingUnit: '4px',
    },
    rules: {
      '.Input': {
        border: '1px solid #DBE3EC',
        boxShadow: '0 1px 2px 0 rgba(27, 49, 75, 0.05)',
      },
      '.Input:focus': {
        borderColor: '#0F77CC',
        boxShadow: '0 0 0 3px rgba(15, 119, 204, 0.18)',
      },
      '.Label': {
        fontWeight: '500',
        color: '#1B314B',
      },
      '.Tab': {
        borderColor: '#ECC98B',
        backgroundColor: '#F8F8F7',
      },
      '.Tab:hover': {
        borderColor: '#A17938',
      },
      '.Tab--selected': {
        borderColor: '#A17938',
        backgroundColor: '#F8F3E8',
        color: '#1B314B',
      },
    },
  };

  return (
    <Elements
      stripe={publishableKey ? getStripeForKey(publishableKey) : getStripePromise()}
      options={{
        clientSecret,
        appearance,
      }}
    >
      <PaymentFormContent {...formProps} />
    </Elements>
  );
}
