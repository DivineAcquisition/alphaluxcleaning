import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Circle, ArrowRight, ArrowLeft, Calendar, CreditCard, Home, MapPin, Clock, Phone, Sparkles, Star, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { toast } from 'sonner';

// Import existing booking components for reuse
import { BookingCheckoutPage } from '@/components/booking/BookingCheckoutPage';
import { EnhancedSchedulingStep } from '@/components/EnhancedSchedulingStep';
import { useAuth } from '@/contexts/AuthContext';

// Service tiers from RecurringBookingInterface
const bookingTiers = [
  {
    id: 'general',
    hours: 2,
    basePrice: 220,
    description: 'General Cleaning',
    shortDescription: 'Perfect for regular maintenance with 15% off one-time service',
    cleaners: 2,
    icon: 'home',
    popular: false,
    bestFor: 'Weekly maintained homes',
    includes: [
      'All surfaces dusted and wiped',
      'Floors vacuumed and mopped', 
      'Bathrooms deep cleaned',
      'Kitchen cleaned and sanitized'
    ]
  },
  {
    id: 'complete',
    hours: 4,
    basePrice: 420,
    description: 'Deep Clean',
    shortDescription: 'Our most popular comprehensive service with 15% off one-time service',
    cleaners: 2,
    icon: 'star',
    popular: true,
    bestFor: 'Most homes every 2-4 weeks',
    includes: [
      'All surfaces dusted and wiped',
      'Floors vacuumed and mopped', 
      'Bathrooms deep cleaned',
      'Kitchen cleaned and sanitized',
      'Inside appliances cleaned',
      'Detailed bathroom sanitization',
      'Light fixture dusting',
      'Window sill cleaning'
    ]
  },
  {
    id: 'premium',
    hours: 6,
    basePrice: 500,
    description: 'Premium Deep Clean',
    shortDescription: 'Complete top-to-bottom transformation - premium pricing',
    cleaners: 3,
    icon: 'sparkles',
    popular: false,
    bestFor: 'Move-ins, special occasions, deep refresh',
    includes: [
      'Everything in Signature Clean',
      'Baseboards hand-wiped',
      'Cabinet fronts detailed',
      'Light switch plates cleaned',
      'Door frames and trim detailed',
      'Extra attention to problem areas'
    ]
  }
];

const recurringOptions = [
  {
    id: 'one-time',
    name: 'One-Time Clean',
    frequency: 'once',
    discount: 0,
    description: 'Single cleaning service'
  },
  {
    id: 'weekly',
    name: 'Weekly',
    frequency: 'weekly',
    discount: 10,
    description: 'Every week - Maximum savings!'
  },
  {
    id: 'bi-weekly',
    name: 'Bi-Weekly',
    frequency: 'bi-weekly',
    discount: 7,
    description: 'Every 2 weeks - Great value'
  },
  {
    id: 'monthly',
    name: 'Monthly',
    frequency: 'monthly',
    discount: 5,
    description: 'Once a month - Convenient'
  }
];

const addOnServices = [
  { id: 'fridge', name: 'Inside Refrigerator', price: 35, description: 'Clean and organize inside refrigerator' },
  { id: 'oven', name: 'Inside Oven', price: 35, description: 'Deep clean inside oven' },
  { id: 'baseboards', name: 'Whole Home Baseboards', price: 50, description: 'Hand-wipe all baseboards' },
  { id: 'cabinet-fronts', name: 'Cabinet Front Cleaning', price: 50, description: 'Clean all kitchen cabinet fronts' },
  { id: 'blinds', name: 'Detailed Blind Cleaning', price: 15, description: 'Per blind detailed cleaning' },
  { id: 'wall-washing', name: 'Wall Washing', price: 25, description: 'Per room wall washing' },
  { id: 'laundry', name: 'Extra Laundry Folding', price: 20, description: 'Per basket laundry folding' },
  { id: 'garage', name: 'Garage Sweeping', price: 30, description: 'Complete garage sweep' },
];

interface BookingData {
  // Step 1: Service Selection
  homeSize: string;
  frequency: string;
  addOns: string[];
  addMembership: boolean;
  
  // Step 2: Service Details & Scheduling
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
  nextDayFee?: number;
  
  // Property Details
  squareFootage: number;
  bedrooms: string;
  bathrooms: string;
  dwellingType: string;
  flooringType: string;
  
  // Customer Information
  customerName: string;
  customerEmail: string;
  
  // Pricing calculations
  basePrice: number;
  addOnPrices: { [key: string]: number };
  frequencyDiscount: number;
  membershipDiscount: number;
  membershipFee: number;
  totalPrice: number;
  paymentType: 'pay_after_service' | '25_percent_with_discount';
  promoDiscount: number;
}

const initialBookingData: BookingData = {
  homeSize: '',
  frequency: 'one-time',
  addOns: [],
  addMembership: false,
  serviceDate: '',
  serviceTime: '',
  address: {
    street: '',
    city: '',
    state: 'CA',
    zipCode: ''
  },
  contactNumber: '',
  specialInstructions: '',
  squareFootage: 1000,
  bedrooms: '',
  bathrooms: '',
  dwellingType: '',
  flooringType: '',
  customerName: '',
  customerEmail: '',
  basePrice: 0,
  addOnPrices: {},
  frequencyDiscount: 0,
  membershipDiscount: 0,
  membershipFee: 0,
  totalPrice: 0,
  paymentType: 'pay_after_service',
  promoDiscount: 0
};

interface UnifiedBookingWizardProps {
  onBookingComplete?: (sessionId: string) => void;
}

const steps = [
  { id: 1, title: 'Service Selection', icon: Home, description: 'Choose your cleaning service' },
  { id: 2, title: 'Schedule & Details', icon: Calendar, description: 'Pick date, time & address' },
  { id: 3, title: 'Payment', icon: CreditCard, description: 'Complete your booking' }
];

export function UnifiedBookingWizard({ onBookingComplete }: UnifiedBookingWizardProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Use form persistence to save data across sessions
  const {
    data: bookingData,
    updateField,
    updateData,
    clearData,
    isLoading: isPersistenceLoading,
    lastSaved
  } = useFormPersistence<BookingData>(initialBookingData, {
    storageKey: 'unified-booking-data',
    debounceMs: 2000
  });

  // Calculate pricing whenever relevant data changes
  useEffect(() => {
    const selectedTier = bookingTiers.find(tier => tier.id === bookingData.homeSize);
    if (!selectedTier) return;

    let basePrice = selectedTier.basePrice;
    
    // Apply one-time service discounts
    const selectedRecurring = recurringOptions.find(opt => opt.id === bookingData.frequency);
    if (selectedRecurring && selectedRecurring.frequency === 'once') {
      if (bookingData.homeSize === 'general' || bookingData.homeSize === 'complete') {
        basePrice = Math.round(basePrice * 0.85);
      } else if (bookingData.homeSize === 'premium') {
        basePrice = Math.round(basePrice * 0.80);
      }
    }

    // Calculate add-on prices with membership discount
    const addOnPrices: { [key: string]: number } = {};
    bookingData.addOns.forEach(addOnId => {
      const addOn = addOnServices.find(service => service.id === addOnId);
      if (addOn) {
        const addOnPrice = addOn.price;
        // Apply 10% membership discount to add-ons if membership is selected
        const discountedPrice = bookingData.addMembership ? addOnPrice * 0.9 : addOnPrice;
        addOnPrices[addOnId] = discountedPrice;
      }
    });

    const addOnsTotal = Object.values(addOnPrices).reduce((sum, price) => sum + price, 0);
    const subtotal = basePrice + addOnsTotal;
    const frequencyDiscount = selectedRecurring ? Math.round(subtotal * (selectedRecurring.discount / 100)) : 0;
    const membershipDiscount = bookingData.addMembership ? 20 : 0;
    const membershipFee = bookingData.addMembership ? 39 : 0;
    const totalPrice = subtotal - frequencyDiscount - membershipDiscount;

    updateData({
      basePrice,
      addOnPrices,
      frequencyDiscount,
      membershipDiscount,
      membershipFee,
      totalPrice
    });
  }, [bookingData.homeSize, bookingData.frequency, bookingData.addOns, bookingData.addMembership]);

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return bookingData.homeSize && bookingData.frequency;
      case 2:
        return bookingData.serviceDate && 
               bookingData.serviceTime && 
               bookingData.address.street && 
               bookingData.contactNumber &&
               bookingData.customerName &&
               bookingData.customerEmail &&
               bookingData.bedrooms &&
               bookingData.bathrooms &&
               bookingData.dwellingType;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceedToNext() && currentStep < 3) {
      setCurrentStep(currentStep + 1);
      
      // Auto-save progress notification
      if (lastSaved) {
        toast.success('Progress saved automatically');
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePaymentSuccess = (sessionId: string) => {
    // Clear saved data after successful booking
    clearData();
    
    toast.success('Booking completed successfully!');
    onBookingComplete?.(sessionId);
  };

  const toggleAddOn = (addOnId: string) => {
    const currentAddOns = bookingData.addOns;
    const newAddOns = currentAddOns.includes(addOnId)
      ? currentAddOns.filter(id => id !== addOnId)
      : [...currentAddOns, addOnId];
    
    updateField('addOns', newAddOns);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            {/* BACP Club™ Membership */}
            <Card className="shadow-clean border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  BACP Club™ Membership
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg border border-primary/20 bg-background">
                  <div className="flex-1">
                    <h4 className="font-semibold text-primary">Join BACP Club™ for $39/month</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      $20 off every clean + exclusive member benefits
                    </p>
                    
                    {bookingData.addMembership && (
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-primary" />
                          <span className="text-sm">$20 off every clean</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-primary" />
                          <span className="text-sm">10% off all add-ons</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <span className="text-sm">Priority scheduling</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ArrowRight className="h-4 w-4 text-primary" />
                          <span className="text-sm">Loyalty rewards</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Switch
                      checked={bookingData.addMembership}
                      onCheckedChange={(checked) => updateField('addMembership', checked)}
                    />
                    {bookingData.addMembership && (
                      <Badge className="bg-success text-success-foreground">
                        Save $20 Today!
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Tier Selection */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Choose Your Service Level</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {bookingTiers.map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => updateField('homeSize', tier.id)}
                    className={cn(
                      "p-6 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-lg",
                      bookingData.homeSize === tier.id
                        ? "border-primary bg-primary/5 shadow-clean"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {tier.popular && (
                      <Badge className="mb-2 bg-primary text-primary-foreground">Most Popular</Badge>
                    )}
                    <h4 className="font-bold text-lg mb-2">{tier.description}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{tier.shortDescription}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-primary">
                        ${tier.basePrice}
                        {bookingData.addMembership && (
                          <span className="block text-sm text-success font-normal">
                            ${tier.basePrice - 20} with membership
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {tier.hours}h • {tier.cleaners} cleaners
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Frequency Selection */}
            {bookingData.homeSize && (
              <div className="animate-fade-in">
                <h3 className="text-xl font-semibold mb-4">How Often?</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {recurringOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => updateField('frequency', option.id)}
                      className={cn(
                        "p-4 rounded-lg border-2 text-left transition-all duration-200",
                        bookingData.frequency === option.id
                          ? "border-primary bg-primary/5 shadow-clean"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <h4 className="font-semibold mb-1">{option.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{option.description}</p>
                      {option.discount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {option.discount}% off
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add-Ons Selection */}
            {bookingData.frequency && (
              <div className="animate-fade-in">
                <h3 className="text-xl font-semibold mb-4">Optional Add-Ons</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addOnServices.map((addOn) => (
                    <button
                      key={addOn.id}
                      onClick={() => toggleAddOn(addOn.id)}
                      className={cn(
                        "p-4 rounded-lg border-2 text-left transition-all duration-200",
                        bookingData.addOns.includes(addOn.id)
                          ? "border-primary bg-primary/5 shadow-clean"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{addOn.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-primary">
                            +${bookingData.addMembership ? Math.round(addOn.price * 0.9) : addOn.price}
                            {bookingData.addMembership && (
                              <span className="text-xs text-success ml-1">(10% off)</span>
                            )}
                          </span>
                          {bookingData.addOns.includes(addOn.id) && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{addOn.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <EnhancedSchedulingStep
            bookingData={bookingData}
            updateBookingData={updateData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );

      case 3:
        return (
          <BookingCheckoutPage
            bookingData={bookingData}
            updateBookingData={updateData}
            onPaymentSuccess={handlePaymentSuccess}
            onBack={handleBack}
          />
        );

      default:
        return null;
    }
  };

  if (isPersistenceLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <span className="ml-2 text-muted-foreground">Loading your booking...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Progress Header */}
      <Card className="shadow-clean">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-2xl">Complete Your Booking</CardTitle>
            {lastSaved && (
              <div className="text-sm text-muted-foreground">
                Auto-saved {new Date(lastSaved).toLocaleTimeString()}
              </div>
            )}
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-4">
            <Progress value={(currentStep / 3) * 100} className="h-2" />
            
            {/* Step Indicators */}
            <div className="flex justify-between">
              {steps.map((step) => {
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;
                const Icon = step.icon;
                
                return (
                  <div key={step.id} className="flex items-center gap-2">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                      isCompleted ? "bg-primary text-primary-foreground" :
                      isCurrent ? "bg-primary/20 text-primary border-2 border-primary" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <div className="hidden sm:block">
                      <div className={cn(
                        "font-medium text-sm",
                        isCurrent ? "text-primary" : "text-muted-foreground"
                      )}>
                        {step.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {step.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Step Content */}
      <div className="min-h-[600px]">
        {renderStepContent()}
      </div>

      {/* Navigation - Only show for step 1 since other steps handle their own navigation */}
      {currentStep === 1 && (
        <div className="flex justify-between items-center pt-6">
          <div className="text-sm text-muted-foreground">
            Step {currentStep} of {steps.length}
          </div>
          
          <div className="flex gap-4">
            <Button
              onClick={handleNext}
              disabled={!canProceedToNext()}
              size="lg"
              className="flex items-center gap-2"
            >
              Continue to Schedule
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Price Summary - Always visible on step 1 and 2 */}
      {(currentStep === 1 || currentStep === 2) && bookingData.totalPrice > 0 && (
        <Card className="shadow-clean bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-lg">Price Summary</h4>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  ${bookingData.totalPrice}
                </div>
                {bookingData.frequencyDiscount > 0 && (
                  <div className="text-sm text-success">
                    You saved ${bookingData.frequencyDiscount}!
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Base Service</span>
                <span>${bookingData.basePrice}</span>
              </div>
              
              {bookingData.addOns.length > 0 && (
                <div className="flex justify-between">
                  <span>Add-ons ({bookingData.addOns.length})</span>
                  <span>+${Object.values(bookingData.addOnPrices).reduce((sum, price) => sum + price, 0)}</span>
                </div>
              )}
              
              {bookingData.frequencyDiscount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Frequency Discount</span>
                  <span>-${bookingData.frequencyDiscount}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}