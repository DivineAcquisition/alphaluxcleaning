import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookingProgressBar } from '@/components/booking/BookingProgressBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBooking } from '@/contexts/BookingContext';
import { supabase } from '@/integrations/supabase/client';
import { squarePromise } from '@/lib/square';
import { toast } from 'sonner';
import { Loader2, Shield, CreditCard, Lock, Tag, CheckCircle2, Clock, Star } from 'lucide-react';
import { useTestMode } from '@/hooks/useTestMode';

export default function BookingCheckout() {
  const navigate = useNavigate();
  const { bookingData, depositAmount } = useBooking();
  const { isTestMode } = useTestMode();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCardReady, setIsCardReady] = useState(false);
  const [cardInstance, setCardInstance] = useState<any>(null);
  const isInitializing = useRef(false);

  useEffect(() => {
    if (!bookingData.zipCode || !bookingData.basePrice) {
      navigate('/book/zip');
    }
  }, [bookingData, navigate]);

  useEffect(() => {
    if (!isTestMode) {
      initializeSquare();
    } else {
      setIsCardReady(true);
    }
    return () => {
      if (cardInstance) {
        cardInstance.destroy();
      }
    };
  }, [isTestMode]);

  const initializeSquare = async () => {
    if (isInitializing.current) return;
    isInitializing.current = true;

    try {
      const square = await squarePromise;
      if (!square?.payments) throw new Error('Square not loaded');

      const card = await square.payments.card();
      await card.attach('#square-card-container');
      
      setCardInstance(card);
      setIsCardReady(true);
      console.log('✅ Square card form ready');
    } catch (error) {
      console.error('Square initialization error:', error);
      toast.error('Failed to load payment form');
    } finally {
      isInitializing.current = false;
    }
  };

  const handlePayment = async () => {
    if (!bookingData.basePrice || !depositAmount) {
      toast.error('Payment information not available');
      return;
    }

    if (!isTestMode && !cardInstance) {
      toast.error('Payment form not ready');
      return;
    }

    setIsProcessing(true);

    try {
      let token = null;
      let details = null;

      if (!isTestMode) {
        const result = await cardInstance.tokenize();
        if (result.status === 'OK') {
          token = result.token;
          details = result.details;
        } else {
          throw new Error(result.errors?.[0]?.message || 'Card tokenization failed');
        }
      }

      // Calculate final price after promo discount
      const finalPrice = (bookingData.basePrice || 0) - (bookingData.promoDiscount || 0);
      const finalDepositAmount = Math.round(finalPrice * 0.25);
      const finalBalanceDue = finalPrice - finalDepositAmount;

      // Create customer
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .upsert({
          email: bookingData.contactInfo.email,
          first_name: bookingData.contactInfo.firstName,
          last_name: bookingData.contactInfo.lastName,
          phone: bookingData.contactInfo.phone,
          address_line1: bookingData.contactInfo.address1,
          address_line2: bookingData.contactInfo.address2,
          city: bookingData.contactInfo.city || bookingData.city,
          state: bookingData.contactInfo.state || bookingData.state,
          postal_code: bookingData.contactInfo.zip || bookingData.zipCode,
        }, { onConflict: 'email' })
        .select()
        .single();

      if (customerError) throw customerError;

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          customer_id: customer.id,
          service_type: bookingData.serviceType,
          frequency: bookingData.frequency,
          sqft_or_bedrooms: `${bookingData.bedrooms}bed/${bookingData.bathrooms}bath`,
          home_size: bookingData.homeSizeId,
          zip_code: bookingData.zipCode,
          est_price: finalPrice,
          deposit_amount: finalDepositAmount,
          base_price: finalPrice,
          balance_due: finalBalanceDue,
          offer_name: bookingData.offerName,
          offer_type: bookingData.offerType,
          visit_count: bookingData.visitCount,
          is_recurring: bookingData.isRecurring || false,
          status: 'payment_pending',
          payment_status: 'pending',
          promo_code: bookingData.promoCode || null,
          promo_discount_cents: bookingData.promoDiscount ? Math.round(bookingData.promoDiscount * 100) : 0,
          pricing_breakdown: {
            basePrice: bookingData.basePrice || 0,
            promoCode: bookingData.promoCode,
            promoDiscount: bookingData.promoDiscount || 0,
            finalPrice: finalPrice,
            depositAmount: finalDepositAmount,
            balanceDue: finalBalanceDue,
          },
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Process payment
      let paymentData: any = null;
      
      if (!isTestMode) {
        const { data, error: paymentError } = await supabase.functions.invoke(
          'create-square-payment',
          {
            body: {
              amount: depositAmount,
              customerEmail: bookingData.contactInfo.email,
              customerName: `${bookingData.contactInfo.firstName} ${bookingData.contactInfo.lastName}`,
              customerPhone: bookingData.contactInfo.phone,
              bookingId: booking.id,
              sourceId: token,
              verificationToken: details?.verification_token,
              saveCard: true,
            },
          }
        );

        if (paymentError) throw new Error(`Payment failed: ${paymentError.message}`);
        if (!data?.success) throw new Error('Payment processing failed');

        paymentData = data;

        await supabase
          .from('bookings')
          .update({ 
            status: 'confirmed',
            square_payment_id: paymentData.payment_id,
            paid_at: new Date().toISOString()
          })
          .eq('id', booking.id);
      } else {
        console.log('🧪 TEST MODE: Skipping payment');
        paymentData = { success: true, payment_id: 'test_' + Date.now() };
        
        await supabase
          .from('bookings')
          .update({ status: 'confirmed' })
          .eq('id', booking.id);
      }

      toast.success('Deposit paid successfully!');
      navigate(`/book/details?booking_id=${booking.id}`);
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!bookingData.basePrice || !depositAmount) return null;

  // Calculate final amounts with promo discount
  const finalPrice = (bookingData.basePrice || 0) - (bookingData.promoDiscount || 0);
  const finalDepositAmount = Math.round(finalPrice * 0.25);
  const balanceDue = finalPrice - finalDepositAmount;

  // Get service details based on service type
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
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Secure Your Deep Clean
          </h1>
          <p className="text-lg text-muted-foreground">
            Just pay 25% deposit to reserve your spot
          </p>
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
              
              {bookingData.promoCode && bookingData.promoDiscount && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="line-through">${bookingData.basePrice?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-primary font-semibold">
                    <span className="flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      {bookingData.promoCode} Discount
                    </span>
                    <span>-${bookingData.promoDiscount.toFixed(2)}</span>
                  </div>
                  <Separator />
                </>
              )}
              
              <div className="flex justify-between font-bold text-lg">
                <span>Total Service Cost</span>
                <span>
                  ${((bookingData.basePrice || 0) - (bookingData.promoDiscount || 0)).toFixed(2)}
                </span>
              </div>
              
              <div className="bg-primary/10 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">💳 Due Today (25% Deposit)</span>
                  <span className="text-2xl font-bold text-primary">
                    ${finalDepositAmount.toFixed(2)}
                  </span>
                </div>
                {bookingData.offerType === '90_day_plan' ? (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-2">
                      After first service:
                    </p>
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-medium">Monthly Payment</span>
                      <span className="text-lg font-bold text-primary">
                        ${Math.round(finalPrice * 0.25)}/month
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Remaining ${balanceDue.toFixed(2)} due after service completion
                  </p>
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
              {isTestMode && (
                <Alert>
                  <AlertDescription>
                    🧪 TEST MODE: Payment processing is disabled
                  </AlertDescription>
                </Alert>
              )}

              {!isTestMode && (
                <div>
                  <div id="square-card-container" className="min-h-[200px]"></div>
                  {!isCardReady && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span>Your payment information is secure and encrypted</span>
              </div>

              <Button
                onClick={handlePayment}
                disabled={!isCardReady || isProcessing}
                size="lg"
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay $${depositAmount.toFixed(2)} Deposit`
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Trust Badges */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="font-medium">Secure Payment</p>
                </div>
                <div>
                  <Lock className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="font-medium">Encrypted</p>
                </div>
                <div>
                  <CreditCard className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="font-medium">PCI Compliant</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
