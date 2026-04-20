import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Home, Sparkles, RefreshCw, ArrowRight, Star, Zap, MapPin, CheckCircle, Building } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  squareFootage?: string; // Add square footage for backward compatibility
}

interface Props {
  bookingData: Partial<BookingData>;
  updateBookingData: (updates: Partial<BookingData>) => void;
  onNext: () => void;
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
    value: '1000-1500',
    label: '1,000 – 1,500 sq ft',
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
    value: '1501-2000',
    label: '1,501 – 2,000 sq ft',
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
    value: '2001-2500',
    label: '2,001 – 2,500 sq ft',
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
    value: '2501-3000',
    label: '2,501 – 3,000 sq ft',
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
    value: '3001-3500',
    label: '3,001 – 3,500 sq ft',
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
    value: '3501-4000',
    label: '3,501 – 4,000 sq ft',
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
    value: '4001-5000',
    label: '4,001 – 5,000 sq ft',
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

export function BookingSelectionPage({ bookingData, updateBookingData, onNext }: Props) {
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>(bookingData.addOns || []);
  const [zipCodeValid, setZipCodeValid] = useState(false);

  // Validate ZIP code for New York State (service area is NY-only).
  const validateZipCode = (zipCode: string) => {
    const zip = parseInt(zipCode);
    // NY prefixes: 10000-14999 cover NYC, Long Island, Westchester,
    // Hudson Valley, Capital Region, Central NY, and Western NY.
    return zip >= 10001 && zip <= 14999;
  };

  // Check existing ZIP code on mount
  useEffect(() => {
    if (bookingData.serviceZipCode && bookingData.serviceZipCode.length === 5) {
      setZipCodeValid(validateZipCode(bookingData.serviceZipCode));
    }
  }, []);

  const handleZipCodeChange = (zipCode: string) => {
    updateBookingData({ serviceZipCode: zipCode });
    if (zipCode.length === 5) {
      const isValid = validateZipCode(zipCode);
      setZipCodeValid(isValid);
      if (!isValid) {
        // Handle invalid ZIP code
      }
    } else {
      setZipCodeValid(false);
    }
  };

  // Calculate pricing with new square footage structure
  useEffect(() => {
    const selectedTier = homeSizes.find(h => h.value === bookingData.homeSize);
    const selectedFrequency = recurringOptions.find(r => r.value === bookingData.frequency);

    if (selectedTier && selectedFrequency) {
      // Get base price from the selected frequency type (already includes 20% discount)
      const basePrice = selectedTier.pricing[selectedFrequency.priceKey] || 0;
      
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

      // Calculate savings from 20% discount
      const originalPrice = selectedTier.originalPricing[selectedFrequency.priceKey] || 0;
      const frequencyDiscount = originalPrice > 0 ? Math.round((originalPrice - basePrice) * 100) / 100 : 0;

      updateBookingData({
        basePrice,
        addOnPrices,
        frequencyDiscount,
        totalPrice,
        addOns: selectedAddOns,
        squareFootage: selectedTier.label // Store square footage for order records
      });
    }
  }, [bookingData.homeSize, bookingData.frequency, selectedAddOns, bookingData.nextDayFee]);


  const toggleAddOn = (addOnValue: string) => {
    const updated = selectedAddOns.includes(addOnValue)
      ? selectedAddOns.filter(a => a !== addOnValue)
      : [...selectedAddOns, addOnValue];
    setSelectedAddOns(updated);
  };

  const selectedTier = homeSizes.find(h => h.value === bookingData.homeSize);
  const selectedFrequency = recurringOptions.find(r => r.value === bookingData.frequency);

  return (
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
                We provide professional cleaning services throughout New York State. Enter your ZIP code to get started.
              </p>
              <div className="flex gap-3">
                <Input
                  placeholder="Enter ZIP code"
                  value={bookingData.serviceZipCode || ''}
                  onChange={(e) => handleZipCodeChange(e.target.value)}
                  className="flex-1"
                  maxLength={5}
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                {zipCodeValid && (
                  <div className="flex items-center text-success">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                )}
              </div>
              {bookingData.serviceZipCode && bookingData.serviceZipCode.length === 5 && !zipCodeValid && (
                <p className="text-destructive text-sm">
                  Sorry, we currently only service New York. Please contact us at (281) 809-9901 for other locations.
                </p>
              )}
              {zipCodeValid && (
                <p className="text-success text-sm font-medium">
                  Great! We service your area. Choose your cleaning service below.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Home Size Selection */}
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
                            <div className="flex items-center gap-2">
                              <span className="line-through text-muted-foreground text-sm">
                                ${tier.originalPricing.oneTime}
                              </span>
                              <Badge variant="secondary" className="text-xs bg-success/20 text-success">
                                20% OFF
                              </Badge>
                            </div>
                            <p className="text-lg font-bold text-primary">
                              Starting at ${tier.pricing.monthly}
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


        {/* Service Type Selection */}
        <Card className="shadow-clean">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Service Type & Frequency
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
                        {originalPrice > 0 && (
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
                            {price > 0 ? `$${price}` : 'Call for Quote'}
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

        {/* Add-ons */}
        <Card className="shadow-clean">
          <CardHeader>
            <CardTitle>Add-on Services</CardTitle>
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
      </div>

      {/* Right Column - Price Summary */}
      <div className="lg:col-span-1">
        <Card className="sticky top-32 shadow-clean border-primary/20">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
            <CardTitle>Price Summary</CardTitle>
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
                
                {bookingData.frequencyDiscount > 0 && (
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
                
                {bookingData.frequencyDiscount > 0 && (
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
              </div>
            )}
            
            <Button 
              onClick={onNext}
              disabled={!bookingData.serviceZipCode || !zipCodeValid || !bookingData.homeSize || !bookingData.frequency}
              className="w-full"
              size="lg"
            >
              Next: Date & Details
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}