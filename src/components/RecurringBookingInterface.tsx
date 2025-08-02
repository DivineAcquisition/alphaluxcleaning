import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Clock, Users, Star, Shield, CreditCard, RotateCcw } from 'lucide-react';

interface BookingTier {
  id: string;
  hours: number;
  basePrice: number;
  description: string;
  cleaners: number;
}

interface AddOnService {
  id: string;
  name: string;
  price: number;
  description: string;
}

interface RecurringOption {
  id: string;
  name: string;
  frequency: string;
  discount: number;
  description: string;
}

interface RecurringBookingInterfaceProps {
  onBookingUpdate?: (data: any) => void;
  existingMember?: boolean;
}

const bookingTiers: BookingTier[] = [
  {
    id: '2-hour',
    hours: 2,
    basePrice: 200,
    description: 'Perfect for maintenance cleaning',
    cleaners: 2
  },
  {
    id: '4-hour',
    hours: 4,
    basePrice: 400,
    description: 'Ideal for thorough cleaning',
    cleaners: 2
  },
  {
    id: '6-hour',
    hours: 6,
    basePrice: 600,
    description: 'Complete deep cleaning',
    cleaners: 3
  }
];

const addOnServices: AddOnService[] = [
  { id: 'deep-clean', name: 'Deep Clean', price: 50, description: 'Extra attention to detail' },
  { id: 'fridge', name: 'Inside Fridge', price: 25, description: 'Complete fridge cleaning' },
  { id: 'microwave', name: 'Inside Microwave', price: 15, description: 'Thorough microwave cleaning' },
  { id: 'oven', name: 'Inside Oven', price: 35, description: 'Deep oven cleaning' },
  { id: 'windows', name: 'Interior Windows', price: 30, description: 'Spotless window cleaning' },
];

const recurringOptions: RecurringOption[] = [
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
    discount: 20,
    description: 'Every week - Maximum savings!'
  },
  {
    id: 'bi-weekly',
    name: 'Bi-Weekly',
    frequency: 'bi-weekly',
    discount: 10,
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

const membershipPerks = [
  { icon: <CreditCard className="h-4 w-4" />, text: '$20 off every clean' },
  { icon: <Star className="h-4 w-4" />, text: 'Free add-ons every 3rd visit' },
  { icon: <CheckCircle className="h-4 w-4" />, text: 'Priority scheduling' },
  { icon: <RotateCcw className="h-4 w-4" />, text: 'Loyalty perks & rewards' }
];

export const RecurringBookingInterface: React.FC<RecurringBookingInterfaceProps> = ({
  onBookingUpdate,
  existingMember = false
}) => {
  const [selectedTier, setSelectedTier] = useState<string>('2-hour');
  const [selectedRecurring, setSelectedRecurring] = useState<string>('one-time');
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [addMembership, setAddMembership] = useState<boolean>(false);
  const [termsAgreed, setTermsAgreed] = useState<boolean>(false);

  const selectedTierData = bookingTiers.find(tier => tier.id === selectedTier)!;
  const selectedRecurringData = recurringOptions.find(opt => opt.id === selectedRecurring)!;

  const calculatePricing = () => {
    const basePrice = selectedTierData.basePrice;
    const addOnsTotal = selectedAddOns.reduce((total, addOnId) => {
      const addOn = addOnServices.find(service => service.id === addOnId);
      return total + (addOn?.price || 0);
    }, 0);
    
    const subtotal = basePrice + addOnsTotal;
    const recurringDiscount = Math.round(subtotal * (selectedRecurringData.discount / 100));
    const membershipDiscount = (existingMember || addMembership) ? 20 : 0;
    
    const total = subtotal - recurringDiscount - membershipDiscount;
    const firstCleaningDiscount = (existingMember || addMembership) ? 20 : 0; // Additional $20 off first cleaning
    const finalTotal = total - firstCleaningDiscount;

    return {
      basePrice,
      addOnsTotal,
      subtotal,
      recurringDiscount,
      membershipDiscount,
      firstCleaningDiscount,
      total: finalTotal,
      monthlyMembership: addMembership ? 30 : 0
    };
  };

  const pricing = calculatePricing();

  const handleAddOnToggle = (addOnId: string) => {
    setSelectedAddOns(prev => 
      prev.includes(addOnId) 
        ? prev.filter(id => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  const handleBookNow = () => {
    const bookingData = {
      tier: selectedTierData,
      recurring: selectedRecurringData,
      addOns: selectedAddOns.map(id => addOnServices.find(service => service.id === id)),
      membership: addMembership,
      pricing,
      termsAgreed
    };
    
    if (onBookingUpdate) {
      onBookingUpdate(bookingData);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Book Your Recurring Cleaning Service</h1>
        <p className="text-lg text-muted-foreground">
          Choose your perfect cleaning plan and save with recurring services
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Step 1: Service Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Step 1: Choose Your Service
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedTier} onValueChange={setSelectedTier}>
                <div className="grid md:grid-cols-3 gap-4">
                  {bookingTiers.map((tier) => (
                    <Label key={tier.id} htmlFor={tier.id} className="cursor-pointer">
                      <Card className={`transition-all ${selectedTier === tier.id ? 'ring-2 ring-primary' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2 mb-3">
                            <RadioGroupItem value={tier.id} id={tier.id} />
                            <span className="font-semibold">{tier.hours}-Hour Clean</span>
                          </div>
                          <div className="text-2xl font-bold mb-2">${tier.basePrice}</div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                            <Users className="h-4 w-4" />
                            {tier.cleaners} Professional Cleaners
                          </div>
                          <p className="text-sm text-muted-foreground">{tier.description}</p>
                        </CardContent>
                      </Card>
                    </Label>
                  ))}
                </div>
              </RadioGroup>

              {/* Add-ons */}
              <div className="mt-6">
                <h3 className="font-semibold mb-4">Optional Add-ons</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {addOnServices.map((addOn) => (
                    <div key={addOn.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                      <Checkbox
                        id={addOn.id}
                        checked={selectedAddOns.includes(addOn.id)}
                        onCheckedChange={() => handleAddOnToggle(addOn.id)}
                      />
                      <div className="flex-1">
                        <label htmlFor={addOn.id} className="font-medium cursor-pointer">
                          {addOn.name} (+${addOn.price})
                        </label>
                        <p className="text-sm text-muted-foreground">{addOn.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Recurring Options */}
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Want to keep it clean all year?</CardTitle>
              <p className="text-muted-foreground">Save more with recurring services</p>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedRecurring} onValueChange={setSelectedRecurring}>
                <div className="grid md:grid-cols-2 gap-4">
                  {recurringOptions.map((option) => (
                    <Label key={option.id} htmlFor={option.id} className="cursor-pointer">
                      <Card className={`transition-all ${selectedRecurring === option.id ? 'ring-2 ring-primary' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value={option.id} id={option.id} />
                              <span className="font-semibold">{option.name}</span>
                            </div>
                            {option.discount > 0 && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                {option.discount}% OFF
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        </CardContent>
                      </Card>
                    </Label>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Step 3: Membership Upsell */}
          {!existingMember && (
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="text-xl">🌟 Unlock Instant Savings with Clean & Covered™</CardTitle>
                <p className="text-muted-foreground">Get more value from every cleaning</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
                    <div>
                      <div className="font-semibold">Clean & Covered™ Membership</div>
                      <div className="text-sm text-muted-foreground">$30/month • Cancel anytime</div>
                    </div>
                    <Switch checked={addMembership} onCheckedChange={(checked) => setAddMembership(checked)} />
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    {membershipPerks.map((perk, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <span className="text-primary">{perk.icon}</span>
                        {perk.text}
                      </div>
                    ))}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Plus: <strong>$20 discount on your first cleaning!</strong>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {existingMember && (
            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">Clean & Covered™ Member</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Your membership discount of $20 has been applied + $20 off your first cleaning!
                </p>
              </CardContent>
            </Card>
          )}

          {/* Terms Agreement */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms-agreement"
                  checked={termsAgreed}
                  onCheckedChange={(checked) => setTermsAgreed(checked === true)}
                />
                <label htmlFor="terms-agreement" className="text-sm leading-relaxed cursor-pointer">
                  I agree to the Terms of Service and understand the time-based nature of services, 
                  recurring billing policy{addMembership ? ', membership terms,' : ''} and 24-hour cancellation policy.
                  {selectedRecurring !== 'one-time' && (
                    <span className="block mt-1 text-muted-foreground">
                      Recurring services will auto-schedule based on selected frequency. Cancel or pause anytime.
                    </span>
                  )}
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Service */}
              <div className="flex justify-between">
                <span>{selectedTierData.hours}-Hour Clean (Base)</span>
                <span>${selectedTierData.basePrice}</span>
              </div>

              {/* Add-ons */}
              {selectedAddOns.length > 0 && (
                <>
                  {selectedAddOns.map(addOnId => {
                    const addOn = addOnServices.find(service => service.id === addOnId)!;
                    return (
                      <div key={addOnId} className="flex justify-between">
                        <span>{addOn.name}</span>
                        <span>+${addOn.price}</span>
                      </div>
                    );
                  })}
                </>
              )}

              <Separator />

              {/* Discounts */}
              {pricing.recurringDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{selectedRecurringData.name} Discount ({selectedRecurringData.discount}%)</span>
                  <span>-${pricing.recurringDiscount}</span>
                </div>
              )}

              {pricing.membershipDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Membership Credit</span>
                  <span>-${pricing.membershipDiscount}</span>
                </div>
              )}

              {pricing.firstCleaningDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>First Cleaning Discount</span>
                  <span>-${pricing.firstCleaningDiscount}</span>
                </div>
              )}

              <Separator />

              {/* Total */}
              <div className="flex justify-between text-lg font-bold">
                <span>Total Today</span>
                <span>${pricing.total}</span>
              </div>

              {/* Membership Fee */}
              {addMembership && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Membership (monthly)</span>
                  <span>+$30/month</span>
                </div>
              )}

              {/* Recurring Info */}
              {selectedRecurring !== 'one-time' && (
                <div className="text-sm text-muted-foreground">
                  <p>Next cleanings: ${pricing.total} {selectedRecurringData.frequency}</p>
                </div>
              )}

              <Button 
                onClick={handleBookNow} 
                disabled={!termsAgreed}
                className="w-full mt-6"
                size="lg"
              >
                Book Now - ${pricing.total}
              </Button>

              {/* Trust Badges */}
              <div className="space-y-2 text-center text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <Shield className="h-4 w-4" />
                  Secure Checkout
                </div>
                <div className="flex items-center justify-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Cancel Anytime
                </div>
                <div>No Hidden Fees</div>
              </div>
            </CardContent>
          </Card>

          {/* Testimonials */}
          <Card className="mt-6">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <blockquote className="text-sm italic mb-2">
                  "The recurring service keeps our home spotless without the hassle of rebooking. 
                  The membership saves us so much money!"
                </blockquote>
                <cite className="text-xs text-muted-foreground">- Sarah M., Weekly Customer</cite>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};