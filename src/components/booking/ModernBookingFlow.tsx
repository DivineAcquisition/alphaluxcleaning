import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CalendarIcon, Clock, ArrowRight, CheckCircle, MapPin, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';

import { validateServiceAreaZipCode } from '@/lib/service-area-validation';
import { hasUsedPromoOffer, CustomerData, markPromoOfferUsed } from '@/lib/offer-tracking';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { useFormValidation } from '@/hooks/useFormValidation';
import { BookingCheckoutPage } from './BookingCheckoutPage';
import { ModernServiceSelection } from './ModernServiceSelection';
import { ModernAddOnsSection } from './ModernAddOnsSection';
import { ModernCustomerIntake } from './ModernCustomerIntake';
import { toast } from 'sonner';

// Import pricing data from original component
const homeSizePricing = {
  'under-1000': {
    originalPricing: { oneTime: 225.31, biweekly: 118.59, monthly: 171.26, deepClean: 305.05 },
    pricing: { oneTime: 180.25, biweekly: 94.87, monthly: 137.01, deepClean: 244.04 }
  },
  '1001-1400': {
    originalPricing: { oneTime: 235.09, biweekly: 125.58, monthly: 186.59, deepClean: 327.77 },
    pricing: { oneTime: 188.07, biweekly: 100.46, monthly: 149.27, deepClean: 262.22 }
  },
  '1401-1800': {
    originalPricing: { oneTime: 255.27, biweekly: 140.06, monthly: 225.73, deepClean: 355.94 },
    pricing: { oneTime: 204.22, biweekly: 112.05, monthly: 180.58, deepClean: 284.75 }
  },
  '1801-2400': {
    originalPricing: { oneTime: 265.41, biweekly: 150.15, monthly: 234.87, deepClean: 385.13 },
    pricing: { oneTime: 212.33, biweekly: 120.12, monthly: 187.90, deepClean: 308.10 }
  },
  '2401-2800': {
    originalPricing: { oneTime: 285.28, biweekly: 175.14, monthly: 245.76, deepClean: 405.01 },
    pricing: { oneTime: 228.22, biweekly: 140.11, monthly: 196.61, deepClean: 324.01 }
  },
  '2801+': {
    originalPricing: { oneTime: 0, biweekly: 0, monthly: 0, deepClean: 0 },
    pricing: { oneTime: 0, biweekly: 0, monthly: 0, deepClean: 0 }
  }
};

interface BookingData {
  serviceZipCode: string;
  homeSize: string;
  frequency: string;
  addOns: string[];
  basePrice: number;
  addOnPrices: { [key: string]: number };
  frequencyDiscount: number;
  totalPrice: number;
  nextDayFee?: number;
  squareFootage?: string;
  bedrooms: string;
  bathrooms: string;
  dwellingType: string;
  flooringType: string;
  serviceDate: string;
  serviceTime: string;
  customerName: string;
  customerEmail: string;
  contactNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  specialInstructions: string;
  paymentType: 'pay_after_service' | '25_percent_with_discount';
  promoDiscount: number;
}

const timeSlots = [
  { value: '8:00 AM', label: '8:00 AM', range: '8:00 - 10:00 AM' },
  { value: '9:00 AM', label: '9:00 AM', range: '9:00 - 11:00 AM' },
  { value: '10:00 AM', label: '10:00 AM', range: '10:00 - 12:00 PM' },
  { value: '11:00 AM', label: '11:00 AM', range: '11:00 AM - 1:00 PM' },
  { value: '12:00 PM', label: '12:00 PM', range: '12:00 - 2:00 PM' },
  { value: '1:00 PM', label: '1:00 PM', range: '1:00 - 3:00 PM' },
  { value: '2:00 PM', label: '2:00 PM', range: '2:00 - 4:00 PM' },
  { value: '3:00 PM', label: '3:00 PM', range: '3:00 - 5:00 PM' },
  { value: '4:00 PM', label: '4:00 PM', range: '4:00 - 6:00 PM' }
];

export function ModernBookingFlow() {
  const navigate = useNavigate();
  
  // Form persistence
  const { data: formData, updateField, updateData, clearData, lastSaved } = useFormPersistence<Partial<BookingData>>({
    address: { street: '', city: '', state: 'CA', zipCode: '' }
  }, { storageKey: 'modern-booking-form' });

  // Form validation
  const { errors, validateField, validateForm, clearErrors, hasError, getError } = useFormValidation();
  
  // State management
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>(formData.addOns || []);
  const [zipCodeValid, setZipCodeValid] = useState(false);
  const [zipCodeError, setZipCodeError] = useState<string>('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    formData.serviceDate ? new Date(formData.serviceDate) : undefined
  );
  const [offerEligible, setOfferEligible] = useState(true);
  const [showOfferUsedAlert, setShowOfferUsedAlert] = useState(false);
  
  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59
  });

  // Check offer eligibility
  useEffect(() => {
    const checkOfferEligibility = async () => {
      if (formData.customerEmail) {
        try {
          const customerData: CustomerData = { email: formData.customerEmail };
          const hasUsed = await hasUsedPromoOffer(customerData);
          setOfferEligible(!hasUsed);
        } catch (error) {
          console.error('Error checking offer eligibility:', error);
          setOfferEligible(true);
        }
      }
    };

    checkOfferEligibility();
  }, [formData.customerEmail]);

  // Validate ZIP code
  useEffect(() => {
    if (formData.serviceZipCode && formData.serviceZipCode.length === 5) {
      const validation = validateServiceAreaZipCode(formData.serviceZipCode);
      setZipCodeValid(validation.isValid);
      if (!validation.isValid) {
        setZipCodeError(validation.message || '');
      } else {
        setZipCodeError('');
      }
    } else {
      setZipCodeValid(false);
    }
  }, [formData.serviceZipCode]);

  // Update pricing when selections change
  useEffect(() => {
    if (formData.homeSize && formData.frequency) {
      const sizeData = homeSizePricing[formData.homeSize as keyof typeof homeSizePricing];
      if (sizeData) {
        const priceKey = formData.frequency === 'bi-weekly' ? 'biweekly' : 
                         formData.frequency === 'deep-clean' ? 'deepClean' :
                         formData.frequency === 'one-time' ? 'oneTime' : 'monthly';
        
        const basePrice = offerEligible 
          ? sizeData.pricing[priceKey as keyof typeof sizeData.pricing] || 0
          : sizeData.originalPricing[priceKey as keyof typeof sizeData.originalPricing] || 0;
        
        const addOnTotal = selectedAddOns.reduce((total, addOn) => {
          const addOnPrices = {
            'fridge': 35, 'oven': 35, 'baseboards': 50, 'cabinet-fronts': 50,
            'blinds': 15, 'wall-washing': 25, 'laundry': 20, 'garage': 30
          };
          return total + (addOnPrices[addOn as keyof typeof addOnPrices] || 0);
        }, 0);
        
        const totalPrice = basePrice + addOnTotal;
        const originalPrice = sizeData.originalPricing[priceKey as keyof typeof sizeData.originalPricing] || 0;
        const frequencyDiscount = offerEligible && originalPrice > 0 
          ? Math.round((originalPrice - basePrice) * 100) / 100 
          : 0;

        updateData({
          basePrice,
          totalPrice,
          frequencyDiscount,
          addOns: selectedAddOns
        });
      }
    }
  }, [formData.homeSize, formData.frequency, selectedAddOns, offerEligible, updateData]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let newSeconds = prev.seconds - 1;
        let newMinutes = prev.minutes;
        let newHours = prev.hours;
        if (newSeconds < 0) {
          newSeconds = 59;
          newMinutes = prev.minutes - 1;
          if (newMinutes < 0) {
            newMinutes = 59;
            newHours = prev.hours - 1;
            if (newHours < 0) {
              return { hours: 23, minutes: 59, seconds: 59 };
            }
          }
        }
        return { hours: newHours, minutes: newMinutes, seconds: newSeconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Generate available dates
  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 5; i <= 35; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      if (date.getDay() !== 0) { // Skip Sundays
        dates.push(date);
      }
      
      if (dates.length >= 21) break;
    }
    
    return dates;
  };

  const availableDates = generateAvailableDates();

  const handleZipCodeChange = (zipCode: string) => {
    updateField('serviceZipCode', zipCode);
    setZipCodeError('');
    
    if (zipCode.length === 5) {
      const validation = validateServiceAreaZipCode(zipCode);
      setZipCodeValid(validation.isValid);
      
      if (!validation.isValid) {
        setZipCodeError(validation.message || '');
      }
    } else {
      setZipCodeValid(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      updateField('serviceDate', date.toISOString().split('T')[0]);
    }
  };

  const handleProceedToCheckout = async () => {
    // Validate required fields
    const requiredFieldsMap = {
      'serviceZipCode': formData.serviceZipCode,
      'homeSize': formData.homeSize,
      'frequency': formData.frequency,
      'serviceDate': formData.serviceDate,
      'serviceTime': formData.serviceTime,
      'bedrooms': formData.bedrooms,
      'bathrooms': formData.bathrooms,
      'dwellingType': formData.dwellingType,
      'customerName': formData.customerName,
      'customerEmail': formData.customerEmail,
      'contactNumber': formData.contactNumber,
      'address.street': formData.address?.street,
      'address.city': formData.address?.city,
      'address.zipCode': formData.address?.zipCode
    };

    const isFormValid = Object.entries(requiredFieldsMap).every(([field, value]) => {
      const isValid = validateField(field, value, formData);
      return isValid;
    });

    if (!isFormValid) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!zipCodeValid) {
      toast.error('Please enter a valid service area ZIP code');
      return;
    }

    // Check offer eligibility
    if (formData.customerEmail) {
      try {
        const customerData: CustomerData = { email: formData.customerEmail };
        const hasUsed = await hasUsedPromoOffer(customerData);
        if (hasUsed) {
          setShowOfferUsedAlert(true);
          return;
        }
      } catch (error) {
        console.error('Error checking offer eligibility:', error);
      }
    }

    setShowCheckout(true);
  };

  const handlePaymentSuccess = async () => {
    try {
      if (formData.customerEmail && offerEligible) {
        const customerData: CustomerData = { email: formData.customerEmail };
        await markPromoOfferUsed(customerData);
      }
      
      clearData();
      clearErrors();
      navigate('/order-confirmation');
    } catch (error) {
      console.error('Error marking promo offer as used:', error);
      navigate('/order-confirmation');
    }
  };

  if (showCheckout) {
    return (
      <BookingCheckoutPage
        bookingData={formData as BookingData}
        onPaymentSuccess={handlePaymentSuccess}
        onBack={() => setShowCheckout(false)}
        updateBookingData={updateData}
      />
    );
  }

  const canProceedToCheckout = zipCodeValid && 
    formData.homeSize && formData.frequency && 
    formData.serviceDate && formData.serviceTime &&
    formData.bedrooms && formData.bathrooms && formData.dwellingType &&
    formData.customerName && formData.customerEmail && formData.contactNumber &&
    formData.address?.street && formData.address?.city && formData.address?.zipCode;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header with timer */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-2">
            Book Your Cleaning Service
          </h1>
          <p className="text-muted-foreground mb-4">
            Professional cleaning services in the Bay Area
          </p>
          
          {/* Countdown Timer */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 to-primary/5 rounded-full px-4 py-2 mb-6">
            <Timer className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              Save Up 75+ With Our Premium Cleanings - Ends in {String(timeLeft.hours).padStart(2, '0')}:
              {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>

          {lastSaved && (
            <Badge variant="secondary" className="text-xs">
              Last saved: {format(lastSaved, 'MMM d, h:mm a')}
            </Badge>
          )}
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-8">
              {/* ZIP Code Entry */}
              <Card className="border-2 border-muted/50 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <MapPin className="h-5 w-5 text-primary" />
                    Service Area
                  </CardTitle>
                  <p className="text-muted-foreground">Enter your ZIP code to get started</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="zipCode"
                        type="text"
                        placeholder="Enter ZIP code"
                        value={formData.serviceZipCode || ''}
                        onChange={(e) => handleZipCodeChange(e.target.value)}
                        maxLength={5}
                        className={cn(
                          "flex-1",
                          zipCodeError && "border-destructive focus-visible:ring-destructive",
                          zipCodeValid && "border-green-500 focus-visible:ring-green-500"
                        )}
                      />
                      {zipCodeValid && (
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                      )}
                    </div>
                    {zipCodeError && (
                      <p className="text-sm text-destructive">{zipCodeError}</p>
                    )}
                    {zipCodeValid && (
                      <p className="text-sm text-green-600">Great! We service your area.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Service Selection */}
              {zipCodeValid && (
                <ModernServiceSelection
                  selectedHomeSize={formData.homeSize}
                  selectedFrequency={formData.frequency}
                  onHomeSizeSelect={(size) => updateField('homeSize', size)}
                  onFrequencySelect={(frequency) => updateField('frequency', frequency)}
                  pricing={homeSizePricing[formData.homeSize as keyof typeof homeSizePricing]?.pricing || {}}
                  originalPricing={homeSizePricing[formData.homeSize as keyof typeof homeSizePricing]?.originalPricing || {}}
                  offerEligible={offerEligible}
                />
              )}

              {/* Add-ons */}
              {zipCodeValid && formData.homeSize && formData.frequency && (
                <ModernAddOnsSection
                  selectedAddOns={selectedAddOns}
                  onToggleAddOn={(addOn) => {
                    const updated = selectedAddOns.includes(addOn)
                      ? selectedAddOns.filter(a => a !== addOn)
                      : [...selectedAddOns, addOn];
                    setSelectedAddOns(updated);
                  }}
                />
              )}

              {/* Date & Time Selection */}
              {zipCodeValid && formData.homeSize && formData.frequency && (
                <Card className="border-2 border-muted/50 shadow-lg animate-fade-in">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <CalendarIcon className="h-5 w-5 text-primary" />
                      Select Date & Time
                    </CardTitle>
                    <p className="text-muted-foreground">Choose when you'd like your service</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Preferred Date *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !selectedDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={handleDateSelect}
                              disabled={(date) => {
                                const today = new Date();
                                const minDate = new Date(today);
                                minDate.setDate(today.getDate() + 5);
                                return date < minDate || date.getDay() === 0 || !availableDates.some(d => 
                                  d.toDateString() === date.toDateString()
                                );
                              }}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Preferred Time *</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {timeSlots.map((slot) => (
                            <Button
                              key={slot.value}
                              variant={formData.serviceTime === slot.value ? "default" : "outline"}
                              size="sm"
                              onClick={() => updateField('serviceTime', slot.value)}
                              className="text-xs"
                            >
                              {slot.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Customer Information */}
              {zipCodeValid && formData.homeSize && formData.frequency && formData.serviceDate && formData.serviceTime && (
                <ModernCustomerIntake
                  customerData={formData}
                  onDataChange={updateField}
                  errors={errors.reduce((acc, error) => {
                    acc[error.field] = error.message;
                    return acc;
                  }, {} as Record<string, string>)}
                />
              )}
            </div>

            {/* Price Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <Card className="border-2 border-primary/20 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {formData.homeSize && formData.frequency ? (
                      <>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Service Area:</span>
                            <span>{formData.serviceZipCode || 'Not selected'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Home Size:</span>
                            <span>{formData.homeSize?.replace('-', '-')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Frequency:</span>
                            <span>{formData.frequency?.replace('-', ' ')}</span>
                          </div>
                          {formData.serviceDate && (
                            <div className="flex justify-between">
                              <span>Date:</span>
                              <span>{format(new Date(formData.serviceDate), 'MMM d, yyyy')}</span>
                            </div>
                          )}
                          {formData.serviceTime && (
                            <div className="flex justify-between">
                              <span>Time:</span>
                              <span>{formData.serviceTime}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="border-t py-2 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Base Price:</span>
                            <span>${formData.basePrice || 0}</span>
                          </div>
                          {selectedAddOns.length > 0 && (
                            <div className="flex justify-between">
                              <span>Add-ons:</span>
                              <span>+${selectedAddOns.reduce((total, addOn) => {
                                const prices = {
                                  'fridge': 35, 'oven': 35, 'baseboards': 50, 'cabinet-fronts': 50,
                                  'blinds': 15, 'wall-washing': 25, 'laundry': 20, 'garage': 30
                                };
                                return total + (prices[addOn as keyof typeof prices] || 0);
                              }, 0)}</span>
                            </div>
                          )}
                          {formData.frequencyDiscount > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Discount:</span>
                              <span>-${formData.frequencyDiscount}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="border-t py-2">
                          <div className="flex justify-between font-bold text-lg">
                            <span>Total:</span>
                            <span>${formData.totalPrice || 0}</span>
                          </div>
                        </div>

                        <Button
                          onClick={handleProceedToCheckout}
                          disabled={!canProceedToCheckout}
                          className="w-full"
                          size="lg"
                        >
                          Proceed to Checkout
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground text-sm">
                          Select your service details to see pricing
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Offer Used Alert */}
        <AlertDialog open={showOfferUsedAlert} onOpenChange={setShowOfferUsedAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Promotional Offer Already Used</AlertDialogTitle>
              <AlertDialogDescription>
                It looks like this promotional offer has already been redeemed with this email address. 
                You can still proceed with booking at our regular rates.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogAction onClick={() => {
              setShowOfferUsedAlert(false);
              setOfferEligible(false);
            }}>
              Continue with Regular Pricing
            </AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}