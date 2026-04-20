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

      <div className="bg-muted/50 p-4 rounded-lg space-y-2">
        <div className="flex justify-between text-sm">
          <span>Deposit Amount</span>
          <span className="font-bold text-primary">${depositAmount.toFixed(2)}</span>
        </div>
        {offerType === '90_day_plan' && monthlyAmount && (
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Then ${monthlyAmount.toFixed(2)}/month for 3 months</span>
            <span className="text-xs">(auto-billed)</span>
          </div>
        )}
        <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>Total Plan Value</span>
          <span>${totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <PaymentElement
          options={{
            layout: 'tabs',
            paymentMethodOrder: ['card'],
          }}
        />
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="h-4 w-4" />
        <span>Your payment is secure and encrypted with Stripe</span>
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
          className="flex-[2]"
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

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: 'hsl(220, 70%, 50%)',
      colorBackground: 'hsl(0, 0%, 100%)',
      colorText: 'hsl(222, 84%, 5%)',
      colorDanger: 'hsl(0, 84%, 60%)',
      fontFamily: 'Plus Jakarta Sans, system-ui, -apple-system, sans-serif',
      borderRadius: '8px',
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
