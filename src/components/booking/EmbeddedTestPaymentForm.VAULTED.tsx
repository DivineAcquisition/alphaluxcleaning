import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CreditCard, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

interface TestPaymentFormProps {
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  pricingData: any;
  calculatedPrice: number;
  onSuccess: () => void;
  onCancel: () => void;
}

interface PaymentFormProps {
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function PaymentForm({ clientSecret, onSuccess, onCancel }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking/success`,
        },
        redirect: 'if_required'
      });

      if (error) {
        toast.error(error.message || 'Payment setup failed');
      } else {
        toast.success('Payment method saved successfully!');
        onSuccess();
      }
    } catch (error) {
      console.error('Payment setup error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Shield className="h-8 w-8 text-green-600 mx-auto" />
        <h3 className="text-lg font-semibold">Test Payment Setup</h3>
        <p className="text-sm text-muted-foreground">
          This will securely store your payment method without charging anything
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-4 border rounded-lg bg-muted/5">
          <PaymentElement
            onReady={() => setIsReady(true)}
            options={{
              layout: 'tabs',
            }}
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">Test Mode Information</p>
              <p className="text-blue-700 mt-1">
                This is a test transaction. No charges will be made to your card.
                Your payment method will be securely stored for future use.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Back to Options
          </Button>
          <Button
            type="submit"
            disabled={!stripe || !isReady || isProcessing}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Save Payment Method
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function EmbeddedTestPaymentForm({
  customerInfo,
  pricingData,
  calculatedPrice,
  onSuccess,
  onCancel
}: TestPaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const createSetupIntent = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: 0, // $0 for setup intent
          customerEmail: customerInfo.email,
          customerName: customerInfo.name,
          customerPhone: customerInfo.phone,
          paymentType: 'pay_after_service',
          cleaningType: pricingData.cleaningType,
          frequency: pricingData.frequency,
          serviceAddress: '', // Will be collected later
          city: '',
          state: '',
          zipCode: ''
        }
      });

      if (error) throw error;

      if (data.client_secret) {
        setClientSecret(data.client_secret);
      } else {
        throw new Error('No client secret received');
      }
    } catch (error: any) {
      console.error('Setup intent creation error:', error);
      setError(error.message || 'Failed to initialize payment setup');
      toast.error('Failed to initialize payment setup');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (customerInfo.email && customerInfo.name) {
      createSetupIntent();
    }
  }, [customerInfo.email, customerInfo.name]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Initializing payment setup...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={onCancel}>
                Back to Options
              </Button>
              <Button onClick={createSetupIntent}>
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!clientSecret) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Setting up payment form...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Test Payment Setup
        </CardTitle>
        <CardDescription>
          Securely save your payment method for testing purposes
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: 'hsl(var(--primary))',
                colorBackground: 'hsl(var(--background))',
                colorText: 'hsl(var(--foreground))',
                colorDanger: 'hsl(var(--destructive))',
                fontFamily: 'system-ui, sans-serif',
                spacingUnit: '4px',
                borderRadius: '6px',
              },
            },
          }}
        >
          <PaymentForm
            clientSecret={clientSecret}
            onSuccess={onSuccess}
            onCancel={onCancel}
          />
        </Elements>
      </CardContent>
    </Card>
  );
}