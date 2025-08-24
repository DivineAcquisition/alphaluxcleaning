import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Home, Sparkles, RefreshCw, ArrowRight, Star, Zap, MapPin, CheckCircle, Building, BedDouble, Bath, Users, CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { GuestBookingFlow } from './GuestBookingFlow';
import { validateServiceAreaZipCode, getNearestServiceableZipCodes, SERVICE_AREA_INFO } from '@/lib/service-area-validation';
import { hasUsedPromoOffer, CustomerData } from '@/lib/offer-tracking';

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
  
  // Property Details
  bedrooms: string;
  bathrooms: string;
  dwellingType: string;
  flooringType: string;
  
  // Date & Time Selection
  serviceDate: string;
  serviceTime: string;
}

// Square footage-based pricing tiers with 20% across-the-board discount applied
const homeSizes = [
  {
    value: 'under-1000',
    label: 'Under 1,000 sq ft',
    icon: Home,
    description: 'Cozy homes and apartments',
    originalPricing: {
      oneTime: 225.31,
      biweekly: 118.59,
      monthly: 171.26,
      deepClean: 305.05
    },
    // Apply 20% discount across all prices
    pricing: {
      oneTime: Math.round(225.31 * 0.8 * 100) / 100,
      biweekly: Math.round(118.59 * 0.8 * 100) / 100,
      monthly: Math.round(171.26 * 0.8 * 100) / 100,
      deepClean: Math.round(305.05 * 0.8 * 100) / 100
    }
  },
  {
    value: '1001-1400',
    label: '1,001-1,400 sq ft',
    icon: Home,
    description: 'Small to medium homes',
    originalPricing: {
      oneTime: 235.09,
      biweekly: 125.58,
      monthly: 186.59,
      deepClean: 327.77
    },
    pricing: {
      oneTime: Math.round(235.09 * 0.8 * 100) / 100,
      biweekly: Math.round(125.58 * 0.8 * 100) / 100,
      monthly: Math.round(186.59 * 0.8 * 100) / 100,
      deepClean: Math.round(327.77 * 0.8 * 100) / 100
    },
    popular: true
  },
  {
    value: '1401-1800',
    label: '1,401-1,800 sq ft',
    icon: Home,
    description: 'Medium sized homes',
    originalPricing: {
      oneTime: 255.27,
      biweekly: 140.06,
      monthly: 225.73,
      deepClean: 355.94
    },
    pricing: {
      oneTime: Math.round(255.27 * 0.8 * 100) / 100,
      biweekly: Math.round(140.06 * 0.8 * 100) / 100,
      monthly: Math.round(225.73 * 0.8 * 100) / 100,
      deepClean: Math.round(355.94 * 0.8 * 100) / 100
    }
  },
  {
    value: '1801-2400',
    label: '1,801-2,400 sq ft',
    icon: Home,
    description: 'Large family homes',
    originalPricing: {
      oneTime: 265.41,
      biweekly: 150.15,
      monthly: 234.87,
      deepClean: 385.13
    },
    pricing: {
      oneTime: Math.round(265.41 * 0.8 * 100) / 100,
      biweekly: Math.round(150.15 * 0.8 * 100) / 100,
      monthly: Math.round(234.87 * 0.8 * 100) / 100,
      deepClean: Math.round(385.13 * 0.8 * 100) / 100
    }
  },
  {
    value: '2401-2800',
    label: '2,401-2,800 sq ft',
    icon: Home,
    description: 'Very large homes',
    originalPricing: {
      oneTime: 285.28,
      biweekly: 175.14,
      monthly: 245.76,
      deepClean: 405.01
    },
    pricing: {
      oneTime: Math.round(285.28 * 0.8 * 100) / 100,
      biweekly: Math.round(175.14 * 0.8 * 100) / 100,
      monthly: Math.round(245.76 * 0.8 * 100) / 100,
      deepClean: Math.round(405.01 * 0.8 * 100) / 100
    }
  },
  {
    value: '2801-3300',
    label: '2,801-3,300 sq ft',
    icon: Home,
    description: 'Extra large homes',
    originalPricing: {
      oneTime: 297.46,
      biweekly: 188.62,
      monthly: 287.92,
      deepClean: 459.16
    },
    pricing: {
      oneTime: Math.round(297.46 * 0.8 * 100) / 100,
      biweekly: Math.round(188.62 * 0.8 * 100) / 100,
      monthly: Math.round(287.92 * 0.8 * 100) / 100,
      deepClean: Math.round(459.16 * 0.8 * 100) / 100
    }
  },
  {
    value: '3301-3900',
    label: '3,301-3,900 sq ft',
    icon: Home,
    description: 'Luxury homes',
    originalPricing: {
      oneTime: 346.34,
      biweekly: 197.61,
      monthly: 307.81,
      deepClean: 478.39
    },
    pricing: {
      oneTime: Math.round(346.34 * 0.8 * 100) / 100,
      biweekly: Math.round(197.61 * 0.8 * 100) / 100,
      monthly: Math.round(307.81 * 0.8 * 100) / 100,
      deepClean: Math.round(478.39 * 0.8 * 100) / 100
    }
  },
  {
    value: '3901-4500',
    label: '3,901-4,500 sq ft',
    icon: Building,
    description: 'Estate homes',
    originalPricing: {
      oneTime: 378.67,
      biweekly: 231.58,
      monthly: 368.69,
      deepClean: 512.60
    },
    pricing: {
      oneTime: Math.round(378.67 * 0.8 * 100) / 100,
      biweekly: Math.round(231.58 * 0.8 * 100) / 100,
      monthly: Math.round(368.69 * 0.8 * 100) / 100,
      deepClean: Math.round(512.60 * 0.8 * 100) / 100
    }
  },
  {
    value: '4501-5100',
    label: '4,501-5,100 sq ft',
    icon: Building,
    description: 'Mansion homes',
    originalPricing: {
      oneTime: 461.37,
      biweekly: 242.05,
      monthly: 428.17,
      deepClean: 564.24
    },
    pricing: {
      oneTime: Math.round(461.37 * 0.8 * 100) / 100,
      biweekly: Math.round(242.05 * 0.8 * 100) / 100,
      monthly: Math.round(428.17 * 0.8 * 100) / 100,
      deepClean: Math.round(564.24 * 0.8 * 100) / 100
    }
  },
  {
    value: '5100-plus',
    label: '5,100+ sq ft',
    icon: Building,
    description: 'Custom estate - call for quote',
    originalPricing: {
      oneTime: 0,
      biweekly: 0,
      monthly: 0,
      deepClean: 0
    },
    pricing: {
      oneTime: 0,
      biweekly: 0,
      monthly: 0,
      deepClean: 0
    },
    requiresQuote: true
  }
];

const recurringOptions = [
  {
    value: 'one-time',
    label: 'One-Time Service',
    icon: Sparkles,
    priceKey: 'oneTime',
    description: 'Single cleaning service'
  },
  {
    value: 'bi-weekly',
    label: 'Every Other Week',
    icon: RefreshCw,
    priceKey: 'biweekly',
    description: 'Bi-weekly recurring service',
    popular: true
  },
  {
    value: 'monthly',
    label: 'Monthly Service',
    icon: RefreshCw,
    priceKey: 'monthly',
    description: 'Monthly recurring service'
  },
  {
    value: 'deep-clean',
    label: 'Ultimate Deep Clean',
    icon: Star,
    priceKey: 'deepClean',
    description: 'Premium deep cleaning service',
    recommended: true
  }
];

const addOns = [
  { value: 'fridge', label: 'Inside Refrigerator', price: 35 },
  { value: 'oven', label: 'Inside Oven', price: 35 },
  { value: 'baseboards', label: 'Whole Home Baseboards', price: 50 },
  { value: 'cabinet-fronts', label: 'Cabinet Front Cleaning', price: 50 },
  { value: 'blinds', label: 'Detailed Blind Cleaning', price: 15 },
  { value: 'wall-washing', label: 'Wall Washing', price: 25 },
  { value: 'laundry', label: 'Extra Laundry Folding', price: 20 },
  { value: 'garage', label: 'Garage Sweeping', price: 30 }
];

export function LegacyBookingFlow() {
  const [bookingData, setBookingData] = useState<Partial<BookingData>>({});
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [zipCodeValid, setZipCodeValid] = useState(false);
  const [zipCodeError, setZipCodeError] = useState<string>('');
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: zip, 2: home size, 3: frequency, 4: add-ons, 5: date/time, 6: property details
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [offerEligible, setOfferEligible] = useState(true);
  const [showOfferUsedAlert, setShowOfferUsedAlert] = useState(false);
  
  // Countdown timer state (matching main page)
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59
  });

  const updateBookingData = (updates: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...updates }));
  };

  // Validate ZIP code using Baytown service area
  const validateZipCode = (zipCode: string) => {
    const validation = validateServiceAreaZipCode(zipCode);
    return validation.isValid;
  };

  // Check existing ZIP code on mount
  useEffect(() => {
    if (bookingData.serviceZipCode && bookingData.serviceZipCode.length === 5) {
      const validation = validateServiceAreaZipCode(bookingData.serviceZipCode);
      setZipCodeValid(validation.isValid);
      if (!validation.isValid) {
        setZipCodeError(validation.message || '');
      }
    }
  }, []);

  const handleZipCodeChange = (zipCode: string) => {
    updateBookingData({ serviceZipCode: zipCode });
    setZipCodeError('');
    
    if (zipCode.length === 5) {
      const validation = validateServiceAreaZipCode(zipCode);
      setZipCodeValid(validation.isValid);
      
      if (validation.isValid) {
        setCurrentStep(2); // Move to home size selection
      } else {
        setZipCodeError(validation.message || '');
        setCurrentStep(1); // Stay on ZIP code step
      }
    } else {
      setZipCodeValid(false);
      setCurrentStep(1);
    }
  };

  // Countdown timer effect (matching main page)
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
              // Reset to 24 hours when it reaches 0
              return {
                hours: 23,
                minutes: 59,
                seconds: 59
              };
            }
          }
        }
        return {
          hours: newHours,
          minutes: newMinutes,
          seconds: newSeconds
        };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update step progression when selections are made
  useEffect(() => {
    if (zipCodeValid && bookingData.homeSize) {
      setCurrentStep(3); // Move to frequency selection
    }
    if (zipCodeValid && bookingData.homeSize && bookingData.frequency) {
      setCurrentStep(4); // Move to add-ons selection
    }
    if (zipCodeValid && bookingData.homeSize && bookingData.frequency) {
      setCurrentStep(5); // Move to date/time selection
    }
    if (zipCodeValid && bookingData.homeSize && bookingData.frequency && 
        bookingData.serviceDate && bookingData.serviceTime) {
      setCurrentStep(6); // Move to property details
    }
  }, [zipCodeValid, bookingData.homeSize, bookingData.frequency, bookingData.serviceDate, bookingData.serviceTime]);

  // Calculate pricing with new square footage structure
  useEffect(() => {
    const selectedTier = homeSizes.find(h => h.value === bookingData.homeSize);
    const selectedFrequency = recurringOptions.find(r => r.value === bookingData.frequency);

    if (selectedTier && selectedFrequency) {
      // Get base price based on offer eligibility
      const basePrice = offerEligible 
        ? selectedTier.pricing[selectedFrequency.priceKey] || 0
        : selectedTier.originalPricing[selectedFrequency.priceKey] || 0;
      
      const addOnTotal = selectedAddOns.reduce((total, addOn) => {
        const addOnItem = addOns.find(a => a.value === addOn);
        return total + (addOnItem?.price || 0);
      }, 0);
      
      const nextDayFee = bookingData.nextDayFee || 0;
      const totalPrice = basePrice + addOnTotal + nextDayFee;

      const addOnPrices = selectedAddOns.reduce((acc, addOn) => {
        const addOnItem = addOns.find(a => a.value === addOn);
        if (addOnItem) acc[addOn] = addOnItem.price;
        return acc;
      }, {} as { [key: string]: number });

      // Calculate savings from 20% discount (only if offer is eligible)
      const originalPrice = selectedTier.originalPricing[selectedFrequency.priceKey] || 0;
      const frequencyDiscount = offerEligible && originalPrice > 0 
        ? Math.round((originalPrice - basePrice) * 100) / 100 
        : 0;

      updateBookingData({
        basePrice,
        addOnPrices,
        frequencyDiscount,
        totalPrice,
        addOns: selectedAddOns,
        squareFootage: selectedTier.label // Store square footage for order records
      });
    }
  }, [bookingData.homeSize, bookingData.frequency, selectedAddOns, bookingData.nextDayFee, offerEligible]);

  const toggleAddOn = (addOnValue: string) => {
    const updated = selectedAddOns.includes(addOnValue)
      ? selectedAddOns.filter(a => a !== addOnValue)
      : [...selectedAddOns, addOnValue];
    setSelectedAddOns(updated);
  };

  // Time selection functions (matching EnhancedSchedulingStep)
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

  // Generate available dates (no Sundays, 5 days minimum)
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

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      updateBookingData({ serviceDate: date.toISOString().split('T')[0] });
    }
  };

  const handleNext = () => {
    // Check if customer has already used the promotional offer
    const customerData: CustomerData = {
      zipCode: bookingData.serviceZipCode,
      // We'll check again with full customer details in the booking flow
    };

    // For now, we'll do a basic check. Full validation will happen in GuestBookingFlow
    // when we have complete customer information (name, email, phone, address)
    
    // Store booking data in localStorage for guest booking flow
    localStorage.setItem('quoteData', JSON.stringify({
      zipCode: bookingData.serviceZipCode,
      homeSize: bookingData.homeSize,
      squareFootage: bookingData.squareFootage,
      serviceType: bookingData.frequency,
      quoteAmount: bookingData.totalPrice,
      basePrice: bookingData.basePrice,
      addOns: selectedAddOns,
      addOnPrices: bookingData.addOnPrices,
      frequencyDiscount: bookingData.frequencyDiscount,
      offerEligible: offerEligible,
      // Property details
      bedrooms: bookingData.bedrooms,
      bathrooms: bookingData.bathrooms,
      dwellingType: bookingData.dwellingType,
      flooringType: bookingData.flooringType,
      // Date & time
      serviceDate: bookingData.serviceDate,
      serviceTime: bookingData.serviceTime
    }));
    
    setShowBookingFlow(true);
  };

  if (showBookingFlow) {
    return <GuestBookingFlow />;
  }

  const selectedTier = homeSizes.find(h => h.value === bookingData.homeSize);
  const selectedFrequency = recurringOptions.find(r => r.value === bookingData.frequency);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="container mx-auto py-8 px-4">
        {/* Enhanced Header with Promotional Messaging */}
        <div className="text-center mb-8">
          <h1 className="sm:text-4xl font-jakarta font-bold tracking-tight mb-4 px-0 mx-0 my-0 py-0 text-2xl text-center">Premium Cleaning Service</h1>
          <p className="sm:text-xl font-inter text-muted-foreground max-w-2xl mx-auto font-semibold text-sm px-[10px]">Legacy pricing system for residential cleaning services</p>
        </div>

        {/* New Client Special Banner - Matching Main Page */}
        <div className="w-full max-w-6xl mx-auto space-y-8 px-2 sm:px-4 mb-8">
          <Card className="bg-gradient-to-r from-primary to-accent border-none shadow-xl">
            <CardContent className="p-4 md:p-6">
              <div className="text-center text-white">
                {/* Header */}
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 md:h-6 w-6 animate-pulse text-yellow-300" />
                  <h2 className="text-xl md:text-2xl font-jakarta font-bold">
                    🎉 New Client Special
                  </h2>
                  <Sparkles className="h-5 w-5 md:h-6 w-6 animate-pulse text-yellow-300" />
                </div>
                
                {/* Main Offer */}
                <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/20">
                  <h3 className="text-lg md:text-xl font-jakarta font-bold mb-2 text-yellow-300">
                    🏡 All Home Sizes Welcome
                  </h3>
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <span className="text-2xl md:text-3xl font-bold text-yellow-300">20% OFF</span>
                  </div>
                  <p className="text-sm md:text-base font-semibold">All Services + BACP Club™ Benefits</p>
                   <div className="bg-yellow-300/20 rounded-lg p-2 mt-3">
                     <p className="text-sm font-bold text-yellow-300">Save up $150+/</p>
                   </div>
                </div>

                {/* Countdown Timer */}
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 mb-3 border border-white/30">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="h-4 w-4 md:h-5 w-5 text-yellow-300" />
                    <span className="text-sm md:text-base font-semibold">Offer Expires In:</span>
                  </div>
                  <div className="flex items-center justify-center gap-1 text-lg md:text-xl font-mono font-bold tabular-nums">
                    <div className="bg-white/30 px-2 py-1 rounded border border-white/40 min-w-[36px] flex justify-center">
                      <span className="text-xs md:text-sm">{String(timeLeft.hours).padStart(2, '0')}</span>
                    </div>
                    <span className="w-2 text-center">:</span>
                    <div className="bg-white/30 px-2 py-1 rounded border border-white/40 min-w-[36px] flex justify-center">
                      <span className="text-xs md:text-sm">{String(timeLeft.minutes).padStart(2, '0')}</span>
                    </div>
                    <span className="w-2 text-center">:</span>
                    <div className="bg-white/30 px-2 py-1 rounded border border-white/40 min-w-[36px] flex justify-center">
                      <span className="text-xs md:text-sm">{String(timeLeft.seconds).padStart(2, '0')}</span>
                    </div>
                  </div>
                </div>

                 <p className="text-xs md:text-sm font-inter font-semibold text-white/90">
                   ⚡ {offerEligible ? 'First-time clients only • Book within 30 days' : 'Offer already redeemed'}
                 </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Service Area Verification - First */}
            <Card className="shadow-clean border-primary/20">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Service Area
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <p className="text-muted-foreground">
                    We provide cleaning services throughout {SERVICE_AREA_INFO.centerCity} and surrounding areas within {SERVICE_AREA_INFO.radiusMiles} miles. Enter your ZIP code to get started.
                  </p>
                  <div className="flex gap-3">
                    <Input
                      placeholder="Enter ZIP code"
                      value={bookingData.serviceZipCode || ''}
                      onChange={(e) => handleZipCodeChange(e.target.value)}
                      className="flex-1"
                      maxLength={5}
                    />
                    {zipCodeValid && (
                      <div className="flex items-center text-success">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  {zipCodeError && (
                    <div className="space-y-2">
                      <p className="text-destructive text-sm">
                        {zipCodeError}
                      </p>
                      {bookingData.serviceZipCode && bookingData.serviceZipCode.startsWith('7') && (
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-2">
                            We're expanding throughout Texas! Join our waitlist to be notified when we reach your area:
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              // This could trigger a modal or redirect to waitlist signup
                              console.log('Join waitlist for:', bookingData.serviceZipCode);
                            }}
                          >
                            Join Expansion Waitlist
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  {zipCodeValid && (
                    <p className="text-success text-sm font-medium">
                      Great! We service your area. Choose your cleaning service below.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Home Size Selection - Show only after valid ZIP */}
            {currentStep >= 2 && (
              <Card className="shadow-clean">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Home Size (Square Footage)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    {homeSizes.map((tier) => {
                      const Icon = tier.icon;
                      return (
                        <div
                          key={tier.value}
                          onClick={() => !tier.requiresQuote && updateBookingData({ homeSize: tier.value })}
                          className={cn(
                            "relative p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-lg",
                            bookingData.homeSize === tier.value
                              ? "border-primary bg-primary/5 shadow-clean"
                              : "border-border hover:border-primary/50",
                            tier.requiresQuote && "opacity-75"
                          )}
                        >
                          {tier.popular && (
                            <Badge className="absolute -top-2 -right-2 bg-accent text-accent-foreground">
                              Most Popular
                            </Badge>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Icon className="h-5 w-5 text-primary" />
                              <div>
                                <span className="font-semibold block">{tier.label}</span>
                                <p className="text-sm text-muted-foreground">{tier.description}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              {tier.requiresQuote ? (
                                <div>
                                  <p className="text-lg font-bold text-primary">Call for Quote</p>
                                  <p className="text-xs text-muted-foreground">(281) 809-9901</p>
                                </div>
                               ) : (
                                 <div>
                                   {offerEligible && (
                                     <div className="flex items-center gap-2">
                                       <span className="line-through text-muted-foreground text-sm">
                                         ${tier.originalPricing.oneTime}
                                       </span>
                                       <Badge variant="secondary" className="text-xs bg-success/20 text-success">
                                         20% OFF
                                       </Badge>
                                     </div>
                                   )}
                                   <p className="text-lg font-bold text-primary">
                                     Starting at ${offerEligible ? tier.pricing.monthly : tier.originalPricing.monthly}
                                   </p>
                                   <p className="text-xs text-muted-foreground">monthly service</p>
                                 </div>
                               )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Show prompt if ZIP valid but no home size selected */}
            {currentStep === 2 && !bookingData.homeSize && (
              <Card className="shadow-clean border-accent/50 bg-accent/5">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Home className="h-8 w-8 mx-auto mb-3 text-accent" />
                    <p className="text-lg font-medium text-foreground mb-2">Select Your Home Size</p>
                    <p className="text-sm text-muted-foreground">
                      Choose your home's square footage above to see pricing options
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Service Type Selection - Show only after home size selected */}
            {currentStep >= 3 && (
              <Card className="shadow-clean">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Service Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {recurringOptions.map((option) => {
                      const Icon = option.icon;
                      const selectedTier = homeSizes.find(h => h.value === bookingData.homeSize);
                      const price = selectedTier?.pricing[option.priceKey] || 0;
                      const originalPrice = selectedTier?.originalPricing[option.priceKey] || 0;
                      
                      return (
                        <div
                          key={option.value}
                          onClick={() => updateBookingData({ frequency: option.value })}
                          className={cn(
                            "relative p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-lg",
                            bookingData.frequency === option.value
                              ? "border-primary bg-primary/5 shadow-clean"
                              : "border-border hover:border-primary/50",
                            !selectedTier && "opacity-50 pointer-events-none"
                          )}
                        >
                          {option.recommended && (
                            <Badge className="absolute -top-2 -right-2 bg-success text-success-foreground">
                              Recommended
                            </Badge>
                          )}
                          {option.popular && (
                            <Badge className="absolute -top-2 -right-2 bg-accent text-accent-foreground">
                              Most Popular
                            </Badge>
                          )}
                          <div className="flex items-center gap-3 mb-3">
                            <Icon className="h-5 w-5 text-primary" />
                            <span className="font-semibold">{option.label}</span>
                          </div>
                          
                           {selectedTier && !selectedTier.requiresQuote ? (
                             <div className="space-y-2">
                               {originalPrice > 0 && offerEligible && (
                                 <div className="flex items-center justify-between">
                                   <span className="text-sm text-muted-foreground line-through">
                                     ${originalPrice}
                                   </span>
                                   <Badge variant="secondary" className="text-xs bg-success/20 text-success">
                                     20% OFF
                                   </Badge>
                                 </div>
                               )}
                               <div className="text-center">
                                 <p className="text-xl font-bold text-primary">
                                   {price > 0 ? `$${offerEligible ? price : originalPrice}` : 'Call for Quote'}
                                 </p>
                                 <p className="text-xs text-muted-foreground">{option.description}</p>
                               </div>
                             </div>
                          ) : (
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">{option.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">Select home size first</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Show prompt if home size selected but no frequency */}
            {currentStep === 3 && !bookingData.frequency && (
              <Card className="shadow-clean border-accent/50 bg-accent/5">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Sparkles className="h-8 w-8 mx-auto mb-3 text-accent" />
                    <p className="text-lg font-medium text-foreground mb-2">Choose Service Type</p>
                    <p className="text-sm text-muted-foreground">
                      Select your preferred cleaning frequency above to continue
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Add-Ons Selection - Show only after frequency selected */}
            {currentStep >= 4 && (
              <Card className="shadow-clean">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Optional Add-Ons
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addOns.map((addOn) => (
                      <div
                        key={addOn.value}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={selectedAddOns.includes(addOn.value)}
                            onCheckedChange={() => toggleAddOn(addOn.value)}
                          />
                          <span className="font-medium">{addOn.label}</span>
                        </div>
                        <span className="text-primary font-semibold">+${addOn.price}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Date & Time Selection - Show only after add-ons selection */}
            {currentStep >= 5 && (
              <Card className="shadow-clean">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Schedule Your Service
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Select your preferred date and time for your cleaning service
                  </p>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-6">
                    {/* Quick Date Selection */}
                    <div>
                      <h4 className="font-semibold mb-4">Select Date</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {availableDates.slice(0, 6).map((date, index) => {
                          const isSelected = selectedDate?.toDateString() === date.toDateString();
                          
                          return (
                            <button
                              key={date.toISOString()}
                              onClick={() => handleDateSelect(date)}
                              className={cn(
                                "p-3 rounded-lg border text-left transition-all duration-200 hover:shadow-md",
                                isSelected 
                                  ? "border-primary bg-primary/5 shadow-clean"
                                  : "border-border hover:border-primary/50"
                              )}
                            >
                              <div className="flex flex-col">
                                <div className="font-medium">
                                  {date.toLocaleDateString('en-US', { 
                                    weekday: 'short', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time Selection */}
                    {selectedDate && bookingData.serviceDate && (
                      <div className="animate-fade-in">
                        <h4 className="font-semibold mb-4">Select Time</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {timeSlots.map((slot) => (
                            <button
                              key={slot.value}
                              onClick={() => updateBookingData({ serviceTime: slot.value })}
                              className={cn(
                                "p-3 rounded-lg border text-left transition-all duration-200",
                                bookingData.serviceTime === slot.value
                                  ? "border-primary bg-primary/5 shadow-clean"
                                  : "border-border hover:border-primary/50"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium">{slot.label}</div>
                                  <div className="text-xs text-muted-foreground">{slot.range}</div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Show prompt if add-ons step but no date/time selected */}
            {currentStep === 5 && !bookingData.serviceDate && (
              <Card className="shadow-clean border-accent/50 bg-accent/5">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <CalendarIcon className="h-8 w-8 mx-auto mb-3 text-accent" />
                    <p className="text-lg font-medium text-foreground mb-2">Schedule Your Service</p>
                    <p className="text-sm text-muted-foreground">
                      Select your preferred date and time above
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Property Details - Show only after date/time selected */}
            {currentStep >= 6 && (
              <Card className="shadow-clean">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Property Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Bedrooms */}
                    <div className="space-y-2">
                      <Label htmlFor="bedrooms" className="text-sm font-medium flex items-center gap-2">
                        <BedDouble className="h-4 w-4" />
                        Bedrooms *
                      </Label>
                      <Select 
                        value={bookingData.bedrooms || ''} 
                        onValueChange={(value) => updateBookingData({ bedrooms: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select bedrooms" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Bedroom</SelectItem>
                          <SelectItem value="2">2 Bedrooms</SelectItem>
                          <SelectItem value="3">3 Bedrooms</SelectItem>
                          <SelectItem value="4">4 Bedrooms</SelectItem>
                          <SelectItem value="5">5 Bedrooms</SelectItem>
                          <SelectItem value="6">6 Bedrooms</SelectItem>
                          <SelectItem value="7">7 Bedrooms</SelectItem>
                          <SelectItem value="8+">8+ Bedrooms</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Bathrooms */}
                    <div className="space-y-2">
                      <Label htmlFor="bathrooms" className="text-sm font-medium flex items-center gap-2">
                        <Bath className="h-4 w-4" />
                        Bathrooms *
                      </Label>
                      <Select 
                        value={bookingData.bathrooms || ''} 
                        onValueChange={(value) => updateBookingData({ bathrooms: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select bathrooms" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Bathroom</SelectItem>
                          <SelectItem value="1.5">1.5 Bathrooms</SelectItem>
                          <SelectItem value="2">2 Bathrooms</SelectItem>
                          <SelectItem value="2.5">2.5 Bathrooms</SelectItem>
                          <SelectItem value="3">3 Bathrooms</SelectItem>
                          <SelectItem value="3.5">3.5 Bathrooms</SelectItem>
                          <SelectItem value="4">4 Bathrooms</SelectItem>
                          <SelectItem value="4.5">4.5 Bathrooms</SelectItem>
                          <SelectItem value="5">5 Bathrooms</SelectItem>
                          <SelectItem value="6+">6+ Bathrooms</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Dwelling Type */}
                    <div className="space-y-2">
                      <Label htmlFor="dwellingType" className="text-sm font-medium flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Dwelling Type *
                      </Label>
                      <Select 
                        value={bookingData.dwellingType || ''} 
                        onValueChange={(value) => updateBookingData({ dwellingType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select dwelling type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="house">Single Family House</SelectItem>
                          <SelectItem value="apartment">Apartment</SelectItem>
                          <SelectItem value="condo">Condominium</SelectItem>
                          <SelectItem value="townhouse">Townhouse</SelectItem>
                          <SelectItem value="duplex">Duplex</SelectItem>
                          <SelectItem value="mobile-home">Mobile Home</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Flooring Type - Optional */}
                    <div className="space-y-2">
                      <Label htmlFor="flooringType" className="text-sm font-medium flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Primary Flooring (Optional)
                      </Label>
                      <Select 
                        value={bookingData.flooringType || ''} 
                        onValueChange={(value) => updateBookingData({ flooringType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select flooring type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hardwood">Hardwood</SelectItem>
                          <SelectItem value="carpet">Carpet</SelectItem>
                          <SelectItem value="tile">Tile</SelectItem>
                          <SelectItem value="laminate">Laminate</SelectItem>
                          <SelectItem value="vinyl">Vinyl</SelectItem>
                          <SelectItem value="mixed">Mixed Flooring</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {(!bookingData.bedrooms || !bookingData.bathrooms || !bookingData.dwellingType) && (
                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <p className="text-sm text-muted-foreground">
                        Please complete the required property details to continue.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Show prompt if date/time selected but no property details */}
            {currentStep === 6 && bookingData.serviceDate && (!bookingData.bedrooms || !bookingData.bathrooms || !bookingData.dwellingType) && (
              <Card className="shadow-clean border-accent/50 bg-accent/5">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Users className="h-8 w-8 mx-auto mb-3 text-accent" />
                    <p className="text-lg font-medium text-foreground mb-2">Property Details Required</p>
                    <p className="text-sm text-muted-foreground">
                      Please provide your property details above to continue with booking
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

          </div>

          {/* Right Column - Price Summary - Show only when there's pricing to display */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              {currentStep >= 2 && bookingData.homeSize && bookingData.frequency ? (
                <Card className="shadow-clean border-primary/20">
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
                    <CardTitle>Booking Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedTier && selectedFrequency && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">{selectedTier.label}</span>
                            <div className="text-sm text-muted-foreground">{selectedFrequency.label}</div>
                          </div>
                          <div className="text-right">
                            {selectedTier.originalPricing[selectedFrequency.priceKey] > 0 && (
                              <div className="text-xs text-muted-foreground line-through">
                                ${selectedTier.originalPricing[selectedFrequency.priceKey]}
                              </div>
                            )}
                            <span className="font-semibold text-primary">${bookingData.basePrice}</span>
                          </div>
                        </div>
                        
                         {bookingData.frequencyDiscount > 0 && offerEligible && (
                           <div className="flex justify-between text-success">
                             <span>20% Discount Applied</span>
                             <span>-${bookingData.frequencyDiscount}</span>
                           </div>
                         )}
                        
                        {selectedAddOns.length > 0 && (
                          <div className="space-y-2">
                            {selectedAddOns.map(addOn => {
                              const addOnItem = addOns.find(a => a.value === addOn);
                              return addOnItem ? (
                                <div key={addOn} className="flex justify-between text-sm">
                                  <span>{addOnItem.label}</span>
                                  <span>+${addOnItem.price}</span>
                                </div>
                              ) : null;
                            })}
                          </div>
                        )}
                        
                        <hr className="border-border" />
                        
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span className="text-primary">${bookingData.totalPrice}</span>
                        </div>
                        
                        {bookingData.nextDayFee && bookingData.nextDayFee > 0 && (
                          <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                            <p className="text-sm font-medium text-primary">Includes $50 Next Day Priority Fee</p>
                          </div>
                        )}
                        
                         {bookingData.frequencyDiscount > 0 && offerEligible && (
                           <div className="bg-success/10 border border-success/20 rounded-lg p-3 mt-3">
                             <div className="flex items-center gap-2 text-success">
                               <CheckCircle className="h-4 w-4" />
                               <span className="font-medium">You're saving ${bookingData.frequencyDiscount}!</span>
                             </div>
                             <p className="text-sm text-success/80 mt-1">
                               20% discount applied to all services
                             </p>
                           </div>
                         )}
                         
                         {!offerEligible && (
                           <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 mt-3">
                             <p className="text-sm text-warning font-medium">
                               This promotional offer has already been redeemed for your details.
                             </p>
                           </div>
                         )}
                      </div>
                    )}
                    
                    <Button 
                      onClick={handleNext}
                      disabled={!bookingData.serviceZipCode || !zipCodeValid || !bookingData.homeSize || !bookingData.frequency || !bookingData.serviceDate || !bookingData.serviceTime || !bookingData.bedrooms || !bookingData.bathrooms || !bookingData.dwellingType}
                      className="w-full"
                      size="lg"
                    >
                      Complete Booking
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-clean border-muted">
                  <CardHeader>
                    <CardTitle className="text-center">Get Your Quote</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium", 
                          zipCodeValid ? "bg-success text-success-foreground" : currentStep >= 1 ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground")}>
                          1
                        </div>
                        <span className={cn("text-sm", zipCodeValid ? "text-success" : "text-muted-foreground")}>
                          {zipCodeValid ? "✓ Service Area Verified" : "Enter ZIP Code"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                          bookingData.homeSize ? "bg-success text-success-foreground" : currentStep >= 2 ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground")}>
                          2
                        </div>
                        <span className={cn("text-sm", bookingData.homeSize ? "text-success" : currentStep >= 2 ? "text-foreground" : "text-muted-foreground")}>
                          {bookingData.homeSize ? "✓ Home Size Selected" : "Select Home Size"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                          bookingData.frequency ? "bg-success text-success-foreground" : currentStep >= 3 ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground")}>
                          3
                        </div>
                        <span className={cn("text-sm", bookingData.frequency ? "text-success" : currentStep >= 3 ? "text-foreground" : "text-muted-foreground")}>
                          {bookingData.frequency ? "✓ Service Type Selected" : "Choose Service Type"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                          currentStep >= 4 ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground")}>
                          4
                        </div>
                        <span className={cn("text-sm", currentStep >= 4 ? "text-success" : "text-muted-foreground")}>
                          {currentStep >= 4 ? "✓ Add-Ons Available" : "Select Add-Ons"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                          (bookingData.serviceDate && bookingData.serviceTime) ? "bg-success text-success-foreground" : currentStep >= 5 ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground")}>
                          5
                        </div>
                        <span className={cn("text-sm", (bookingData.serviceDate && bookingData.serviceTime) ? "text-success" : currentStep >= 5 ? "text-foreground" : "text-muted-foreground")}>
                          {(bookingData.serviceDate && bookingData.serviceTime) ? "✓ Date & Time Selected" : "Choose Date & Time"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                          (bookingData.bedrooms && bookingData.bathrooms && bookingData.dwellingType) ? "bg-success text-success-foreground" : currentStep >= 6 ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground")}>
                          6
                        </div>
                        <span className={cn("text-sm", (bookingData.bedrooms && bookingData.bathrooms && bookingData.dwellingType) ? "text-success" : currentStep >= 6 ? "text-foreground" : "text-muted-foreground")}>
                          {(bookingData.bedrooms && bookingData.bathrooms && bookingData.dwellingType) ? "✓ Property Details Added" : "Add Property Details"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
           </div>
         </div>
       </div>
       
       {/* Alert Dialog for Offer Already Used */}
       <AlertDialog open={showOfferUsedAlert} onOpenChange={setShowOfferUsedAlert}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Promotional Offer Already Redeemed</AlertDialogTitle>
             <AlertDialogDescription>
               Our records show that this promotional offer has already been used with your details (name, address, email, or phone number). 
               Each customer can only redeem this special offer once. You can continue with regular pricing.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogAction onClick={() => setShowOfferUsedAlert(false)}>
             Continue with Regular Pricing
           </AlertDialogAction>
         </AlertDialogContent>
       </AlertDialog>
     </div>
   );
 }