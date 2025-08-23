import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Home, Sparkles, RefreshCw, ArrowRight, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookingData {
  homeSize: string;
  frequency: string;
  addOns: string[];
  basePrice: number;
  addOnPrices: { [key: string]: number };
  frequencyDiscount: number;
  totalPrice: number;
  nextDayFee?: number;
}

interface Props {
  bookingData: Partial<BookingData>;
  updateBookingData: (updates: Partial<BookingData>) => void;
  onNext: () => void;
}

const homeSizes = [
  { 
    value: 'general', 
    label: 'General Clean', 
    icon: Home, 
    basePrice: 220,
    description: '2 hours - Perfect for regular maintenance',
    hours: 2,
    cleaners: 2
  },
  { 
    value: 'complete', 
    label: 'Deep Clean', 
    icon: Star, 
    basePrice: 420,
    description: '4 hours - Our most popular comprehensive service',
    hours: 4,
    cleaners: 2,
    popular: true
  },
  { 
    value: 'premium', 
    label: 'Premium Deep Clean', 
    icon: Sparkles, 
    basePrice: 500,
    description: '6 hours - Complete top-to-bottom transformation',
    hours: 6,
    cleaners: 3
  }
];

const recurringOptions = [
  {
    value: 'one-time',
    label: 'One-Time',
    icon: Sparkles,
    discount: 0.15, // 15% off for one-time bookings
    description: 'Single service - 15% discount included'
  },
  {
    value: 'weekly',
    label: 'Weekly',
    icon: RefreshCw,
    discount: 0.10,
    description: 'Every week - 10% recurring discount',
    recommended: true
  },
  {
    value: 'bi-weekly',
    label: 'Bi-Weekly',
    icon: RefreshCw,
    discount: 0.07,
    description: 'Every 2 weeks - 7% recurring discount',
    popular: true
  },
  {
    value: 'monthly',
    label: 'Monthly',
    icon: RefreshCw,
    discount: 0.05,
    description: 'Once a month - 5% recurring discount'
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

  // Calculate pricing
  useEffect(() => {
    const selectedTier = homeSizes.find(h => h.value === bookingData.homeSize);
    const selectedFrequency = recurringOptions.find(r => r.value === bookingData.frequency);

    if (selectedTier && selectedFrequency) {
      let basePrice = selectedTier.basePrice;
      
      // Apply discount based on frequency
      if (selectedFrequency.discount > 0) {
        basePrice = Math.round(basePrice * (1 - selectedFrequency.discount));
      }
      
      const addOnTotal = selectedAddOns.reduce((total, addOn) => {
        const addOnItem = addOns.find(a => a.value === addOn);
        return total + (addOnItem?.price || 0);
      }, 0);
      
      const frequencyDiscount = Math.round(selectedTier.basePrice * selectedFrequency.discount);
      const nextDayFee = bookingData.nextDayFee || 0;
      const totalPrice = basePrice + addOnTotal + nextDayFee;

      const addOnPrices = selectedAddOns.reduce((acc, addOn) => {
        const addOnItem = addOns.find(a => a.value === addOn);
        if (addOnItem) acc[addOn] = addOnItem.price;
        return acc;
      }, {} as { [key: string]: number });

      updateBookingData({
        basePrice,
        addOnPrices,
        frequencyDiscount,
        totalPrice,
        addOns: selectedAddOns
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
        
        {/* Service Tier Selection */}
        <Card className="shadow-clean">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Service Tier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              {homeSizes.map((tier) => {
                const Icon = tier.icon;
                return (
                  <div
                    key={tier.value}
                    onClick={() => updateBookingData({ homeSize: tier.value })}
                    className={cn(
                      "relative p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-lg",
                      bookingData.homeSize === tier.value
                        ? "border-primary bg-primary/5 shadow-clean"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {tier.popular && (
                      <Badge className="absolute -top-2 -right-2 bg-accent text-accent-foreground">
                        Popular
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
                        <p className="text-lg font-bold text-primary">${tier.basePrice}</p>
                        <p className="text-xs text-muted-foreground">{tier.cleaners} cleaners</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>


        {/* Frequency Selection */}
        <Card className="shadow-clean">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Frequency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recurringOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <div
                    key={option.value}
                    onClick={() => updateBookingData({ frequency: option.value })}
                    className={cn(
                      "relative p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-lg",
                      bookingData.frequency === option.value
                        ? "border-primary bg-primary/5 shadow-clean"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {option.recommended && (
                      <Badge className="absolute -top-2 -right-2 bg-success text-success-foreground">
                        Best Value
                      </Badge>
                    )}
                    {option.popular && (
                      <Badge className="absolute -top-2 -right-2 bg-accent text-accent-foreground">
                        Popular
                      </Badge>
                    )}
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="h-5 w-5 text-primary" />
                      <span className="font-semibold">{option.label}</span>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-success font-medium">
                        {option.discount > 0 ? `${Math.round(option.discount * 100)}% off` : 'Standard rate'}
                      </p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
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
                <div className="flex justify-between">
                  <span>Base Service</span>
                  <span className="font-semibold">${selectedTier.basePrice}</span>
                </div>
                
                {selectedFrequency.discount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>{selectedFrequency.label} Discount</span>
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
                
                {selectedFrequency && selectedFrequency.discount > 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    You're saving ${bookingData.frequencyDiscount} with this {selectedFrequency.label.toLowerCase()} booking!
                  </p>
                )}
              </div>
            )}
            
            <Button 
              onClick={onNext}
              disabled={!bookingData.homeSize || !bookingData.frequency}
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