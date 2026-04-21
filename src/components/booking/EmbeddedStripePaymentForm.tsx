import React, { useState, useEffect, useRef } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripePromise } from '@/lib/stripe';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, CreditCard, AlertCircle, CheckCircle, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

interface EmbeddedStripePaymentFormProps {
  paymentAmount: number;
  fullAmount: number;
  paymentType: "full" | "deposit" | "full_with_discount";
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  bookingId?: string;
  applyCredits?: boolean;
  creditsAmount?: number;
  prepaymentDiscount?: { applied: boolean; amount: number };
  deepCleanDiscount?: { applied: boolean; amount: number };
  onSuccess: (paymentId: string) => void;
  onCancel: () => void;
}

interface PaymentFormContentProps {
  paymentAmount: number;
  fullAmount: number;
  paymentType: "full" | "deposit" | "full_with_discount";
  applyCredits?: boolean;
  creditsAmount?: number;
  prepaymentDiscount?: { applied: boolean; amount: number };
  deepCleanDiscount?: { applied: boolean; amount: number };
  onSuccess: (paymentId: string) => void;
  onCancel: () => void;
}

function PaymentFormContent({
  paymentAmount,
  fullAmount,
  paymentType,
  applyCredits,
  creditsAmount,
  prepaymentDiscount,
  deepCleanDiscount,
  onSuccess,
  onCancel,
}: PaymentFormContentProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
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
      } else if (paymentIntent && paymentIntent.status === 'requires_action') {
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

  const displayAmount = paymentType === 'deposit' ? paymentAmount : 
    paymentType === 'full_with_discount' ? fullAmount * 0.95 : fullAmount;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Payment Summary */}
      <div className="bg-muted/50 p-4 rounded-lg space-y-2">
        <div className="flex justify-between text-sm">
          <span>Service Total</span>
          <span>${fullAmount.toFixed(2)}</span>
        </div>
        
        {deepCleanDiscount?.applied && deepCleanDiscount.amount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Deep Clean Discount</span>
            <span>-${deepCleanDiscount.amount.toFixed(2)}</span>
          </div>
        )}
        
        {prepaymentDiscount?.applied && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Pay-in-Full Discount (5%)</span>
            <span>-${prepaymentDiscount.amount.toFixed(2)}</span>
          </div>
        )}
        
        {applyCredits && creditsAmount && creditsAmount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Referral Credits Applied</span>
            <span>-${creditsAmount.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between pt-2 border-t font-semibold">
          <span>{paymentType === 'deposit' ? 'Deposit Amount' : 'Amount Due'}</span>
          <span className="text-primary text-lg">${displayAmount.toFixed(2)}</span>
        </div>
        
        {paymentType === 'deposit' && (
          <div className="text-xs text-muted-foreground">
            Remaining ${(fullAmount - paymentAmount).toFixed(2)} due after service
          </div>
        )}
      </div>

      {/* Stripe Payment Element */}
      <div className="border rounded-lg p-4">
        <PaymentElement
          options={{
            layout: 'tabs',
            paymentMethodOrder: ['card'],
          }}
        />
      </div>

      {/* Security Note */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="h-4 w-4" />
        <span>Your payment is secure and encrypted with Stripe</span>
      </div>

      {/* Action Buttons */}
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
              Pay ${displayAmount.toFixed(2)}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export function EmbeddedStripePaymentForm({
  paymentAmount,
  fullAmount,
  paymentType,
  customerEmail,
  customerName,
  customerPhone,
  bookingId,
  applyCredits,
  creditsAmount,
  prepaymentDiscount,
  deepCleanDiscount,
  onSuccess,
  onCancel,
}: EmbeddedStripePaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initRef = useRef(false);

  const createPaymentIntent = async () => {
    if (!customerEmail) {
      setError('Customer email is required');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Creating Stripe payment intent...');
      
      const actualAmount = paymentType === 'deposit' ? paymentAmount : 
        paymentType === 'full_with_discount' ? fullAmount * 0.95 : fullAmount;
      
      // Apply credits if applicable
      const finalAmount = applyCredits && creditsAmount 
        ? Math.max(0.50, actualAmount - creditsAmount) 
        : actualAmount;

      const { data, error: invokeError } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: finalAmount,
          customerEmail,
          customerName,
          customerPhone,
          bookingId,
          paymentType,
          fullAmount,
          metadata: {
            paymentType,
            creditsApplied: applyCredits ? creditsAmount : 0,
            prepaymentDiscount: prepaymentDiscount?.applied ? prepaymentDiscount.amount : 0,
            deepCleanDiscount: deepCleanDiscount?.applied ? deepCleanDiscount.amount : 0,
          }
        }
      });

      if (invokeError) {
        console.error('🔴 Payment intent creation failed:', invokeError);
        throw new Error(invokeError.message || 'Failed to create payment');
      }

      if (!data?.clientSecret) {
        throw new Error('No client secret received');
      }

      console.log('✅ Payment intent created successfully');
      setClientSecret(data.clientSecret);
    } catch (err: any) {
      console.error('🔴 Error creating payment intent:', err);
      setError(err.message || 'Failed to initialize payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!initRef.current && customerEmail) {
      initRef.current = true;
      createPaymentIntent();
    }
  }, [customerEmail]);

  const handleRetry = () => {
    initRef.current = false;
    createPaymentIntent();
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Preparing secure payment...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-12 bg-muted rounded animate-pulse" />
            <div className="h-12 bg-muted rounded animate-pulse" />
            <div className="h-10 bg-muted rounded animate-pulse w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Payment Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Back
            </Button>
            <Button onClick={handleRetry} className="flex-1">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!clientSecret) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p>Unable to initialize payment form.</p>
            <Button variant="link" onClick={handleRetry}>
              Click here to retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: 'hsl(220, 70%, 50%)',
      colorBackground: 'hsl(0, 0%, 100%)',
      colorText: 'hsl(222, 84%, 5%)',
      colorDanger: 'hsl(0, 84%, 60%)',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      borderRadius: '8px',
    },
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Secure Payment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Elements
          stripe={getStripePromise()}
          options={{
            clientSecret,
            appearance,
          }}
        >
          <PaymentFormContent
            paymentAmount={paymentAmount}
            fullAmount={fullAmount}
            paymentType={paymentType}
            applyCredits={applyCredits}
            creditsAmount={creditsAmount}
            prepaymentDiscount={prepaymentDiscount}
            deepCleanDiscount={deepCleanDiscount}
            onSuccess={onSuccess}
            onCancel={onCancel}
          />
        </Elements>
      </CardContent>
    </Card>
  );
}
