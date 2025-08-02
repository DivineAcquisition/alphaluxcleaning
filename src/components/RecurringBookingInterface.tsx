import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { CheckCircle, Clock, Users, Star, Shield, CreditCard, RotateCcw, User, Mail, Phone, Gift, Tag } from 'lucide-react';
import { ServiceIncluded } from '@/components/ServiceIncluded';

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
  
  // Contact form state
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [referralCode, setReferralCode] = useState<string>('');
  const [discountCode, setDiscountCode] = useState<string>('');

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
    const membershipFee = addMembership ? 30 : 0;

    return {
      basePrice,
      addOnsTotal,
      subtotal,
      recurringDiscount,
      membershipDiscount,
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

  // Map tier hours to cleaning type for ServiceIncluded component
  const getCleaningType = (hours: number) => {
    return hours >= 6 ? 'deep' : 'general';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Professional Cleaning Services</h2>
        <p className="text-muted-foreground">
          Explore our services and see what's included
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Service Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Service Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Choose Your Service
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

              {/* Membership Option */}
              {!existingMember && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-4">🌟 BACP Club Membership</h3>
                  <div className="border-2 border-primary/20 rounded-lg p-4 bg-primary/5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-semibold">BACP Club Membership</div>
                        <div className="text-sm text-muted-foreground">$30/month • Cancel anytime</div>
                      </div>
                      <Switch checked={addMembership} onCheckedChange={(checked) => setAddMembership(checked)} />
                    </div>

                    <div className="grid md:grid-cols-2 gap-3 mb-3">
                      {membershipPerks.map((perk, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <span className="text-primary">{perk.icon}</span>
                          {perk.text}
                        </div>
                      ))}
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <strong>Sign up today and start saving!</strong>
                    </div>
                  </div>
                </div>
              )}

              {existingMember && (
                <div className="mt-6">
                  <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">BACP Club Member</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Your membership discount has been applied!
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* What's Included Section */}
          <ServiceIncluded 
            cleaningType={getCleaningType(selectedTierData.hours)} 
            serviceType="recurring" 
          />

          {/* Step 2: Recurring Options */}
          <Card>
            <CardHeader>
              <CardTitle>Want to keep it clean all year?</CardTitle>
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

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Contact Information
              </CardTitle>
              <p className="text-muted-foreground">Tell us how to reach you</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="transition-all focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="transition-all focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="referralCode" className="flex items-center gap-2">
                    <Gift className="h-4 w-4" />
                    Referral Code <span className="text-muted-foreground">(Optional)</span>
                  </Label>
                  <Input
                    id="referralCode"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder="Enter referral code"
                    className="transition-all focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-xs text-muted-foreground">Get rewards for you and your friend!</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountCode" className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Discount Code <span className="text-muted-foreground">(Optional)</span>
                  </Label>
                  <Input
                    id="discountCode"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    placeholder="Enter discount code"
                    className="transition-all focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-xs text-muted-foreground">Have a promo code? Apply it here!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Pricing Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Pricing Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>{selectedTierData.hours}-Hour Clean</span>
                  <span>${selectedTierData.basePrice}</span>
                </div>
                
                {selectedAddOns.length > 0 && selectedAddOns.map(addOnId => {
                  const addOn = addOnServices.find(service => service.id === addOnId)!;
                  return (
                    <div key={addOnId} className="flex justify-between">
                      <span>{addOn.name}</span>
                      <span>+${addOn.price}</span>
                    </div>
                  );
                })}

                {addMembership && (
                  <div className="flex justify-between">
                    <span>BACP Club Membership</span>
                    <span>+$30/month</span>
                  </div>
                )}

                {pricing.recurringDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>{selectedRecurringData.name} Discount</span>
                    <span>-${pricing.recurringDiscount}</span>
                  </div>
                )}

                {pricing.membershipDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>BACP Club Discount</span>
                    <span>-${pricing.membershipDiscount}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${pricing.total + pricing.membershipFee}</span>
              </div>

              <div className="text-center pt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Ready to book? Contact us to schedule your service!
                </p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>📞 Call: (555) 123-CLEAN</p>
                  <p>📧 Email: book@bacp.com</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};