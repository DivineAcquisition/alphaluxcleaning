import { useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripePromise } from '@/lib/stripe';
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
          return_url: window.location.href,
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
      } else if (paymentIntent && paymentIntent.status === 'requires_action') {
        // Handle 3D Secure authentication
        toast.info('Additional verification required...');
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

      <div className="rounded-xl border border-alx-gold/25 bg-alx-cream p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-foreground font-medium">Deposit Amount</span>
          <span className="font-serif font-bold text-lg text-alx-gold">
            ${depositAmount.toFixed(2)}
          </span>
        </div>
        {offerType === '90_day_plan' && monthlyAmount && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Then ${monthlyAmount.toFixed(2)}/month for 3 months</span>
            <span>(auto-billed)</span>
          </div>
        )}
        <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t border-alx-gold/15">
          <span>Total Plan Value</span>
          <span>${totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="rounded-xl border border-alx-gold/20 p-4 bg-background">
        <PaymentElement
          options={{
            layout: 'tabs',
            paymentMethodOrder: ['card'],
          }}
        />
      </div>

      <div className="flex items-center justify-between gap-3 border border-alx-gold/20 bg-alx-black-ink text-alx-gold-pale px-3 py-2 rounded-lg">
        <div className="flex items-center gap-2 text-xs font-medium">
          <Lock className="h-4 w-4 text-alx-gold-light" />
          <span>Secure Payment via Stripe</span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.18em] text-alx-gold">
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
          disabled={!stripe || !elements || isProcessing}
          className="flex-[2] btn-alx-gold rounded-full font-semibold uppercase tracking-wider"
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
  const { clientSecret, ...formProps } = props;

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Preparing payment form...</span>
      </div>
    );
  }

  // Match the branded Stripe PaymentElement to the AlphaLux black+gold palette.
  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#A17938', // Brand gold
      colorBackground: '#ffffff',
      colorText: '#15120F', // Alpha black
      colorDanger: 'hsl(0, 84%, 60%)',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      borderRadius: '12px',
      fontSizeBase: '15px',
    },
    rules: {
      '.Input': {
        border: '1px solid #E5E7EB',
      },
      '.Input:focus': {
        borderColor: '#A17938',
        boxShadow: '0 0 0 2px rgba(161, 121, 56, 0.25)',
      },
      '.Label': {
        fontWeight: '500',
        color: '#15120F',
      },
      '.Tab': {
        borderColor: '#ECC98B',
      },
      '.Tab--selected': {
        borderColor: '#A17938',
        backgroundColor: '#FCFBF7',
      },
    },
  };

  return (
    <Elements
      stripe={getStripePromise()}
      options={{
        clientSecret,
        appearance,
      }}
    >
      <PaymentFormContent {...formProps} />
    </Elements>
  );
}
