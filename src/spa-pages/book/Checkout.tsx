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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useBooking } from '@/contexts/BookingContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Loader2,
  Shield,
  CreditCard,
  Lock,
  Tag,
  CheckCircle2,
  Clock,
  Star,
} from 'lucide-react';
import { GoogleGuaranteedBadge } from '@/components/trust/GoogleGuaranteedBadge';

export default function BookingCheckout() {
  const navigate = useNavigate();
  const { bookingData, updateBookingData, depositAmount } = useBooking();
  const { isTestMode } = useTestMode();
  const { trackStep, markCompleted } = useBookingProgress();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [hasTrackedCheckout, setHasTrackedCheckout] = useState(false);

  // Local contact form state — the Offer step doesn't collect it, so we
  // prompt for it inline if it's missing. This prevents the page from
  // silently blanking out and keeps the Stripe form loading flow in one
  // place.
  const [contactDraft, setContactDraft] = useState({
    firstName: bookingData.contactInfo?.firstName || '',
    lastName: bookingData.contactInfo?.lastName || '',
    email: bookingData.contactInfo?.email || '',
    phone: bookingData.contactInfo?.phone || '',
  });
  const [contactFormError, setContactFormError] = useState<string | null>(null);

  const hasContact = Boolean(
    bookingData.contactInfo?.firstName &&
      bookingData.contactInfo?.lastName &&
      bookingData.contactInfo?.email &&
      bookingData.contactInfo?.phone,
  );

  // Redirect back to the zip step if the customer somehow landed here
  // without picking a home size / offer.
  useEffect(() => {
    if (!bookingData.zipCode) {
      navigate('/book/zip', { replace: true });
    } else if (!bookingData.basePrice) {
      navigate('/book/offer', { replace: true });
    }
  }, [bookingData.zipCode, bookingData.basePrice, navigate]);

  useEffect(() => {
    if (hasContact && !hasTrackedCheckout) {
      trackStep('checkout_started');
      setHasTrackedCheckout(true);
    }
  }, [hasContact, hasTrackedCheckout, trackStep]);

  // Calculate final amounts
  const finalPrice = (bookingData.basePrice || 0) - (bookingData.promoDiscount || 0);
  const depositPercentage = bookingData.offerType === '90_day_plan' ? 0.0625 : 0.2;
  const finalDepositAmount = Math.max(
    1,
    Math.round(finalPrice * depositPercentage),
  );
  const balanceDue = Math.max(0, finalPrice - finalDepositAmount);
  const monthlyPayment = Math.round(finalPrice * 0.25);
  const totalMonthlyPayments = monthlyPayment * 3;
  const firstCleanBalance = Math.max(
    0,
    finalPrice - finalDepositAmount - totalMonthlyPayments,
  );

  const individualServicePrice = bookingData.basePrice
    ? (bookingData.basePrice / 4) * 1.2
    : 0;
  const totalIndividualCost = individualServicePrice * 4;
  const savings = Math.round(totalIndividualCost - finalPrice);

  const initializePayment = useCallback(async () => {
    if (isInitializing || clientSecret) return;
    if (!hasContact) {
      setInitError('Please enter your contact details to continue.');
      return;
    }
    setIsInitializing(true);
    setInitError(null);

    try {
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
        promoDiscountCents: bookingData.promoDiscount
          ? Math.round(bookingData.promoDiscount * 100)
          : 0,
        serviceDate: bookingData.date || null,
        timeSlot: bookingData.timeSlot || null,
        specialInstructions: bookingData.specialInstructions || null,
        addressLine1: bookingData.contactInfo.address1 || null,
        addressLine2: bookingData.contactInfo.address2 || null,
        fullName:
          `${bookingData.contactInfo.firstName} ${bookingData.contactInfo.lastName}`.trim(),
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

      if (isTestMode) {
        console.log('🧪 TEST MODE: Creating booking via edge function');
        const { data, error } = await supabase.functions.invoke(
          'create-payment-intent',
          {
            body: {
              amount: finalDepositAmount,
              customerEmail: customerData.email,
              customerName: `${customerData.firstName} ${customerData.lastName}`,
              customerPhone: customerData.phone,
              customerData,
              bookingData: bookingPayload,
              paymentType: 'deposit',
            },
          },
        );
        if (error) throw new Error(error.message);
        setCustomerId(data?.customerId ?? null);
        setBookingId(data?.bookingId ?? null);
        return;
      }

      if (bookingData.offerType === '90_day_plan') {
        const { data: initData, error: initError } =
          await supabase.functions.invoke('create-payment-intent', {
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

        const { data, error } = await supabase.functions.invoke(
          'create-90day-subscription',
          {
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
          },
        );

        if (error) throw new Error(error.message);
        if (!data?.clientSecret) throw new Error('Failed to create payment');

        setClientSecret(data.clientSecret);
      } else {
        const { data, error } = await supabase.functions.invoke(
          'create-payment-intent',
          {
            body: {
              amount: finalDepositAmount,
              customerEmail: customerData.email,
              customerName: `${customerData.firstName} ${customerData.lastName}`,
              customerPhone: customerData.phone,
              customerData,
              bookingData: bookingPayload,
              paymentType: 'deposit',
              metadata: { offer_type: bookingData.offerType },
            },
          },
        );

        if (error) throw new Error(error.message);
        const secret = data?.clientSecret || data?.client_secret;
        if (!secret) throw new Error('Failed to create payment intent');

        setCustomerId(data.customerId);
        setBookingId(data.bookingId);
        setClientSecret(secret);
      }

      console.log('✅ Payment initialized');
    } catch (error: any) {
      console.error('Failed to initialize payment:', error);
      const msg = error?.message || 'Failed to initialize payment';
      setInitError(msg);
      toast.error(msg);
    } finally {
      setIsInitializing(false);
    }
  }, [
    bookingData,
    finalPrice,
    finalDepositAmount,
    balanceDue,
    monthlyPayment,
    isTestMode,
    isInitializing,
    clientSecret,
    hasContact,
  ]);

  // Kick off Stripe initialization as soon as we have a contact and
  // haven't already done it. Missing contact info shows the inline
  // "Contact Details" form instead of silently doing nothing.
  useEffect(() => {
    if (hasContact && !clientSecret && !isTestMode && !isInitializing) {
      initializePayment();
    }
  }, [hasContact, clientSecret, isTestMode, isInitializing, initializePayment]);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactFormError(null);

    const { firstName, lastName, email, phone } = contactDraft;
    if (!firstName.trim() || !lastName.trim()) {
      setContactFormError('Please enter your first and last name.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setContactFormError('Please enter a valid email address.');
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setContactFormError('Please enter a valid phone number.');
      return;
    }

    updateBookingData({
      contactInfo: {
        ...bookingData.contactInfo,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      },
    });
  };

  const handlePaymentSuccess = async (
    paymentIntentId: string,
    subscriptionId?: string,
  ) => {
    if (!bookingId) return;

    try {
      const { error } = await supabase.functions.invoke(
        'confirm-booking-payment',
        {
          body: {
            bookingId,
            paymentIntentId,
            subscriptionId,
            paymentStatus: 'deposit_paid',
          },
        },
      );

      if (error) {
        console.error('Error confirming booking payment:', error);
        throw new Error(error.message);
      }

      markCompleted(bookingId);

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
      const { error } = await supabase.functions.invoke(
        'confirm-booking-payment',
        {
          body: {
            bookingId,
            paymentIntentId: 'test_' + Date.now(),
            paymentStatus: 'deposit_paid',
          },
        },
      );

      if (error) throw new Error(error.message);
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
    navigate('/book/offer');
  };

  if (!bookingData.basePrice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 text-center space-y-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">
              Preparing your quote… redirecting.
            </p>
            <Button onClick={() => navigate('/book/offer')} variant="outline">
              Pick a Service
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getServiceDetails = () => {
    const serviceType = bookingData.serviceType || 'standard';

    const details = {
      standard: {
        title: 'Standard Cleaning',
        duration: '2–3 hours',
        features: [
          'Professional cleaning team',
          'Eco-friendly cleaning products',
          'All supplies and equipment included',
          'Satisfaction guarantee',
        ],
        checklist: [
          'Kitchen: countertops, sink, stovetop, appliance exteriors',
          'Bathrooms: sanitize fixtures, polish mirrors, mop floors',
          'Living areas: dust surfaces, vacuum carpets, mop floors',
          'Bedrooms: dust furniture, change linens on request',
          'Trash removal and general tidying',
        ],
      },
      deep: {
        title: 'Deep Clean',
        duration: '3–5 hours',
        features: [
          'Professional 2-person team',
          'Eco-friendly products & HEPA vacuums',
          'All supplies and equipment included',
          '100% satisfaction guarantee',
        ],
        checklist: [
          'Kitchen: deep clean appliances, cabinets, countertops',
          'Bathrooms: scrub tiles, sanitize fixtures, polish mirrors',
          'Living areas: dust surfaces, vacuum carpets, mop floors',
          'Bedrooms: full refresh and detailed dusting',
          'Interior windows, sills, and baseboards',
        ],
      },
      tester: {
        title: 'Tester Deep Clean (90-Min)',
        duration: '90 minutes',
        features: [
          'Experienced cleaning professional',
          'Focus on high-priority areas',
          'Premium eco-friendly products',
          'Perfect for trying our service',
        ],
        checklist: [
          'Kitchen: countertops, sink, and stovetop',
          'Bathroom: sanitize toilet, sink, and mirror',
          'Living room: dust surfaces and vacuum',
          'Quick tidy of visible areas',
          'Trash removal and basic organizing',
        ],
      },
      '90day': {
        title: '90-Day Deep Clean Bundle',
        duration: '3–4 hours per visit',
        features: [
          '3 deep cleaning sessions over 90 days',
          'Consistent cleaning team',
          'Flexible scheduling',
          'Best value for money',
        ],
        checklist: [
          'Complete deep cleaning for each visit',
          'All areas covered thoroughly',
          'Kitchen, bathrooms, bedrooms, living areas',
          'Windows, baseboards, and detailed surfaces',
          'Customizable priority areas',
        ],
      },
    };

    return details[serviceType as keyof typeof details] || details.deep;
  };

  const serviceDetails = getServiceDetails();

  const promoLabelSuffix =
    bookingData.offerType === 'recurring' ? '10% Off' : '20% Off';
  const depositPercentLabel =
    bookingData.offerType === '90_day_plan' ? '6.25% Deposit' : '20% Deposit';

  return (
    <div className="min-h-screen bg-background">
      <BookingProgressBar currentStep={4} totalSteps={6} />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Review & Reserve
          </h1>
          <p className="text-lg text-muted-foreground">
            Pay a small deposit today to lock in your service. No hidden fees,
            no contracts.
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
                <span className="font-semibold">
                  {bookingData.offerName || 'Cleaning Service'}
                </span>
              </div>
              {(bookingData.city || bookingData.state) && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Location</span>
                  <span className="font-semibold">
                    {[bookingData.city, bookingData.state]
                      .filter(Boolean)
                      .join(', ') || bookingData.zipCode}
                  </span>
                </div>
              )}

              <Separator />

              {bookingData.promoCode &&
                bookingData.promoDiscount &&
                bookingData.promoDiscount > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Original Price
                      </span>
                      <span className="line-through text-muted-foreground">
                        ${(bookingData.basePrice || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm bg-primary/10 p-2 rounded-lg border border-primary/30">
                      <span className="flex items-center gap-1 text-primary font-semibold">
                        <Tag className="w-4 h-4" />
                        New Customer Special ({promoLabelSuffix})
                      </span>
                      <span className="text-primary font-bold">
                        -${bookingData.promoDiscount.toFixed(2)}
                      </span>
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
                <span>${finalPrice.toFixed(2)}</span>
              </div>

              {bookingData.offerType === '90_day_plan' && savings > 0 && (
                <div className="text-sm text-primary font-semibold">
                  Save ${savings} vs booking separately
                </div>
              )}

              <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                {bookingData.offerType === '90_day_plan' ? (
                  <>
                    <div className="mb-3">
                      <p className="font-semibold text-sm mb-3">
                        Payment Breakdown
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Today (Starter Deposit)
                          </span>
                          <span className="font-bold text-primary">
                            ${finalDepositAmount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            After 1st Service
                          </span>
                          <span className="font-bold">
                            ${firstCleanBalance.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-border/50">
                          <span className="text-sm font-medium">
                            Monthly Payment (3 months, auto-billed)
                          </span>
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
                      <span className="font-medium">
                        Due Today ({depositPercentLabel})
                      </span>
                      <span className="text-2xl font-bold text-primary">
                        ${finalDepositAmount.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Remaining ${balanceDue.toFixed(2)} due after service
                      completion.
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
                What's Included
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
                  {serviceDetails.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-start gap-2 text-sm"
                    >
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3 text-sm">
                  Detailed Cleaning Checklist
                </h3>
                <div className="grid gap-2">
                  {serviceDetails.checklist.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-sm">
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
              {!hasContact ? (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Tell us where to send your booking confirmation and
                    service updates.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="firstName">First name</Label>
                      <Input
                        id="firstName"
                        autoComplete="given-name"
                        value={contactDraft.firstName}
                        onChange={(e) =>
                          setContactDraft((d) => ({
                            ...d,
                            firstName: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="lastName">Last name</Label>
                      <Input
                        id="lastName"
                        autoComplete="family-name"
                        value={contactDraft.lastName}
                        onChange={(e) =>
                          setContactDraft((d) => ({
                            ...d,
                            lastName: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={contactDraft.email}
                      onChange={(e) =>
                        setContactDraft((d) => ({
                          ...d,
                          email: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      value={contactDraft.phone}
                      onChange={(e) =>
                        setContactDraft((d) => ({
                          ...d,
                          phone: e.target.value,
                        }))
                      }
                    />
                  </div>

                  {contactFormError && (
                    <Alert variant="destructive">
                      <AlertDescription>{contactFormError}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" size="lg" className="w-full">
                    Continue to Secure Payment
                  </Button>
                </form>
              ) : isTestMode ? (
                <>
                  <Alert>
                    <TestTube className="h-4 w-4" />
                    <AlertDescription>
                      TEST MODE: Payment processing is simulated.
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
                  <span className="ml-2 text-muted-foreground">
                    Preparing secure checkout...
                  </span>
                </div>
              ) : clientSecret ? (
                <StripePaymentForm
                  depositAmount={finalDepositAmount}
                  totalAmount={finalPrice}
                  monthlyAmount={
                    bookingData.offerType === '90_day_plan'
                      ? monthlyPayment
                      : undefined
                  }
                  offerType={bookingData.offerType || 'standard'}
                  onSuccess={handlePaymentSuccess}
                  onCancel={handleCancel}
                  clientSecret={clientSecret}
                  isProcessing={isProcessing}
                  setIsProcessing={setIsProcessing}
                />
              ) : (
                <div className="text-center py-8 space-y-3">
                  {initError && (
                    <Alert variant="destructive">
                      <AlertDescription>{initError}</AlertDescription>
                    </Alert>
                  )}
                  <p className="text-muted-foreground">
                    We couldn't load the secure payment form.
                  </p>
                  <div className="flex justify-center gap-3">
                    <Button onClick={initializePayment}>Try Again</Button>
                    <Button variant="outline" onClick={handleCancel}>
                      Back to Offers
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trust Badges */}
          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center text-sm mb-4">
                <div>
                  <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="font-medium">Secure payment via Stripe</p>
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
