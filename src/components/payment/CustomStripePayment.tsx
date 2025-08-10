import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Lock, 
  Shield, 
  CheckCircle,
  AlertTriangle,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const stripePromise = loadStripe('pk_test_51QPW5FDN8hM6Ej1bOaUNNafIjV0eTK3EgjXi7J1RA9z4LsOQ3HlHwLtD0JkFMf6wRQv2fA73qCgIQVjJJ3l4WZdF00DkHVLTVN');

interface PaymentData {
  amount: number;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  cleaningType?: string;
  frequency?: string;
  squareFootage?: number;
  addOns?: string[];
  bedrooms?: number;
  bathrooms?: number;
  serviceAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  paymentType?: string;
}

interface CustomStripePaymentProps {
  paymentData: PaymentData;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
  className?: string;
}

function PaymentForm({ 
  paymentData, 
  onSuccess, 
  onCancel, 
  clientSecret 
}: { 
  paymentData: PaymentData;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
  clientSecret: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setProgress(25);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/payment-success',
        receipt_email: paymentData.customerEmail,
      },
      redirect: 'if_required'
    });

    setProgress(75);

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || "Payment failed");
        toast({
          title: "Payment Failed",
          description: error.message || "Please check your payment details and try again.",
          variant: "destructive",
        });
      } else {
        setMessage("An unexpected error occurred.");
        toast({
          title: "Payment Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
      setProgress(0);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setProgress(100);
      toast({
        title: "Payment Successful!",
        description: "Your cleaning service has been booked successfully.",
      });
      setTimeout(() => {
        onSuccess(paymentIntent.id);
      }, 1000);
    } else {
      setMessage("Payment processing...");
    }

    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Security Indicators */}
      <div className="flex items-center justify-center gap-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2 text-green-700">
          <Lock className="h-4 w-4" />
          <span className="text-sm font-medium">256-bit SSL Encryption</span>
        </div>
        <div className="flex items-center gap-2 text-green-700">
          <Shield className="h-4 w-4" />
          <span className="text-sm font-medium">PCI Compliant</span>
        </div>
      </div>

      {/* Payment Progress */}
      {progress > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Processing Payment</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentElement 
              options={{
                layout: 'tabs',
                paymentMethodOrder: ['card', 'apple_pay', 'google_pay']
              }}
            />
          </CardContent>
        </Card>

        {/* Error Message */}
        {message && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {/* Payment Summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Service</span>
                <span>{paymentData.cleaningType} - {paymentData.frequency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Square Footage</span>
                <span>{paymentData.squareFootage} sq ft</span>
              </div>
              {paymentData.addOns && paymentData.addOns.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Add-ons</span>
                  <span>{paymentData.addOns.join(', ')}</span>
                </div>
              )}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${paymentData.amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
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
            disabled={isLoading || !stripe || !elements}
            className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                Pay ${paymentData.amount.toFixed(2)}
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function CustomStripePayment({
  paymentData,
  onSuccess,
  onCancel,
  className
}: CustomStripePaymentProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    createPaymentIntent();
  }, []);

  const createPaymentIntent = async () => {
    setIsCreatingIntent(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: paymentData
      });

      if (error) {
        throw error;
      }

      if (data?.client_secret) {
        setClientSecret(data.client_secret);
      } else {
        throw new Error('No client secret received');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize payment';
      setError(errorMessage);
      toast({
        title: "Payment Setup Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCreatingIntent(false);
    }
  };

  if (isCreatingIntent) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <h3 className="text-lg font-semibold mb-2">Setting up secure payment...</h3>
          <p className="text-sm text-muted-foreground text-center">
            Please wait while we prepare your payment form
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button onClick={createPaymentIntent} className="flex-1">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!clientSecret) {
    return null;
  }

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#16a34a',
      colorBackground: '#ffffff',
      colorText: '#1f2937',
      colorDanger: '#dc2626',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '6px',
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <div className={className}>
      <Elements options={options} stripe={stripePromise}>
        <PaymentForm
          paymentData={paymentData}
          onSuccess={onSuccess}
          onCancel={onCancel}
          clientSecret={clientSecret}
        />
      </Elements>
    </div>
  );
}