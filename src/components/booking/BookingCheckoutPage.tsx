import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Shield, Sparkles, ArrowLeft, ArrowRight, Check, Tag, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { checkStripeReady } from '@/lib/stripe';
import { CustomStripePayment } from '@/components/payment/CustomStripePayment';
import { PaymentErrorBoundary } from '@/components/payment/PaymentErrorBoundary';
import { formatPrice, applyGlobalDiscount, calculateGlobalDiscountAmount } from '@/lib/pricing-utils';
import { calculateComprehensivePricing, formatPricingForGHL } from '@/lib/comprehensive-pricing';
import { useAuth } from '@/contexts/AuthContext';

interface BookingData {
  serviceZipCode?: string;
  serviceType?: string;
  homeSize: string;
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
  membershipDiscount?: number;
  membershipFee?: number;
  totalPrice: number;
  paymentType: 'pay_after_service' | '25_percent_with_discount';
  promoDiscount: number;
  nextDayFee?: number;
  customerEmail?: string;
  customerName?: string;
  
  // Property Details
  squareFootage?: string; // Changed to string to match the label format
  bedrooms?: string;
  bathrooms?: string;
  dwellingType?: string;
  flooringType?: string;
  
  // Membership
  addMembership?: boolean;
}

interface Props {
  bookingData: Partial<BookingData>;
  updateBookingData: (updates: Partial<BookingData>) => void;
  onPaymentSuccess: (sessionId: string) => void;
  onBack: () => void;
}

export function BookingCheckoutPage({ bookingData, updateBookingData, onPaymentSuccess, onBack }: Props) {
  const { user } = useAuth(); // Get authenticated user info
  const checkoutRef = React.useRef<HTMLDivElement>(null);
  const [isRecurring, setIsRecurring] = useState(bookingData.frequency !== 'one-time');
  const [paymentType, setPaymentType] = useState<'pay_after_service' | '25_percent_with_discount'>('pay_after_service');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [stripeReady, setStripeReady] = useState(false);
  const [systemError, setSystemError] = useState<string | null>(null);

  // Check if Stripe is ready on component mount
  useEffect(() => {
    const checkStripe = async () => {
      try {
        console.log('🔄 Checking Stripe readiness...');
        const ready = await checkStripeReady();
        console.log('✅ Stripe ready:', ready);
        setStripeReady(ready);
        if (!ready) {
          setSystemError('Payment system not available. Please try refreshing the page.');
        }
      } catch (error) {
        console.error('❌ Stripe check failed:', error);
        setSystemError('Payment system error. Please try refreshing the page.');
      }
    };
    checkStripe();
  }, []);

  // Calculate final pricing with 20% global discount and membership
  const originalBaseTotal = bookingData.basePrice + Object.values(bookingData.addOnPrices).reduce((sum, price) => sum + price, 0);
  const globalDiscountAmount = calculateGlobalDiscountAmount(originalBaseTotal);
  const baseTotal = originalBaseTotal - globalDiscountAmount; // Base total with 20% discount applied
  
  const recurringDiscount = isRecurring ? bookingData.frequencyDiscount : 0;
  const membershipFee = bookingData.addMembership ? 39 : 0; // $39/month membership fee
  const membershipDiscount = bookingData.addMembership ? 20 : 0; // $20 membership credit on current service
  const totalDiscount = recurringDiscount + promoDiscount + membershipDiscount;
  const nextDayFee = bookingData.nextDayFee || 0;
  
  // Final calculation: base total + membership fee + next day fee - all discounts
  const finalTotal = baseTotal + membershipFee + nextDayFee - totalDiscount;
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
      totalPrice: finalTotal,
      membershipDiscount: bookingData.addMembership ? 20 : 0,
      membershipFee: bookingData.addMembership ? 39 : 0
    });
  }, [paymentType, promoDiscount, finalTotal, bookingData.addMembership]);

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
    console.log('💳 ProcessPayment Debug:', {
      stripeReady,
      systemError,
      showPaymentForm,
      finalTotal,
      paymentAmount,
      paymentType
    });
    
    if (!stripeReady) {
      console.error('❌ Stripe not ready:', { stripeReady, systemError });
      toast.error('Payment system not ready. Please refresh the page.');
      return;
    }
    
    console.log('✅ Setting showPaymentForm to true');
    setShowPaymentForm(true);
    // No scrolling - keep user at current position in the payment selection area
  };


  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      // Save order to database first
      const orderData = {
        id: paymentIntentId,
        stripe_payment_intent_id: paymentIntentId,
        amount: Math.round(finalTotal * 100), // Convert to cents
        currency: 'usd',
        status: 'confirmed',
        cleaning_type: bookingData.homeSize || 'general',
        frequency: bookingData.frequency || 'one-time',
        scheduled_date: bookingData.serviceDate,
        scheduled_time: bookingData.serviceTime,
        customer_name: bookingData.customerName || user?.user_metadata?.full_name || 'Guest User',
        customer_email: bookingData.customerEmail || user?.email || 'guest@example.com',
        customer_phone: bookingData.contactNumber,
        user_id: user?.id,
        service_details: {
          service_type: 'residential_cleaning',
          cleaningType: bookingData.homeSize,
          frequency: bookingData.frequency,
          addOns: bookingData.addOns,
          serviceAddress: bookingData.address,
          specialInstructions: bookingData.specialInstructions,
          basePrice: bookingData.basePrice,
          addOnPrices: bookingData.addOnPrices,
          frequencyDiscount: bookingData.frequencyDiscount,
          membershipDiscount: bookingData.membershipDiscount || 0,
          promoDiscount: promoDiscount,
          nextDayFee: bookingData.nextDayFee || 0,
          totalPrice: finalTotal,
          payment_type: paymentType,
          payment_amount: paymentAmount,
          final_total: finalTotal,
          squareFootage: bookingData.squareFootage,
          bedrooms: bookingData.bedrooms,
          bathrooms: bookingData.bathrooms,
          dwellingType: bookingData.dwellingType,
          flooringType: bookingData.flooringType
        }
      };

      // Insert order into database
      const { error: orderError } = await supabase
        .from('orders')
        .insert([orderData]);

      if (orderError) {
        console.error('Failed to save order:', orderError);
      } else {
        console.log('Order saved successfully');
      }

      // Create comprehensive order entry webhook data with enhanced pricing
      const addOnsTotal = Object.values(bookingData.addOnPrices || {}).reduce((sum, price) => sum + price, 0);
      
      // Calculate comprehensive pricing breakdown
      const pricingBreakdown = calculateComprehensivePricing(
        bookingData.basePrice || 0,
        addOnsTotal,
        bookingData.homeSize || '',
        bookingData.frequency || '',
        bookingData.addMembership || false,
        promoDiscount > 0,
        promoCode || ''
      );

// Cleaning type mapping function
      const mapCleaningType = (serviceType: string): string => {
        const cleaningTypeMap: { [key: string]: string } = {
          'regular': 'Regular Cleaning',
          'deep': 'Deep Cleaning', 
          'moveout': 'Move-Out Cleaning',
          'movein': 'Move-In Cleaning',
          'post_construction': 'Post-Construction Cleaning',
          'residential_cleaning': 'Residential Cleaning',
          'commercial_cleaning': 'Commercial Cleaning'
        };
        return cleaningTypeMap[serviceType] || 'Residential Cleaning';
      };

      // Format data for GHL
      const ghlFormattedData = formatPricingForGHL(
        pricingBreakdown,
        {
          name: bookingData.customerName || user?.user_metadata?.full_name || 'Guest User',
          email: bookingData.customerEmail || user?.email || 'guest@example.com',
          phone: bookingData.contactNumber || '',
          address: bookingData.address?.street || '',
          city: bookingData.address?.city || '',
          state: bookingData.address?.state || 'TX',
          zipCode: bookingData.address?.zipCode || ''
        },
        {
          serviceType: 'residential_cleaning',
          homeSize: bookingData.homeSize,
          frequency: bookingData.frequency,
          flooringType: bookingData.flooringType,
          addOns: bookingData.addOns,
          serviceDate: bookingData.serviceDate,
          serviceTime: bookingData.serviceTime
        }
      );

      const orderEntryData = {
        event_type: 'order_entry',
        timestamp: new Date().toISOString(),
        source: 'bay_area_cleaning_pros',
        
        // Service Details (with separate and unified date/time)
        serviceType: 'residential_cleaning',
        cleaningType: mapCleaningType(bookingData.serviceType || ''),
        homeSize: bookingData.homeSize,
        frequency: bookingData.frequency,
        addOns: bookingData.addOns || [],
        flooringType: bookingData.flooringType || 'not_specified',
        serviceDateSeparate: bookingData.serviceDate,
        serviceTimeSeparate: bookingData.serviceTime,
        serviceDateTime: `${bookingData.serviceDate} ${bookingData.serviceTime}`,
        specialInstructions: bookingData.specialInstructions,
        
        // Customer Information
        customerInfo: {
          name: bookingData.customerName || user?.user_metadata?.full_name || 'Guest User',
          email: bookingData.customerEmail || user?.email || 'guest@example.com',
          phone: bookingData.contactNumber || '',
          address: bookingData.address?.street || '',
          city: bookingData.address?.city || '',
          state: bookingData.address?.state || 'TX',
          zipCode: bookingData.address?.zipCode || ''
        },
        
        // Property Details
        propertyDetails: {
          squareFootage: bookingData.squareFootage || null,
          bedrooms: bookingData.bedrooms || null,
          bathrooms: bookingData.bathrooms || null,
          dwellingType: bookingData.dwellingType || null,
          flooringType: bookingData.flooringType || null
        },
        
        // Comprehensive Pricing Information
        basePrice: bookingData.basePrice || 0,
        addOnPrices: bookingData.addOnPrices || {},
        
        // Detailed discount breakdowns
        discounts: {
          global: pricingBreakdown.globalDiscount,
          frequency: pricingBreakdown.frequencyDiscount,
          membership: pricingBreakdown.membershipDiscount,
          referral: pricingBreakdown.referralDiscount,
          promo: pricingBreakdown.promoDiscount
        },
        
        // Labor cost information
        laborCosts: pricingBreakdown.laborCosts,
        
        // Legacy discount fields (backwards compatibility)
        frequencyDiscount: recurringDiscount,
        membershipDiscount: membershipDiscount,
        promoDiscount: promoDiscount,
        
        // Final totals
        totalPrice: finalTotal,
        totalSavings: pricingBreakdown.totalSavings,
        
        // Payment Information
        paymentType: paymentType,
        paymentAmount: paymentAmount,
        
        // GHL formatted data
        ghlFormattedData: ghlFormattedData,
        
        // Order Information
        order_data: {
          id: paymentIntentId,
          payment_intent_id: paymentIntentId,
          status: 'confirmed',
          created_at: new Date().toISOString(),
          
          // Enhanced Pricing Breakdown
          pricing_details: {
            original_base_total: Math.round(originalBaseTotal * 100), // in cents
            global_discount_20_percent: Math.round(globalDiscountAmount * 100), // in cents
            base_total_after_global_discount: Math.round(baseTotal * 100), // in cents
            membership_monthly_fee: Math.round(membershipFee * 100), // in cents
            membership_service_credit: Math.round(membershipDiscount * 100), // in cents
            recurring_discount: Math.round(recurringDiscount * 100), // in cents
            promo_discount: Math.round(promoDiscount * 100), // in cents
            next_day_fee: Math.round(nextDayFee * 100), // in cents
            final_total: Math.round(finalTotal * 100), // in cents
            payment_amount: Math.round(paymentAmount * 100), // in cents
            
            // Formatted for display
            original_base_total_display: formatPrice(originalBaseTotal),
            global_discount_display: formatPrice(globalDiscountAmount),
            base_total_display: formatPrice(baseTotal),
            membership_fee_display: formatPrice(membershipFee),
            membership_discount_display: formatPrice(membershipDiscount),
            final_total_display: formatPrice(finalTotal),
            payment_amount_display: formatPrice(paymentAmount)
          },
          
          // All calculated totals for webhook
          calculated_breakdown: {
            base_total: baseTotal,
            add_ons_total: addOnsTotal,
            subtotal: baseTotal,
            recurring_discount: recurringDiscount,
            membership_discount: membershipDiscount,
            promo_discount: promoDiscount,
            total_discounts: totalDiscount,
            next_day_fee: nextDayFee,
            final_total: finalTotal,
            payment_amount: paymentAmount,
            amount_due_after: paymentType === 'pay_after_service' ? finalTotal : (finalTotal * 0.95 - paymentAmount)
          }
        },
        
        // Customer Information
        customer_data: {
          name: bookingData.customerName || user?.user_metadata?.full_name || 'Guest User',
          email: bookingData.customerEmail || user?.email || 'guest@example.com',
          phone: bookingData.contactNumber || '',
          
          // Address Information
          street_address: bookingData.address?.street || '',
          city: bookingData.address?.city || '',
          state: bookingData.address?.state || 'TX',
          zip_code: bookingData.address?.zipCode || '',
          
          // Property Details (if available)
          square_footage: bookingData.squareFootage || null,
          bedrooms: bookingData.bedrooms || null,
          bathrooms: bookingData.bathrooms || null,
          dwelling_type: bookingData.dwellingType || null,
          flooring_type: bookingData.flooringType || null
        },
        
        // Booking Information
        booking_data: {
          booking_id: paymentIntentId,
          booking_step: 'payment_completed',
          is_recurring: bookingData.frequency !== 'one-time',
          membership_added: bookingData.addMembership || false,
          promo_code_used: promoCode || null,
          user_authenticated: !!user,
          total_savings: totalDiscount
        },
        
        // Metadata
        metadata: {
          order_id: paymentIntentId,
          booking_id: paymentIntentId,
          session_id: paymentIntentId,
          processed_at: new Date().toISOString(),
          platform: 'web',
          user_agent: navigator.userAgent,
          webhook_version: '2.0_comprehensive'
        }
      };

      // Send to order entry webhook
      const { data, error } = await supabase.functions.invoke('send-order-entry-webhook', {
        body: {
          order_id: paymentIntentId,
          booking_id: paymentIntentId,
          comprehensive_data: orderEntryData
        }
      });

      if (error) {
        console.error('Order entry webhook error:', error);
        // Don't block payment success for webhook errors
      } else {
        console.log('Order entry webhook sent successfully:', data);
      }
    } catch (error) {
      console.error('Error sending order entry webhook:', error);
      // Don't block payment success for webhook errors
    }
    
    // Store order ID in localStorage for confirmation page
    localStorage.setItem('current_order_id', paymentIntentId);
    
    onPaymentSuccess(paymentIntentId);
  };

  const handlePaymentCancel = () => {
    setShowPaymentForm(false);
  };

  return (
    <PaymentErrorBoundary>
      <div ref={checkoutRef} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* System Error Display */}
        {systemError && (
          <div className="lg:col-span-3">
            <Card className="border-destructive/20 shadow-clean">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-destructive mb-4">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-semibold">System Notice</span>
                </div>
                <p className="text-muted-foreground mb-4">{systemError}</p>
                <div className="flex gap-2">
                  <Button onClick={() => window.location.reload()} variant="outline">
                    Refresh Page
                  </Button>
                 <Button onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Left Column - Payment Form */}
        <div className="lg:col-span-2 space-y-6">
        
        {/* Membership Signup */}
        <Card className="shadow-clean">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Clean Covered Membership - Save $20 Monthly!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
              <div className="flex-1">
                <h4 className="font-semibold text-primary">Add Clean Covered Membership</h4>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success" />
                    <span>Priority booking & scheduling</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success" />
                    <span>$20 monthly service credit</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success" />
                    <span>Exclusive member discounts</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success" />
                    <span>Cancel anytime, no commitment</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-success">
                    <span>$39/month + $20 credit on this service!</span>
                  </div>
                </div>
                <Badge className="mt-3 bg-success text-success-foreground">
                  Net: $19/month (includes $20 credit today!)
                </Badge>
              </div>
              <Switch
                checked={bookingData.addMembership || false}
                onCheckedChange={(checked) => updateBookingData({ addMembership: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Referral Code Generation */}
        <Card className="shadow-clean">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Generate Your Referral Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Share & Earn Together!</h4>
              <p className="text-sm text-blue-800 mb-3">
                Create your personal referral code and share with friends. When they book, you both get rewards!
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-800">Your friend gets 25% off their first cleaning</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-800">You earn $25 credit when they book</span>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="mt-3 border-blue-300 text-blue-700 hover:bg-blue-100"
                onClick={() => {
                  const referralCode = `${bookingData.customerName?.replace(/\s+/g, '').toUpperCase() || 'GUEST'}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
                  navigator.clipboard.writeText(referralCode);
                  toast.success(`Referral code "${referralCode}" copied to clipboard!`);
                }}
              >
                Generate My Code
              </Button>
            </div>
          </CardContent>
        </Card>
        
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

        {/* Simplified Payment Notice */}
        {!showPaymentForm && !systemError && (
          <Card className="shadow-clean">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-5 w-5 text-success" />
                <h3 className="text-lg font-semibold">Secure Payment Processing</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Your payment will be processed securely. We use industry-standard encryption to protect your information.
              </p>
              <div className="flex items-center gap-2 text-sm text-success">
                <Check className="h-4 w-4" />
                <span>256-bit SSL encryption</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Error Display */}
        {systemError && (
          <Card className="shadow-clean border-destructive/20">
            <CardContent className="p-6 text-center space-y-4">
              <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
              <div className="text-destructive text-lg font-semibold">Payment System Issue</div>
              <p className="text-muted-foreground">{systemError}</p>
              <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
                Refresh Page
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Embedded Payment Form */}
        {showPaymentForm && stripeReady && !systemError && (
          <CustomStripePayment
            paymentData={{
              amount: paymentAmount,
              customerEmail: bookingData.customerEmail || user?.email || 'guest@example.com',
              customerName: bookingData.customerName || user?.user_metadata?.full_name || 'Guest User',
              customerPhone: bookingData.contactNumber,
              cleaningType: bookingData.homeSize,
              frequency: bookingData.frequency,
              serviceAddress: bookingData.address.street,
              city: bookingData.address.city,
              state: bookingData.address.state,
              zipCode: bookingData.address.zipCode,
              paymentType: paymentType
            }}
            onSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
            className="shadow-clean"
          />
        )}

        {/* Stripe Loading Error Fallback */}
        {showPaymentForm && !stripeReady && (
          <Card className="shadow-clean border-destructive/20">
            <CardContent className="p-6 text-center space-y-4">
              <div className="text-destructive text-lg font-semibold">Payment System Unavailable</div>
              <p className="text-muted-foreground">
                Unable to load the secure payment form. Please try refreshing the page.
              </p>
              <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
                Refresh Page
              </Button>
            </CardContent>
          </Card>
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Price Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Original Service Price</span>
                <span className="line-through text-muted-foreground">{formatPrice(originalBaseTotal)}</span>
              </div>
              <div className="flex justify-between items-center text-success">
                <span>20% Limited Time Discount</span>
                <span>-{formatPrice(globalDiscountAmount)}</span>
              </div>
              <div className="flex justify-between items-center font-medium">
                <span>Service Total (with 20% off)</span>
                <span>{formatPrice(baseTotal)}</span>
              </div>
              
              {bookingData.addMembership && (
                <>
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Membership Fee (monthly)</span>
                      <span>+{formatPrice(membershipFee)}</span>
                    </div>
                    <div className="flex justify-between items-center text-success">
                      <span>Membership Credit (this service)</span>
                      <span>-{formatPrice(membershipDiscount)}</span>
                    </div>
                  </div>
                </>
              )}
              
              {nextDayFee > 0 && (
                <div className="flex justify-between items-center">
                  <span>Next-Day Service Fee</span>
                  <span>+{formatPrice(nextDayFee)}</span>
                </div>
              )}
              
              {promoDiscount > 0 && (
                <div className="flex justify-between items-center text-success">
                  <span>Promo Code Discount</span>
                  <span>-{formatPrice(promoDiscount)}</span>
                </div>
              )}
              
              <div className="border-t pt-3">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Due Today</span>
                  <span className="text-primary">{formatPrice(finalTotal)}</span>
                </div>
                {bookingData.addMembership && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Membership will continue at $39/month with $20 monthly credit
                  </p>
                )}
              </div>
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
                     Continue to Payment
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
    </PaymentErrorBoundary>
  );
}