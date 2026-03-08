import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookingProgressBar } from '@/components/booking/BookingProgressBar';
import { StripePaymentForm } from '@/components/booking/StripePaymentForm';
import { useTestMode } from '@/hooks/useTestMode';
import { useBookingProgress } from '@/hooks/useBookingProgress';
import { TestTube } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useBooking } from '@/contexts/BookingContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Shield, CreditCard, Lock, Tag, CheckCircle2, Clock, Star, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GoogleGuaranteedBadge } from '@/components/trust/GoogleGuaranteedBadge';

export default function BookingCheckout() {
  const navigate = useNavigate();
  const { bookingData, depositAmount } = useBooking();
  const { isTestMode } = useTestMode();
  const { trackStep, markCompleted } = useBookingProgress();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasTrackedCheckout, setHasTrackedCheckout] = useState(false);

  useEffect(() => {
    if (!bookingData.zipCode || !bookingData.basePrice) {
      navigate('/book/zip');
    }
  }, [bookingData, navigate]);

  // Track checkout step when entering this page
  useEffect(() => {
    if (bookingData.contactInfo?.email && !hasTrackedCheckout) {
      trackStep('checkout_started');
      setHasTrackedCheckout(true);
    }
  }, [bookingData.contactInfo?.email, hasTrackedCheckout, trackStep]);

  // Calculate final amounts
  const finalPrice = (bookingData.basePrice || 0) - (bookingData.promoDiscount || 0);
  const depositPercentage = bookingData.offerType === '90_day_plan' ? 0.0625 : 0.25;
  const finalDepositAmount = Math.round(finalPrice * depositPercentage);
  const balanceDue = finalPrice - finalDepositAmount;
  const monthlyPayment = Math.round(finalPrice * 0.25);
  const totalMonthlyPayments = monthlyPayment * 3;
  const firstCleanBalance = finalPrice - finalDepositAmount - totalMonthlyPayments;
  
  const individualServicePrice = bookingData.basePrice ? (bookingData.basePrice / 4) * 1.2 : 0;
  const totalIndividualCost = individualServicePrice * 4;
  const savings = Math.round(totalIndividualCost - finalPrice);

  const initializePayment = useCallback(async () => {
    if (isInitializing || clientSecret) return;
    setIsInitializing(true);

    try {
      // For test mode, create customer/booking directly via edge function but skip Stripe
      const customerData = {
        email: bookingData.contactInfo.email,
        firstName: bookingData.contactInfo.firstName,
        lastName: bookingData.contactInfo.lastName,
        phone: bookingData.contactInfo.phone,
        address1: bookingData.contactInfo.address1,
        address2: bookingData.contactInfo.address2,
        city: bookingData.contactInfo.city || bookingData.city,
        state: bookingData.contactInfo.state || bookingData.state,
        zip: bookingData.contactInfo.zip || bookingData.zipCode,
      };

      const bookingPayload = {
        serviceType: bookingData.serviceType,
        frequency: bookingData.frequency,
        sqftOrBedrooms: `${bookingData.bedrooms}bed/${bookingData.bathrooms}bath`,
        homeSize: bookingData.homeSizeId,
        zipCode: bookingData.zipCode,
        estPrice: finalPrice,
        depositAmount: finalDepositAmount,
        basePrice: finalPrice,
        balanceDue: balanceDue,
        offerName: bookingData.offerName,
        offerType: bookingData.offerType,
        visitCount: bookingData.visitCount,
        isRecurring: bookingData.offerType === '90_day_plan',
        promoCode: bookingData.promoCode || null,
        promoDiscountCents: bookingData.promoDiscount ? Math.round(bookingData.promoDiscount * 100) : 0,
        // Additional fields for complete booking data
        serviceDate: bookingData.date || null,
        timeSlot: bookingData.timeSlot || null,
        specialInstructions: bookingData.specialInstructions || null,
        addressLine1: bookingData.contactInfo.address1 || null,
        addressLine2: bookingData.contactInfo.address2 || null,
        fullName: `${bookingData.contactInfo.firstName} ${bookingData.contactInfo.lastName}`.trim(),
        source: 'customer_web',
        pricingBreakdown: {
          basePrice: bookingData.basePrice || 0,
          promoCode: bookingData.promoCode,
          promoDiscount: bookingData.promoDiscount || 0,
          finalPrice,
          depositAmount: finalDepositAmount,
          balanceDue,
          monthlyAmount: monthlyPayment,
        },
      };

      // For test mode, skip Stripe but still need booking
      if (isTestMode) {
        console.log('🧪 TEST MODE: Creating booking via edge function');
        const { data, error } = await supabase.functions.invoke('create-payment-intent', {
          body: {
            amount: finalDepositAmount,
            customerEmail: customerData.email,
            customerName: `${customerData.firstName} ${customerData.lastName}`,
            customerPhone: customerData.phone,
            customerData,
            bookingData: bookingPayload,
            paymentType: 'deposit',
          },
        });

        if (error) throw new Error(error.message);
        setCustomerId(data.customerId);
        setBookingId(data.bookingId);
        console.log('🧪 TEST MODE: Booking created, skipping Stripe');
        return;
      }

      // Create payment intent based on offer type
      if (bookingData.offerType === '90_day_plan') {
        // First create customer/booking, then use 90-day subscription function
        const { data: initData, error: initError } = await supabase.functions.invoke('create-payment-intent', {
          body: {
            amount: finalDepositAmount,
            customerEmail: customerData.email,
            customerName: `${customerData.firstName} ${customerData.lastName}`,
            customerPhone: customerData.phone,
            customerData,
            bookingData: bookingPayload,
            paymentType: 'deposit',
          },
        });

        if (initError) throw new Error(initError.message);
        setCustomerId(initData.customerId);
        setBookingId(initData.bookingId);

        // Now use the 90-day subscription function
        const { data, error } = await supabase.functions.invoke('create-90day-subscription', {
          body: {
            bookingId: initData.bookingId,
            customerId: initData.customerId,
            customerEmail: customerData.email,
            customerName: `${customerData.firstName} ${customerData.lastName}`,
            customerPhone: customerData.phone,
            depositAmount: finalDepositAmount,
            monthlyAmount: monthlyPayment,
            totalAmount: finalPrice,
            address: {
              line1: customerData.address1,
              line2: customerData.address2,
              city: customerData.city,
              state: customerData.state,
              postal_code: customerData.zip,
            },
          },
        });

        if (error) throw new Error(error.message);
        if (!data?.clientSecret) throw new Error('Failed to create payment');

        setClientSecret(data.clientSecret);
      } else {
        // Use the unified edge function for customer/booking/payment creation
        const { data, error } = await supabase.functions.invoke('create-payment-intent', {
          body: {
            amount: finalDepositAmount,
            customerEmail: customerData.email,
            customerName: `${customerData.firstName} ${customerData.lastName}`,
            customerPhone: customerData.phone,
            customerData,
            bookingData: bookingPayload,
            paymentType: 'deposit',
            metadata: {
              offer_type: bookingData.offerType,
            },
          },
        });

        if (error) throw new Error(error.message);
        if (!data?.clientSecret && !data?.client_secret) throw new Error('Failed to create payment intent');

        setCustomerId(data.customerId);
        setBookingId(data.bookingId);
        setClientSecret(data.clientSecret || data.client_secret);
      }

      console.log('✅ Payment initialized');
    } catch (error: any) {
      console.error('Failed to initialize payment:', error);
      toast.error(error.message || 'Failed to initialize payment');
    } finally {
      setIsInitializing(false);
    }
  }, [bookingData, finalPrice, finalDepositAmount, balanceDue, monthlyPayment, isTestMode, isInitializing, clientSecret]);

  useEffect(() => {
    if (bookingData.contactInfo?.email && !clientSecret && !isTestMode) {
      initializePayment();
    }
  }, [bookingData.contactInfo?.email, isTestMode]);

  const handlePaymentSuccess = async (paymentIntentId: string, subscriptionId?: string) => {
    if (!bookingId) return;

    try {
      // Use edge function to update booking (bypasses RLS)
      const { data, error } = await supabase.functions.invoke('confirm-booking-payment', {
        body: {
          bookingId,
          paymentIntentId,
          subscriptionId,
          paymentStatus: 'deposit_paid',
        },
      });

      if (error) {
        console.error('Error confirming booking payment:', error);
        throw new Error(error.message);
      }

      // Mark booking as completed in partial_bookings (stops abandoned emails)
      markCompleted(bookingId);

      // Send confirmation email
      try {
        await supabase.functions.invoke('send-payment-schedule', {
          body: {
            bookingId,
            customerEmail: bookingData.contactInfo.email,
            customerName: `${bookingData.contactInfo.firstName} ${bookingData.contactInfo.lastName}`,
            offerType: bookingData.offerType || 'standard',
            totalPrice: finalPrice,
            depositAmount: finalDepositAmount,
            firstCleanBalance,
            monthlyPayment,
          },
        });
      } catch (emailError) {
        console.error('Failed to send payment schedule email:', emailError);
      }

      toast.success('Deposit paid successfully!');
      navigate(`/book/details?booking_id=${bookingId}`);
    } catch (error: any) {
      console.error('Error updating booking:', error);
      toast.error('Payment recorded but failed to update booking');
    }
  };

  const handleTestPayment = async () => {
    if (!bookingId) {
      await initializePayment();
      return;
    }

    setIsProcessing(true);
    try {
      // Use edge function to confirm booking (bypasses RLS)
      const { data, error } = await supabase.functions.invoke('confirm-booking-payment', {
        body: {
          bookingId,
          paymentIntentId: 'test_' + Date.now(),
          paymentStatus: 'deposit_paid',
        },
      });

      if (error) throw new Error(error.message);

      // Mark booking as completed
      markCompleted(bookingId);

      toast.success('Test payment successful!');
      navigate(`/book/details?booking_id=${bookingId}`);
    } catch (error: any) {
      toast.error(error.message || 'Test payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    navigate('/book/contact');
  };

  if (!bookingData.basePrice || !depositAmount) return null;

  const getServiceDetails = () => {
    const serviceType = bookingData.serviceType || 'standard';
    
    const details = {
      standard: {
        title: "Standard Deep Cleaning",
        duration: "3-4 hours",
        features: [
          "Professional deep cleaning team",
          "Eco-friendly cleaning products",
          "All supplies and equipment included",
          "Satisfaction guarantee"
        ],
        checklist: [
          "Kitchen: Deep clean appliances, cabinets, countertops",
          "Bathrooms: Scrub tiles, sanitize fixtures, polish mirrors",
          "Living Areas: Dust surfaces, vacuum carpets, mop floors",
          "Bedrooms: Change linens, dust furniture, organize",
          "Windows: Clean interior windows and sills",
          "Baseboards: Wipe down and detail clean"
        ]
      },
      tester: {
        title: "Tester Deep Clean (90-Min)",
        duration: "90 minutes",
        features: [
          "Experienced cleaning professional",
          "Focus on high-priority areas",
          "Premium eco-friendly products",
          "Perfect for trying our service"
        ],
        checklist: [
          "Kitchen: Clean countertops, sink, and stovetop",
          "Bathroom: Sanitize toilet, sink, and mirror",
          "Living Room: Dust surfaces and vacuum",
          "Quick tidy of visible areas",
          "Trash removal and basic organizing"
        ]
      },
      '90day': {
        title: "90-Day Deep Clean Bundle",
        duration: "3-4 hours per visit",
        features: [
          "3 deep cleaning sessions over 90 days",
          "Consistent cleaning team",
          "Flexible scheduling",
          "Best value for money"
        ],
        checklist: [
          "Complete deep cleaning for each visit",
          "All areas covered thoroughly",
          "Kitchen, bathrooms, bedrooms, living areas",
          "Windows, baseboards, and detailed surfaces",
          "Customizable priority areas",
          "Build relationship with your cleaning team"
        ]
      }
    };
    
    return details[serviceType as keyof typeof details] || details.standard;
  };

  const serviceDetails = getServiceDetails();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <BookingProgressBar currentStep={4} totalSteps={6} />
      
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* New Year Special Banner */}
         <Card className="mb-6 border-primary/30 bg-primary/5 shadow-lg">
          <div className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-center justify-center gap-3 text-center md:text-left">
              <Badge className="bg-primary text-primary-foreground text-sm md:text-base px-3 md:px-4 py-1.5 whitespace-nowrap font-bold">
                ✨ New Customer Special
              </Badge>
              <div>
                <h2 className="font-bold text-base md:text-lg text-foreground mb-1">
                  20% Off Deep Clean + 10% Off Recurring Service
                </h2>
                <p className="text-xs md:text-sm text-muted-foreground">
                  48-Hour Re-Clean Guarantee • Insured & Bonded
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Your Discount is Applied!
          </h1>
          <p className="text-lg text-muted-foreground">
            Pay only 25% today to reserve your spot. No hidden fees, no contracts.
          </p>
          <div className="flex justify-center mt-4">
            <GoogleGuaranteedBadge variant="compact" />
          </div>
        </div>

        <div className="grid gap-6">
          {/* Booking Summary */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Service</span>
                <span className="font-semibold">{bookingData.offerName || 'Deep Cleaning'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Location</span>
                <span className="font-semibold">{bookingData.city}, {bookingData.state}</span>
              </div>
              
              <Separator />
              
              {/* New Year Discount Display */}
              {bookingData.promoCode && bookingData.promoDiscount && bookingData.promoDiscount > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Original Price</span>
                    <span className="line-through text-muted-foreground">${bookingData.basePrice?.toFixed(2)}</span>
                  </div>
                   <div className="flex justify-between text-sm bg-primary/10 p-2 rounded-lg border border-primary/30">
                     <span className="flex items-center gap-1 text-primary font-semibold">
                       <Tag className="w-4 h-4" />
                       ✨ New Customer Special ({bookingData.offerType === 'recurring' ? '10% Off' : '20% Off'})
                     </span>
                     <span className="text-primary font-bold">-${bookingData.promoDiscount.toFixed(2)}</span>
                  </div>
                  <Separator />
                </>
              )}
              
              <div className="flex justify-between font-bold text-lg">
                <span>
                  {bookingData.offerType === '90_day_plan' 
                    ? 'Total Service Cost (Over 3 Months)' 
                    : 'Total Service Cost'}
                </span>
                <span>
                  ${((bookingData.basePrice || 0) - (bookingData.promoDiscount || 0)).toFixed(2)}
                </span>
              </div>
              
              {bookingData.offerType === '90_day_plan' && savings > 0 && (
                <div className="text-sm text-primary font-semibold">
                  Save ${savings} vs booking separately
                </div>
              )}
              
              <div className="bg-primary/10 p-4 rounded-lg">
                {bookingData.offerType === '90_day_plan' ? (
                  <>
                    <div className="mb-3">
                      <p className="font-semibold text-sm mb-3">💳 Payment Breakdown</p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Today (Starter Deposit)</span>
                          <span className="font-bold text-primary">
                            ${finalDepositAmount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">After 1st Service (Complete First Clean)</span>
                          <span className="font-bold">
                            ${firstCleanBalance.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-border/50">
                          <span className="text-sm font-medium">Monthly Payment (3 months, auto-billed)</span>
                          <span className="text-lg font-bold text-primary">
                            ${monthlyPayment}/month
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">💳 Due Today (25% Deposit)</span>
                      <span className="text-2xl font-bold text-primary">
                        ${finalDepositAmount.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Remaining ${balanceDue.toFixed(2)} due after service completion
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Service Details */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                What's Included in Your Clean
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-5 w-5 text-primary" />
                <span className="font-semibold">{serviceDetails.duration}</span>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-sm">Premium Features</h3>
                <div className="grid gap-2">
                  {serviceDetails.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3 text-sm">Detailed Cleaning Checklist</h3>
                <div className="grid gap-2">
                  {serviceDetails.checklist.map((item, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isTestMode ? (
                <>
                  <Alert>
                    <TestTube className="h-4 w-4" />
                    <AlertDescription>
                      🧪 TEST MODE: Payment processing is simulated
                    </AlertDescription>
                  </Alert>
                  <Button
                    onClick={handleTestPayment}
                    disabled={isProcessing}
                    size="lg"
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Pay $${finalDepositAmount.toFixed(2)} Deposit (Test)`
                    )}
                  </Button>
                </>
              ) : isInitializing ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Preparing secure checkout...</span>
                </div>
              ) : clientSecret ? (
                <StripePaymentForm
                  depositAmount={finalDepositAmount}
                  totalAmount={finalPrice}
                  monthlyAmount={bookingData.offerType === '90_day_plan' ? monthlyPayment : undefined}
                  offerType={bookingData.offerType || 'standard'}
                  onSuccess={handlePaymentSuccess}
                  onCancel={handleCancel}
                  clientSecret={clientSecret}
                  isProcessing={isProcessing}
                  setIsProcessing={setIsProcessing}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Unable to load payment form.</p>
                  <Button onClick={initializePayment} className="mt-4">
                    Try Again
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trust Badges */}
          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm mb-4">
                <div>
                  <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="font-medium">Secure Payment</p>
                </div>
                <div>
                  <ShieldCheck className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="font-medium">48-Hr Re-Clean</p>
                </div>
                <div>
                  <Lock className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="font-medium">No Contracts</p>
                </div>
                <div>
                  <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="font-medium">Insured & Bonded</p>
                </div>
              </div>
              <div className="pt-4 border-t flex justify-center">
                <GoogleGuaranteedBadge variant="standard" showSubtitle />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
