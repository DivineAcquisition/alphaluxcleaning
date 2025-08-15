import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Shield, Sparkles, ArrowLeft, ArrowRight, Check, Tag, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';
import { EnhancedPaymentInterface } from '@/components/payment/EnhancedPaymentInterface';
import { PaymentMethodSelector } from '@/components/payment/PaymentMethodSelector';
import { calculatePaymentAmount, toStripeAmount, formatPrice } from '@/lib/pricing-utils';

interface BookingData {
  homeSize: string;
  serviceType: string;
  frequency: string;
  addOns: string[];
  serviceDate: string;
  serviceTime: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  contactNumber: string;
  specialInstructions: string;
  basePrice: number;
  addOnPrices: { [key: string]: number };
  frequencyDiscount: number;
  totalPrice: number;
  paymentType: 'pay_after_service' | '25_percent_with_discount';
  promoDiscount: number;
  nextDayFee?: number;
}

interface Props {
  bookingData: BookingData;
  updateBookingData: (updates: Partial<BookingData>) => void;
  onPaymentSuccess: (sessionId: string) => void;
  onBack: () => void;
}

export function BookingCheckoutPage({ bookingData, updateBookingData, onPaymentSuccess, onBack }: Props) {
  const [isRecurring, setIsRecurring] = useState(bookingData.frequency !== 'one-time');
  const [paymentType, setPaymentType] = useState<'pay_after_service' | '25_percent_with_discount'>('pay_after_service');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe_checkout' | 'embedded_payment'>('embedded_payment');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isUpdatingPaymentIntent, setIsUpdatingPaymentIntent] = useState(false);

  // Calculate final pricing
  const baseTotal = bookingData.basePrice + Object.values(bookingData.addOnPrices).reduce((sum, price) => sum + price, 0);
  const recurringDiscount = isRecurring ? bookingData.frequencyDiscount : 0;
  const totalDiscount = recurringDiscount + promoDiscount;
  const nextDayFee = bookingData.nextDayFee || 0;
  const finalTotal = baseTotal + nextDayFee - totalDiscount;
  let paymentAmount = 0;
  
  if (paymentType === '25_percent_with_discount') {
    // Apply 5% discount to total, then calculate 25% of discounted amount
    const discountedTotal = finalTotal * 0.95;
    paymentAmount = discountedTotal * 0.25;
  } else if (paymentType === 'pay_after_service') {
    paymentAmount = 0; // No charge now, authorize only
  }

  useEffect(() => {
    updateBookingData({ 
      paymentType,
      promoDiscount,
      totalPrice: finalTotal
    });
  }, [paymentType, promoDiscount, finalTotal]);

  // Monitor payment amount changes for embedded payments
  useEffect(() => {
    const updatePaymentIntent = async () => {
      // Only update if embedded payment is active and showing payment form
      if (paymentMethod === 'embedded_payment' && showPaymentForm && clientSecret) {
        setIsUpdatingPaymentIntent(true);
        try {
          // Clear current payment form and recreate with new amount
          setShowPaymentForm(false);
          setClientSecret(null);
          
          // Small delay to ensure UI updates
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Create new payment intent with updated amount
          await createPaymentIntent();
        } catch (error) {
          console.error('Failed to update payment intent:', error);
          toast.error('Failed to update payment amount');
        } finally {
          setIsUpdatingPaymentIntent(false);
        }
      }
    };

    updatePaymentIntent();
  }, [paymentAmount, paymentMethod, showPaymentForm]); // Only react to amount changes

  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }

    setIsValidatingPromo(true);
    try {
      const { data, error } = await supabase.rpc('validate_and_use_referral_code', {
        p_code: promoCode.trim(),
        p_user_email: 'temp@email.com', // Will be updated with real email in payment
        p_user_name: 'Guest User'
      });

      if (error) throw error;

      const result = data as any;
      if (result.success) {
        // Apply discount based on reward type
        let discount = 0;
        if (result.reward_type === 'deep_clean_50_percent') {
          discount = Math.round(baseTotal * 0.5);
        } else if (result.reward_type === 'standard_25_percent') {
          discount = Math.round(baseTotal * 0.25);
        }

        setPromoDiscount(discount);
         toast.success(`Promo code applied! You saved ${formatPrice(discount)}`);
       } else {
        toast.error(result.error || 'Invalid promo code');
      }
    } catch (error) {
      console.error('Promo validation error:', error);
      toast.error('Failed to validate promo code');
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const removePromoCode = () => {
    setPromoCode('');
    setPromoDiscount(0);
    toast.success('Promo code removed');
  };

  const processPayment = async () => {
    if (paymentMethod === 'embedded_payment') {
      await createPaymentIntent();
    } else {
      await processStripeCheckout();
    }
  };

  const createPaymentIntent = async () => {
    setIsProcessingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
          body: {
            amount: toStripeAmount(paymentAmount), // Convert to cents
            currency: 'usd',
            booking_data: bookingData,
            payment_type: paymentType,
            promo_code: promoCode || null,
            payment_method: 'payment_intent', // Signal to create Payment Intent
            fullAmount: toStripeAmount(finalTotal) // Store full amount for later charging
          }
      });

      if (error) throw error;

      if (data?.client_secret) {
        setClientSecret(data.client_secret);
        setShowPaymentForm(true);
      } else {
        throw new Error('No client secret received');
      }
    } catch (error) {
      console.error('Payment intent creation error:', error);
      toast.error('Failed to initialize payment. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const processStripeCheckout = async () => {
    setIsProcessingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
          body: {
            amount: toStripeAmount(paymentAmount), // Convert to cents
            currency: 'usd',
            booking_data: bookingData,
            payment_type: paymentType,
            promo_code: promoCode || null,
            payment_method: 'checkout', // Signal to create Checkout Session
            fullAmount: toStripeAmount(finalTotal) // Store full amount for later charging
          }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        setTimeout(() => {
          onPaymentSuccess(data.session_id || 'demo_session_' + Date.now());
        }, 3000);
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentSuccess = (paymentIntentId: string) => {
    onPaymentSuccess(paymentIntentId);
  };

  const handlePaymentCancel = () => {
    setShowPaymentForm(false);
    setClientSecret(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Left Column - Payment Form */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Recurring Service Toggle */}
        <Card className="shadow-clean">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Service Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex-1">
                <h4 className="font-semibold">Recurring Service</h4>
                <p className="text-sm text-muted-foreground">
                  Save money and keep your home consistently clean
                </p>
                {isRecurring && (
                   <Badge className="mt-2 bg-success text-success-foreground">
                     You're saving {formatPrice(recurringDiscount)} with {bookingData.frequency} cleanings!
                   </Badge>
                )}
              </div>
              <Switch
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
                disabled={bookingData.frequency === 'one-time'}
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment Type Selection */}
        <Card className="shadow-clean">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Choose Your Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setPaymentType('pay_after_service')}
                className={cn(
                  "p-4 rounded-lg border-2 text-left transition-all duration-200",
                  paymentType === 'pay_after_service'
                    ? "border-primary bg-primary/5 shadow-clean"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2",
                    paymentType === 'pay_after_service' ? "border-primary bg-primary" : "border-muted"
                  )}>
                    {paymentType === 'pay_after_service' && (
                      <div className="w-2 h-2 rounded-full bg-white m-0.5" />
                    )}
                  </div>
                  <span className="font-semibold">Pay After Service</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  We'll charge your card after completion
                </p>
                <p className="text-lg font-bold text-primary mt-2">
                  $0.00 now, {formatPrice(finalTotal)} after
                </p>
                <div className="mt-2 text-xs text-green-600">
                  🔒 Secure card authorization only
                </div>
              </button>

              <button
                onClick={() => setPaymentType('25_percent_with_discount')}
                className={cn(
                  "p-4 rounded-lg border-2 text-left transition-all duration-200 relative",
                  paymentType === '25_percent_with_discount'
                    ? "border-primary bg-primary/5 shadow-clean"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="absolute -top-2 -right-2">
                  <Badge className="bg-green-600 text-white text-xs px-2 py-1">
                    Save 5%
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2",
                    paymentType === '25_percent_with_discount' ? "border-primary bg-primary" : "border-muted"
                  )}>
                    {paymentType === '25_percent_with_discount' && (
                      <div className="w-2 h-2 rounded-full bg-white m-0.5" />
                    )}
                  </div>
                  <span className="font-semibold">Pay 25% + Get 5% Discount</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  25% now, 75% after service with 5% total discount
                </p>
                <p className="text-lg font-bold text-primary mt-2">
                  {formatPrice(finalTotal * 0.95 * 0.25)} now, {formatPrice(finalTotal * 0.95 * 0.75)} after
                </p>
                <div className="mt-2 text-xs text-green-600">
                  💰 Save {formatPrice(finalTotal * 0.05)} total
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Promo Code Section */}
        <Card className="shadow-clean">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Promo Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            {promoDiscount > 0 ? (
              <div className="flex items-center justify-between p-4 rounded-lg bg-success/10 border border-success/20">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-success" />
                  <div>
                    <p className="font-semibold text-success">Promo Code Applied!</p>
                    <p className="text-sm text-muted-foreground">Code: {promoCode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-success">-{formatPrice(promoDiscount)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removePromoCode}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={validatePromoCode}
                  disabled={isValidatingPromo || !promoCode.trim()}
                  variant="outline"
                >
                  {isValidatingPromo ? 'Validating...' : 'Apply'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Method Selection */}
        <PaymentMethodSelector
          selectedMethod={paymentMethod}
          onMethodChange={setPaymentMethod}
          amount={paymentAmount}
        />

        {/* Payment Intent Update Loading */}
        {isUpdatingPaymentIntent && (
          <Card className="shadow-clean">
            <CardContent className="flex items-center justify-center p-8">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground">Updating payment amount...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Payment Form */}
        {showPaymentForm && clientSecret && paymentMethod === 'embedded_payment' && !isUpdatingPaymentIntent && (
          <Elements 
            stripe={stripePromise} 
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: 'hsl(273 100% 50%)',
                  colorBackground: 'hsl(0 0% 100%)',
                  colorText: 'hsl(210 40% 8%)',
                  colorDanger: 'hsl(0 84.2% 60.2%)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  borderRadius: '8px',
                }
              }
            }}
          >
            <EnhancedPaymentInterface
              amount={paymentAmount}
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
              customerData={{
                email: 'guest@example.com',
                name: 'Guest User'
              }}
            />
          </Elements>
        )}

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>Secure payment powered by Stripe</span>
        </div>
      </div>

      {/* Right Column - Order Summary */}
      <div className="lg:col-span-1">
        <Card className="sticky top-32 shadow-clean border-primary/20">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Service Details */}
            <div className="space-y-2">
              <h4 className="font-semibold">Service Details</h4>
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Service:</span> {bookingData.serviceType.replace('_', ' ')} ({bookingData.homeSize})</p>
                <p><span className="text-muted-foreground">Date:</span> {new Date(bookingData.serviceDate).toLocaleDateString()}</p>
                <p><span className="text-muted-foreground">Time:</span> {bookingData.serviceTime}</p>
                <p><span className="text-muted-foreground">Address:</span> {bookingData.address.street}</p>
              </div>
            </div>

            <Separator />

            {/* Pricing Breakdown */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Base Service</span>
                <span>${formatPrice(bookingData.basePrice, { showCurrency: false })}</span>
              </div>
              
              {Object.keys(bookingData.addOnPrices).length > 0 && (
                <div className="space-y-1">
               {Object.entries(bookingData.addOnPrices).map(([addOn, price]) => (
                   <div key={addOn} className="flex justify-between text-sm">
                     <span className="text-muted-foreground">{addOn.replace(/-/g, ' ')}</span>
                     <span>+${formatPrice(price, { showCurrency: false })}</span>
                   </div>
                 ))}
               </div>
             )}
             
             {nextDayFee > 0 && (
               <div className="flex justify-between text-primary">
                 <span>Next Day Priority Fee</span>
                 <span>+${formatPrice(nextDayFee, { showCurrency: false })}</span>
               </div>
             )}
             
             {recurringDiscount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Recurring Discount</span>
                  <span>-${formatPrice(recurringDiscount, { showCurrency: false })}</span>
                </div>
              )}
              
              {promoDiscount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Promo Discount</span>
                  <span>-${formatPrice(promoDiscount, { showCurrency: false })}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">${formatPrice(finalTotal, { showCurrency: false })}</span>
              </div>
              
              {paymentType === '25_percent_with_discount' && (
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium">Paying Today: {formatPrice(paymentAmount)}</p>
                  <p className="text-xs text-muted-foreground">
                    Save {formatPrice(finalTotal * 0.05)} with 5% discount! Remaining {formatPrice(finalTotal * 0.95 - paymentAmount)} due after service
                  </p>
                </div>
              )}
              
              {paymentType === 'pay_after_service' && (
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium">Paying Today: $0.00 (Authorization Only)</p>
                  <p className="text-xs text-muted-foreground">
                    Full amount {formatPrice(finalTotal)} will be charged after service completion
                  </p>
                </div>
              )}
              
              {totalDiscount > 0 && (
                <div className="text-center text-success font-medium">
                  Total Savings: {formatPrice(totalDiscount)}
                </div>
              )}
            </div>

            {!showPaymentForm && (
              <Button 
                onClick={processPayment}
                disabled={isProcessingPayment}
                className="w-full"
                size="lg"
              >
                {isProcessingPayment ? (
                  'Processing...'
                ) : (
                  <>
                    {paymentMethod === 'embedded_payment' ? 'Continue to Payment' : `Complete Booking - ${formatPrice(paymentAmount)}`}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="lg:col-span-3 flex justify-start">
        <Button 
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
          size="lg"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Details
        </Button>
      </div>
    </div>
  );
}