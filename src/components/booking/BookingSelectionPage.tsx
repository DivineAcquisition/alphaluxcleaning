import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Home, Sparkles, RefreshCw, ArrowRight, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookingData {
  homeSize: string;
  serviceType: string;
  frequency: string;
  addOns: string[];
  basePrice: number;
  addOnPrices: { [key: string]: number };
  frequencyDiscount: number;
  totalPrice: number;
  nextDayFee?: number;
}

interface Props {
  bookingData: BookingData;
  updateBookingData: (updates: Partial<BookingData>) => void;
  onNext: () => void;
}

const homeSizes = [
  { 
    value: 'studio', 
    label: 'Studio/1BR', 
    icon: Home, 
    basePrice: 129,
    description: 'Up to 800 sq ft'
  },
  { 
    value: '2br', 
    label: '2 Bedroom', 
    icon: Home, 
    basePrice: 159,
    description: '800-1200 sq ft',
    popular: true
  },
  { 
    value: '3br', 
    label: '3 Bedroom', 
    icon: Home, 
    basePrice: 189,
    description: '1200-1800 sq ft'
  },
  { 
    value: '4br+', 
    label: '4+ Bedroom', 
    icon: Home, 
    basePrice: 229,
    description: '1800+ sq ft'
  }
];

const serviceTypes = [
  {
    value: 'standard',
    label: 'Standard Clean',
    icon: Sparkles,
    description: 'Perfect for regular maintenance',
    priceMultiplier: 1
  },
  {
    value: 'deep',
    label: 'Deep Clean',
    icon: Star,
    description: 'Thorough, detailed cleaning',
    priceMultiplier: 1.5,
    popular: true
  },
  {
    value: 'move',
    label: 'Move In/Out',
    icon: Zap,
    description: 'Complete move-ready cleaning',
    priceMultiplier: 1.8
  }
];

const frequencies = [
  {
    value: 'weekly',
    label: 'Weekly',
    icon: RefreshCw,
    discount: 0.2,
    savings: '20% off',
    recommended: true
  },
  {
    value: 'biweekly',
    label: 'Bi-weekly',
    icon: RefreshCw,
    discount: 0.15,
    savings: '15% off',
    popular: true
  },
  {
    value: 'monthly',
    label: 'Monthly',
    icon: RefreshCw,
    discount: 0.1,
    savings: '10% off'
  },
  {
    value: 'one-time',
    label: 'One-time',
    icon: Sparkles,
    discount: 0,
    savings: 'No discount'
  }
];

const addOns = [
  { value: 'inside-fridge', label: 'Inside Fridge', price: 25 },
  { value: 'inside-oven', label: 'Inside Oven', price: 25 },
  { value: 'inside-cabinets', label: 'Inside Cabinets', price: 35 },
  { value: 'garage', label: 'Garage', price: 45 },
  { value: 'basement', label: 'Basement', price: 40 },
  { value: 'windows-interior', label: 'Interior Windows', price: 30 }
];

export function BookingSelectionPage({ bookingData, updateBookingData, onNext }: Props) {
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>(bookingData.addOns || []);

  // Calculate pricing
  useEffect(() => {
    const homeSize = homeSizes.find(h => h.value === bookingData.homeSize);
    const serviceType = serviceTypes.find(s => s.value === bookingData.serviceType);
    const frequency = frequencies.find(f => f.value === bookingData.frequency);

    if (homeSize && serviceType && frequency) {
      const basePrice = Math.round(homeSize.basePrice * serviceType.priceMultiplier);
      const addOnTotal = selectedAddOns.reduce((total, addOn) => {
        const addOnItem = addOns.find(a => a.value === addOn);
        return total + (addOnItem?.price || 0);
      }, 0);
      
      const frequencyDiscount = frequency.discount * basePrice;
      const nextDayFee = bookingData.nextDayFee || 0;
      const totalPrice = basePrice + addOnTotal + nextDayFee - frequencyDiscount;

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
  }, [bookingData.homeSize, bookingData.serviceType, bookingData.frequency, selectedAddOns, bookingData.nextDayFee]);

  const toggleAddOn = (addOnValue: string) => {
    const updated = selectedAddOns.includes(addOnValue)
      ? selectedAddOns.filter(a => a !== addOnValue)
      : [...selectedAddOns, addOnValue];
    setSelectedAddOns(updated);
  };

  const selectedHomeSize = homeSizes.find(h => h.value === bookingData.homeSize);
  const selectedServiceType = serviceTypes.find(s => s.value === bookingData.serviceType);
  const selectedFrequency = frequencies.find(f => f.value === bookingData.frequency);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column - Form */}
      <div className="lg:col-span-2 space-y-8">
        
        {/* Home Size Selection */}
        <Card className="shadow-clean">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Home Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {homeSizes.map((size) => {
                const Icon = size.icon;
                return (
                  <div
                    key={size.value}
                    onClick={() => updateBookingData({ homeSize: size.value })}
                    className={cn(
                      "relative p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-lg",
                      bookingData.homeSize === size.value
                        ? "border-primary bg-primary/5 shadow-clean"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {size.popular && (
                      <Badge className="absolute -top-2 -right-2 bg-accent text-accent-foreground">
                        Popular
                      </Badge>
                    )}
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="h-5 w-5 text-primary" />
                      <span className="font-semibold">{size.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{size.description}</p>
                    <p className="text-lg font-bold text-primary">From ${size.basePrice}</p>
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
              <Sparkles className="h-5 w-5" />
              Service Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              {serviceTypes.map((service) => {
                const Icon = service.icon;
                return (
                  <div
                    key={service.value}
                    onClick={() => updateBookingData({ serviceType: service.value })}
                    className={cn(
                      "relative p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-lg",
                      bookingData.serviceType === service.value
                        ? "border-primary bg-primary/5 shadow-clean"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {service.popular && (
                      <Badge className="absolute -top-2 -right-2 bg-accent text-accent-foreground">
                        Popular
                      </Badge>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-primary" />
                        <div>
                          <span className="font-semibold block">{service.label}</span>
                          <p className="text-sm text-muted-foreground">{service.description}</p>
                        </div>
                      </div>
                      {selectedHomeSize && (
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">
                            ${Math.round(selectedHomeSize.basePrice * service.priceMultiplier)}
                          </p>
                        </div>
                      )}
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
              {frequencies.map((freq) => {
                const Icon = freq.icon;
                return (
                  <div
                    key={freq.value}
                    onClick={() => updateBookingData({ frequency: freq.value })}
                    className={cn(
                      "relative p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-lg",
                      bookingData.frequency === freq.value
                        ? "border-primary bg-primary/5 shadow-clean"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {freq.recommended && (
                      <Badge className="absolute -top-2 -right-2 bg-success text-success-foreground">
                        Best Value
                      </Badge>
                    )}
                    {freq.popular && (
                      <Badge className="absolute -top-2 -right-2 bg-accent text-accent-foreground">
                        Popular
                      </Badge>
                    )}
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="h-5 w-5 text-primary" />
                      <span className="font-semibold">{freq.label}</span>
                    </div>
                    <div className="text-center">
                      <p className={cn(
                        "text-sm font-medium",
                        freq.discount > 0 ? "text-success" : "text-muted-foreground"
                      )}>
                        {freq.savings}
                      </p>
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
            {selectedHomeSize && selectedServiceType && (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Base Service</span>
                  <span className="font-semibold">${bookingData.basePrice}</span>
                </div>
                
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
                
                {selectedFrequency && bookingData.frequencyDiscount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>{selectedFrequency.label} Discount</span>
                    <span>-${bookingData.frequencyDiscount.toFixed(0)}</span>
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
                
                {selectedFrequency && bookingData.frequency !== 'one-time' && (
                  <p className="text-sm text-muted-foreground text-center">
                    You're saving ${bookingData.frequencyDiscount.toFixed(0)} with {selectedFrequency.label.toLowerCase()} cleanings!
                  </p>
                )}
              </div>
            )}
            
            <Button 
              onClick={onNext}
              disabled={!bookingData.homeSize || !bookingData.serviceType || !bookingData.frequency}
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