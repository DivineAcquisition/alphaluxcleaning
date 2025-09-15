import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, MapPin, Home, Clock, Star, Sparkles, Calendar, Phone, User, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateServiceAreaZipCode } from '@/lib/service-area-validation';
import { formatPrice } from '@/lib/pricing-utils';
// BookingCheckoutPage removed - keeping simplified booking flow
import { EnhancedSchedulingStep } from '@/components/EnhancedSchedulingStep';

// Simplified service types with clear pricing
const serviceTypes = [
  {
    id: 'general',
    name: 'General Cleaning',
    description: 'Perfect for regular maintenance cleaning',
    icon: Home,
    basePrice: 180,
    features: [
      'All surfaces dusted and wiped',
      'Floors vacuumed and mopped',
      'Bathrooms cleaned',
      'Kitchen cleaned and sanitized'
    ],
    allowRecurring: true,
    popular: false
  },
  {
    id: 'deep',
    name: 'Deep Cleaning',
    description: 'Comprehensive deep clean service',
    icon: Star,
    basePrice: 180,
    premium: 1.35, // 35% premium
    features: [
      'Everything in General Cleaning',
      'Inside appliances cleaned',
      'Detailed bathroom sanitization',
      'Light fixture dusting',
      'Window sill cleaning',
      'Baseboards wiped'
    ],
    allowRecurring: true,
    popular: true
  },
  {
    id: 'move-in',
    name: 'Move-In Cleaning',
    description: 'Complete move-in preparation',
    icon: Sparkles,
    basePrice: 180,
    premium: 1.5, // 50% premium
    features: [
      'Everything in Deep Cleaning',
      'Cabinet interiors cleaned',
      'All drawers and shelves',
      'Complete sanitization',
      'Move-in ready preparation'
    ],
    allowRecurring: false,
    popular: false
  },
  {
    id: 'move-out',
    name: 'Move-Out Cleaning',
    description: 'Get your deposit back',
    icon: Sparkles,
    basePrice: 180,
    premium: 1.5, // 50% premium
    features: [
      'Everything in Deep Cleaning',
      'Complete property preparation',
      'Deposit-back guarantee',
      'Final walkthrough ready'
    ],
    allowRecurring: false,
    popular: false
  }
];

// Simplified home size tiers
const homeSizes = [
  { id: 'small', name: 'Small (1-2 bedrooms)', multiplier: 1.0, description: 'Up to 1,200 sq ft' },
  { id: 'medium', name: 'Medium (2-3 bedrooms)', multiplier: 1.3, description: '1,200 - 2,000 sq ft' },
  { id: 'large', name: 'Large (3-4 bedrooms)', multiplier: 1.6, description: '2,000 - 3,000 sq ft' },
  { id: 'extra-large', name: 'Extra Large (4-5 bedrooms)', multiplier: 2.0, description: '3,000 - 4,500 sq ft' },
  { id: 'estate', name: 'Estate (5+ bedrooms)', multiplier: 2.5, description: '4,500+ sq ft' }
];

// Simplified frequency options
const frequencyOptions = [
  { id: 'one-time', name: 'One-Time', discount: 0, description: 'Single cleaning service' },
  { id: 'weekly', name: 'Weekly', discount: 0.15, description: 'Every week - Best value!' },
  { id: 'bi-weekly', name: 'Bi-Weekly', discount: 0.10, description: 'Every 2 weeks - Most popular' },
  { id: 'monthly', name: 'Monthly', discount: 0.05, description: 'Once a month - Convenient' }
];

// Add-on services
const addOnServices = [
  { id: 'fridge', name: 'Inside Refrigerator', price: 35, description: 'Clean and organize inside refrigerator' },
  { id: 'oven', name: 'Inside Oven', price: 35, description: 'Deep clean inside oven' },
  { id: 'baseboards', name: 'Whole Home Baseboards', price: 50, description: 'Hand-wipe all baseboards' },
  { id: 'cabinet-fronts', name: 'Cabinet Front Cleaning', price: 50, description: 'Clean all kitchen cabinet fronts' },
  { id: 'blinds', name: 'Detailed Blind Cleaning', price: 15, description: 'Per blind detailed cleaning' },
  { id: 'wall-washing', name: 'Wall Washing', price: 25, description: 'Per room wall washing' },
  { id: 'laundry', name: 'Extra Laundry Folding', price: 20, description: 'Per basket laundry folding' },
  { id: 'garage', name: 'Garage Sweeping', price: 30, description: 'Complete garage sweep' }
];

interface BookingData {
  // Service selections
  zipCode: string;
  serviceType: string;
  homeSize: string;
  frequency: string;
  addOns: string[];
  
  // Scheduling
  serviceDate: string;
  serviceTime: string;
  
  // Customer info
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  
  // Address
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  
  // Property details
  bedrooms: string;
  bathrooms: string;
  dwellingType: string;
  specialInstructions: string;
  
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
  serviceDate: '',
  serviceTime: '',
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  address: {
    street: '',
    city: '',
    state: 'TX',
    zipCode: ''
  },
  bedrooms: '',
  bathrooms: '',
  dwellingType: '',
  specialInstructions: '',
  basePrice: 0,
  totalPrice: 0,
  savings: 0
};

export function SinglePageBooking() {
  const [bookingData, setBookingData] = useState<BookingData>(initialBookingData);
  const [zipCodeValid, setZipCodeValid] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  // Update booking data helper
  const updateField = (field: keyof BookingData, value: any) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateNestedField = (parentField: keyof BookingData, childField: string, value: any) => {
    setBookingData(prev => ({
      ...prev,
      [parentField]: {
        ...(prev[parentField] as any),
        [childField]: value
      }
    }));
  };

  // Calculate pricing whenever selections change
  useEffect(() => {
    const serviceType = serviceTypes.find(s => s.id === bookingData.serviceType);
    const homeSize = homeSizes.find(h => h.id === bookingData.homeSize);
    const frequency = frequencyOptions.find(f => f.id === bookingData.frequency);
    
    if (!serviceType || !homeSize) {
      updateField('basePrice', 0);
      updateField('totalPrice', 0);
      updateField('savings', 0);
      return;
    }

    // Calculate base price
    let basePrice = serviceType.basePrice;
    if (serviceType.premium) {
      basePrice = Math.round(basePrice * serviceType.premium);
    }
    
    // Apply home size multiplier
    basePrice = Math.round(basePrice * homeSize.multiplier);
    
    // Calculate add-ons total
    const addOnsTotal = bookingData.addOns.reduce((total, addOnId) => {
      const addOn = addOnServices.find(a => a.id === addOnId);
      return total + (addOn?.price || 0);
    }, 0);
    
    // Calculate subtotal
    const subtotal = basePrice + addOnsTotal;
    
    // Apply frequency discount
    const discount = frequency?.discount || 0;
    const savings = Math.round(subtotal * discount);
    const totalPrice = subtotal - savings;
    
    updateField('basePrice', basePrice);
    updateField('totalPrice', totalPrice);
    updateField('savings', savings);
  }, [bookingData.serviceType, bookingData.homeSize, bookingData.frequency, bookingData.addOns]);

  // Validate ZIP code
  useEffect(() => {
    if (bookingData.zipCode && bookingData.zipCode.length === 5) {
      const validation = validateServiceAreaZipCode(bookingData.zipCode);
      setZipCodeValid(validation.isValid);
    } else {
      setZipCodeValid(false);
    }
  }, [bookingData.zipCode]);

  const toggleAddOn = (addOnId: string) => {
    const currentAddOns = bookingData.addOns;
    const newAddOns = currentAddOns.includes(addOnId)
      ? currentAddOns.filter(id => id !== addOnId)
      : [...currentAddOns, addOnId];
    
    updateField('addOns', newAddOns);
  };

  const canProceedToCheckout = () => {
    return (
      zipCodeValid &&
      bookingData.serviceType &&
      bookingData.homeSize &&
      bookingData.frequency &&
      bookingData.serviceDate &&
      bookingData.serviceTime &&
      bookingData.customerName &&
      bookingData.customerEmail &&
      bookingData.customerPhone &&
      bookingData.address.street &&
      bookingData.bedrooms &&
      bookingData.bathrooms &&
      bookingData.dwellingType
    );
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Service Selection */}
          <div className="lg:col-span-2 space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2">Book Your Cleaning Service</h1>
              <p className="text-muted-foreground">Choose your service and we'll take care of the rest</p>
            </div>

            {/* ZIP Code Verification */}
            <Card className="shadow-clean">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Service Area
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    We serve the Greater Baytown, Texas area within a 40-mile radius.
                  </p>
                  <div className="flex gap-3">
                    <Input
                      placeholder="Enter ZIP code"
                      value={bookingData.zipCode}
                      onChange={(e) => updateField('zipCode', e.target.value)}
                      className="flex-1"
                      maxLength={5}
                    />
                    {zipCodeValid && (
                      <div className="flex items-center text-success">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  
                  {bookingData.zipCode && bookingData.zipCode.length === 5 && (
                    <div className={cn(
                      "p-3 rounded-lg border",
                      zipCodeValid 
                        ? "bg-success/10 border-success/20 text-success" 
                        : "bg-destructive/10 border-destructive/20 text-destructive"
                    )}>
                      <p className="text-sm font-medium">
                        {zipCodeValid 
                          ? "✓ Great! We service your area."
                          : "Sorry, we don't currently service this area."
                        }
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Service Type Selection */}
            {zipCodeValid && (
              <Card className="shadow-clean">
                <CardHeader>
                  <CardTitle>Choose Your Service</CardTitle>
                  <p className="text-muted-foreground">Select the type of cleaning service you need</p>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {serviceTypes.map((service) => {
                      const Icon = service.icon;
                      const isSelected = bookingData.serviceType === service.id;
                      const calculatedPrice = service.premium 
                        ? Math.round(service.basePrice * service.premium) 
                        : service.basePrice;
                      
                      return (
                        <div
                          key={service.id}
                          className={cn(
                            "relative p-4 border-2 rounded-lg cursor-pointer transition-all",
                            "hover:border-primary/30 hover:bg-primary/5",
                            isSelected 
                              ? "border-primary bg-primary/10" 
                              : "border-border"
                          )}
                          onClick={() => updateField('serviceType', service.id)}
                        >
                          {service.popular && (
                            <Badge className="absolute -top-2 left-4 bg-accent text-accent-foreground">
                              Most Popular
                            </Badge>
                          )}
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "p-2 rounded-lg",
                              isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                            )}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold">{service.name}</h3>
                              <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                              <p className="text-sm font-medium">Starting at {formatPrice(calculatedPrice)}</p>
                              <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                                {service.features.slice(0, 3).map((feature, idx) => (
                                  <li key={idx}>• {feature}</li>
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

            {/* Home Size Selection */}
            {bookingData.serviceType && (
              <Card className="shadow-clean">
                <CardHeader>
                  <CardTitle>Home Size</CardTitle>
                  <p className="text-muted-foreground">Select your home size for accurate pricing</p>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {homeSizes.map((size) => {
                      const isSelected = bookingData.homeSize === size.id;
                      return (
                        <div
                          key={size.id}
                          className={cn(
                            "p-4 border-2 rounded-lg cursor-pointer transition-all",
                            "hover:border-primary/30 hover:bg-primary/5",
                            isSelected 
                              ? "border-primary bg-primary/10" 
                              : "border-border"
                          )}
                          onClick={() => updateField('homeSize', size.id)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold">{size.name}</h3>
                              <p className="text-sm text-muted-foreground">{size.description}</p>
                            </div>
                            {isSelected && (
                              <CheckCircle className="h-5 w-5 text-primary" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Frequency Selection */}
            {bookingData.homeSize && (
              <Card className="shadow-clean">
                <CardHeader>
                  <CardTitle>Cleaning Frequency</CardTitle>
                  <p className="text-muted-foreground">Choose how often you'd like service</p>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {frequencyOptions.map((freq) => {
                      const selectedService = serviceTypes.find(s => s.id === bookingData.serviceType);
                      const canSelect = freq.id === 'one-time' || selectedService?.allowRecurring;
                      const isSelected = bookingData.frequency === freq.id;
                      
                      if (!canSelect) return null;
                      
                      return (
                        <div
                          key={freq.id}
                          className={cn(
                            "relative p-4 border-2 rounded-lg cursor-pointer transition-all",
                            "hover:border-primary/30 hover:bg-primary/5",
                            isSelected 
                              ? "border-primary bg-primary/10" 
                              : "border-border"
                          )}
                          onClick={() => updateField('frequency', freq.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">{freq.name}</h3>
                              <p className="text-sm text-muted-foreground">{freq.description}</p>
                              {freq.discount > 0 && (
                                <Badge variant="secondary" className="mt-2">
                                  Save {Math.round(freq.discount * 100)}%
                                </Badge>
                              )}
                            </div>
                            {isSelected && (
                              <CheckCircle className="h-5 w-5 text-primary" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Add-ons */}
            {bookingData.frequency && (
              <Card className="shadow-clean">
                <CardHeader>
                  <CardTitle>Add-On Services</CardTitle>
                  <p className="text-muted-foreground">Optional extras to enhance your cleaning</p>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-3">
                    {addOnServices.map((addOn) => {
                      const isSelected = bookingData.addOns.includes(addOn.id);
                      return (
                        <div
                          key={addOn.id}
                          className={cn(
                            "p-3 border-2 rounded-lg cursor-pointer transition-all",
                            "hover:border-primary/30 hover:bg-primary/5",
                            isSelected 
                              ? "border-primary bg-primary/10" 
                              : "border-border"
                          )}
                          onClick={() => toggleAddOn(addOn.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium">{addOn.name}</h4>
                              <p className="text-xs text-muted-foreground">{addOn.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatPrice(addOn.price)}</p>
                              {isSelected && (
                                <CheckCircle className="h-4 w-4 text-primary ml-auto mt-1" />
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

            {/* Scheduling Section */}
            {bookingData.frequency && (
              <Card className="shadow-clean">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Schedule Your Service
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EnhancedSchedulingStep
                    bookingData={{
                      serviceDate: bookingData.serviceDate,
                      serviceTime: bookingData.serviceTime,
                      homeSize: bookingData.homeSize,
                      frequency: bookingData.frequency,
                      addOns: bookingData.addOns,
                      addMembership: false,
                      address: bookingData.address,
                      contactNumber: bookingData.customerPhone,
                      specialInstructions: bookingData.specialInstructions,
                      bedrooms: bookingData.bedrooms,
                      bathrooms: bookingData.bathrooms,
                      dwellingType: bookingData.dwellingType,
                      flooringType: '',
                      customerName: bookingData.customerName,
                      customerEmail: bookingData.customerEmail,
                      basePrice: bookingData.basePrice,
                      addOnPrices: bookingData.addOns.reduce((acc, addOnId) => {
                        const addOn = addOnServices.find(a => a.id === addOnId);
                        if (addOn) acc[addOnId] = addOn.price;
                        return acc;
                      }, {} as { [key: string]: number }),
                      frequencyDiscount: bookingData.savings,
                      membershipDiscount: 0,
                      membershipFee: 0,
                      totalPrice: bookingData.totalPrice,
                      paymentType: 'pay_after_service' as const,
                      promoDiscount: 0
                    }}
                    updateBookingData={(updates) => {
                      if (updates.serviceDate) updateField('serviceDate', updates.serviceDate);
                      if (updates.serviceTime) updateField('serviceTime', updates.serviceTime);
                    }}
                    onNext={() => {}}
                    onBack={() => {}}
                  />
                </CardContent>
              </Card>
            )}

            {/* Customer Information */}
            {bookingData.serviceDate && bookingData.serviceTime && (
              <Card className="shadow-clean">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Your Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
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
                      <Label htmlFor="customerPhone">Phone Number *</Label>
                      <Input
                        id="customerPhone"
                        type="tel"
                        value={bookingData.customerPhone}
                        onChange={(e) => updateField('customerPhone', e.target.value)}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div>
                      <Label htmlFor="street">Street Address *</Label>
                      <Input
                        id="street"
                        value={bookingData.address.street}
                        onChange={(e) => updateNestedField('address', 'street', e.target.value)}
                        placeholder="123 Main St"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Property Details */}
            {bookingData.address.street && (
              <Card className="shadow-clean">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Property Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="bedrooms">Bedrooms *</Label>
                      <Select value={bookingData.bedrooms} onValueChange={(value) => updateField('bedrooms', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="4">4</SelectItem>
                          <SelectItem value="5+">5+</SelectItem>
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
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="1.5">1.5</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="2.5">2.5</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="3.5">3.5</SelectItem>
                          <SelectItem value="4+">4+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="dwellingType">Dwelling Type *</Label>
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
                  <div className="mt-4">
                    <Label htmlFor="specialInstructions">Special Instructions (Optional)</Label>
                    <Textarea
                      id="specialInstructions"
                      value={bookingData.specialInstructions}
                      onChange={(e) => updateField('specialInstructions', e.target.value)}
                      placeholder="Any special requests or instructions for our team..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Pricing Summary (Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card className="shadow-clean">
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {bookingData.serviceType && bookingData.homeSize && bookingData.frequency ? (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Service:</span>
                          <span className="text-sm font-medium">
                            {serviceTypes.find(s => s.id === bookingData.serviceType)?.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Home Size:</span>
                          <span className="text-sm font-medium">
                            {homeSizes.find(h => h.id === bookingData.homeSize)?.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Frequency:</span>
                          <span className="text-sm font-medium">
                            {frequencyOptions.find(f => f.id === bookingData.frequency)?.name}
                          </span>
                        </div>
                      </div>

                      <hr className="border-border" />

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Base Price:</span>
                          <span className="text-sm">{formatPrice(bookingData.basePrice)}</span>
                        </div>
                        
                        {bookingData.addOns.length > 0 && (
                          <>
                            {bookingData.addOns.map((addOnId) => {
                              const addOn = addOnServices.find(a => a.id === addOnId);
                              return addOn ? (
                                <div key={addOnId} className="flex justify-between">
                                  <span className="text-sm">{addOn.name}:</span>
                                  <span className="text-sm">{formatPrice(addOn.price)}</span>
                                </div>
                              ) : null;
                            })}
                          </>
                        )}

                        {bookingData.savings > 0 && (
                          <div className="flex justify-between text-success">
                            <span className="text-sm">Frequency Discount:</span>
                            <span className="text-sm">-{formatPrice(bookingData.savings)}</span>
                          </div>
                        )}
                      </div>

                      <hr className="border-border" />

                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span>{formatPrice(bookingData.totalPrice)}</span>
                      </div>

                      {bookingData.savings > 0 && (
                        <div className="p-3 bg-success/10 rounded-lg">
                          <p className="text-sm text-success font-medium">
                            You're saving {formatPrice(bookingData.savings)} with {frequencyOptions.find(f => f.id === bookingData.frequency)?.name.toLowerCase()} service!
                          </p>
                        </div>
                      )}

                      {canProceedToCheckout() && (
                        <Button 
                          className="w-full"
                          onClick={() => setShowCheckout(true)}
                        >
                          Continue to Payment
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Make your selections to see pricing</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}