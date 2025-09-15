import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CheckCircle, ArrowRight, ArrowLeft, Calendar, CreditCard, Home, MapPin, Clock, Sparkles, Star, Shield, Zap, Tag, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { validateServiceAreaZipCode } from '@/lib/service-area-validation';
import { formatPrice, applyGlobalDiscount, calculateGlobalDiscountAmount } from '@/lib/pricing-utils';
import { supabase } from '@/integrations/supabase/client';

import { ServiceTypeCards } from './ServiceTypeCards';
import { PricingSummarySticky } from './PricingSummarySticky';
import { EnhancedSchedulingStep } from './EnhancedSchedulingStep';
import { toLocalDate, parseLocalDate } from '@/lib/date-helpers';

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
const serviceTypes = [
  {
    id: 'regular',
    name: 'Regular Cleaning',
    description: 'Perfect for regular maintenance cleaning',
    basePrice: 0, // Using exact pricing matrix
    icon: Home,
    popular: true,
    features: [
      'All surfaces dusted and wiped',
      'Floors vacuumed and mopped',
      'Bathrooms cleaned and sanitized',
      'Kitchen cleaned',
      'Trash emptied'
    ],
    recurring: true,
    hasFrequency: true
  },
  {
    id: 'deep',
    name: 'Deep Cleaning',
    description: 'Comprehensive top-to-bottom cleaning',
    basePrice: 0, // Using exact pricing matrix
    icon: Sparkles,
    popular: false,
    features: [
      'Everything in Regular Clean',
      'Inside appliances cleaned',
      'Detailed bathroom sanitization',
      'Light fixtures dusted',
      'Window sills cleaned',
      'Baseboards wiped'
    ],
    recurring: false,
    hasFrequency: false
  },
  {
    id: 'moveout',
    name: 'Move-Out Cleaning',
    description: 'Leave your old home spotless',
    basePrice: 0, // Using exact pricing matrix
    icon: Zap,
    popular: false,
    features: [
      'Everything in Deep Clean',
      'Cabinet interiors wiped',
      'Appliance deep clean',
      'Final walk-through',
      'Damage deposit protection'
    ],
    recurring: false,
    hasFrequency: false
  }
];

// Home sizes matching exact pricing tiers
const homeSizes = [
  { id: 'under-1000', name: 'Under 1,000 sq ft', multiplier: 1, description: 'Studio/1 BR apartments' },
  { id: '1001-1400', name: '1,001 - 1,400 sq ft', multiplier: 1, description: '1-2 BR condos/homes' },
  { id: '1401-1800', name: '1,401 - 1,800 sq ft', multiplier: 1, description: '2-3 BR homes' },
  { id: '1801-2400', name: '1,801 - 2,400 sq ft', multiplier: 1, description: '3 BR homes' },
  { id: '2401-2800', name: '2,401 - 2,800 sq ft', multiplier: 1, description: '3-4 BR homes' },
  { id: '2801-3300', name: '2,801 - 3,300 sq ft', multiplier: 1, description: '4 BR homes' },
  { id: '3301-3900', name: '3,301 - 3,900 sq ft', multiplier: 1, description: '4-5 BR homes' },
  { id: '3901-4500', name: '3,901 - 4,500 sq ft', multiplier: 1, description: '5 BR homes' },
  { id: '4501-5100', name: '4,501 - 5,100 sq ft', multiplier: 1, description: '5+ BR homes' },
  { id: 'over-5100', name: '5,100+ sq ft', multiplier: 1, description: 'Requires in-person estimate' }
];

// Frequency options for regular cleaning
const frequencyOptions = [
  { id: 'weekly', name: 'Weekly', discount: 0, description: 'Every week - Best value!' },
  { id: 'biweekly', name: 'Bi-Weekly', discount: 0, description: 'Every 2 weeks' },
  { id: 'monthly', name: 'Monthly', discount: 0, description: 'Once a month' },
  { id: 'oneTime', name: 'One-Time', discount: 0, description: 'Single cleaning' }
];

// Add-on services with fixed pricing
const addOnServices = [
  { id: 'fridge', name: 'Inside Refrigerator', price: 35, description: 'Clean and organize' },
  { id: 'oven', name: 'Inside Oven', price: 35, description: 'Deep clean interior' },
  { id: 'baseboards', name: 'Baseboards', price: 50, description: 'Hand-wipe all baseboards' },
  { id: 'cabinets', name: 'Cabinet Fronts', price: 50, description: 'Clean all exterior surfaces' },
  { id: 'blinds', name: 'Blind Cleaning', price: 15, description: 'Per blind detailed clean' },
  { id: 'garage', name: 'Garage Sweep', price: 30, description: 'Complete garage cleaning' }
];

interface BookingData {
  // Step 1: Service Area & Type
  zipCode: string;
  serviceType: string;
  
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
  customerEmail: string;
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
    state: 'TX',
    zipCode: ''
  },
  customerName: '',
  customerEmail: '',
  contactNumber: '',
  specialInstructions: '',
  bedrooms: '',
  bathrooms: '',
  dwellingType: '',
  basePrice: 0,
  totalPrice: 0,
  savings: 0
};

const steps = [
  { id: 1, title: 'Service Area & Type', icon: MapPin, description: 'Choose your service' },
  { id: 2, title: 'Service Details', icon: Home, description: 'Size, frequency & add-ons' },
  { id: 3, title: 'Scheduling & Details', icon: Calendar, description: 'Date, time & information' },
  { id: 4, title: 'Review & Payment', icon: CreditCard, description: 'Complete booking' }
];

export function ModernLegacyBooking() {
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState<BookingData>(initialBookingData);
  const [zipCodeValid, setZipCodeValid] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  
  // Payment UI State
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<'pay_after_service' | '25_percent_with_discount' | ''>('');
  const [referralCode, setReferralCode] = useState('');
  const [appliedReferral, setAppliedReferral] = useState<{code: string, discount: number} | null>(null);
  const [discountCode, setDiscountCode] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  const containerRef = React.useRef<HTMLDivElement>(null);

  const updateField = (field: keyof BookingData, value: any) => {
    setBookingData(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedField = (field: string, nestedField: string, value: any) => {
    setBookingData(prev => ({
      ...prev,
      [field]: { ...(prev[field as keyof BookingData] as any), [nestedField]: value }
    }));
  };

  // Get exact price from pricing matrix with 20% discount applied
  const getExactPrice = () => {
    if (!bookingData.homeSize) return 0;
    
    // Handle homes over 5,100 sq ft
    if (bookingData.homeSize === 'over-5100') {
      return 0; // Requires estimate
    }

    const sizePricing = pricingMatrix[bookingData.homeSize as keyof typeof pricingMatrix];
    if (!sizePricing) return 0;

    let originalPrice = 0;
    
    if (bookingData.serviceType === 'regular' && bookingData.frequency) {
      originalPrice = sizePricing[bookingData.frequency as keyof typeof sizePricing] || 0;
    } else if (bookingData.serviceType === 'deep') {
      originalPrice = sizePricing.deepClean;
    } else if (bookingData.serviceType === 'moveout') {
      originalPrice = sizePricing.deepClean; // Move-out uses same pricing as deep clean
    }

    // Apply 20% global discount
    return applyGlobalDiscount(originalPrice);
  };

  // Calculate pricing whenever relevant fields change with 20% discount applied
  useEffect(() => {
    const discountedPrice = getExactPrice(); // Already includes 20% discount
    
    // Calculate add-ons total
    const addOnsTotal = bookingData.addOns.reduce((total, addOnId) => {
      const addOn = addOnServices.find(a => a.id === addOnId);
      return total + (addOn?.price || 0);
    }, 0);

    // Calculate discounted add-ons (20% off add-ons too)
    const discountedAddOnsTotal = applyGlobalDiscount(addOnsTotal);
    const totalPrice = discountedPrice + discountedAddOnsTotal;

    updateField('basePrice', discountedPrice);
    updateField('totalPrice', totalPrice);
    updateField('savings', 0);
  }, [bookingData.homeSize, bookingData.serviceType, bookingData.frequency, bookingData.addOns]);

  // Validate ZIP code
  useEffect(() => {
    if (bookingData.zipCode && bookingData.zipCode.length === 5) {
      const validation = validateServiceAreaZipCode(bookingData.zipCode);
      setZipCodeValid(validation.isValid);
      if (!validation.isValid) {
        toast.error(validation.message || 'ZIP code not in service area');
      }
    } else {
      setZipCodeValid(false);
    }
  }, [bookingData.zipCode]);

  const canProceedToNext = (): boolean => {
    switch (currentStep) {
      case 1:
        return zipCodeValid && bookingData.serviceType !== '';
      case 2:
        // Handle homes over 5,100 sq ft
        if (bookingData.homeSize === 'over-5100') {
          return false; // Block progression - requires estimate
        }
        // Regular cleaning requires frequency selection and flooring type
        if (bookingData.serviceType === 'regular') {
          return bookingData.homeSize !== '' && bookingData.frequency !== '' && bookingData.flooringType !== '';
        }
        // Deep clean and move-out need home size and flooring type
        return bookingData.homeSize !== '' && bookingData.flooringType !== '';
      case 3:
        return (
          (bookingData.serviceDate !== '' || bookingData.nextDayUpsell) &&
          bookingData.serviceTime !== '' &&
          bookingData.address.street !== '' &&
          bookingData.customerName !== '' &&
          bookingData.customerEmail !== '' &&
          bookingData.contactNumber !== '' &&
          bookingData.bedrooms !== '' &&
          bookingData.bathrooms !== '' &&
          bookingData.dwellingType !== ''
        );
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceedToNext()) {
      if (currentStep === 4) {
        setShowCheckout(true);
      } else {
        setCurrentStep(prev => prev + 1);
        // Auto-scroll to top of container
        setTimeout(() => {
          containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      // Auto-scroll to top of container
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const toggleAddOn = (addOnId: string) => {
    const newAddOns = bookingData.addOns.includes(addOnId)
      ? bookingData.addOns.filter(id => id !== addOnId)
      : [...bookingData.addOns, addOnId];
    updateField('addOns', newAddOns);
  };

  if (showCheckout) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => setShowCheckout(false)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Review
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Pricing Summary */}
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
                  {bookingData.frequency && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Frequency:</span>
                      <span className="font-medium">{frequencyOptions.find(f => f.id === bookingData.frequency)?.name}</span>
                    </div>
                  )}
                  {bookingData.addOns.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-muted-foreground">Add-ons:</span>
                      {bookingData.addOns.map(addOnId => {
                        const addOn = addOnServices.find(a => a.id === addOnId);
                        return (
                          <div key={addOnId} className="flex justify-between text-sm">
                            <span>• {addOn?.name}</span>
                            <span>{formatPrice(addOn?.price || 0)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
                  {appliedReferral && (
                    <div className="flex justify-between text-success">
                      <span>Referral Discount ({appliedReferral.discount}%):</span>
                      <span>-{formatPrice(bookingData.totalPrice * (appliedReferral.discount / 100))}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span className="text-primary">{formatPrice(bookingData.totalPrice)}</span>
                  </div>
                </div>
                {selectedPaymentOption === '25_percent_with_discount' && (
                  <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Today (25%):</span>
                        <span className="font-medium">{formatPrice(bookingData.totalPrice * 0.95 * 0.25)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>After Service:</span>
                        <span className="font-medium">{formatPrice(bookingData.totalPrice * 0.95 * 0.75)}</span>
                      </div>
                      <div className="flex justify-between text-success font-medium">
                        <span>You Save:</span>
                        <span>{formatPrice(bookingData.totalPrice * 0.05)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Payment Options */}
          <div className="lg:col-span-2 space-y-6">
            {/* Referral Code Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" />
                  Referral Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Have a referral code?</Label>
                    <p className="text-sm text-muted-foreground">
                      Enter a friend's referral code to get additional savings
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter referral code"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                        className="flex-1"
                      />
                      <Button 
                        variant="outline"
                        onClick={async () => {
                          if (!referralCode.trim()) return;
                          
                          try {
                            // Call referral validation function
                            const { data, error } = await supabase.functions.invoke('validate-referral-code', {
                              body: { referralCode: referralCode.trim() }
                            });
                            
                            if (error) throw error;
                            
                            if (data.valid) {
                              setAppliedReferral({ code: referralCode, discount: data.discount || 5 });
                              toast.success(`Referral code applied! You saved ${data.discount || 5}%`);
                            } else {
                              toast.error('Invalid referral code');
                            }
                          } catch (error) {
                            toast.error('Failed to validate referral code');
                          }
                        }}
                      >
                        Apply
                      </Button>
                    </div>
                    
                    {appliedReferral && (
                      <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                        <p className="text-success text-sm font-medium">
                          ✓ Referral code "{appliedReferral.code}" applied! You saved {appliedReferral.discount}%
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Get your referral code</Label>
                    <p className="text-sm text-muted-foreground">
                      Get your own referral code to share with friends
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={async () => {
                        if (!bookingData.customerEmail || !bookingData.customerName) {
                          toast.error('Please complete your contact information first');
                          return;
                        }
                        
                        try {
                          const { data, error } = await supabase.functions.invoke('send-referral-email', {
                            body: {
                              ownerName: bookingData.customerName,
                              ownerEmail: bookingData.customerEmail,
                              referralCode: `REF${Date.now().toString().slice(-6).toUpperCase()}`
                            }
                          });
                          
                          if (error) throw error;
                          
                          toast.success('Your referral code has been sent to your email!');
                        } catch (error) {
                          console.error('Error generating referral code:', error);
                          toast.error('Failed to generate referral code. Please try again.');
                        }
                      }}
                    >
                      <Gift className="h-4 w-4 mr-2" />
                      Email Me My Referral Code
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Choose Your Payment */}
            <Card>
              <CardHeader>
                <CardTitle>Choose Your Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pay After Service */}
                <div 
                  className={cn(
                    "p-4 border-2 rounded-lg cursor-pointer transition-colors",
                    selectedPaymentOption === 'pay_after_service' 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => setSelectedPaymentOption('pay_after_service')}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">Pay After Service</h3>
                      <p className="text-muted-foreground text-sm mb-2">
                        We'll authorize your card but only charge after cleaning is complete
                      </p>
                      <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                        Recommended
                      </Badge>
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 transition-colors",
                      selectedPaymentOption === 'pay_after_service'
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    )}>
                      {selectedPaymentOption === 'pay_after_service' && (
                        <div className="w-full h-full rounded-full bg-white scale-50" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Pay 25% + Get 5% Discount */}
                <div 
                  className={cn(
                    "p-4 border-2 rounded-lg cursor-pointer transition-colors",
                    selectedPaymentOption === '25_percent_with_discount' 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => setSelectedPaymentOption('25_percent_with_discount')}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Tag className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">Pay 25% + Get 5% Discount</h3>
                      <p className="text-muted-foreground text-sm mb-2">
                        Pay 25% now and save 5% on your total service cost
                      </p>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                        Save ${(bookingData.totalPrice * 0.05).toFixed(2)}
                      </Badge>
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 transition-colors",
                      selectedPaymentOption === '25_percent_with_discount'
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    )}>
                      {selectedPaymentOption === '25_percent_with_discount' && (
                        <div className="w-full h-full rounded-full bg-white scale-50" />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Promo Code */}
            <Card>
              <CardHeader>
                <CardTitle>Promo Code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter promo code"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    className="flex-1"
                  />
                  <Button 
                    variant="outline"
                    onClick={async () => {
                      if (!discountCode.trim()) return;
                      
                      try {
                        // Call promo code validation function
                        const { data, error } = await supabase.functions.invoke('validate-promo-code', {
                          body: { promoCode: discountCode.trim() }
                        });
                        
                        if (error) throw error;
                        
                        if (data.valid) {
                          toast.success(`Promo code applied! You saved ${data.discount}%`);
                        } else {
                          toast.error('Invalid or expired promo code');
                        }
                      } catch (error) {
                        toast.error('Failed to validate promo code');
                      }
                    }}
                  >
                    Apply
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Book Your Service Button */}
            <Card>
              <CardContent className="pt-6">
                <Button
                  onClick={async () => {
                    if (!selectedPaymentOption) {
                      toast.error('Please select a payment option');
                      return;
                    }

                    setIsProcessingPayment(true);
                    
                    try {
                      if (selectedPaymentOption === 'pay_after_service') {
                        // Card authorization only
                        const { data, error } = await supabase.functions.invoke('create-payment', {
                          body: {
                            amount: bookingData.totalPrice,
                            type: 'authorization',
                            bookingData,
                            customerEmail: bookingData.customerEmail,
                            customerName: bookingData.customerName
                          }
                        });

                        if (error) throw error;
                        
                        if (data.checkout_url) {
                          window.open(data.checkout_url, '_blank');
                        }
                      } else {
                        // 25% upfront payment with 5% discount
                        const discountedTotal = bookingData.totalPrice * 0.95; // 5% discount
                        const upfrontAmount = discountedTotal * 0.25; // 25% of discounted total
                        
                        const { data, error } = await supabase.functions.invoke('create-payment', {
                          body: {
                            amount: upfrontAmount,
                            type: 'upfront_with_discount',
                            totalAmount: discountedTotal,
                            bookingData,
                            customerEmail: bookingData.customerEmail,
                            customerName: bookingData.customerName
                          }
                        });

                        if (error) throw error;
                        
                        if (data.checkout_url) {
                          window.open(data.checkout_url, '_blank');
                        }
                      }
                    } catch (error) {
                      console.error('Payment error:', error);
                      toast.error('Failed to process payment. Please try again.');
                    } finally {
                      setIsProcessingPayment(false);
                    }
                  }}
                  disabled={!selectedPaymentOption || isProcessingPayment}
                  className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
                >
                  {isProcessingPayment ? (
                    "Processing..."
                  ) : (
                    `Book Your Service - ${formatPrice(
                      selectedPaymentOption === '25_percent_with_discount' 
                        ? bookingData.totalPrice * 0.95 * 0.25 
                        : bookingData.totalPrice
                    )}`
                  )}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            {/* ZIP Code Verification */}
            <Card className="border-primary/20">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Service Area
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    We serve Cali & Texas.
                  </p>
                  <div className="flex gap-3">
                    <Input
                      placeholder="Enter ZIP code"
                      value={bookingData.zipCode}
                      onChange={(e) => updateField('zipCode', e.target.value)}
                      maxLength={5}
                      className="flex-1"  
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                    {zipCodeValid && (
                      <div className="flex items-center text-success">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  {zipCodeValid && (
                    <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                      <p className="text-success text-sm font-medium">
                        Great! We service your area.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Service Type Selection */}
            {zipCodeValid && (
              <ServiceTypeCards
                serviceTypes={serviceTypes}
                selectedType={bookingData.serviceType}
                onSelect={(typeId) => updateField('serviceType', typeId)}
              />
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            {/* Home Size Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-primary" />
                  Home Size
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {homeSizes.map((size) => (
                    <Card
                      key={size.id}
                      className={cn(
                        "cursor-pointer border-2 transition-all hover:shadow-md",
                        size.id === 'over-5100' && "border-warning bg-warning/5",
                        bookingData.homeSize === size.id
                          ? "border-primary bg-primary/5"
                          : size.id === 'over-5100' 
                            ? "border-warning hover:border-warning/70"
                            : "border-border hover:border-primary/50"
                      )}
                      onClick={() => {
                        updateField('homeSize', size.id);
                        if (size.id === 'over-5100') {
                          toast.info('Homes over 5,100 sq ft require an in-person estimate. Please call to schedule.');
                        }
                      }}
                    >
                      <CardContent className="p-4">
                        <h3 className="font-semibold">{size.name}</h3>
                        <p className="text-sm text-muted-foreground">{size.description}</p>
                        {size.id === 'over-5100' && (
                          <Badge variant="outline" className="mt-2 border-warning text-warning">
                            Call Required
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Flooring Type Selection */}
            {bookingData.homeSize && bookingData.homeSize !== 'over-5100' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-primary" />
                    Flooring Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={bookingData.flooringType}
                    onValueChange={(value) => updateField('flooringType', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select primary flooring type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hardwood">Hardwood</SelectItem>
                      <SelectItem value="carpet">Carpet</SelectItem>
                      <SelectItem value="tile">Tile</SelectItem>
                      <SelectItem value="laminate">Laminate</SelectItem>
                      <SelectItem value="mixed">Mixed Flooring</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            {/* Frequency Selection - Only for Regular Cleaning */}
            {bookingData.homeSize && bookingData.homeSize !== 'over-5100' && bookingData.serviceType === 'regular' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Frequency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {frequencyOptions.map((option) => {
                      const sizePricing = pricingMatrix[bookingData.homeSize as keyof typeof pricingMatrix];
                      const price = sizePricing ? sizePricing[option.id as keyof typeof sizePricing] : 0;
                      
                      return (
                        <Card
                          key={option.id}
                          className={cn(
                            "cursor-pointer border-2 transition-all hover:shadow-md relative",
                            bookingData.frequency === option.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                          onClick={() => updateField('frequency', option.id)}
                        >
                          <CardContent className="p-4 text-center">
                            <h3 className="font-semibold">{option.name}</h3>
                            <p className="text-sm text-muted-foreground">{option.description}</p>
                            {price > 0 && (
                              <p className="text-lg font-bold text-primary mt-2">
                                {formatPrice(price)}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Show price for Deep Clean and Move-Out */}
            {bookingData.homeSize && bookingData.homeSize !== 'over-5100' && (bookingData.serviceType === 'deep' || bookingData.serviceType === 'moveout') && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6 text-center">
                  <h3 className="text-2xl font-bold text-primary">
                    {formatPrice(getExactPrice())}
                  </h3>
                  <p className="text-muted-foreground">
                    {bookingData.serviceType === 'deep' ? 'Deep Cleaning' : 'Move-Out Cleaning'} Price
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Large Home Estimate Notice */}
            {bookingData.homeSize === 'over-5100' && (
              <Card className="bg-warning/5 border-warning/20">
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl font-bold text-warning mb-2">
                    In-Person Estimate Required
                  </h3>
                  <p className="text-muted-foreground">
                    Homes over 5,100 sq ft require an in-person estimate. Please call us to schedule your consultation.
                  </p>
                  <Button className="mt-4" variant="outline">
                    Call for Estimate
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Add-ons Selection */}
            {((bookingData.serviceType === 'regular' && bookingData.frequency) || 
              (bookingData.serviceType !== 'regular' && bookingData.homeSize && bookingData.homeSize !== 'over-5100')) && (
              <Card>
                <CardHeader>
                  <CardTitle>Optional Add-Ons</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addOnServices.map((addOn) => (
                      <Card
                        key={addOn.id}
                        className={cn(
                          "cursor-pointer border transition-all hover:shadow-md",
                          bookingData.addOns.includes(addOn.id)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                        onClick={() => toggleAddOn(addOn.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium">{addOn.name}</h4>
                              <p className="text-sm text-muted-foreground">{addOn.description}</p>
                            </div>
                            <div className="ml-4 text-right">
                              <p className="font-semibold">{formatPrice(addOn.price)}</p>
                              {bookingData.addOns.includes(addOn.id) && (
                                <CheckCircle className="h-4 w-4 text-success mt-1 ml-auto" />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            {/* Enhanced Scheduling */}
            <EnhancedSchedulingStep
              selectedDate={bookingData.serviceDate ? parseLocalDate(bookingData.serviceDate) : undefined}
              selectedTime={bookingData.serviceTime}
              nextDayUpsell={bookingData.nextDayUpsell}
              onDateChange={(date) => updateField('serviceDate', date ? toLocalDate(date) : '')}
              onTimeChange={(time) => updateField('serviceTime', time)}
              onNextDayToggle={(enabled) => {
                updateField('nextDayUpsell', enabled);
                if (enabled) {
                  // Clear regular date selection when next-day is enabled
                  updateField('serviceDate', '');
                }
              }}
              serviceType={bookingData.serviceType}
            />

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Your Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerName">Full Name *</Label>
                    <Input
                      id="customerName"
                      value={bookingData.customerName}
                      onChange={(e) => updateField('customerName', e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerEmail">Email Address *</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={bookingData.customerEmail}
                      onChange={(e) => updateField('customerEmail', e.target.value)}
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactNumber">Phone Number *</Label>
                    <Input
                      id="contactNumber"
                      value={bookingData.contactNumber}
                      onChange={(e) => updateField('contactNumber', e.target.value)}
                      placeholder="(555) 123-4567"
                    />
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
                  <Input
                    id="street"
                    value={bookingData.address.street}
                    onChange={(e) => updateNestedField('address', 'street', e.target.value)}
                    placeholder="123 Main Street"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={bookingData.address.city}
                      onChange={(e) => updateNestedField('address', 'city', e.target.value)}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={bookingData.address.state}
                      onChange={(e) => updateNestedField('address', 'state', e.target.value)}
                      placeholder="TX"
                    />
                  </div>
                  <div>
                    <Label htmlFor="addressZip">ZIP Code</Label>
                    <Input
                      id="addressZip"
                      value={bookingData.address.zipCode}
                      onChange={(e) => updateNestedField('address', 'zipCode', e.target.value)}
                      placeholder="77520"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="bedrooms">Bedrooms *</Label>
                    <Select value={bookingData.bedrooms} onValueChange={(value) => updateField('bedrooms', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} Bedroom{num > 1 ? 's' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="bathrooms">Bathrooms *</Label>
                    <Select value={bookingData.bathrooms} onValueChange={(value) => updateField('bathrooms', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 1.5, 2, 2.5, 3, 3.5, 4, 5].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} Bathroom{num > 1 ? 's' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dwellingType">Property Type *</Label>
                    <Select value={bookingData.dwellingType} onValueChange={(value) => updateField('dwellingType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="house">House</SelectItem>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="condo">Condo</SelectItem>
                        <SelectItem value="townhouse">Townhouse</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="specialInstructions">Special Instructions</Label>
                  <Textarea
                    id="specialInstructions"
                    value={bookingData.specialInstructions}
                    onChange={(e) => updateField('specialInstructions', e.target.value)}
                    placeholder="Any special instructions or areas of focus..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
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
                    <p><span className="font-medium">Frequency:</span> {frequencyOptions.find(f => f.id === bookingData.frequency)?.name}</p>
                    <p><span className="font-medium">Date & Time:</span> {bookingData.serviceDate} at {bookingData.serviceTime}</p>
                    <p><span className="font-medium">Address:</span> {bookingData.address.street}, {bookingData.address.city}, {bookingData.address.state} {bookingData.address.zipCode}</p>
                  </div>
                </div>

                {/* Add-ons */}
                {bookingData.addOns.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Add-On Services</h3>
                    <div className="space-y-1 text-sm">
                      {bookingData.addOns.map(addOnId => {
                        const addOn = addOnServices.find(a => a.id === addOnId);
                        return addOn && (
                          <p key={addOnId}>
                            <span className="font-medium">{addOn.name}:</span> {formatPrice(addOn.price)}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                )}

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
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-4">
              <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-lg px-4 py-2 animate-pulse">
                🔥 LIMITED TIME: 20% OFF ALL SERVICES! 🔥
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Book Your Cleaning Service
            </h1>
            <p className="text-muted-foreground text-lg">
              Professional cleaning services in the Greater Baytown area
            </p>
            <p className="text-sm text-success font-semibold mt-2">
              All prices already include 20% discount - Save big today!
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex items-center">
                    <div
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                        currentStep >= step.id
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-border text-muted-foreground"
                      )}
                    >
                      {currentStep > step.id ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <step.icon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="ml-3 hidden md:block">
                      <p className={cn(
                        "text-sm font-medium",
                        currentStep >= step.id ? "text-primary" : "text-muted-foreground"
                      )}>
                        {step.title}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground mx-4" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="flex-1">
              {renderStepContent()}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!canProceedToNext()}
                  className="bg-primary hover:bg-primary/90"
                >
                  {currentStep === 4 ? 'Book Your Service' : 'Next Step'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>

            {/* Pricing Summary Sidebar */}
            <div className="w-full lg:w-80">
              <PricingSummarySticky
                bookingData={bookingData}
                serviceTypes={serviceTypes}
                homeSizes={homeSizes}
                frequencyOptions={frequencyOptions}
                addOnServices={addOnServices}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}