import React, { useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface EmbeddedDepositPaymentFormProps {
  clientSecret: string;
  amount: number;
  bookingData: any;
  onSuccess: () => void;
  onCancel: () => void;
}

function PaymentForm({ clientSecret, amount, bookingData, onSuccess, onCancel }: EmbeddedDepositPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isElementReady, setIsElementReady] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setPaymentError(null);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking-confirmation`,
        },
        redirect: 'if_required',
      });

      if (error) {
        console.error('Payment failed:', error);
        setPaymentError(error.message || 'Payment failed');
        toast({
          title: "Payment Failed",
          description: error.message || "There was an error processing your payment.",
          variant: "destructive",
        });
      } else {
        console.log('Payment succeeded');
        toast({
          title: "Payment Successful",
          description: "Your 20% deposit has been processed successfully!",
        });
        onSuccess();
      }
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setPaymentError(errorMessage);
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Complete Your Payment</CardTitle>
        <div className="text-center space-y-1">
          <p className="text-sm text-muted-foreground">
            20% Deposit: <span className="font-semibold">${(amount / 100).toFixed(2)}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Total Service: ${((amount / 0.2) / 100).toFixed(2)}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {paymentError && (
          <Alert variant="destructive">
            <AlertDescription>{paymentError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
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
              }}
              options={{
                layout: 'tabs'
              }}
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !stripe || !elements || !isElementReady}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay $${(amount / 100).toFixed(2)}`
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function EmbeddedDepositPaymentForm(props: EmbeddedDepositPaymentFormProps) {
  if (!props.clientSecret) {
    return (
      <Alert>
        <AlertDescription>
          Payment initialization failed. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Elements 
      stripe={stripePromise} 
      options={{
        clientSecret: props.clientSecret,
        appearance: {
          theme: 'stripe',
        },
      }}
    >
      <PaymentForm {...props} />
    </Elements>
  );
}