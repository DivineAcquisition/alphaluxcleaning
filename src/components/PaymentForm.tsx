import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, User, Mail, Phone, Gift, Tag, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
const sb = supabase as any;
import { toast } from "sonner";
import { ReferralCodeDialog } from "@/components/ReferralCodeDialog";
import { useFacebookPixel } from "@/hooks/useFacebookPixel";
import { useNavigate } from "react-router-dom";
import { EmbeddedSquarePaymentForm } from "@/components/booking/EmbeddedSquarePaymentForm";
import { usePreloadedPayment } from "@/hooks/usePreloadedPayment";
import { navigateToOrderConfirmation } from "@/utils/routing-helpers";
import { PaymentFormSkeleton } from "@/components/ui/loading-skeleton";

interface PaymentFormProps {
  pricingData: {
    squareFootage: number;
    cleaningType: string;
    frequency: string;
    addOns: string[];
    bedrooms?: number;
    bathrooms?: number;
    membership?: boolean;
    hours?: number;
  };
  calculatedPrice: number;
  priceBreakdown: any;
  schedulingData?: {
    scheduledDate: string;
    scheduledTime: string;
    nextDayBooking?: boolean;
    upchargeAmount?: number;
  };
  customerInfo?: {
    name: string;
    email: string;
    phone: string;
  };
}

export function PaymentForm({
  pricingData,
  calculatedPrice,
  priceBreakdown,
  schedulingData,
  customerInfo: prefilledCustomerInfo
}: PaymentFormProps) {
  const [customerInfo, setCustomerInfo] = useState({
    name: prefilledCustomerInfo?.name || "",
    email: prefilledCustomerInfo?.email || "",
    phone: prefilledCustomerInfo?.phone || ""
  });
  const [referralCode, setReferralCode] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [appliedReferral, setAppliedReferral] = useState<any>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentType, setPaymentType] = useState<"25_percent_with_discount">("25_percent_with_discount");
  const [showEmbeddedForm, setShowEmbeddedForm] = useState(false);
  
  const { trackInitiateCheckout } = useFacebookPixel();
  const navigate = useNavigate();

  // Calculate final price with scheduling upcharge (for legacy next-day booking)
  const getFinalPrice = () => {
    let finalPrice = calculatedPrice;
    if (schedulingData?.nextDayBooking && schedulingData?.upchargeAmount) {
      finalPrice += schedulingData.upchargeAmount;
    }
    console.log("PaymentForm - getFinalPrice:", {
      calculatedPrice,
      schedulingUpcharge: schedulingData?.upchargeAmount || 0,
      finalPrice,
      pricingData
    });
    return finalPrice;
  };
  
  // Preloaded payment hook for instant form loading
  const {
    clientSecret: preloadedClientSecret,
    paymentIntentId: preloadedPaymentIntentId,
    isLoading: paymentPreloading,
    error: paymentPreloadError,
    isReady: paymentReady,
    createPaymentIntent,
    clearPayment
  } = usePreloadedPayment({
    fullAmount: getFinalPrice(),
    customerInfo,
    pricingData,
    schedulingData,
    shouldPreload: Boolean(
      customerInfo.name && 
      customerInfo.email && 
      customerInfo.phone && 
      calculatedPrice > 0 && 
      pricingData.cleaningType &&
      !pricingData.membership // Only preload for regular services, not membership
    )
  });

  const handleInputChange = (field: string, value: string) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApplyReferralCode = async () => {
    if (!referralCode.trim()) {
      toast.error("Please enter a referral code");
      return;
    }
    if (!customerInfo.email || !customerInfo.name) {
      toast.error("Please fill in your name and email first");
      return;
    }
    try {
      const {
        data,
        error
      } = await sb.rpc('validate_and_use_referral_code', {
        p_code: referralCode.trim(),
        p_user_email: customerInfo.email,
        p_user_name: customerInfo.name,
        p_order_id: null
      });
      if (error) throw error;
      const result = data as any;
      if (result?.success) {
        setAppliedReferral(result);
        toast.success(`Referral code applied! You get 10% off your service.`);

        // Get referrer's email and send reward email
        const {
          data: referrerData
        } = await sb.from('referral_codes').select('owner_email').eq('code', referralCode.trim()).maybeSingle();
        if ((referrerData as any)?.owner_email) {
          await supabase.functions.invoke('send-service-notification', {
            body: {
              type: 'referral_reward',
              referrerEmail: referrerData.owner_email,
              referrerName: result.owner_name,
              friendName: customerInfo.name,
              rewardCode: `FRIEND50-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
              rewardAmount: '50%'
            }
          });
        }
      } else {
        toast.error(result?.error || "Invalid referral code");
      }
    } catch (error) {
      console.error("Error applying referral code:", error);
      toast.error("Failed to apply referral code");
    }
  };

  const handleApplyDiscountCode = async () => {
    if (!discountCode.trim()) {
      toast.error("Please enter a discount code");
      return;
    }
    if (discountCode.startsWith('FRIEND50')) {
      if (appliedReferral) {
        toast.error("Cannot combine discount codes with referral codes");
        return;
      }
      setAppliedDiscount({
        code: discountCode,
        type: 'deep_clean_50_percent',
        description: '50% off deep cleaning service'
      });
      toast.success("Discount code applied! 50% off your deep cleaning service.");
    } else {
      toast.error("Invalid discount code");
    }
  };

  const handleBookService = async () => {
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (calculatedPrice <= 0) {
      toast.error("Please complete the pricing calculator first");
      return;
    }

    // Check if service type is selected (required for proper scheduling)
    if (!pricingData.cleaningType) {
      toast.error("Please select a service type first");
      return;
    }
    
    // Track InitiateCheckout event
    trackInitiateCheckout({
      value: getFinalPrice()
    });
    
    try {
      // Check if membership is enabled from pricingData
      if (pricingData.membership) {
        setIsProcessing(true);
        
        // Handle membership booking with both service payment and recurring subscription
        const {
          data,
          error
        } = await supabase.functions.invoke('create-membership-checkout', {
          body: {
            bookingData: {
              tier: {
                hours: pricingData.hours,
                price: calculatedPrice,
                membershipPrice: calculatedPrice // Already discounted
              },
              pricing: {
                total: calculatedPrice,
                addonMemberDiscount: priceBreakdown?.addonMemberDiscount || 0
              },
              membership: true,
              addOns: pricingData.addOns || [],
              subtotal: calculatedPrice
            },
            customerInfo: {
              email: customerInfo.email,
              name: customerInfo.name
            }
          }
        });
        if (error) throw error;

        // Redirect to Stripe checkout
        if (data.url) {
          window.open(data.url, '_blank');
          toast.success("Opening membership checkout in new tab. Complete payment to start your Clean & Covered™ membership and book your service.");
        } else {
          throw new Error('No checkout URL received');
        }
      } else {
        // Handle regular service booking with preloaded payment
        
        // If payment is already preloaded and ready, show form instantly
        if (paymentReady && preloadedClientSecret) {
          console.log('Using preloaded payment intent - instant form display');
          setShowEmbeddedForm(true);
          toast.success("Secure deposit form is ready. Complete your 20% deposit to confirm your booking.");
          return;
        }

        // Fallback: create payment intent if preloading failed or not ready
        setIsProcessing(true);
        console.log('🔄 Creating payment intent (fallback)...');
        
        try {
          await createPaymentIntent();
          
          if (preloadedClientSecret) {
            console.log('Payment intent created - showing form');
            setShowEmbeddedForm(true);
            toast.success("Secure deposit form is ready. Complete your 20% deposit to confirm your booking.");
          } else {
            throw new Error('Failed to create payment intent');
          }
        } catch (fallbackError) {
          console.error('Fallback payment creation failed:', fallbackError);
          throw fallbackError;
        }
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to create payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Don't allow booking with zero or invalid price
  if (!calculatedPrice || calculatedPrice <= 0) {
    console.log("PaymentForm: Invalid calculatedPrice:", calculatedPrice);
    return (
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-muted to-accent/20 rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Book Your Service
          </CardTitle>
          <CardDescription>
            Complete the pricing calculator to book your cleaning service
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            Please complete the pricing form to proceed with booking
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary to-accent text-white rounded-t-lg text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-xl">
          <CreditCard className="h-6 w-6" />
          Book Your Service
        </CardTitle>
        <CardDescription className="text-primary-foreground/80 text-center">
          Secure booking with AlphaLux Clean
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-6 text-center">
          {/* Payment Type Selection */}
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-primary">Choose Your Payment</h3>
              <p className="text-muted-foreground">Select your preferred payment option</p>
            </div>
            
            <div className="grid grid-cols-1 gap-6 w-full max-w-2xl mx-auto">
              {/* Pay 20% Deposit Now Option - Only Option */}
              <div className="relative border-2 rounded-xl p-6 border-primary bg-primary/5 shadow-lg">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge variant="secondary" className="px-3 py-1">
                    Secure Deposit
                  </Badge>
                </div>
                <div className="text-center space-y-4">
                  <div className="w-8 h-8 rounded-full mx-auto border-2 border-primary bg-primary flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Pay 20% Deposit Now</h4>
                    <div className="text-3xl font-bold text-primary mb-1">
                      ${(getFinalPrice() * 0.2).toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      now, then ${(getFinalPrice() * 0.8).toFixed(2)} after service
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Secure your booking with a small deposit
                    </p>
                  </div>
                   <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-center text-green-600 gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Lower upfront payment
                    </div>
                    <div className="flex items-center justify-center text-green-600 gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Remaining balance charged after service
                    </div>
                    <div className="flex items-center justify-center text-green-600 gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Secure booking guarantee
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information - Only show if not pre-filled */}
          {!prefilledCustomerInfo && (
            <div className="space-y-6 w-full max-w-2xl mx-auto">
              <div className="space-y-2 text-center">
                <div className="flex items-center justify-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <h4 className="text-lg font-semibold text-primary">Contact Information</h4>
                </div>
                <p className="text-sm text-muted-foreground">We'll use this information to contact you about your service</p>
              </div>
            
              <div className="space-y-6 text-left">
                <div className="space-y-4 text-left">
                  <div className="space-y-1 text-left">
                    <h5 className="font-medium text-foreground text-left">Personal Details</h5>
                    <p className="text-sm text-muted-foreground text-left">Your name as it appears on official documents</p>
                  </div>
                  <div className="space-y-2 text-left">
                    <Label htmlFor="customerName" className="text-left">Full Name *</Label>
                    <Input 
                      id="customerName" 
                      value={customerInfo.name} 
                      onChange={e => handleInputChange("name", e.target.value)} 
                      placeholder="Enter your full name" 
                      className="text-left" 
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-4 text-left">
                  <div className="space-y-1 text-left">
                    <h5 className="font-medium text-foreground text-left">Contact Details</h5>
                    <p className="text-sm text-muted-foreground text-left">How we'll reach you for updates and confirmations</p>
                  </div>
                  <div className="space-y-4 text-left">
                    <div className="space-y-2 text-left">
                      <Label htmlFor="customerPhone" className="text-left">Phone Number *</Label>
                      <Input 
                        id="customerPhone" 
                        type="tel" 
                        value={customerInfo.phone} 
                        onChange={e => handleInputChange("phone", e.target.value)} 
                        placeholder="Enter your phone number" 
                        className="text-left" 
                        required 
                      />
                    </div>

                    <div className="space-y-2 text-left">
                      <Label htmlFor="customerEmail" className="text-left">Email Address *</Label>
                      <Input 
                        id="customerEmail" 
                        type="email" 
                        value={customerInfo.email} 
                        onChange={e => handleInputChange("email", e.target.value)} 
                        placeholder="Enter your email address" 
                        className="text-left" 
                        required 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Show embedded form for payment */}
          {showEmbeddedForm && preloadedClientSecret && (
            <EmbeddedPaymentForm
              clientSecret={preloadedClientSecret}
              paymentAmount={Math.round(getFinalPrice() * 0.2 * 100) / 100}
              fullAmount={getFinalPrice()}
              paymentType="deposit_20"
              onSuccess={async () => {
                console.log('Payment successful, creating booking...');
                
                const finalPrice = getFinalPrice();
                
                try {
                  // Create the booking record
                  const { data: bookingData, error: bookingError } = await supabase
                    .from('bookings')
                    .insert({
                      customer_name: customerInfo.name,
                      customer_email: customerInfo.email,
                      customer_phone: customerInfo.phone,
                      service_type: pricingData.cleaningType,
                      home_size: String(pricingData.squareFootage || ''),
                      frequency: pricingData.frequency,
                      add_ons: pricingData.addOns,
                      scheduled_date: schedulingData?.scheduledDate || null,
                      scheduled_time: schedulingData?.scheduledTime || null,
                      total_price: finalPrice,
                      payment_status: 'deposit_paid',
                      stripe_payment_intent_id: preloadedPaymentIntentId,
                      discount_code: appliedDiscount?.code || null,
                      referral_code: appliedReferral?.code || null
                    })
                    .select()
                    .single();

                  if (bookingError) {
                    console.error('Booking creation failed:', bookingError);
                    toast.error('Payment successful but booking creation failed. Please contact support.');
                    return;
                  }

                  console.log('Booking created successfully:', bookingData);
                  toast.success('Booking confirmed! Redirecting to confirmation page...');
                  
                  // Navigate to confirmation page
                  navigateToOrderConfirmation(navigate, bookingData.id);
                } catch (error) {
                  console.error('Booking creation error:', error);
                  toast.error('Payment successful but booking creation failed. Please contact support.');
                }
              }}
              onCancel={() => {
                setShowEmbeddedForm(false);
                clearPayment();
              }}
            />
          )}

          {/* Show payment form skeleton while preloading */}
          {!showEmbeddedForm && paymentPreloading && (
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-5 w-5 bg-muted rounded animate-pulse" />
                  Preparing instant payment form...
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentFormSkeleton />
              </CardContent>
            </Card>
          )}

          {/* Show preload error if any */}
          {paymentPreloadError && !showEmbeddedForm && (
            <Card className="w-full">
              <CardContent className="pt-6">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <div className="flex items-center gap-2 text-amber-700">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Payment form is loading...</span>
                  </div>
                  <p className="text-sm text-amber-600 mt-1">Click "Book Service" to continue with your payment.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Referral and Discount Codes Section */}
          {!showEmbeddedForm && (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Gift className="h-5 w-5 text-primary mt-0.5" />
                  <div className="text-left">
                    <h4 className="text-lg font-semibold text-primary text-left">Promo Codes</h4>
                    <p className="text-sm text-muted-foreground text-left">Have a referral or discount code? Apply it here to save money</p>
                  </div>
                </div>
              </div>
              
              {/* Referral Code */}
              <div className="space-y-4">
                <div className="space-y-1 text-left">
                  <h5 className="font-medium text-foreground text-left">Referral Code</h5>
                  <p className="text-sm text-muted-foreground text-left">Got referred by a friend? Use their code for instant savings</p>
                </div>
                <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                  {appliedReferral && (
                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-left">
                       <p className="text-green-800 font-medium text-sm text-left flex items-center gap-2">
                         <CheckCircle className="h-4 w-4" />
                         Referral code applied!
                       </p>
                      <p className="text-green-600 text-xs text-left">You get 10% off your service.</p>
                    </div>
                  )}
                  
                  {!appliedReferral && (
                    <div className="text-left">
                      <div className="flex gap-2">
                        <Input 
                          value={referralCode} 
                          onChange={e => setReferralCode(e.target.value)} 
                          placeholder="Enter your friend's referral code" 
                          className="flex-1 text-left" 
                        />
                        <Button 
                          onClick={handleApplyReferralCode} 
                          disabled={!referralCode.trim() || !customerInfo.email || !customerInfo.name} 
                          variant="outline" 
                          size="sm"
                        >
                          Apply
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground text-left mt-2">
                        Get 10% off your service with a friend's referral code
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        {(!customerInfo.email || !customerInfo.name) && (
                          <p className="text-xs text-orange-600 text-left">
                            Please fill in your name and email first
                          </p>
                        )}
                        <ReferralCodeDialog 
                          onCodeGenerated={(code) => setReferralCode(code)}
                          trigger={
                            <Button variant="link" className="p-0 h-auto text-sm text-primary">
                              Don't have a referral code? Generate one here!
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Discount Code */}
              <div className="space-y-4">
                <div className="space-y-1 text-left">
                  <h5 className="font-medium text-foreground text-left">Discount Code</h5>
                  <p className="text-sm text-muted-foreground text-left">Have a special promotion code? Enter it for additional discounts</p>
                </div>
                <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                  {appliedDiscount && (
                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-left">
                       <p className="text-green-800 font-medium text-sm text-left flex items-center gap-2">
                         <CheckCircle className="h-4 w-4" />
                         Discount code applied!
                       </p>
                      <p className="text-green-600 text-xs text-left">{appliedDiscount.description}</p>
                    </div>
                  )}
                  
                  {!appliedDiscount && !appliedReferral && (
                    <div className="text-left">
                      <div className="flex gap-2">
                        <Input 
                          value={discountCode} 
                          onChange={e => setDiscountCode(e.target.value)} 
                          placeholder="Enter discount code (e.g., FRIEND50-ABC123)" 
                          className="flex-1 text-left" 
                        />
                        <Button 
                          onClick={handleApplyDiscountCode} 
                          disabled={!discountCode.trim()} 
                          variant="outline" 
                          size="sm"
                        >
                          Apply
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground text-left mt-2">
                        Have a discount code from a referral reward? Get 50% off deep cleaning
                      </p>
                    </div>
                  )}
                  
                  {appliedReferral && (
                    <p className="text-xs text-muted-foreground text-orange-600 text-left">
                      Cannot apply discount code when referral code is already applied
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Book Service Button */}
          {!showEmbeddedForm && (
            <>
              <Button 
                className="w-full" 
                size="lg" 
                onClick={handleBookService} 
                disabled={isProcessing || !customerInfo.name || !customerInfo.email || !customerInfo.phone || !pricingData.cleaningType}
              >
                {isProcessing ? "Processing..." : `Pay 20% Now - $${(getFinalPrice() * 0.2).toFixed(2)}`}
              </Button>

              <div className="text-xs text-muted-foreground text-center">
                Remaining ${(getFinalPrice() * 0.8).toFixed(2)} charged after service.
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}