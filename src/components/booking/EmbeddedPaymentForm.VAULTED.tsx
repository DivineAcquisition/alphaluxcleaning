import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Shield, Lock, Loader2, CreditCard } from 'lucide-react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/pricing-utils';
import { PaymentFormSkeleton } from '@/components/ui/loading-skeleton';
import { scrollToPaymentForm } from '@/lib/scroll-utils';

export interface EmbeddedPaymentFormProps {
  clientSecret: string;
  paymentAmount: number;
  fullAmount: number;
  paymentType: 'full_payment' | 'deposit_20';
  onSuccess: () => void;
  onCancel: () => void;
}

interface PaymentFormProps {
  paymentAmount: number;
  fullAmount: number;
  paymentType: 'full_payment' | 'deposit_20';
  onSuccess: () => void;
  onCancel: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ paymentAmount, fullAmount, paymentType, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [isPaymentElementReady, setIsPaymentElementReady] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to payment form when component mounts
  useEffect(() => {
    scrollToPaymentForm(200);
  }, []);

  // Auto-scroll when PaymentElement becomes ready
  useEffect(() => {
    if (isPaymentElementReady && formRef.current) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 300);
    }
  }, [isPaymentElementReady]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      console.error('Stripe not loaded');
      return;
    }

    setLoading(true);
    setPaymentError(null);

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required',
      });

      if (result.error) {
        console.error('Payment confirmation error:', result.error);
        setPaymentError(result.error.message || 'Payment failed');
        toast.error(result.error.message || 'Payment failed. Please try again.');
      } else if (result.paymentIntent?.status === 'succeeded') {
        console.log('Payment succeeded:', result.paymentIntent);
        toast.success('Payment successful! Creating your booking...');
        onSuccess();
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentError(error.message || 'An unexpected error occurred');
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full" ref={formRef} role="main">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          {paymentType === 'full_payment' ? 'Secure Payment - Full Amount' : 'Secure Payment - 20% Deposit'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Information */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h4 className="font-semibold text-lg">
                {paymentType === 'full_payment' ? 'Full Payment' : 'Deposit Payment'}
              </h4>
              <p className="text-sm text-muted-foreground">
                {paymentType === 'full_payment' 
                  ? 'You\'re paying the full amount now.'
                  : 'You\'re paying a 20% deposit now. The remaining balance will be collected after your service is completed.'
                }
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-t">
              <span className="font-medium">
                {paymentType === 'full_payment' ? 'Total Amount:' : 'Deposit Amount:'}
              </span>
              <span className="font-bold text-lg">${paymentAmount.toFixed(2)}</span>
            </div>
            {paymentType === 'deposit_20' && (
              <>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Full Service Amount:</span>
                  <span>${fullAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Remaining Balance:</span>
                  <span>${(fullAmount - paymentAmount).toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h5 className="font-semibold">Payment Amount</h5>
              <p className="text-2xl font-bold text-primary">${paymentAmount.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Secured by Stripe</span>
            </div>
          </div>

          <PaymentElement 
            onReady={() => {
              console.log('PaymentElement is ready!');
              setIsPaymentElementReady(true);
              setPaymentError(null);
            }}
            onLoadError={(errorEvent) => {
              console.error('PaymentElement load error:', errorEvent);
              const errorMessage = errorEvent.error?.message || 'Payment form failed to load';
              setPaymentError(errorMessage);
              toast.error('Unable to load payment form. Please refresh and try again.');
            }}
            options={{
              layout: 'tabs'
            }}
          />
          
          {paymentError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Payment Error:</span>
              </div>
              <p className="text-sm text-red-600 mt-1">{paymentError}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>
          )}
          
          {!isPaymentElementReady && !paymentError && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading secure payment form...</span>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              Back to Review
            </Button>
            <Button
              type="submit"
              disabled={loading || !stripe || !elements || !isPaymentElementReady}
              className="w-full"
            >
              {loading ? "Processing..." : paymentType === 'full_payment' ? "Pay Full Amount" : "Pay Deposit"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export const EmbeddedPaymentForm: React.FC<EmbeddedPaymentFormProps> = ({
  clientSecret,
  paymentAmount,
  fullAmount,
  paymentType,
  onSuccess,
  onCancel
}) => {
  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: 'hsl(var(--primary))',
      colorBackground: 'hsl(var(--background))',
      colorText: 'hsl(var(--foreground))',
      colorDanger: 'hsl(var(--destructive))',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  if (!clientSecret) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-5 w-5 bg-muted rounded animate-pulse" />
            Preparing payment form...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentFormSkeleton />
        </CardContent>
      </Card>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm
        paymentAmount={paymentAmount}
        fullAmount={fullAmount}
        paymentType={paymentType}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
};