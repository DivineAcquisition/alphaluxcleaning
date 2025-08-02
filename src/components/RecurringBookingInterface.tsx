import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Clock, Users, Star, Shield, CreditCard, RotateCcw, FileText } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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
  const [selectedRecurring, setSelectedRecurring] = useState<string>('one-time');
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
    
    const addOnsTotal = selectedAddOns.reduce((total, addOnId) => {
      const addOn = addOnServices.find(service => service.id === addOnId);
      return total + (addOn?.price || 0);
    }, 0);
    
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Professional Cleaning Services</h2>
        <p className="text-muted-foreground">
          Choose your perfect cleaning plan and save with recurring services
        </p>
      </div>

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
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="font-semibold text-lg">BACP Club™ Membership</div>
                <div className="text-sm text-muted-foreground">$39/month • Cancel anytime</div>
              </div>
              <div className="flex items-center gap-3">
                {!isMobile && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        View Terms
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Terms of Service Agreement</DialogTitle>
                      </DialogHeader>
                       <div className="space-y-4 text-sm leading-relaxed">
                         <p className="font-medium">
                           By booking a service with Bay Area Cleaning Pros, you agree to the following terms:
                         </p>
                         
                         <div className="space-y-3">
                           <div>
                             <h4 className="font-semibold mb-2">Time-Based Services</h4>
                             <p className="text-muted-foreground">
                               All bookings are based on the selected time duration (2, 4, or 6 hours) and include a team of professional cleaners (2 cleaners for 2-4 hour services, 3 cleaners for 6-hour services). If your cleaning requires additional time, we will notify you before proceeding. Extra time is billed in 30-minute increments at $50/hour per cleaner and must be approved prior to continuation.
                             </p>
                           </div>

                           <div>
                             <h4 className="font-semibold mb-2">Service Scope</h4>
                             <p className="text-muted-foreground">
                               We clean according to the time purchased. If a full-home clean cannot be completed in the time selected, cleaners will prioritize based on your initial instructions. Deep cleaning, pet hair removal, wall washing, and other specialized tasks require proper add-ons.
                             </p>
                           </div>

                           <div>
                             <h4 className="font-semibold mb-2">BACP Club™ Membership Terms</h4>
                             <p className="text-muted-foreground">
                               By selecting the BACP Club™ Membership, you agree to be billed $39/month on a recurring basis until canceled. A $20 discount is applied to each cleaning while the membership is active. You may cancel anytime from your customer portal or by contacting support. Credits roll over for 1 month and expire thereafter.
                             </p>
                           </div>

                           <div>
                             <h4 className="font-semibold mb-2">Cancellation & Rescheduling</h4>
                             <p className="text-muted-foreground">
                               To avoid a cancellation fee, you must cancel or reschedule your appointment at least 24 hours before the scheduled time. Late cancellations or missed appointments may be subject to a fee of up to 50% of the booking cost.
                             </p>
                           </div>

                           <div>
                             <h4 className="font-semibold mb-2">Access to Property</h4>
                             <p className="text-muted-foreground">
                               You are responsible for ensuring our cleaners can access your property at the scheduled time. If we cannot access the home within 15 minutes of arrival, the appointment may be canceled and a fee may apply.
                             </p>
                           </div>

                           <div>
                             <h4 className="font-semibold mb-2">Refunds</h4>
                             <p className="text-muted-foreground">
                               All bookings are non-refundable once services are rendered. If you're dissatisfied, please contact us within 24 hours so we can resolve the issue.
                             </p>
                           </div>
                         </div>
                       </div>
                     </DialogContent>
                     </Dialog>
                )}
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

      {/* Step 2: Choose Your Service */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Choose Your Service
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            All services include professional cleaners and quality supplies
          </p>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedTier} onValueChange={setSelectedTier}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bookingTiers.map((tier) => (
                <Label key={tier.id} htmlFor={tier.id} className="cursor-pointer">
                  <Card className={`transition-all hover:shadow-md ${
                    selectedTier === tier.id 
                      ? 'ring-2 ring-primary border-primary shadow-md' 
                      : 'hover:border-primary/50'
                  }`}>
                    <CardContent className="p-5">
                      <div className="flex items-center space-x-2 mb-3">
                        <RadioGroupItem value={tier.id} id={tier.id} />
                         <span className="font-semibold text-lg">
                           {tier.id === 'general' ? 'General Clean' : 
                            tier.id === 'complete' ? 'Complete Clean' : 
                            'Premium Deep Clean'} ({tier.hours} Hours)
                         </span>
                      </div>
                       <div className="text-3xl font-bold mb-3 text-primary">
                         {newClient && tier.id === 'complete' ? (
                           <div>
                             <span className="line-through text-muted-foreground text-xl mr-2">${tier.basePrice}</span>
                             <span>$349</span>
                             <div className="text-xs font-normal text-green-600 mt-1">New Client Special!</div>
                           </div>
                         ) : (existingMember || addMembership) ? (
                           <div>
                             <span className="line-through text-muted-foreground text-xl mr-2">${tier.basePrice}</span>
                             <span>${tier.basePrice - 20}</span>
                           </div>
                         ) : (
                           `$${tier.basePrice}`
                         )}
                       </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <Users className="h-4 w-4" />
                        <span>{tier.cleaners} Professional Cleaners</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{tier.description}</p>
                    </CardContent>
                  </Card>
                </Label>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Step 3: Add-ons */}
      <Card>
        <CardHeader>
          <CardTitle>Optional Add-ons</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enhance your cleaning with these popular extras
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addOnServices.map((addOn) => (
              <Label key={addOn.id} htmlFor={addOn.id} className="cursor-pointer">
                <Card className={`transition-all hover:shadow-sm ${
                  selectedAddOns.includes(addOn.id) 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:border-primary/50'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={addOn.id}
                        checked={selectedAddOns.includes(addOn.id)}
                        onCheckedChange={() => handleAddOnToggle(addOn.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{addOn.name}</div>
                        <div className="text-sm font-semibold text-primary">+${addOn.price}</div>
                        <p className="text-sm text-muted-foreground mt-1">{addOn.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step 4: Recurring Options */}
      <Card>
        <CardHeader>
          <CardTitle>Cleaning Frequency</CardTitle>
          <p className="text-muted-foreground">Save more with recurring services</p>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedRecurring} onValueChange={setSelectedRecurring}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recurringOptions.map((option) => (
                <Label key={option.id} htmlFor={option.id} className="cursor-pointer">
                  <Card className={`transition-all hover:shadow-md ${
                    selectedRecurring === option.id 
                      ? 'ring-2 ring-primary border-primary shadow-md' 
                      : 'hover:border-primary/50'
                  }`}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value={option.id} id={option.id} />
                          <span className="font-semibold text-lg">{option.name}</span>
                        </div>
                        {option.discount > 0 && (
                          <Badge className="bg-green-500 hover:bg-green-600">
                            {option.discount}% OFF
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                      {option.discount > 0 && (
                        <p className="text-xs text-green-600 mt-2 font-medium">
                          Save ${Math.round(pricing.subtotal * (option.discount / 100))} per visit
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Label>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Terms Checkbox - Outside membership for all users */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms-agreement"
              checked={termsAgreed}
              onCheckedChange={(checked) => setTermsAgreed(checked === true)}
              className="mt-1"
            />
            <label 
              htmlFor="terms-agreement" 
              className="text-sm font-medium leading-relaxed cursor-pointer"
            >
              I agree to the Terms of Service and understand the time-based nature of the service, membership billing (if applicable), and cancellation policy.
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Booking Summary */}
      <Card className="sticky top-4">
        <CardHeader>
          <CardTitle className="text-xl">Booking Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">{selectedTierData.hours}-Hour Clean</span>
              <span className="font-semibold">${selectedTierData.basePrice}</span>
            </div>
            
            {selectedAddOns.length > 0 && selectedAddOns.map(addOnId => {
              const addOn = addOnServices.find(service => service.id === addOnId)!;
              return (
                <div key={addOnId} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{addOn.name}</span>
                  <span className="text-sm font-medium">+${addOn.price}</span>
                </div>
              );
            })}

            {addMembership && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">BACP Club™ Membership</span>
                <span className="text-sm font-medium">+$39/month</span>
              </div>
            )}

            {pricing.recurringDiscount > 0 && (
              <div className="flex justify-between items-center text-green-600">
                <span className="text-sm">{selectedRecurringData.name} Discount</span>
                <span className="text-sm font-medium">-${pricing.recurringDiscount}</span>
              </div>
            )}

            {pricing.membershipDiscount > 0 && (
              <div className="flex justify-between items-center text-green-600">
                <span className="text-sm">BACP Club™ Discount</span>
                <span className="text-sm font-medium">-${pricing.membershipDiscount}</span>
              </div>
            )}
          </div>

          <Separator />

          <div className="flex justify-between items-center text-xl font-bold">
            <span>Total</span>
            <span className="text-primary">${pricing.total + pricing.membershipFee}</span>
          </div>

          {(pricing.recurringDiscount > 0 || pricing.membershipDiscount > 0) && (
            <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-medium">
                You're saving ${pricing.recurringDiscount + pricing.membershipDiscount} today! 🎉
              </p>
            </div>
          )}

          <Button 
            onClick={handleBookNow} 
            disabled={!termsAgreed}
            className="w-full h-14 text-lg font-semibold"
            size="lg"
          >
            {termsAgreed 
              ? `Book Now - $${pricing.total + pricing.membershipFee}` 
              : 'Please agree to terms to continue'
            }
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};