import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Clock, Users, Star, Shield, CreditCard, RotateCcw, FileText, Home, Sparkles, ArrowRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ProgressIndicator } from '@/components/booking/ProgressIndicator';
import { PriceSummaryCard } from '@/components/booking/PriceSummaryCard';

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
  newClient?: boolean;
}

const bookingTiers: BookingTier[] = [
  {
    id: 'general',
    hours: 2,
    basePrice: 250,
    description: 'Perfect for regularly maintained homes',
    cleaners: 2
  },
  {
    id: 'complete',
    hours: 4,
    basePrice: 420,
    description: 'Our most popular comprehensive service',
    cleaners: 2
  },
  {
    id: 'premium',
    hours: 6,
    basePrice: 600,
    description: 'Ultimate cleaning experience',
    cleaners: 3
  }
];

const addOnServices: AddOnService[] = [
  { id: 'fridge', name: 'Inside Refrigerator', price: 35, description: 'Clean and organize inside refrigerator' },
  { id: 'oven', name: 'Inside Oven', price: 35, description: 'Deep clean inside oven' },
  { id: 'baseboards', name: 'Whole Home Baseboards', price: 50, description: 'Hand-wipe all baseboards' },
  { id: 'cabinet-fronts', name: 'Cabinet Front Cleaning', price: 50, description: 'Clean all kitchen cabinet fronts' },
  { id: 'blinds', name: 'Detailed Blind Cleaning', price: 15, description: 'Per blind detailed cleaning' },
  { id: 'wall-washing', name: 'Wall Washing', price: 25, description: 'Per room wall washing' },
  { id: 'laundry', name: 'Extra Laundry Folding', price: 20, description: 'Per basket laundry folding' },
  { id: 'garage', name: 'Garage Sweeping', price: 30, description: 'Complete garage sweep' },
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

const membershipPerks = [
  { icon: <CreditCard className="h-4 w-4" />, text: '$20 off every clean' },
  { icon: <Star className="h-4 w-4" />, text: 'Free add-ons every 3rd visit' },
  { icon: <CheckCircle className="h-4 w-4" />, text: 'Priority scheduling' },
  { icon: <RotateCcw className="h-4 w-4" />, text: 'Loyalty perks & rewards' }
];

export const RecurringBookingInterface: React.FC<RecurringBookingInterfaceProps> = ({
  onBookingUpdate,
  existingMember = false,
  newClient = false
}) => {
  const isMobile = useIsMobile();
  const [selectedTier, setSelectedTier] = useState<string>('general');
  const [selectedRecurring, setSelectedRecurring] = useState<string>('bi-weekly');
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [addMembership, setAddMembership] = useState<boolean>(false);
  const [termsAgreed, setTermsAgreed] = useState<boolean>(false);

  const selectedTierData = bookingTiers.find(tier => tier.id === selectedTier)!;
  const selectedRecurringData = recurringOptions.find(opt => opt.id === selectedRecurring)!;

  const calculatePricing = () => {
    let basePrice = selectedTierData.basePrice;
    
    // Apply new client special for Complete Clean
    if (newClient && selectedTier === 'complete') {
      basePrice = 349;
    }
    
    // Calculate addon total with member discount
    const addOnsTotal = selectedAddOns.reduce((total, addOnId) => {
      const addOn = addOnServices.find(service => service.id === addOnId);
      const addOnPrice = addOn?.price || 0;
      // Apply 10% discount for existing members or new membership signups
      const discountedPrice = (existingMember || addMembership) ? addOnPrice * 0.9 : addOnPrice;
      return total + discountedPrice;
    }, 0);
    
    const addonMemberDiscount = selectedAddOns.length > 0 && (existingMember || addMembership) 
      ? selectedAddOns.reduce((total, addOnId) => {
          const addOn = addOnServices.find(service => service.id === addOnId);
          return total + ((addOn?.price || 0) * 0.1);
        }, 0)
      : 0;
    
    const subtotal = basePrice + addOnsTotal;
    const recurringDiscount = Math.round(subtotal * (selectedRecurringData.discount / 100));
    const membershipDiscount = (existingMember || addMembership) ? 20 : 0;
    
    const total = subtotal - recurringDiscount - membershipDiscount;
    const membershipFee = addMembership ? 39 : 0;

    return {
      basePrice,
      addOnsTotal,
      subtotal,
      recurringDiscount,
      membershipDiscount,
      addonMemberDiscount,
      total: Math.max(0, total),
      membershipFee
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

  const steps = [
    { id: 1, title: 'Service', description: 'Choose your service' },
    { id: 2, title: 'Details', description: 'Date & address' },
    { id: 3, title: 'Payment', description: 'Review & pay' },
    { id: 4, title: 'Confirmation', description: 'Complete' }
  ];

  return (
    <div className="w-full">
      {/* Progress Indicator */}
      <ProgressIndicator currentStep={1} steps={steps} />
      
      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Form (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Step 1: BACP Club Membership */}
          {!existingMember && (
            <Card className="border-primary/30 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Star className="h-5 w-5" />
                  🌟 BACP Club™ Membership
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Join today and save $20 on every cleaning service
                </p>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex-1">
                    <div className="font-semibold text-base sm:text-lg">BACP Club™ Membership</div>
                    <div className="text-sm text-muted-foreground">$39/month • Cancel anytime</div>
                  </div>
                  <div className="flex items-center gap-3 justify-end">
                    <Switch 
                      checked={addMembership} 
                      onCheckedChange={(checked) => setAddMembership(checked)} 
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                </div>

                {addMembership && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="col-span-full mb-3">
                      <h4 className="font-semibold text-primary mb-2">Your Membership Benefits:</h4>
                    </div>
                    {membershipPerks.map((perk, index) => (
                      <div key={index} className="flex items-center gap-3 text-sm">
                        <span className="text-primary bg-primary/10 p-1 rounded">{perk.icon}</span>
                        <span className="font-medium">{perk.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {!addMembership && (
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Turn on membership to see all the amazing benefits and start saving $20 on every clean!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {existingMember && (
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">BACP Club™ Member</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 ml-auto">
                    Active
                  </Badge>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Your $20 membership discount has been applied to this booking!
                </p>
              </CardContent>
            </Card>
          )}

          {/* Service Selection */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Home className="h-5 w-5" />
                Choose Your Service
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                All services include professional cleaners and quality supplies
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <RadioGroup value={selectedTier} onValueChange={setSelectedTier}>
                <div className="grid grid-cols-1 gap-4 w-full">
                  {bookingTiers.map((tier) => (
                    <Label key={tier.id} htmlFor={tier.id} className="cursor-pointer w-full">
                      <Card className={`w-full transition-all duration-300 hover:shadow-lg ${
                        selectedTier === tier.id 
                          ? 'ring-2 ring-primary border-primary shadow-lg bg-primary/5' 
                          : 'hover:border-primary/30 hover:shadow-md'
                      }`}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <RadioGroupItem value={tier.id} id={tier.id} className="mt-1" />
                              <div>
                                <div className="font-bold text-lg mb-1">
                                  {tier.id === 'general' ? 'General Clean' : 
                                   tier.id === 'complete' ? 'Complete Clean' : 
                                   'Premium Deep Clean'}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {tier.hours} Hours
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    {tier.cleaners} Cleaners
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">{tier.description}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary">
                                {newClient && tier.id === 'complete' ? (
                                  <div>
                                    <span className="line-through text-muted-foreground text-lg mr-2">${tier.basePrice}</span>
                                    <span>$349</span>
                                    <div className="text-xs font-normal text-green-600 mt-1">New Client Special!</div>
                                  </div>
                                ) : (existingMember || addMembership) ? (
                                  <div>
                                    <span className="line-through text-muted-foreground text-lg mr-2">${tier.basePrice}</span>
                                    <span>${tier.basePrice - 20}</span>
                                    <div className="text-xs font-normal text-green-600 mt-1">Member Price</div>
                                  </div>
                                ) : (
                                  `$${tier.basePrice}`
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Label>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Frequency Selection */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-accent/5 to-accent/10">
              <CardTitle className="flex items-center gap-2 text-accent">
                <RotateCcw className="h-5 w-5" />
                Service Frequency
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose how often you'd like service (recurring saves more!)
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <RadioGroup value={selectedRecurring} onValueChange={setSelectedRecurring}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recurringOptions.map((option) => (
                    <Label key={option.id} htmlFor={option.id} className="cursor-pointer">
                      <Card className={`transition-all duration-300 hover:shadow-md ${
                        selectedRecurring === option.id 
                          ? 'ring-2 ring-accent border-accent shadow-md bg-accent/5' 
                          : 'hover:border-accent/30'
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem value={option.id} id={option.id} />
                              <div>
                                <div className="font-semibold">{option.name}</div>
                                <div className="text-sm text-muted-foreground">{option.description}</div>
                              </div>
                            </div>
                            {option.discount > 0 && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                Save {option.discount}%
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Label>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Add-ons */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-secondary/5 to-secondary/10">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Optional Add-ons
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Enhance your cleaning with these popular extras
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {addOnServices.map((addOn) => (
                  <Label key={addOn.id} htmlFor={addOn.id} className="cursor-pointer w-full">
                    <div className={`w-full transition-all duration-300 hover:shadow-sm border rounded-lg p-4 ${
                      selectedAddOns.includes(addOn.id) 
                        ? 'ring-2 ring-primary border-primary shadow-md bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}>
                      <div className="flex items-center justify-between h-full">
                        <div className="flex items-center space-x-3">
                          <Checkbox 
                            id={addOn.id}
                            checked={selectedAddOns.includes(addOn.id)}
                            onCheckedChange={(checked) => handleAddOnToggle(addOn.id)}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <div>
                            <div className="font-semibold">{addOn.name}</div>
                            <div className="text-sm text-muted-foreground">{addOn.description}</div>
                          </div>
                        </div>
                        <div className="text-lg font-bold text-primary">
                          {(existingMember || addMembership) ? (
                            <div className="text-right">
                              <span className="line-through text-muted-foreground text-sm mr-2">${addOn.price}</span>
                              <span>${Math.round(addOn.price * 0.9)}</span>
                              <div className="text-xs text-green-600">Member price</div>
                            </div>
                          ) : (
                            `$${addOn.price}`
                          )}
                        </div>
                      </div>
                    </div>
                  </Label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Terms Agreement */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="terms"
                    checked={termsAgreed}
                    onCheckedChange={(checked) => setTermsAgreed(checked as boolean)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label htmlFor="terms" className="text-sm leading-tight cursor-pointer">
                    I agree to the Terms of Service and understand that this booking is time-based service.
                  </Label>
                </div>

                <Button 
                  onClick={handleBookNow}
                  disabled={!termsAgreed}
                  size="lg"
                  className="w-full flex items-center gap-2"
                >
                  Continue to Details
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Price Summary Sticky Card (1/3 width) */}
        <div className="lg:col-span-1">
          <PriceSummaryCard
            basePrice={pricing.basePrice}
            addOnsTotal={pricing.addOnsTotal}
            subtotal={pricing.subtotal}
            recurringDiscount={pricing.recurringDiscount}
            membershipDiscount={pricing.membershipDiscount}
            total={pricing.total}
            membershipFee={pricing.membershipFee}
            selectedTier={selectedTierData}
            selectedAddOns={selectedAddOns.map(id => addOnServices.find(service => service.id === id)).filter(Boolean)}
            selectedRecurring={selectedRecurringData}
            membership={addMembership}
            newClient={newClient}
          />
        </div>
      </div>
    </div>
  );
};