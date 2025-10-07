import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CheckCircle, ArrowRight, ArrowLeft, Calendar, CreditCard, Home, MapPin, Clock, Sparkles, Star, Shield, Zap, Tag, Gift } from 'lucide-react';
import { EnhancedProgressIndicator } from '@/components/landing/EnhancedProgressIndicator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { validateServiceAreaZipCode } from '@/lib/service-area-validation';
import { STATE_ABBREVIATIONS } from '@/lib/states';
import { formatPrice, applyGlobalDiscount, calculateGlobalDiscountAmount } from '@/lib/pricing-utils';
import { supabase } from '@/integrations/supabase/client';
import { calculateNewPricing, getHomeSizeBySquareFootage } from '@/lib/new-pricing-system';
import { ServiceTypeCards } from './ServiceTypeCards';
import { EnhancedServiceTypeCards } from './EnhancedServiceTypeCards';
import { PropertyDetailsSelector } from './PropertyDetailsSelector';
import { PricingSummarySticky } from './PricingSummarySticky';
import { EnhancedSchedulingStep } from './EnhancedSchedulingStep';
import { EmbeddedSquarePaymentForm } from './EmbeddedSquarePaymentForm';
import { PromoCodeInput } from './PromoCodeInput';
import { toLocalDate, parseLocalDate } from '@/lib/date-helpers';
import { scrollToStepContent } from '@/lib/scroll-utils';

// Original pricing matrix - 20% discount applied automatically in calculations
const pricingMatrix = {
  'under-1000': {
    weekly: 97.50,
    biweekly: 118.59,
    monthly: 171.26,
    oneTime: 225.31,
    deepClean: 305.05
  },
  '1001-1400': {
    weekly: 115.94,
    biweekly: 125.58,
    monthly: 186.59,
    oneTime: 235.09,
    deepClean: 327.77
  },
  '1401-1800': {
    weekly: 125.67,
    biweekly: 140.06,
    monthly: 225.73,
    oneTime: 255.27,
    deepClean: 355.94
  },
  '1801-2400': {
    weekly: 132.81,
    biweekly: 150.15,
    monthly: 234.87,
    oneTime: 265.41,
    deepClean: 385.13
  },
  '2401-2800': {
    weekly: 158.26,
    biweekly: 175.14,
    monthly: 245.76,
    oneTime: 285.28,
    deepClean: 405.01
  },
  '2801-3300': {
    weekly: 168.73,
    biweekly: 188.62,
    monthly: 287.92,
    oneTime: 297.46,
    deepClean: 459.16
  },
  '3301-3900': {
    weekly: 178.82,
    biweekly: 197.61,
    monthly: 307.81,
    oneTime: 346.34,
    deepClean: 478.39
  },
  '3901-4500': {
    weekly: 215.29,
    biweekly: 231.58,
    monthly: 368.69,
    oneTime: 378.67,
    deepClean: 512.60
  },
  '4501-5100': {
    weekly: 228.56,
    biweekly: 242.05,
    monthly: 342.54,
    oneTime: 369.10,
    deepClean: 451.39
  }
};

// Service types based on frequency and type
const serviceTypes = [{
  id: 'regular',
  name: 'Regular Clean',
  description: 'Weekly maintenance',
  basePrice: 0,
  // Using exact pricing matrix
  icon: Home,
  popular: true,
  features: ['All surfaces cleaned', 'Floors & bathrooms', 'Kitchen & trash'],
  recurring: true,
  hasFrequency: true
}, {
  id: 'deep',
  name: 'Deep Clean',
  description: 'Thorough cleaning',
  basePrice: 0,
  // Using exact pricing matrix
  icon: Sparkles,
  popular: false,
  features: ['Everything + appliances', 'Light fixtures', 'Baseboards & sills'],
  recurring: false,
  hasFrequency: false
}, {
  id: 'moveout',
  name: 'Move-Out Clean',
  description: 'Complete cleanout',
  basePrice: 0,
  // Using exact pricing matrix
  icon: Zap,
  popular: false,
  features: ['Deep clean + cabinets', 'Appliance interiors', 'Final walkthrough'],
  recurring: false,
  hasFrequency: false
}];

// Home sizes matching exact pricing tiers
const homeSizes = [{
  id: 'under-1000',
  name: 'Under 1,000 sq ft',
  multiplier: 1,
  description: 'Studio/1 BR apartments'
}, {
  id: '1000-1500',
  name: '1,000 – 1,500 sq ft',
  multiplier: 1,
  description: '1-2 BR condos/homes'
}, {
  id: '1501-2000',
  name: '1,501 – 2,000 sq ft',
  multiplier: 1,
  description: '2-3 BR homes'
}, {
  id: '2001-2500',
  name: '2,001 – 2,500 sq ft',
  multiplier: 1,
  description: '3 BR homes'
}, {
  id: '2501-3000',
  name: '2,501 – 3,000 sq ft',
  multiplier: 1,
  description: '3-4 BR homes'
}, {
  id: '3001-3500',
  name: '3,001 – 3,500 sq ft',
  multiplier: 1,
  description: '4 BR homes'
}, {
  id: '3501-4000',
  name: '3,501 – 4,000 sq ft',
  multiplier: 1,
  description: '4-5 BR homes'
}, {
  id: '4001-5000',
  name: '4,001 – 5,000 sq ft',
  multiplier: 1,
  description: '5 BR homes'
}, {
  id: '5000-plus',
  name: '5,000+ sq ft',
  multiplier: 1,
  description: 'Requires in-person estimate'
}];

// Frequency options for regular cleaning
const frequencyOptions = [{
  id: 'weekly',
  name: 'Weekly',
  discount: 0,
  description: 'Every week - Best value!'
}, {
  id: 'biweekly',
  name: 'Bi-Weekly',
  discount: 0,
  description: 'Every 2 weeks'
}, {
  id: 'monthly',
  name: 'Monthly',
  discount: 0,
  description: 'Once a month'
}, {
  id: 'oneTime',
  name: 'One-Time',
  discount: 0,
  description: 'Single cleaning'
}];

// Add-on services with fixed pricing
const addOnServices = [{
  id: 'fridge',
  name: 'Inside Refrigerator',
  price: 35,
  description: 'Clean and organize'
}, {
  id: 'oven',
  name: 'Inside Oven',
  price: 35,
  description: 'Deep clean interior'
}, {
  id: 'baseboards',
  name: 'Baseboards',
  price: 50,
  description: 'Hand-wipe all baseboards'
}, {
  id: 'cabinets',
  name: 'Cabinet Fronts',
  price: 50,
  description: 'Clean all exterior surfaces'
}, {
  id: 'blinds',
  name: 'Blind Cleaning',
  price: 15,
  description: 'Per blind detailed clean'
}, {
  id: 'garage',
  name: 'Garage Sweep',
  price: 30,
  description: 'Complete garage cleaning'
}];
interface BookingData {
  // Step 1: Service Area & Type
  zipCode: string;
  serviceType: string;
  customerEmail: string; // Move email to step 1

  // Step 2: Service Details
  homeSize: string;
  frequency: string;
  addOns: string[];
  flooringType: string;

  // Step 3: Scheduling & Details
  serviceDate: string;
  serviceTime: string;
  nextDayUpsell: boolean;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  customerName: string;
  contactNumber: string;
  specialInstructions: string;

  // Property details
  bedrooms: string;
  bathrooms: string;
  dwellingType: string;

  // Pricing
  basePrice: number;
  totalPrice: number;
  savings: number;
}
const initialBookingData: BookingData = {
  zipCode: '',
  serviceType: '',
  customerEmail: '',
  homeSize: '',
  frequency: '',
  addOns: [],
  flooringType: '',
  serviceDate: '',
  serviceTime: '',
  nextDayUpsell: false,
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: ''
  },
  customerName: '',
  contactNumber: '',
  specialInstructions: '',
  bedrooms: '',
  bathrooms: '',
  dwellingType: '',
  basePrice: 0,
  totalPrice: 0,
  savings: 0
};
const steps = [{
  id: 1,
  title: 'Service Area & Type',
  icon: MapPin,
  description: 'Choose your service'
}, {
  id: 2,
  title: 'Service Details',
  icon: Home,
  description: 'Size, frequency & add-ons'
}, {
  id: 3,
  title: 'Scheduling & Details',
  icon: Calendar,
  description: 'Date, time & information'
}, {
  id: 4,
  title: 'Review & Payment',
  icon: CreditCard,
  description: 'Complete booking'
}];
export function ModernLegacyBooking() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState<BookingData>(initialBookingData);
  const [zipCodeValid, setZipCodeValid] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  // Payment UI State
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<'25_percent_with_discount' | ''>('25_percent_with_discount');
  const [referralCode, setReferralCode] = useState('');
  const [appliedReferral, setAppliedReferral] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [discountCode, setDiscountCode] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Promo code state
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [promoDiscountCents, setPromoDiscountCents] = useState<number>(0);

  // Embedded payment state
  const [showEmbeddedPayment, setShowEmbeddedPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const updateField = (field: keyof BookingData, value: any) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const updateNestedField = (field: string, nestedField: string, value: any) => {
    setBookingData(prev => ({
      ...prev,
      [field]: {
        ...(prev[field as keyof BookingData] as any),
        [nestedField]: value
      }
    }));
  };

  // Get price using new pricing system and apply 20% global discount
  const getExactPrice = () => {
    if (!bookingData.homeSize) return 0;

    // Handle homes over 5,000 sq ft
    if (bookingData.homeSize === '5000-plus') {
      return 0; // Requires estimate
    }

    // Map home size to approximate square footage midpoint
    const sizeMidpoints: Record<string, number> = {
      'under-1000': 800,
      '1000-1500': 1250,
      '1501-2000': 1750,
      '2001-2500': 2250,
      '2501-3000': 2750,
      '3001-3500': 3250,
      '3501-4000': 3750,
      '4001-5000': 4500
    };
    const approxSqft = sizeMidpoints[bookingData.homeSize] ?? 1500;
    const homeSizeRange = getHomeSizeBySquareFootage(approxSqft);
    if (!homeSizeRange) return 0;

    // Map legacy service type to new system ids
    let serviceTypeId: 'standard' | 'deep' | 'move_in_out' = 'standard';
    if (bookingData.serviceType === 'deep') serviceTypeId = 'deep';else if (bookingData.serviceType === 'moveout') serviceTypeId = 'move_in_out';

    // Map legacy frequency to new system ids
    let frequencyId: 'one_time' | 'weekly' | 'bi_weekly' | 'monthly';
    if (bookingData.serviceType === 'regular') {
      if (bookingData.frequency === 'weekly') frequencyId = 'weekly';else if (bookingData.frequency === 'biweekly') frequencyId = 'bi_weekly';else if (bookingData.frequency === 'monthly') frequencyId = 'monthly';else if (bookingData.frequency === 'oneTime') frequencyId = 'one_time';else return 0; // Require frequency selection for regular
    } else {
      frequencyId = 'one_time';
    }

    // Derive state code from ZIP if possible, otherwise use address state or default to TX
    const cleanZip = (bookingData.zipCode || '').replace(/[^\d]/g, '');
    const zip = /^\d{5}$/.test(cleanZip) ? parseInt(cleanZip, 10) : NaN;
    let stateCode = (bookingData.address?.state || '').toUpperCase();
    const isTexasZip = (z: number) => z === 73301 || z >= 75001 && z <= 79999 || z >= 88510 && z <= 88595;
    const isCaliforniaZip = (z: number) => z >= 90001 && z <= 96162;
    if ((!stateCode || stateCode !== 'TX' && stateCode !== 'CA') && !isNaN(zip)) {
      if (isTexasZip(zip)) stateCode = 'TX';else if (isCaliforniaZip(zip)) stateCode = 'CA';
    }
    if (stateCode !== 'TX' && stateCode !== 'CA') stateCode = 'TX';
    const result = calculateNewPricing(homeSizeRange.id, serviceTypeId, frequencyId, stateCode);
    return result.finalPrice;
  };

  // Calculate pricing whenever relevant fields change
  useEffect(() => {
    const baseServicePrice = getExactPrice();

    // Calculate add-ons total
    const addOnsTotal = bookingData.addOns.reduce((total, addOnId) => {
      const addOn = addOnServices.find(a => a.id === addOnId);
      return total + (addOn?.price || 0);
    }, 0);

    const totalPrice = baseServicePrice + addOnsTotal;
    updateField('basePrice', baseServicePrice);
    updateField('totalPrice', totalPrice);
    updateField('savings', 0);
  }, [bookingData.homeSize, bookingData.serviceType, bookingData.frequency, bookingData.addOns]);

  // Validate ZIP code
  useEffect(() => {
    if (bookingData.zipCode && bookingData.zipCode.length === 5) {
      const validation = validateServiceAreaZipCode(bookingData.zipCode, bookingData.address.state);
      setZipCodeValid(validation.isValid);
      if (!validation.isValid) {
        toast.error(validation.message || 'ZIP code not in service area');
      }
    } else {
      setZipCodeValid(false);
    }
  }, [bookingData.zipCode]);
  // Basic email validation
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validation for step progression
  const getStepValidationMessage = (step: number): string => {
    switch (step) {
      case 1:
        if (!zipCodeValid) return "Please enter a valid ZIP code in our service area";
        if (!bookingData.customerEmail) return "Please enter your email address";
        if (!isValidEmail(bookingData.customerEmail)) return "Please enter a valid email address";
        if (!bookingData.serviceType) return "Please select a service type";
        return "";
      case 2:
        if (bookingData.homeSize === '5000-plus') return "Homes over 5,000 sq ft require a phone consultation";
        if (!bookingData.homeSize) return "Please select your home size";
        if (!bookingData.flooringType) return "Please select your primary flooring type";
        if (bookingData.serviceType === 'regular' && !bookingData.frequency) return "Please select a cleaning frequency";
        if (!bookingData.bedrooms) return "Please specify number of bedrooms";
        if (!bookingData.bathrooms) return "Please specify number of bathrooms";
        if (!bookingData.dwellingType) return "Please specify dwelling type";
        return "";
      case 3:
        if (!bookingData.serviceDate && !bookingData.nextDayUpsell) return "Please select a service date";
        if (!bookingData.serviceTime) return "Please select a service time";
        if (!bookingData.address.street) return "Please enter your address";
        if (!bookingData.customerName) return "Please enter your name";
        if (!bookingData.contactNumber) return "Please enter your phone number";
        return "";
      default:
        return "";
    }
  };
  const canProceedToNext = (): boolean => {
    return getStepValidationMessage(currentStep) === "";
  };
  const handleNext = () => {
    if (canProceedToNext()) {
      if (currentStep === 4) {
        // Handle payment based on selected option
        handleBooking();
      } else {
        setCurrentStep(prev => prev + 1);
        // Enhanced auto-scroll to step content
        scrollToStepContent(containerRef, 150);
      }
    }
  };
  const handleBooking = async () => {
    if (!selectedPaymentOption) {
      toast.error('Please select a payment option');
      return;
    }
    if (!bookingData.totalPrice || bookingData.totalPrice <= 0) {
      console.warn('Aborting booking: invalid totalPrice', bookingData.totalPrice);
      toast.error('Please complete your selections to get a valid price before booking.');
      return;
    }
    setIsProcessingPayment(true);
    try {
      // Handle 20% deposit payment (only available option)
      console.log('Creating 20% deposit payment intent');
      const response = await supabase.functions.invoke('create-payment', {
        body: {
          payment_type: 'deposit_20',
          fullAmount: bookingData.totalPrice,
          booking_data: bookingData,
          customerEmail: bookingData.customerEmail,
          customerName: bookingData.customerName
        }
      });
      if (response.error) {
        throw response.error;
      }
      if (response.data?.clientSecret) {
        console.log('Payment intent created, showing embedded form');
        setClientSecret(response.data.clientSecret);
        setPaymentIntentId(response.data.paymentIntentId || null);
        setShowEmbeddedPayment(true);
      } else {
        throw new Error('No client secret received');
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to process booking. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      // Auto-scroll to top of container
      setTimeout(() => {
        containerRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  };
  const toggleAddOn = (addOnId: string) => {
    const newAddOns = bookingData.addOns.includes(addOnId) ? bookingData.addOns.filter(id => id !== addOnId) : [...bookingData.addOns, addOnId];
    updateField('addOns', newAddOns);
  };

  // Handle embedded payment form
  if (showEmbeddedPayment && clientSecret) {
    const depositAmount = bookingData.totalPrice * 0.2;
    return <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Button variant="outline" onClick={() => {
          setShowEmbeddedPayment(false);
          setClientSecret(null);
        }} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Review
          </Button>
        </div>
        
        <EmbeddedSquarePaymentForm 
          paymentAmount={selectedPaymentOption === '25_percent_with_discount' ? depositAmount : bookingData.totalPrice}
          fullAmount={bookingData.totalPrice}
          paymentType={selectedPaymentOption === '25_percent_with_discount' ? "deposit" : "full"}
          customerEmail={bookingData.customerEmail}
          customerName={bookingData.customerName}
          customerPhone={bookingData.customerEmail}
          onSuccess={async (paymentId) => {
        console.log('Payment successful, creating order');
        setIsProcessingPayment(true);
        try {
          // Create order record with deposit payment
          const {
            data: orderResult,
            error: orderError
          } = await supabase.functions.invoke('create-order-with-deposit', {
            body: {
              bookingData,
              paymentIntentId: paymentIntentId || '',
              depositAmount: bookingData.totalPrice * 0.2,
              totalAmount: bookingData.totalPrice,
              customerEmail: bookingData.customerEmail,
              customerName: bookingData.customerName
            }
          });
          if (orderError || !orderResult?.orderId) {
            console.error('Error creating order:', orderError);
            navigate(`/order-status?session_id=${paymentIntentId}`);
            return;
          }
          console.log('Order created successfully:', orderResult.orderId);

          // Redirect to confirmation with order ID using React Router
          navigate(`/order-confirmation/${orderResult.orderId}`);
        } catch (error) {
          console.error('Error in order creation:', error);
          toast.error('Payment successful but failed to create order. Please contact support.');
        } finally {
          setIsProcessingPayment(false);
        }
      }} onCancel={() => {
        setShowEmbeddedPayment(false);
        setClientSecret(null);
      }} />
      </div>;
  }
  if (showCheckout) {
    return <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Button variant="outline" onClick={() => setShowCheckout(false)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Review
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Payment Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="h-6 w-6 text-primary" />
                    <div>
                      <h4 className="font-semibold text-lg">20% Deposit Required</h4>
                      <p className="text-sm text-muted-foreground">
                        Pay just 20% now to secure your booking. Remaining balance due after service completion.
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4 p-3 rounded-md bg-background/50">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Service Cost</p>
                      <p className="text-lg font-bold">${formatPrice(bookingData.totalPrice)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Deposit Due Today</p>
                      <p className="text-lg font-bold text-primary">${formatPrice(bookingData.totalPrice * 0.2)}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t">
                    <p className="text-sm text-muted-foreground">
                      Remaining balance of <strong>${formatPrice(bookingData.totalPrice * 0.8)}</strong> will be charged after your cleaning is completed.
                    </p>
                  </div>
                </div>

                <Button onClick={async () => {
                setIsProcessingPayment(true);
                try {
                  console.log("Creating 20% deposit payment intent...");
                  const response = await supabase.functions.invoke('create-payment', {
                    body: {
                      payment_type: 'deposit_20',
                      fullAmount: bookingData.totalPrice,
                      // Send in dollars
                      booking_data: bookingData,
                      customerEmail: bookingData.customerEmail,
                      customerName: bookingData.customerName
                    }
                  });
                  if (response.error) {
                    throw response.error;
                  }
                  if (response.data?.clientSecret) {
                    console.log("Payment intent created, showing embedded form");
                    setClientSecret(response.data.clientSecret);
                    setShowEmbeddedPayment(true);
                  } else {
                    throw new Error('No client secret received');
                  }
                } catch (error) {
                  console.error('Payment error:', error);
                  toast.error('Failed to initialize payment. Please try again.');
                } finally {
                  setIsProcessingPayment(false);
                }
              }} disabled={isProcessingPayment} className="w-full h-12 text-lg" size="lg">
                  {isProcessingPayment ? <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Preparing Payment...
                    </div> : <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Pay 20% Deposit - ${formatPrice(bookingData.totalPrice * 0.2)}
                    </div>}
                </Button>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Secure payment powered by Stripe</span>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Column - Pricing Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Pricing Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service Type:</span>
                    <span className="font-medium capitalize">{bookingData.serviceType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Home Size:</span>
                    <span className="font-medium">{homeSizes.find(s => s.id === bookingData.homeSize)?.name}</span>
                  </div>
                  {bookingData.frequency && <div className="flex justify-between">
                      <span className="text-muted-foreground">Frequency:</span>
                      <span className="font-medium">{frequencyOptions.find(f => f.id === bookingData.frequency)?.name}</span>
                    </div>}
                  {bookingData.addOns.length > 0 && <div className="space-y-2">
                      <span className="text-muted-foreground">Add-ons:</span>
                      {bookingData.addOns.map(addOnId => {
                    const addOn = addOnServices.find(a => a.id === addOnId);
                    return <div key={addOnId} className="flex justify-between text-sm">
                            <span>• {addOn?.name}</span>
                            <span>{formatPrice(addOn?.price || 0)}</span>
                          </div>;
                  })}
                    </div>}
                </div>
                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>{formatPrice(bookingData.basePrice + bookingData.addOns.reduce((total, addOnId) => {
                      const addOn = addOnServices.find(a => a.id === addOnId);
                      return total + (addOn?.price || 0);
                    }, 0))}</span>
                  </div>
                  <div className="flex justify-between text-success">
                    <span>20% Savings Applied:</span>
                    <span>-{formatPrice(calculateGlobalDiscountAmount(bookingData.basePrice + bookingData.addOns.reduce((total, addOnId) => {
                      const addOn = addOnServices.find(a => a.id === addOnId);
                      return total + (addOn?.price || 0);
                    }, 0)))}</span>
                  </div>
                  {appliedReferral && <div className="flex justify-between text-success">
                      <span>Referral Discount ({appliedReferral.discount}%):</span>
                      <span>-{formatPrice(bookingData.totalPrice * (appliedReferral.discount / 100))}</span>
                    </div>}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span className="text-primary">{formatPrice(bookingData.totalPrice)}</span>
                  </div>
                </div>
                {selectedPaymentOption === '25_percent_with_discount' && <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Today (25%):</span>
                        <span className="font-medium">{formatPrice(bookingData.totalPrice * 0.95 * 0.25)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>After Service:</span>
                        <span className="font-medium">{formatPrice(bookingData.totalPrice * 0.95 * 0.75)}</span>
                      </div>
                      <div className="flex justify-between text-success font-semibold border-t pt-1">
                        <span>Total Savings:</span>
                        <span>-{formatPrice(bookingData.totalPrice * 0.05)}</span>
                      </div>
                    </div>
                  </div>}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>;
  }
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <div className="space-y-8">
            <Card className="border-primary/20 shadow-lg bg-gradient-to-br from-card to-secondary/10">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  Service Area & Contact
                </CardTitle>
                <p className="text-muted-foreground mt-2">Let's start by checking if we service your area</p>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* Mobile-Optimized ZIP Code Input */}
                  <div className="relative">
                    <Label htmlFor="zipCode" className="text-base font-medium text-foreground mb-3 block">
                      ZIP Code *
                    </Label>
                    <Input id="zipCode" type="text" placeholder="Enter your ZIP code" value={bookingData.zipCode} onChange={e => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                    updateField('zipCode', value);
                  }} className={cn("mobile-input text-lg lg:text-base transition-all duration-200 border-2", zipCodeValid && bookingData.zipCode ? "ring-2 ring-success border-success" : "", bookingData.zipCode && !zipCodeValid ? "ring-2 ring-destructive border-destructive" : "", "focus:ring-2 focus:ring-primary focus:border-primary")} maxLength={5} inputMode="numeric" pattern="[0-9]*" />
                    <p className="mobile-body text-muted-foreground mt-2 text-center">
                      Check availability and exact pricing for your area
                    </p>
                    <div className="mt-3 min-h-[2rem]">
                      {zipCodeValid ? <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                          <p className="text-success text-sm font-medium flex items-center gap-2 justify-center">
                            <CheckCircle className="w-4 h-4" />
                            Perfect! We provide excellent service in your area
                          </p>
                        </div> : bookingData.zipCode.length === 5 ? <p className="text-destructive text-sm flex items-center gap-2 justify-center">
                          <span className="w-4 h-4 rounded-full bg-destructive flex items-center justify-center text-destructive-foreground text-xs">!</span>
                          Sorry, we currently service Texas & California only
                        </p> : null}
                    </div>
                  </div>
                  
                  {/* Mobile-Optimized Email Input */}
                  {zipCodeValid && <div>
                      <Label htmlFor="email" className="text-base font-medium text-foreground mb-3 block">
                        Email Address *
                      </Label>
                      <Input id="email" type="email" placeholder="your@email.com" value={bookingData.customerEmail} onChange={e => updateField('customerEmail', e.target.value)} className={cn("mobile-input text-lg lg:text-base transition-all duration-200 border-2", isValidEmail(bookingData.customerEmail) && bookingData.customerEmail ? "ring-2 ring-success border-success" : bookingData.customerEmail && !isValidEmail(bookingData.customerEmail) ? "ring-2 ring-destructive border-destructive" : "focus:ring-2 focus:ring-primary focus:border-primary")} />
                      <p className="mobile-body text-muted-foreground mt-2 text-center flex items-center gap-2 justify-center">
                        <Shield className="w-4 h-4" />
                        We'll send your booking confirmation and service updates here
                      </p>
                      {bookingData.customerEmail && <p className={cn("text-sm mt-2 text-center font-medium", isValidEmail(bookingData.customerEmail) ? "text-success" : "text-destructive")}>
                          {isValidEmail(bookingData.customerEmail) ? "✓ Valid email address" : "Please enter a valid email address"}
                        </p>}
                    </div>}
                </div>
              </CardContent>
            </Card>

            {/* Service Type Selection */}
            {zipCodeValid && bookingData.customerEmail && <EnhancedServiceTypeCards 
              serviceTypes={serviceTypes} 
              selectedType={bookingData.serviceType} 
              onSelect={typeId => updateField('serviceType', typeId)}
              currentPrice={getExactPrice()}
            />}
          </div>;
      case 2:
        return <div className="space-y-8">
            {/* Home Size Selection */}
            <Card className="border-primary/20 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Home className="w-5 h-5 text-primary" />
                  </div>
                  Home Size & Details
                </CardTitle>
                <p className="text-muted-foreground mt-2">Help us provide accurate pricing for your space</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {homeSizes.map(size => <Card key={size.id} className={cn("cursor-pointer border-2 transition-all hover:shadow-md mobile-touch-target", size.id === '5000-plus' && "border-warning bg-warning/5", bookingData.homeSize === size.id ? "border-primary bg-primary/5 shadow-md" : size.id === '5000-plus' ? "border-warning hover:border-warning/70" : "border-border hover:border-primary/50")} onClick={() => {
                  updateField('homeSize', size.id);
                  if (size.id === '5000-plus') {
                    toast.info('Homes over 5,000 sq ft require an in-person estimate. Please call to schedule.');
                  }
                }}>
                      <CardContent className="p-4">
                        <h3 className="font-semibold">{size.name}</h3>
                        <p className="text-sm text-muted-foreground">{size.description}</p>
                        {size.id === '5000-plus' && <Badge variant="outline" className="mt-2 border-warning text-warning">
                            Call Required
                          </Badge>}
                        {bookingData.homeSize === size.id && (
                          <Badge className="mt-2 bg-primary/20 text-primary border-primary/30" variant="outline">
                            Selected
                          </Badge>
                        )}
                      </CardContent>
                    </Card>)}
                </div>

                {/* Real-time pricing display */}
                {bookingData.homeSize && bookingData.homeSize !== '5000-plus' && getExactPrice() > 0 && (
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center mb-6">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {formatPrice(getExactPrice())}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Current pricing based on your selections
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Property Details - New consolidated section */}
            {bookingData.homeSize && bookingData.homeSize !== '5000-plus' && (
              <PropertyDetailsSelector
                bedrooms={bookingData.bedrooms}
                bathrooms={bookingData.bathrooms}
                dwellingType={bookingData.dwellingType}
                flooringType={bookingData.flooringType}
                onBedroomsChange={(value) => updateField('bedrooms', value)}
                onBathroomsChange={(value) => updateField('bathrooms', value)}
                onDwellingTypeChange={(value) => updateField('dwellingType', value)}
                onFlooringTypeChange={(value) => updateField('flooringType', value)}
              />
            )}

            {/* Frequency Selection - Only for Regular Cleaning */}
            {bookingData.homeSize && bookingData.homeSize !== '5000-plus' && bookingData.serviceType === 'regular' && <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Frequency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {frequencyOptions.map(option => {
                  // Calculate price using new pricing system for each frequency option
                  const sizeMidpoints: Record<string, number> = {
                    'under-1000': 800,
                    '1000-1500': 1250,
                    '1501-2000': 1750,
                    '2001-2500': 2250,
                    '2501-3000': 2750,
                    '3001-3500': 3250,
                    '3501-4000': 3750,
                    '4001-5000': 4500
                  };
                  const approxSqft = sizeMidpoints[bookingData.homeSize] ?? 1500;
                  const homeSizeRange = getHomeSizeBySquareFootage(approxSqft);

                  // Derive state code similar to main calculation
                  const cleanZip = (bookingData.zipCode || '').replace(/[^\d]/g, '');
                  const zip = /^\d{5}$/.test(cleanZip) ? parseInt(cleanZip, 10) : NaN;
                  let stateCode = (bookingData.address?.state || '').toUpperCase();
                  const isTexasZip = (z: number) => z === 73301 || z >= 75001 && z <= 79999 || z >= 88510 && z <= 88595;
                  const isCaliforniaZip = (z: number) => z >= 90001 && z <= 96162;
                  if ((!stateCode || stateCode !== 'TX' && stateCode !== 'CA') && !isNaN(zip)) {
                    if (isTexasZip(zip)) stateCode = 'TX';else if (isCaliforniaZip(zip)) stateCode = 'CA';
                  }
                  if (stateCode !== 'TX' && stateCode !== 'CA') stateCode = 'TX';

                  // Map frequency id
                  const freqId = option.id === 'weekly' ? 'weekly' : option.id === 'biweekly' ? 'bi_weekly' : option.id === 'monthly' ? 'monthly' : 'one_time';
                  const price = homeSizeRange ? applyGlobalDiscount(calculateNewPricing(homeSizeRange.id, 'standard', freqId, stateCode).finalPrice) : 0;
                  return <Card key={option.id} className={cn("cursor-pointer border-2 transition-all hover:shadow-md relative", bookingData.frequency === option.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")} onClick={() => updateField('frequency', option.id)}>
                          <CardContent className="p-4 text-center">
                            <h3 className="font-semibold">{option.name}</h3>
                            <p className="text-sm text-muted-foreground">{option.description}</p>
                            {price > 0 && <p className="text-lg font-bold text-primary mt-2">
                                {formatPrice(price)}
                              </p>}
                          </CardContent>
                        </Card>;
                })}
                  </div>
                </CardContent>
              </Card>}

            {/* Show price for Deep Clean and Move-Out */}
            {bookingData.homeSize && bookingData.homeSize !== '5000-plus' && (bookingData.serviceType === 'deep' || bookingData.serviceType === 'moveout') && <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6 text-center">
                  <h3 className="text-2xl font-bold text-primary">
                    {formatPrice(getExactPrice())}
                  </h3>
                  <p className="text-muted-foreground">
                    {bookingData.serviceType === 'deep' ? 'Deep Cleaning' : 'Move-Out Cleaning'} Price
                  </p>
                </CardContent>
              </Card>}

            {/* Large Home Estimate Notice */}
            {bookingData.homeSize === '5000-plus' && <Card className="bg-warning/5 border-warning/20">
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl font-bold text-warning mb-2">
                    In-Person Estimate Required
                  </h3>
                   <p className="text-muted-foreground">
                     Homes over 5,000 sq ft require an in-person estimate. Please call us to schedule your consultation.
                   </p>
                  <Button className="mt-4" variant="outline">
                    Call for Estimate
                  </Button>
                </CardContent>
              </Card>}

            {/* Add-ons Selection */}
            {(bookingData.serviceType === 'regular' && bookingData.frequency || bookingData.serviceType !== 'regular' && bookingData.homeSize && bookingData.homeSize !== '5000-plus') && <Card>
                <CardHeader>
                  <CardTitle>Optional Add-Ons</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addOnServices.map(addOn => <Card key={addOn.id} className={cn("cursor-pointer border transition-all hover:shadow-md", bookingData.addOns.includes(addOn.id) ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")} onClick={() => toggleAddOn(addOn.id)}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium">{addOn.name}</h4>
                              <p className="text-sm text-muted-foreground">{addOn.description}</p>
                            </div>
                            <div className="ml-4 text-right">
                              <p className="font-semibold">{formatPrice(addOn.price)}</p>
                              {bookingData.addOns.includes(addOn.id) && <CheckCircle className="h-4 w-4 text-success mt-1 ml-auto" />}
                            </div>
                          </div>
                        </CardContent>
                      </Card>)}
                  </div>
                </CardContent>
              </Card>}
          </div>;
      case 3:
        return <div className="space-y-8">
            {/* Enhanced Scheduling */}
            <EnhancedSchedulingStep selectedDate={bookingData.serviceDate ? parseLocalDate(bookingData.serviceDate) : undefined} selectedTime={bookingData.serviceTime} nextDayUpsell={bookingData.nextDayUpsell} onDateChange={date => updateField('serviceDate', date ? toLocalDate(date) : '')} onTimeChange={time => updateField('serviceTime', time)} onNextDayToggle={enabled => {
            updateField('nextDayUpsell', enabled);
            if (enabled) {
              // Clear regular date selection when next-day is enabled
              updateField('serviceDate', '');
            }
          }} serviceType={bookingData.serviceType} />

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Your Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerName">Full Name *</Label>
                    <Input id="customerName" value={bookingData.customerName} onChange={e => updateField('customerName', e.target.value)} placeholder="Your full name" />
                  </div>
                  <div>
                    <Label htmlFor="customerEmailDisplay">Email Address</Label>
                    <Input id="customerEmailDisplay" type="email" value={bookingData.customerEmail} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground mt-1">Email was entered in step 1</p>
                  </div>
                  <div>
                    <Label htmlFor="contactNumber">Phone Number *</Label>
                    <Input id="contactNumber" value={bookingData.contactNumber} onChange={e => updateField('contactNumber', e.target.value)} placeholder="(555) 123-4567" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property Address */}
            <Card>
              <CardHeader>
                <CardTitle>Property Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="street">Street Address *</Label>
                  <Input id="street" value={bookingData.address.street} onChange={e => updateNestedField('address', 'street', e.target.value)} placeholder="123 Main Street" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={bookingData.address.city} onChange={e => updateNestedField('address', 'city', e.target.value)} placeholder="City" />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Select value={bookingData.address.state} onValueChange={value => updateNestedField('address', 'state', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select State" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATE_ABBREVIATIONS.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="addressZip">ZIP Code</Label>
                    <Input id="addressZip" value="78704" disabled className="bg-gray-50 text-gray-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Special Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Special Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="specialInstructions">Special Instructions</Label>
                  <Textarea id="specialInstructions" value={bookingData.specialInstructions} onChange={e => updateField('specialInstructions', e.target.value)} placeholder="Any special instructions or areas of focus..." rows={3} />
                  <p className="text-sm text-muted-foreground mt-2">
                    Let us know about any specific areas you'd like us to focus on or avoid
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>;
      case 4:
        return <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Review Your Booking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Service Summary */}
                <div>
                  <h3 className="font-semibold mb-2">Service Details</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Service:</span> {serviceTypes.find(s => s.id === bookingData.serviceType)?.name}</p>
                    <p><span className="font-medium">Home Size:</span> {homeSizes.find(h => h.id === bookingData.homeSize)?.name}</p>
                    {bookingData.frequency && <p><span className="font-medium">Frequency:</span> {frequencyOptions.find(f => f.id === bookingData.frequency)?.name}</p>}
                    <p><span className="font-medium">Date & Time:</span> {bookingData.nextDayUpsell ? 'Next Day Service' : bookingData.serviceDate} at {bookingData.serviceTime}</p>
                    <p><span className="font-medium">Address:</span> {bookingData.address.street}, {bookingData.address.city}, {bookingData.address.state} {bookingData.address.zipCode}</p>
                  </div>
                </div>

                {/* Add-ons */}
                {bookingData.addOns.length > 0 && <div>
                    <h3 className="font-semibold mb-2">Add-On Services</h3>
                    <div className="space-y-1 text-sm">
                      {bookingData.addOns.map(addOnId => {
                    const addOn = addOnServices.find(a => a.id === addOnId);
                    return addOn && <p key={addOnId}>
                            <span className="font-medium">{addOn.name}:</span> {formatPrice(addOn.price)}
                          </p>;
                  })}
                    </div>
                  </div>}

                {/* Contact Information */}
                <div>
                  <h3 className="font-semibold mb-2">Contact Information</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Name:</span> {bookingData.customerName}</p>
                    <p><span className="font-medium">Email:</span> {bookingData.customerEmail}</p>
                    <p><span className="font-medium">Phone:</span> {bookingData.contactNumber}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Promo Code Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  Promo Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PromoCodeInput
                  subtotalCents={Math.round(bookingData.totalPrice * 100)}
                  bookingType="ONE_TIME"
                  onApply={(code, discountCents) => {
                    setAppliedPromoCode(code);
                    setPromoDiscountCents(discountCents);
                  }}
                  onRemove={() => {
                    setAppliedPromoCode(null);
                    setPromoDiscountCents(0);
                  }}
                  appliedCode={appliedPromoCode || undefined}
                  appliedDiscount={promoDiscountCents}
                />
              </CardContent>
            </Card>

            {/* Payment Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Choose Payment Option
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Price Summary with Promo */}
                {promoDiscountCents > 0 && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>${formatPrice(bookingData.totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400 font-medium">
                      <span>Promo Discount:</span>
                      <span>-${(promoDiscountCents / 100).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-green-200 dark:border-green-800 pt-2 flex justify-between font-bold">
                      <span>New Total:</span>
                      <span className="text-green-600 dark:text-green-400">
                        ${formatPrice(Math.max(0, bookingData.totalPrice - (promoDiscountCents / 100)))}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* 20% Deposit Option - Only Available Option */}
                <Card className="cursor-pointer border-2 transition-all border-primary bg-primary/5 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-6 w-6 text-primary" />
                        <div>
                          <h4 className="font-semibold">Pay 20% Deposit Now</h4>
                          <p className="text-sm text-muted-foreground">
                            Secure your booking with a small deposit
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">
                          ${formatPrice(Math.max(0, bookingData.totalPrice - (promoDiscountCents / 100)) * 0.2)}
                        </p>
                        <p className="text-xs text-muted-foreground">Today only</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>;
      default:
        return null;
    }
  };
  return <div ref={containerRef} className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-[1400px]">
        <div className="w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-4">
              <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-lg px-4 py-2 animate-pulse">GET 20% OFF ALL SERVICES!</Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Book Your Cleaning Service
            </h1>
            <p className="text-muted-foreground text-lg">Premium cleaning services in Texas & California</p>
            <p className="text-sm text-success font-semibold mt-2">
              All prices already include 20% discount - Save big today!
            </p>
            
            {/* Trust Signal */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-4 h-4 fill-warning text-warning" />)}
              </div>
              <span className="text-muted-foreground text-sm font-medium">Trusted by 150+ TX & CA families served</span>
            </div>
          </div>

          {/* Enhanced Progress Steps */}
          <EnhancedProgressIndicator steps={steps} currentStep={currentStep} className="mb-8" />

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="flex-1">
              {renderStepContent()}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleNext} disabled={!canProceedToNext() || isProcessingPayment} className={cn("mobile-touch-target text-lg lg:text-base font-medium transition-all duration-200", canProceedToNext() ? "animate-pulse" : "", currentStep === 4 ? "bg-success hover:bg-success/90" : "bg-primary hover:bg-primary/90")} size="lg">
                  {isProcessingPayment ? <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </div> : currentStep === 4 ? 'Complete Booking' : 'Next Step'}
                  {!isProcessingPayment && <ArrowRight className="h-4 w-4 ml-2" />}
                </Button>
              </div>
            </div>

            {/* Pricing Summary Sidebar */}
            <div className="w-full lg:w-80">
              <PricingSummarySticky bookingData={bookingData} serviceTypes={serviceTypes} homeSizes={homeSizes} frequencyOptions={frequencyOptions} addOnServices={addOnServices} />
            </div>
          </div>
        </div>
      </div>
    </div>;
}