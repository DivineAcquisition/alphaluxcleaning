import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Shield, Lock, Loader2, CreditCard } from 'lucide-react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/pricing-utils';

interface EmbeddedDepositPaymentFormProps {
  totalAmount: number;
  depositAmount: number;
  clientSecret: string;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
  bookingData: any;
}

interface PaymentFormProps {
  totalAmount: number;
  depositAmount: number;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}

function PaymentForm({ totalAmount, depositAmount, onSuccess, onCancel }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [isElementReady, setIsElementReady] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      console.error('Stripe not loaded');
      return;
    }

    setIsLoading(true);
    setPaymentError(null);

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking-confirmation`,
        },
        redirect: 'if_required',
      });

      if (result.error) {
        console.error('Payment confirmation error:', result.error);
        setPaymentError(result.error.message || 'Payment failed');
        toast.error(result.error.message || 'Payment failed. Please try again.');
      } else if (result.paymentIntent?.status === 'succeeded') {
        console.log('Payment succeeded:', result.paymentIntent);
        toast.success('Payment successful! Redirecting to confirmation...');
        onSuccess(result.paymentIntent?.id || 'payment_succeeded');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentError(error.message || 'An unexpected error occurred');
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Secure Payment - 20% Deposit
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Deposit Information */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h4 className="font-semibold text-lg">20% Deposit Required</h4>
              <p className="text-sm text-muted-foreground">
                Pay just 20% now to secure your booking. Remaining balance due after service completion.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4 p-3 rounded-md bg-background/50">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Service Cost</p>
              <p className="text-lg font-bold">${formatPrice(totalAmount)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Deposit Due Today</p>
              <p className="text-lg font-bold text-primary">${formatPrice(depositAmount)}</p>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t">
            <p className="text-sm text-muted-foreground">
              Remaining balance of <strong>${formatPrice(totalAmount - depositAmount)}</strong> will be charged after your cleaning is completed.
            </p>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h5 className="font-semibold">Payment Amount</h5>
              <p className="text-2xl font-bold text-primary">${formatPrice(depositAmount)}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Secured by Stripe</span>
            </div>
          </div>

          <PaymentElement 
            onReady={() => {
              console.log('PaymentElement is ready!');
              setIsElementReady(true);
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
          
          {!isElementReady && !paymentError && (
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
              disabled={isLoading}
              className="flex-1"
            >
              Back to Review
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !stripe || !elements || !isElementReady}
              className="flex-1"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Pay ${formatPrice(depositAmount)} Deposit
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function EmbeddedDepositPaymentForm({ 
  totalAmount, 
  depositAmount, 
  clientSecret, 
  onSuccess, 
  onCancel,
  bookingData 
}: EmbeddedDepositPaymentFormProps) {
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
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Preparing payment form...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm 
        totalAmount={totalAmount}
        depositAmount={depositAmount}
        onSuccess={(paymentIntentId: string) => onSuccess(paymentIntentId)}
        onCancel={onCancel}
      />
    </Elements>
  );
}