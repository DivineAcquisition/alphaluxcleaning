import React, { useState, useEffect, useCallback } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Lock, AlertCircle, CheckCircle, Loader2, RefreshCw, Shield, Smartphone, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/pricing-utils';

type PaymentStatus = 
  | 'idle' 
  | 'validating' 
  | 'processing' 
  | 'authenticating' 
  | 'finalizing' 
  | 'succeeded' 
  | 'failed';

type ErrorType = 
  | 'validation_error'
  | 'payment_method_error' 
  | 'authentication_error'
  | 'network_error'
  | 'server_error'
  | 'unknown_error';

interface StripePaymentFormProps {
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  customerData?: {
    email?: string;
    name?: string;
  };
}

export function StripePaymentForm({ 
  amount, 
  onSuccess, 
  onCancel, 
  isProcessing, 
  setIsProcessing,
  customerData 
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [retryCount, setRetryCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [cardBrand, setCardBrand] = useState<string | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isWebAuthnSupported, setIsWebAuthnSupported] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop'>('desktop');

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000;

  // Device detection and feature checking
  useEffect(() => {
    const checkDeviceFeatures = () => {
      // Check for mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setDeviceType(isMobile ? 'mobile' : 'desktop');

      // Check for WebAuthn support
      setIsWebAuthnSupported(!!window.PublicKeyCredential);
    };

    checkDeviceFeatures();
  }, []);

  // Progress tracking effect with enhanced mobile feedback
  useEffect(() => {
    if (paymentStatus === 'validating') {
      setProgress(25);
      setStatusMessage(deviceType === 'mobile' ? 'Checking payment...' : 'Validating payment information...');
    } else if (paymentStatus === 'processing') {
      setProgress(50);
      setStatusMessage(deviceType === 'mobile' ? 'Processing...' : 'Processing payment...');
    } else if (paymentStatus === 'authenticating') {
      setProgress(75);
      setStatusMessage(deviceType === 'mobile' ? 'Authenticating...' : 'Authenticating with your bank...');
    } else if (paymentStatus === 'finalizing') {
      setProgress(90);
      setStatusMessage(deviceType === 'mobile' ? 'Finalizing...' : 'Finalizing payment...');
    } else if (paymentStatus === 'succeeded') {
      setProgress(100);
      setStatusMessage('Payment successful!');
    }
  }, [paymentStatus, deviceType]);

  const categorizeError = (error: any): ErrorType => {
    if (!error) return 'unknown_error';
    
    const errorCode = error.code || '';
    const errorType = error.type || '';
    
    if (errorCode.includes('card_') || errorType === 'card_error') {
      return 'payment_method_error';
    }
    if (errorCode.includes('authentication_') || errorType === 'authentication_error') {
      return 'authentication_error';
    }
    if (errorType === 'validation_error') {
      return 'validation_error';
    }
    if (errorCode.includes('network') || error.message?.includes('network')) {
      return 'network_error';
    }
    if (errorType === 'api_error') {
      return 'server_error';
    }
    
    return 'unknown_error';
  };

  const getErrorMessage = (error: string, type: ErrorType): string => {
    const mobileMessages = {
      'payment_method_error': 'Card issue. Please check details and try again.',
      'authentication_error': 'Authentication failed. Verify with your bank.',
      'network_error': 'Connection issue. Check internet and retry.',
      'server_error': 'Service temporarily unavailable. Try again.',
      'validation_error': 'Please fill all required fields correctly.',
    };

    const desktopMessages = {
      'payment_method_error': 'There was an issue with your payment method. Please check your card details and try again.',
      'authentication_error': 'Payment authentication failed. Please verify with your bank and try again.',
      'network_error': 'Network connection issue. Please check your internet connection and try again.',
      'server_error': 'Payment processing temporarily unavailable. Please try again in a moment.',
      'validation_error': 'Please check that all required fields are filled correctly.',
    };

    const messages = deviceType === 'mobile' ? mobileMessages : desktopMessages;
    return messages[type as keyof typeof messages] || error || 'An unexpected error occurred. Please try again.';
  };

  const canRetry = (type: ErrorType): boolean => {
    return ['network_error', 'server_error', 'unknown_error'].includes(type);
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Enhanced form validation with real-time feedback
  const handleElementChange = useCallback((event: any) => {
    setIsFormValid(event.complete);
    
    // Detect card brand for better UX
    if (event.value?.card?.brand) {
      setCardBrand(event.value.card.brand);
    }

    // Clear errors when user starts typing
    if (event.complete && error) {
      setError(null);
      setErrorType(null);
    }
  }, [error]);

  const processPayment = async (): Promise<void> => {
    if (!stripe || !elements) {
      throw new Error('Stripe is not loaded');
    }

    setPaymentStatus('validating');
    setError(null);
    setErrorType(null);

    // Submit payment form
    const { error: submitError } = await elements.submit();
    if (submitError) {
      const type = categorizeError(submitError);
      setErrorType(type);
      throw new Error(submitError.message || 'Payment submission failed');
    }

    setPaymentStatus('processing');

    // Confirm payment
    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/booking-confirmation',
      },
      redirect: 'if_required',
    });

    if (confirmError) {
      const type = categorizeError(confirmError);
      setErrorType(type);
      throw new Error(confirmError.message || 'Payment confirmation failed');
    }

    if (!paymentIntent) {
      throw new Error('Payment intent not found');
    }

    // Handle different payment statuses
    switch (paymentIntent.status) {
      case 'succeeded':
        setPaymentStatus('succeeded');
        toast.success('Payment successful!');
        onSuccess(paymentIntent.id);
        break;
      case 'requires_action':
        setPaymentStatus('authenticating');
        // 3D Secure or other authentication required
        // Stripe handles this automatically with confirmPayment
        break;
      case 'processing':
        setPaymentStatus('finalizing');
        // Payment is being processed
        break;
      case 'requires_payment_method':
        throw new Error('Payment method was declined. Please try a different payment method.');
      default:
        throw new Error(`Payment status: ${paymentIntent.status}`);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe is not loaded');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      await processPayment();
    } catch (err: any) {
      console.error('Payment error:', err);
      const type = errorType || categorizeError(err);
      const message = getErrorMessage(err.message, type);
      
      setError(message);
      setErrorType(type);
      setPaymentStatus('failed');

      // Show appropriate toast based on error type
      if (type === 'payment_method_error') {
        toast.error('Card declined', { description: message });
      } else if (type === 'authentication_error') {
        toast.error('Authentication failed', { description: message });
      } else {
        toast.error('Payment failed', { description: message });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = async () => {
    if (retryCount >= MAX_RETRIES) {
      toast.error('Maximum retry attempts reached. Please try again later.');
      return;
    }

    setRetryCount(prev => prev + 1);
    setError(null);
    setErrorType(null);
    setPaymentStatus('idle');
    setProgress(0);

    // Add delay before retry
    await delay(RETRY_DELAY * retryCount);
    
    const form = document.querySelector('form');
    if (form) {
      form.requestSubmit();
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'validating':
      case 'processing':
      case 'authenticating':
      case 'finalizing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'succeeded':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  return (
    <Card className="shadow-clean">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Payment Information
        </CardTitle>
        {paymentStatus !== 'idle' && paymentStatus !== 'failed' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{statusMessage}</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Security badges */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  PCI DSS Compliant
                </Badge>
                {isWebAuthnSupported && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Smartphone className="h-3 w-3" />
                    Biometric Ready
                  </Badge>
                )}
              </div>
              {cardBrand && (
                <Badge variant="outline" className="capitalize">
                  {cardBrand}
                </Badge>
              )}
            </div>

            <PaymentElement 
              onChange={handleElementChange}
              options={{
                layout: deviceType === 'mobile' ? 'accordion' : 'tabs',
                paymentMethodOrder: deviceType === 'mobile' 
                  ? ['apple_pay', 'google_pay', 'card']
                  : ['card', 'apple_pay', 'google_pay'],
                fields: {
                  billingDetails: {
                    email: customerData?.email ? 'never' : 'auto',
                    name: customerData?.name ? 'never' : 'auto',
                  }
                },
                terms: {
                  card: 'auto',
                },
                wallets: {
                  applePay: 'auto',
                  googlePay: 'auto',
                }
              }}
              className={cn(
                "transition-all duration-200",
                deviceType === 'mobile' && "text-base", // Prevent zoom on mobile
                !isFormValid && error && "opacity-75"
              )}
            />

            {/* Real-time validation feedback */}
            {!isFormValid && paymentStatus === 'idle' && (
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-muted animate-pulse" />
                Please complete the payment form
              </div>
            )}
          </div>
          
          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-destructive text-sm font-medium">
                    {errorType === 'payment_method_error' ? 'Payment Method Error' :
                     errorType === 'authentication_error' ? 'Authentication Error' :
                     errorType === 'network_error' ? 'Connection Error' :
                     errorType === 'server_error' ? 'Service Error' :
                     'Payment Error'}
                  </p>
                  <p className="text-destructive text-sm mt-1">{error}</p>
                  {errorType && canRetry(errorType) && retryCount < MAX_RETRIES && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRetry}
                      className="mt-2 h-8"
                      disabled={isProcessing}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry ({retryCount + 1}/{MAX_RETRIES})
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!stripe || isProcessing || paymentStatus === 'succeeded'}
              className="flex-1"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {statusMessage || 'Processing...'}
                </div>
              ) : paymentStatus === 'succeeded' ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Payment Complete
                </div>
              ) : (
                <>
                  Pay {formatPrice(amount)}
                  <Lock className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Enhanced security information */}
        <div className="space-y-3 mt-6 pt-4 border-t">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>Secured by Stripe • SSL Encrypted</span>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              <span>PCI Compliant</span>
            </div>
            <div className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              <span>256-bit SSL</span>
            </div>
            <div className="flex items-center gap-1">
              <CreditCard className="h-3 w-3" />
              <span>Bank Grade</span>
            </div>
          </div>

          {deviceType === 'mobile' && (
            <div className="text-xs text-center text-muted-foreground">
              Optimized for mobile • Touch ID / Face ID supported
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}