import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Home, Sparkles, RefreshCw, ArrowRight, Star, Zap, MapPin, CheckCircle, Building, BedDouble, Bath, Users, CalendarIcon, Clock, User, Phone, Mail, TruckIcon, PackageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { validateServiceAreaZipCode, getNearestServiceableZipCodes, SERVICE_AREA_INFO } from '@/lib/service-area-validation';
import { hasUsedPromoOffer, CustomerData, markPromoOfferUsed } from '@/lib/offer-tracking';
// BookingCheckoutPage removed - keeping simplified booking flow
import { toLocalDate } from '@/lib/date-helpers';

interface BookingData {
  serviceZipCode: string;
  serviceType: string; // NEW: General, Deep, Move-In, Move-Out
  homeSize: string;
  frequency: string; // Only applies to General and Deep
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
  
  // Contact & Address Details
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
  
  // Payment
  paymentType: 'pay_after_service' | '25_percent_with_discount';
  promoDiscount: number;
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

// 4 Main Service Types
const serviceTypes = [
  {
    value: 'general',
    label: 'General Cleaning',
    icon: Home,
    description: 'Regular maintenance cleaning for well-maintained homes',
    features: ['All surfaces dusted', 'Floors vacuumed & mopped', 'Bathrooms cleaned', 'Kitchen sanitized'],
    allowsRecurring: true,
    priceMultiplier: 1.0
  },
  {
    value: 'deep',
    label: 'Deep Cleaning',
    icon: Star,
    description: 'Comprehensive detailed cleaning service',
    features: ['Everything in General', 'Inside appliances', 'Detailed scrubbing', 'Light fixtures'],
    allowsRecurring: true,
    priceMultiplier: 1.35,
    popular: true
  },
  {
    value: 'move-in',
    label: 'Move-In Cleaning',
    icon: TruckIcon,
    description: 'Specialized cleaning for new occupancy',
    features: ['Deep clean included', 'Inside all appliances', 'Cabinet interiors', 'Ready to move in'],
    allowsRecurring: false,
    priceMultiplier: 1.5,
    oneTimeOnly: true
  },
  {
    value: 'move-out',
    label: 'Move-Out Cleaning',
    icon: PackageIcon,
    description: 'Specialized cleaning for vacating properties',
    features: ['Deep clean included', 'Deposit recovery focus', 'Inside all appliances', 'Rental ready'],
    allowsRecurring: false,
    priceMultiplier: 1.5,
    oneTimeOnly: true
  }
];

// Frequency options for General and Deep Cleaning only
const recurringOptions = [
  {
    value: 'one-time',
    label: 'One-Time Service',
    icon: Sparkles,
    priceKey: 'oneTime',
    description: 'Single cleaning service'
  },
  {
    value: 'weekly',
    label: 'Weekly Service',
    icon: RefreshCw,
    priceKey: 'weekly',
    description: 'Weekly recurring service - Best value',
    discount: 0.15 // 15% discount
  },
  {
    value: 'bi-weekly',
    label: 'Every Other Week',
    icon: RefreshCw,
    priceKey: 'biweekly',
    description: 'Bi-weekly recurring service',
    popular: true,
    discount: 0.10 // 10% discount
  },
  {
    value: 'monthly',
    label: 'Monthly Service',
    icon: RefreshCw,
    priceKey: 'monthly',
    description: 'Monthly recurring service',
    discount: 0.05 // 5% discount
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
  const navigate = useNavigate();
  
  // Scroll refs for auto-scroll functionality
  const serviceTypeRef = useRef<HTMLDivElement>(null);
  const frequencyRef = useRef<HTMLDivElement>(null);
  const homeSizeRef = useRef<HTMLDivElement>(null);
  const addOnsRef = useRef<HTMLDivElement>(null);
  const dateTimeRef = useRef<HTMLDivElement>(null);
  const propertyDetailsRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  
  const [bookingData, setBookingData] = useState<Partial<BookingData>>({
    address: { street: '', city: '', state: 'CA', zipCode: '' }
  });
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [zipCodeValid, setZipCodeValid] = useState(false);
  const [zipCodeError, setZipCodeError] = useState<string>('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: zip, 2: service type, 3: frequency (if applicable), 4: home size, 5: add-ons, 6: date/time, 7: property details, 8: contact/address
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

  // Auto-scroll function with smooth behavior
  const scrollToSection = (ref: React.RefObject<HTMLDivElement>, delay = 800) => {
    setTimeout(() => {
      ref.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
    }, delay);
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
        setCurrentStep(2); // Move to service type selection
        scrollToSection(serviceTypeRef);
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
    if (zipCodeValid && bookingData.serviceType) {
      const selectedService = serviceTypes.find(s => s.value === bookingData.serviceType);
      if (selectedService?.oneTimeOnly) {
        // Move-in/Move-out skip frequency selection
        setCurrentStep(4); // Move to home size
      } else {
        setCurrentStep(3); // Move to frequency selection
      }
    }
    if (zipCodeValid && bookingData.serviceType && bookingData.frequency) {
      setCurrentStep(4); // Move to home size selection
    }
    if (zipCodeValid && bookingData.serviceType && 
        ((bookingData.frequency) || (serviceTypes.find(s => s.value === bookingData.serviceType)?.oneTimeOnly)) && 
        bookingData.homeSize) {
      setCurrentStep(5); // Move to add-ons selection
    }
    if (zipCodeValid && bookingData.serviceType && 
        ((bookingData.frequency) || (serviceTypes.find(s => s.value === bookingData.serviceType)?.oneTimeOnly)) && 
        bookingData.homeSize) {
      setCurrentStep(6); // Move to date/time selection
    }
    if (zipCodeValid && bookingData.serviceType && 
        ((bookingData.frequency) || (serviceTypes.find(s => s.value === bookingData.serviceType)?.oneTimeOnly)) && 
        bookingData.homeSize && bookingData.serviceDate && bookingData.serviceTime) {
      setCurrentStep(7); // Move to property details
    }
    if (zipCodeValid && bookingData.serviceType && 
        ((bookingData.frequency) || (serviceTypes.find(s => s.value === bookingData.serviceType)?.oneTimeOnly)) && 
        bookingData.homeSize && bookingData.serviceDate && bookingData.serviceTime &&
        bookingData.bedrooms && bookingData.bathrooms && bookingData.dwellingType) {
      setCurrentStep(8); // Move to contact/address details
    }
  }, [zipCodeValid, bookingData.serviceType, bookingData.frequency, bookingData.homeSize, bookingData.serviceDate, bookingData.serviceTime, bookingData.bedrooms, bookingData.bathrooms, bookingData.dwellingType]);

  // Calculate pricing with new service type structure
  useEffect(() => {
    const selectedTier = homeSizes.find(h => h.value === bookingData.homeSize);
    const selectedService = serviceTypes.find(s => s.value === bookingData.serviceType);
    const selectedFrequency = recurringOptions.find(r => r.value === bookingData.frequency);

    if (selectedTier && selectedService) {
      // Base price calculation with service type multiplier
      let basePrice = 0;
      
      if (selectedService.oneTimeOnly) {
        // Move-in/Move-out pricing (use oneTime pricing with service multiplier)
        basePrice = Math.round(selectedTier.pricing.oneTime * selectedService.priceMultiplier);
      } else if (selectedFrequency) {
        // General/Deep cleaning with frequency
        let tierPrice = selectedTier.pricing[selectedFrequency.priceKey] || selectedTier.pricing.oneTime;
        basePrice = Math.round(tierPrice * selectedService.priceMultiplier);
        
        // Apply frequency discount for recurring services
        if (selectedFrequency.discount && selectedFrequency.value !== 'one-time') {
          basePrice = Math.round(basePrice * (1 - selectedFrequency.discount));
        }
      }
      
      // Apply 20% new client discount if eligible
      if (!offerEligible) {
        basePrice = Math.round(basePrice / 0.8); // Reverse the discount to get original price
      }
      
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

      // Calculate discount savings
      const originalPrice = Math.round(basePrice / 0.8);
      const frequencyDiscount = offerEligible && originalPrice > basePrice 
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
  }, [bookingData.homeSize, bookingData.serviceType, bookingData.frequency, selectedAddOns, bookingData.nextDayFee, offerEligible]);

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
      updateBookingData({ serviceDate: toLocalDate(date) });
      // Auto-scroll to time selection after brief delay to let content render
      setTimeout(() => {
        const timeSection = document.querySelector('[data-time-selection]');
        timeSection?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }, 300);
    }
  };

  const handleProceedToCheckout = () => {
    // Validate all required fields
    const requiredFields = [
      'serviceZipCode', 'homeSize', 'frequency', 'serviceDate', 'serviceTime',
      'bedrooms', 'bathrooms', 'dwellingType', 'customerName', 'customerEmail', 'contactNumber'
    ];
    
    const missingFields = requiredFields.filter(field => {
      if (field === 'customerName' || field === 'customerEmail' || field === 'contactNumber') {
        return !bookingData[field];
      }
      return !bookingData[field as keyof BookingData];
    });
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (bookingData.customerEmail && !emailRegex.test(bookingData.customerEmail)) {
      toast.error('Please enter a valid email address');
      const element = document.querySelector(`[data-step="8"]`);
      element?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    
    if (missingFields.length > 0 || !bookingData.address?.street || !zipCodeValid) {
      // Scroll to the first missing section
      const element = document.querySelector(`[data-step="${currentStep}"]`);
      element?.scrollIntoView({ behavior: 'smooth' });
      toast.error('Please complete all required fields');
      return;
    }
    
    // Check if customer has already used the promotional offer
    if (offerEligible) {
      const customerData: CustomerData = {
        name: bookingData.customerName,
        email: bookingData.customerEmail,
        phone: bookingData.contactNumber,
        zipCode: bookingData.serviceZipCode,
        address: bookingData.address?.street
      };
      
      if (hasUsedPromoOffer(customerData)) {
        setOfferEligible(false);
        setShowOfferUsedAlert(true);
        return;
      }
    }
    
    setShowCheckout(true);
  };

  const handlePaymentSuccess = (sessionId: string) => {
    // Mark promo offer as used if eligible
    if (offerEligible && bookingData.customerName && bookingData.customerEmail) {
      const customerData: CustomerData = {
        name: bookingData.customerName,
        email: bookingData.customerEmail,
        phone: bookingData.contactNumber,
        zipCode: bookingData.serviceZipCode,
        address: bookingData.address?.street
      };
      markPromoOfferUsed(customerData);
    }
    
    // Navigate to order confirmation
    navigate(`/order-confirmation?session_id=${sessionId}`);
  };

  const handleBackFromCheckout = () => {
    setShowCheckout(false);
  };

  if (showCheckout) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Complete Your Booking</h2>
          <p className="text-muted-foreground mb-6">
            Your booking details have been saved. You'll receive payment information via email.
          </p>
          <Button 
            onClick={() => window.location.href = '/booking-confirmation'}
            className="w-full max-w-sm"
          >
            Confirm Booking
          </Button>
        </div>
      </div>
    );
  }

  const selectedTier = homeSizes.find(h => h.value === bookingData.homeSize);
  const selectedService = serviceTypes.find(s => s.value === bookingData.serviceType);
  const selectedFrequency = recurringOptions.find(r => r.value === bookingData.frequency);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="w-full max-w-7xl mx-auto py-8 px-4">
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
                      <p className="text-sm font-bold text-yellow-300">Save Up 75+ With Our Premium Cleanings</p>
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

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 max-w-4xl mx-auto lg:mx-0 space-y-8">
            
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

            {/* Service Type Selection - Show only after valid ZIP */}
            {currentStep >= 2 && (
              <Card className="shadow-clean" ref={serviceTypeRef}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Choose Your Service Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {serviceTypes.map((service) => {
                      const Icon = service.icon;
                      return (
                        <div
                          key={service.value}
                          onClick={() => {
                            updateBookingData({ serviceType: service.value, frequency: service.oneTimeOnly ? 'one-time' : '' });
                            // Auto-scroll based on service type
                            if (service.oneTimeOnly) {
                              scrollToSection(homeSizeRef);
                            } else {
                              scrollToSection(frequencyRef);
                            }
                          }}
                          className={cn(
                            "relative p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-lg",
                            bookingData.serviceType === service.value
                              ? "border-primary bg-primary/5 shadow-clean"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          {service.popular && (
                            <Badge className="absolute -top-2 -right-2 bg-accent text-accent-foreground">
                              Most Popular
                            </Badge>
                          )}
                          <div className="flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-3">
                              <Icon className="h-6 w-6 text-primary" />
                              <span className="font-semibold text-lg">{service.label}</span>
                              {service.oneTimeOnly && (
                                <Badge variant="outline" className="text-xs">One-Time Only</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-4 flex-grow">
                              {service.description}
                            </p>
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-foreground">What's included:</p>
                              <ul className="text-xs text-muted-foreground space-y-1">
                                {service.features.map((feature, index) => (
                                  <li key={index} className="flex items-center gap-2">
                                    <CheckCircle className="h-3 w-3 text-success flex-shrink-0" />
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Show prompt if ZIP valid but no service type selected */}
            {currentStep === 2 && !bookingData.serviceType && (
              <Card className="shadow-clean border-accent/50 bg-accent/5">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Sparkles className="h-8 w-8 mx-auto mb-3 text-accent" />
                    <p className="text-lg font-medium text-foreground mb-2">Choose Your Service Type</p>
                    <p className="text-sm text-muted-foreground">
                      Select the type of cleaning service you need above
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Frequency Selection - Show only for General/Deep cleaning after service type selected */}
            {currentStep >= 3 && bookingData.serviceType && selectedService?.allowsRecurring && (
              <Card className="shadow-clean" ref={frequencyRef}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    Service Frequency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {recurringOptions.map((option) => {
                      const Icon = option.icon;
                      
                      return (
                        <div
                          key={option.value}
                          onClick={() => {
                            updateBookingData({ frequency: option.value });
                            scrollToSection(homeSizeRef);
                          }}
                          className={cn(
                            "relative p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-lg",
                            bookingData.frequency === option.value
                              ? "border-primary bg-primary/5 shadow-clean"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          {option.popular && (
                            <Badge className="absolute -top-2 -right-2 bg-accent text-accent-foreground">
                              Most Popular
                            </Badge>
                          )}
                          <div className="flex items-center gap-3 mb-3">
                            <Icon className="h-5 w-5 text-primary" />
                            <span className="font-semibold">{option.label}</span>
                          </div>
                          
                          <div className="space-y-2">
                            {option.discount && (
                              <div className="flex items-center justify-center">
                                <Badge variant="secondary" className="text-xs bg-success/20 text-success">
                                  {Math.round(option.discount * 100)}% OFF Recurring
                                </Badge>
                              </div>
                            )}
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">{option.description}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Show prompt if service type selected but no frequency for recurring services */}
            {currentStep === 3 && bookingData.serviceType && selectedService?.allowsRecurring && !bookingData.frequency && (
              <Card className="shadow-clean border-accent/50 bg-accent/5">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 mx-auto mb-3 text-accent" />
                    <p className="text-lg font-medium text-foreground mb-2">Choose Service Frequency</p>
                    <p className="text-sm text-muted-foreground">
                      Select your preferred cleaning frequency above to continue
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Home Size Selection - Show after frequency or directly after Move-In/Move-Out */}
            {currentStep >= 4 && (
              <Card className="shadow-clean" ref={homeSizeRef}>
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
                      // Calculate price preview based on selected service type and frequency
                      let displayPrice = 0;
                      if (selectedService) {
                        if (selectedService.oneTimeOnly) {
                          displayPrice = Math.round(tier.pricing.oneTime * selectedService.priceMultiplier);
                        } else if (selectedFrequency) {
                          let tierPrice = tier.pricing[selectedFrequency.priceKey] || tier.pricing.oneTime;
                          displayPrice = Math.round(tierPrice * selectedService.priceMultiplier);
                          if (selectedFrequency.discount && selectedFrequency.value !== 'one-time') {
                            displayPrice = Math.round(displayPrice * (1 - selectedFrequency.discount));
                          }
                        }
                      }
                      const originalPrice = Math.round(displayPrice / 0.8);
                      
                      return (
                        <div
                          key={tier.value}
                          onClick={() => {
                            if (!tier.requiresQuote) {
                              updateBookingData({ homeSize: tier.value });
                              scrollToSection(addOnsRef);
                            }
                          }}
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
                                  {offerEligible && originalPrice > displayPrice && (
                                    <div className="flex items-center gap-2">
                                      <span className="line-through text-muted-foreground text-sm">
                                        ${originalPrice}
                                      </span>
                                      <Badge variant="secondary" className="text-xs bg-success/20 text-success">
                                        20% OFF
                                      </Badge>
                                    </div>
                                  )}
                                  <p className="text-lg font-bold text-primary">
                                    {displayPrice > 0 ? `$${offerEligible ? displayPrice : originalPrice}` : 'Select service first'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {selectedService?.oneTimeOnly ? 'one-time service' : 
                                     selectedFrequency ? selectedFrequency.description : 'select frequency'}
                                  </p>
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

            {/* Add-Ons Selection - Show only after home size selected */}
            {currentStep >= 5 && (
              <Card className="shadow-clean" ref={addOnsRef}>
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
                            onCheckedChange={() => {
                              toggleAddOn(addOn.value);
                              // Auto-scroll after first add-on interaction
                              if (selectedAddOns.length === 0) {
                                scrollToSection(dateTimeRef);
                              }
                            }}
                          />
                          <span className="font-medium">{addOn.label}</span>
                        </div>
                        <span className="text-primary font-semibold">+${addOn.price}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <Button 
                      variant="outline" 
                      onClick={() => scrollToSection(dateTimeRef)}
                      className="w-full"
                    >
                      Continue to Date & Time
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Date & Time Selection - Show only after add-ons selection */}
            {currentStep >= 6 && (
              <Card className="shadow-clean" ref={dateTimeRef}>
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
                      <div className="animate-fade-in" data-time-selection>
                        <h4 className="font-semibold mb-4">Select Time</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {timeSlots.map((slot) => (
                            <button
                              key={slot.value}
                              onClick={() => {
                                updateBookingData({ serviceTime: slot.value });
                                scrollToSection(propertyDetailsRef);
                              }}
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

            {/* Show prompt if date/time step but no date/time selected */}
            {currentStep === 6 && !bookingData.serviceDate && (
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
            {currentStep >= 7 && (
              <Card className="shadow-clean" ref={propertyDetailsRef}>
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
                        onValueChange={(value) => {
                          updateBookingData({ bedrooms: value });
                          if (bookingData.bathrooms && bookingData.dwellingType) {
                            scrollToSection(contactRef);
                          }
                        }}
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
                        onValueChange={(value) => {
                          updateBookingData({ bathrooms: value });
                          if (bookingData.bedrooms && bookingData.dwellingType) {
                            scrollToSection(contactRef);
                          }
                        }}
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
                        onValueChange={(value) => {
                          updateBookingData({ dwellingType: value });
                          if (bookingData.bedrooms && bookingData.bathrooms) {
                            scrollToSection(contactRef);
                          }
                        }}
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

            {/* Contact & Address Details - Step 8 */}
            {currentStep >= 8 && (
              <Card className="shadow-clean" data-step="8" ref={contactRef}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Contact & Service Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Customer Name */}
                    <div className="space-y-2">
                      <Label htmlFor="customerName" className="text-sm font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Full Name *
                      </Label>
                      <Input
                        id="customerName"
                        placeholder="Enter your full name"
                        value={bookingData.customerName || ''}
                        onChange={(e) => updateBookingData({ customerName: e.target.value })}
                      />
                    </div>

                    {/* Customer Email */}
                    <div className="space-y-2">
                      <Label htmlFor="customerEmail" className="text-sm font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address *
                      </Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        placeholder="Enter your email (e.g., john@example.com)"
                        value={bookingData.customerEmail || ''}
                        onChange={(e) => updateBookingData({ customerEmail: e.target.value })}
                        className={bookingData.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingData.customerEmail) ? "border-destructive" : ""}
                      />
                      {bookingData.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingData.customerEmail) && (
                        <p className="text-sm text-destructive">Please enter a valid email address</p>
                      )}
                    </div>

                    {/* Contact Number */}
                    <div className="space-y-2">
                      <Label htmlFor="contactNumber" className="text-sm font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone Number *
                      </Label>
                      <Input
                        id="contactNumber"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={bookingData.contactNumber || ''}
                        onChange={(e) => updateBookingData({ contactNumber: e.target.value })}
                      />
                    </div>

                    {/* Service Address */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="street" className="text-sm font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Service Address *
                      </Label>
                      <Input
                        id="street"
                        placeholder="Street address where service will be performed"
                        value={bookingData.address?.street || ''}
                        onChange={(e) => updateBookingData({ 
                          address: { 
                            ...bookingData.address, 
                            street: e.target.value,
                            zipCode: bookingData.serviceZipCode || bookingData.address?.zipCode || ''
                          } 
                        })}
                      />
                    </div>

                    {/* City, State (auto-filled based on ZIP) */}
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm font-medium">City</Label>
                      <Input
                        id="city"
                        placeholder="City"
                        value={bookingData.address?.city || ''}
                        onChange={(e) => updateBookingData({ 
                          address: { ...bookingData.address, city: e.target.value } 
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-sm font-medium">State</Label>
                      <Select 
                        value={bookingData.address?.state || 'CA'} 
                        onValueChange={(value) => updateBookingData({ 
                          address: { ...bookingData.address, state: value } 
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CA">California</SelectItem>
                          <SelectItem value="TX">Texas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Special Instructions */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="specialInstructions" className="text-sm font-medium">
                        Special Instructions (Optional)
                      </Label>
                      <Textarea
                        id="specialInstructions"
                        placeholder="Any specific cleaning requests, access instructions, or notes for our team..."
                        value={bookingData.specialInstructions || ''}
                        onChange={(e) => updateBookingData({ specialInstructions: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>

                  {(!bookingData.customerName || !bookingData.customerEmail || !bookingData.contactNumber || !bookingData.address?.street) && (
                    <div className="p-3 rounded-lg bg-muted/50 border mt-4">
                      <p className="text-sm text-muted-foreground">
                        Please complete all required contact and address fields to continue.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Show prompt if property details completed but no contact details */}
            {currentStep === 8 && (!bookingData.customerName || !bookingData.customerEmail || !bookingData.contactNumber || !bookingData.address?.street) && (
              <Card className="shadow-clean border-accent/50 bg-accent/5">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <User className="h-8 w-8 mx-auto mb-3 text-accent" />
                    <p className="text-lg font-medium text-foreground mb-2">Contact Details Required</p>
                    <p className="text-sm text-muted-foreground">
                      Please provide your contact information and service address above
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

          </div>

          {/* Right Column - Price Summary - Show only when there's pricing to display */}
          <div className="lg:col-span-1 max-w-md mx-auto lg:mx-0">
            <div className="sticky top-8">
            {currentStep >= 2 && bookingData.serviceType && bookingData.homeSize && 
             (selectedService?.oneTimeOnly || bookingData.frequency) ? (
                <Card className="shadow-clean border-primary/20">
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
                    <CardTitle>Booking Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedTier && selectedService && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">{selectedTier.label}</span>
                            <div className="text-sm text-muted-foreground">
                              {selectedService.label}
                              {!selectedService.oneTimeOnly && selectedFrequency && ` - ${selectedFrequency.label}`}
                            </div>
                          </div>
                          <div className="text-right">
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
                      onClick={handleProceedToCheckout}
                      disabled={!bookingData.serviceZipCode || !zipCodeValid || !bookingData.serviceType || !bookingData.homeSize || 
                               (!selectedService?.oneTimeOnly && !bookingData.frequency) || !bookingData.serviceDate || !bookingData.serviceTime || 
                               !bookingData.bedrooms || !bookingData.bathrooms || !bookingData.dwellingType || !bookingData.customerName || 
                               !bookingData.customerEmail || !bookingData.contactNumber || !bookingData.address?.street}
                      className="w-full"
                      size="lg"
                    >
                      Proceed to Payment
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
                           bookingData.serviceType ? "bg-success text-success-foreground" : currentStep >= 2 ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground")}>
                           2
                         </div>
                         <span className={cn("text-sm", bookingData.serviceType ? "text-success" : currentStep >= 2 ? "text-foreground" : "text-muted-foreground")}>
                           {bookingData.serviceType ? "✓ Service Type Selected" : "Choose Service Type"}
                         </span>
                       </div>
                       <div className="flex items-center gap-3">
                         <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                           (!selectedService?.allowsRecurring || bookingData.frequency) ? "bg-success text-success-foreground" : currentStep >= 3 ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground")}>
                           3
                         </div>
                         <span className={cn("text-sm", (!selectedService?.allowsRecurring || bookingData.frequency) ? "text-success" : currentStep >= 3 ? "text-foreground" : "text-muted-foreground")}>
                           {selectedService?.oneTimeOnly ? "✓ One-Time Service" : bookingData.frequency ? "✓ Frequency Selected" : "Choose Frequency"}
                         </span>
                       </div>
                       <div className="flex items-center gap-3">
                         <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                           bookingData.homeSize ? "bg-success text-success-foreground" : currentStep >= 4 ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground")}>
                           4
                         </div>
                         <span className={cn("text-sm", bookingData.homeSize ? "text-success" : currentStep >= 4 ? "text-foreground" : "text-muted-foreground")}>
                           {bookingData.homeSize ? "✓ Home Size Selected" : "Select Home Size"}
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
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                          (bookingData.customerName && bookingData.customerEmail && bookingData.contactNumber && bookingData.address?.street) ? "bg-success text-success-foreground" : currentStep >= 7 ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground")}>
                          7
                        </div>
                        <span className={cn("text-sm", (bookingData.customerName && bookingData.customerEmail && bookingData.contactNumber && bookingData.address?.street) ? "text-success" : currentStep >= 7 ? "text-foreground" : "text-muted-foreground")}>
                          {(bookingData.customerName && bookingData.customerEmail && bookingData.contactNumber && bookingData.address?.street) ? "✓ Contact Details Added" : "Add Contact Details"}
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