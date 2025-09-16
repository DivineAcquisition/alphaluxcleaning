import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CheckCircle, ArrowRight, ArrowLeft, Calendar, CreditCard, Home, MapPin, Clock, Sparkles, Star, Shield, Zap, Tag, Gift, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { validateServiceAreaZipCode } from '@/lib/service-area-validation';
import { formatPrice, applyGlobalDiscount, calculateGlobalDiscountAmount } from '@/lib/pricing-utils';
import { supabase } from '@/integrations/supabase/client';

import { ServiceTypeCards } from './ServiceTypeCards';
import { PricingSummarySticky } from './PricingSummarySticky';
import { EmbeddedDepositPaymentForm } from './EmbeddedDepositPaymentForm';
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
    weekly: 111.20,
    biweekly: 135.24,
    monthly: 195.53,
    oneTime: 257.04,
    deepClean: 348.05
  },
  '1401-1800': {
    weekly: 124.90,
    biweekly: 151.89,
    monthly: 219.80,
    oneTime: 288.77,
    deepClean: 391.05
  },
  '1801-2400': {
    weekly: 138.60,
    biweekly: 168.54,
    monthly: 244.07,
    oneTime: 320.50,
    deepClean: 434.05
  },
  '2401-2800': {
    weekly: 152.30,
    biweekly: 185.19,
    monthly: 268.34,
    oneTime: 352.23,
    deepClean: 477.05
  },
  '2801-3300': {
    weekly: 166.00,
    biweekly: 201.84,
    monthly: 292.61,
    oneTime: 383.96,
    deepClean: 520.05
  },
  '3301-3900': {
    weekly: 179.70,
    biweekly: 218.49,
    monthly: 316.88,
    oneTime: 415.69,
    deepClean: 563.05
  },
  '3901-4500': {
    weekly: 193.40,
    biweekly: 235.14,
    monthly: 341.15,
    oneTime: 447.42,
    deepClean: 606.05
  },
  '4501-5100': {
    weekly: 207.10,
    biweekly: 251.79,
    monthly: 365.42,
    oneTime: 479.15,
    deepClean: 649.05
  }
};

const serviceTypes = [
  {
    id: 'regular',
    name: 'Regular Cleaning',
    description: 'Ongoing maintenance cleaning for your home',
    features: ['All rooms cleaned', 'Kitchen & bathrooms', 'Vacuuming & mopping', 'Dusting surfaces']
  },
  {
    id: 'deep',
    name: 'Deep Cleaning',
    description: 'Comprehensive cleaning for a fresh start',
    features: ['Everything in regular', 'Inside appliances', 'Baseboards & windowsills', 'Light fixtures', 'Cabinet fronts']
  },
  {
    id: 'moveout',
    name: 'Move-Out Cleaning',
    description: 'Complete cleaning for move-out inspections',
    features: ['Deep clean level', 'Inside all cabinets', 'Inside refrigerator', 'Oven deep clean', 'Move-out ready']
  }
];

const homeSizes = [
  { id: 'under-1000', name: 'Under 1,000 sq ft', multiplier: 1, description: 'Studio, 1BR apartments' },
  { id: '1001-1400', name: '1,001-1,400 sq ft', multiplier: 1.14, description: 'Large 1BR, small 2BR' },
  { id: '1401-1800', name: '1,401-1,800 sq ft', multiplier: 1.28, description: 'Average 2-3BR home' },
  { id: '1801-2400', name: '1,801-2,400 sq ft', multiplier: 1.42, description: 'Large 2-3BR home' },
  { id: '2401-2800', name: '2,401-2,800 sq ft', multiplier: 1.56, description: 'Large 3-4BR home' },
  { id: '2801-3300', name: '2,801-3,300 sq ft', multiplier: 1.70, description: 'Large 4BR+ home' },
  { id: '3301-3900', name: '3,301-3,900 sq ft', multiplier: 1.84, description: 'Very large home' },
  { id: '3901-4500', name: '3,901-4,500 sq ft', multiplier: 1.98, description: 'Luxury home' },
  { id: '4501-5100', name: '4,501-5,100 sq ft', multiplier: 2.12, description: 'Large luxury home' },
  { id: 'over-5100', name: '5,100+ sq ft', multiplier: 1, description: 'Requires in-person estimate' }
];

const frequencyOptions = [
  { id: 'weekly', name: 'Weekly', discount: 35, description: 'Maximum savings' },
  { id: 'biweekly', name: 'Bi-Weekly', discount: 25, description: 'Most popular' },
  { id: 'monthly', name: 'Monthly', discount: 10, description: 'Budget friendly' },
  { id: 'oneTime', name: 'One-Time', discount: 0, description: 'Single cleaning' }
];

const addOnServices = [
  { id: 'fridge', name: 'Inside Refrigerator', price: 20, description: 'Deep clean inside and shelves' },
  { id: 'oven', name: 'Inside Oven', price: 25, description: 'Thorough oven interior cleaning' },
  { id: 'cabinets', name: 'Inside Cabinets', price: 30, description: 'Clean inside all cabinets' },
  { id: 'windows', name: 'Window Cleaning', price: 35, description: 'Interior window cleaning' },
  { id: 'laundry', name: 'Laundry Service', price: 25, description: 'Wash, dry, and fold' },
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
  bedrooms: string;
  bathrooms: string;
  dwellingType: string;
  
  // Calculated fields
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
  flooringType: 'mixed',
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
  bedrooms: '2',
  bathrooms: '2',
  dwellingType: 'house',
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
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  
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

  // Handle payment success
  const handlePaymentSuccess = () => {
    toast.success("Your cleaning service has been booked successfully!");
    setShowCheckout(false);
    setClientSecret(null);
  };

  const handlePaymentCancel = () => {
    setShowCheckout(false);
    setClientSecret(null);
  };

  const handleBookService = async () => {
    try {
      setIsCreatingPayment(true);
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          payment_type: 'deposit_20',
          fullAmount: bookingData.totalPrice,
          booking_data: bookingData,
          customerEmail: bookingData.customerEmail,
          customerName: bookingData.customerName
        }
      });

      if (error) {
        throw error;
      }

      if (!data?.clientSecret) {
        throw new Error('No client secret received from payment service');
      }

      setClientSecret(data.clientSecret);
      
    } catch (error) {
      console.error('Payment creation failed:', error);
      toast.error("Failed to process payment. Please try again.");
    } finally {
      setIsCreatingPayment(false);
    }
  };

  if (showCheckout) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold mb-2">Complete Your Payment</h1>
              <p className="text-muted-foreground">
                You're paying a 20% deposit of <span className="font-semibold">${(bookingData.totalPrice * 0.2).toFixed(2)}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Remaining balance (${(bookingData.totalPrice * 0.8).toFixed(2)}) will be collected after service completion
              </p>
            </div>

            {/* Service Summary */}
            <Card className="p-6 mb-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Service:</span>
                  <span>{bookingData.serviceType} cleaning</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Date & Time:</span>
                  <span>{bookingData.serviceDate} at {bookingData.serviceTime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Address:</span>
                  <span className="text-right">
                    {bookingData.address.street}<br/>
                    {bookingData.address.city}, {bookingData.address.state} {bookingData.address.zipCode}
                  </span>
                </div>
              </div>
            </Card>

            {/* Payment Form */}
            {!clientSecret ? (
              <Card className="p-6">
                <div className="text-center">
                  <Button 
                    onClick={handleBookService}
                    disabled={isCreatingPayment}
                    className="w-full mb-4"
                    size="lg"
                  >
                    {isCreatingPayment ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Pay $${(bookingData.totalPrice * 0.2).toFixed(2)} Deposit`
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCheckout(false)}
                    className="w-full"
                    disabled={isCreatingPayment}
                  >
                    Back to Booking
                  </Button>
                </div>
              </Card>
            ) : (
              <EmbeddedDepositPaymentForm
                clientSecret={clientSecret}
                amount={Math.round(bookingData.totalPrice * 0.2 * 100)}
                bookingData={bookingData}
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Book Your Cleaning Service
            </h1>
            <p className="text-muted-foreground text-lg">
              Professional cleaning services with embedded payment form
            </p>
          </div>

          <div className="text-center">
            <Button
              onClick={() => setShowCheckout(true)}
              disabled={!bookingData.customerEmail || !bookingData.customerName}
              size="lg"
              className="bg-primary hover:bg-primary/90"
            >
              Continue to Payment
            </Button>
          </div>

          <div className="mt-8 space-y-4">
            <Input
              placeholder="Your Name"
              value={bookingData.customerName}
              onChange={(e) => updateField('customerName', e.target.value)}
            />
            <Input
              placeholder="Your Email"
              type="email"
              value={bookingData.customerEmail}
              onChange={(e) => updateField('customerEmail', e.target.value)}
            />
            <Input
              placeholder="Total Price"
              type="number"
              value={bookingData.totalPrice}
              onChange={(e) => updateField('totalPrice', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}