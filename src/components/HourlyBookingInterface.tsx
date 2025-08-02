import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, Clock, Star, Shield, MessageCircle, Calendar, Gift, CheckCircle } from 'lucide-react';

interface BookingTier {
  hours: number;
  price: number;
  membershipPrice: number;
  description: string;
  bestFor: string;
}

interface AddOnService {
  id: string;
  name: string;
  price: number;
  description: string;
}

interface MembershipPerk {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const bookingTiers: BookingTier[] = [
  {
    hours: 2,
    price: 200,
    membershipPrice: 180,
    description: "Best for 1-bedroom or light maintenance",
    bestFor: "Quick refresh"
  },
  {
    hours: 4,
    price: 400,
    membershipPrice: 380,
    description: "Ideal for 2–3 bedroom standard cleaning",
    bestFor: "Deep clean"
  },
  {
    hours: 6,
    price: 600,
    membershipPrice: 580,
    description: "Great for deep cleans or large homes",
    bestFor: "Deep clean"
  }
];

const addOnServices: AddOnService[] = [
  { id: 'fridge', name: 'Inside Fridge Cleaning', price: 25, description: 'Deep clean inside of refrigerator' },
  { id: 'microwave', name: 'Inside Microwave', price: 15, description: 'Thorough microwave interior cleaning' },
  { id: 'oven', name: 'Inside Oven', price: 35, description: 'Complete oven interior deep clean' },
  { id: 'baseboards', name: 'Baseboard Detailing', price: 30, description: 'Detailed baseboard cleaning throughout' },
  { id: 'windows', name: 'Interior Windows', price: 40, description: 'All interior window cleaning' },
  { id: 'cabinets', name: 'Cabinet Fronts', price: 25, description: 'Kitchen cabinet exterior cleaning' }
];

const membershipPerks: MembershipPerk[] = [
  {
    icon: <Gift className="h-6 w-6 text-primary" />,
    title: "$20 Credit Every Month",
    description: "Applied to every cleaning you book — guaranteed savings"
  },
  {
    icon: <Star className="h-6 w-6 text-primary" />,
    title: "Free Add-On Every 3rd Booking",
    description: "Fridge, microwave, or baseboard detailing — on us"
  },
  {
    icon: <Calendar className="h-6 w-6 text-primary" />,
    title: "Priority Scheduling Access",
    description: "First pick for weekends, holidays, and last-minute slots"
  },
  {
    icon: <CheckCircle className="h-6 w-6 text-primary" />,
    title: "Loyalty Reward at 6 Months",
    description: "Earn a free standard cleaning or 50% off a deep clean"
  },
  {
    icon: <MessageCircle className="h-6 w-6 text-primary" />,
    title: "VIP Text Line",
    description: "Text-in reschedules, questions, or booking requests 24/7"
  }
];

interface HourlyBookingInterfaceProps {
  onBookingUpdate?: (data: any) => void;
}

export const HourlyBookingInterface: React.FC<HourlyBookingInterfaceProps> = ({ onBookingUpdate }) => {
  const [selectedTier, setSelectedTier] = useState<BookingTier | null>(null);
  const [membershipEnabled, setMembershipEnabled] = useState(false);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [showMembershipDetails, setShowMembershipDetails] = useState(false);

  const calculateSubtotal = () => {
    if (!selectedTier) return 0;
    const tierPrice = membershipEnabled ? selectedTier.membershipPrice : selectedTier.price;
    const addOnsTotal = selectedAddOns.reduce((total, addOnId) => {
      const addOn = addOnServices.find(service => service.id === addOnId);
      return total + (addOn?.price || 0);
    }, 0);
    return tierPrice + addOnsTotal;
  };

  const calculateMonthlySavings = () => {
    if (!selectedTier) return 0;
    return selectedTier.price - selectedTier.membershipPrice;
  };

  const handleAddOnToggle = (addOnId: string) => {
    setSelectedAddOns(prev => 
      prev.includes(addOnId) 
        ? prev.filter(id => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  const handleBookNow = () => {
    if (!selectedTier) return;
    
    const bookingData = {
      tier: selectedTier,
      membership: membershipEnabled,
      addOns: selectedAddOns.map(id => addOnServices.find(service => service.id === id)),
      subtotal: calculateSubtotal(),
      monthlySavings: membershipEnabled ? calculateMonthlySavings() : 0
    };
    
    onBookingUpdate?.(bookingData);
  };

  return (
    <TooltipProvider>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center space-y-2 sm:space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Choose Your Cleaning Duration</h2>
          <p className="text-sm sm:text-base text-muted-foreground px-2">Professional 2-cleaner teams • Flat-rate pricing • Same-day availability</p>
        </div>

        {/* Membership Toggle */}
        <Card className="border-primary/20">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h3 className="text-base sm:text-lg font-semibold">Membership Plan</h3>
                  <Badge variant="secondary" className="w-fit">$30/month</Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">Save $20 on every cleaning + exclusive perks</p>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3">
                <Switch
                  checked={membershipEnabled}
                  onCheckedChange={setMembershipEnabled}
                  id="membership-toggle"
                />
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-xs sm:text-sm"
                  onClick={() => setShowMembershipDetails(!showMembershipDetails)}
                >
                  View Perks
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Membership Perks */}
        {showMembershipDetails && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Membership Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {membershipPerks.map((perk, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-background/60">
                    {perk.icon}
                    <div>
                      <h4 className="font-medium text-sm">{perk.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{perk.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Booking Tiers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {bookingTiers.map((tier) => (
            <Card 
              key={tier.hours}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedTier?.hours === tier.hours 
                  ? 'ring-2 ring-primary border-primary shadow-lg' 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => setSelectedTier(tier)}
            >
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <CardTitle className="text-2xl">{tier.hours} Hours</CardTitle>
                </div>
                <Badge variant="outline" className="mx-auto">
                  <Users className="h-3 w-3 mr-1" />
                  2 Cleaners Included
                </Badge>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-primary">
                    ${membershipEnabled ? tier.membershipPrice : tier.price}
                  </div>
                  {membershipEnabled && (
                    <div className="text-sm text-muted-foreground">
                      <span className="line-through">${tier.price}</span>
                      <span className="ml-2 text-green-600 font-medium">Save ${tier.price - tier.membershipPrice}</span>
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground">{tier.description}</p>
                
                <Button 
                  className="w-full" 
                  variant={selectedTier?.hours === tier.hours ? "default" : "outline"}
                >
                  {selectedTier?.hours === tier.hours ? "Selected" : "Select Plan"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add-on Services */}
        {selectedTier && (
          <Card>
            <CardHeader>
              <CardTitle>Add-On Services</CardTitle>
              <p className="text-sm text-muted-foreground">Enhance your cleaning with these optional services</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {addOnServices.map((addOn) => (
                  <div key={addOn.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                    <Checkbox
                      id={addOn.id}
                      checked={selectedAddOns.includes(addOn.id)}
                      onCheckedChange={() => handleAddOnToggle(addOn.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <label htmlFor={addOn.id} className="font-medium cursor-pointer">
                          {addOn.name}
                        </label>
                        <span className="font-semibold">${addOn.price}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{addOn.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Booking Summary */}
        {selectedTier && (
          <Card className="bg-primary/5 border-primary/30">
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span>{selectedTier.hours}-Hour Cleaning Session</span>
                <span className="font-semibold">
                  ${membershipEnabled ? selectedTier.membershipPrice : selectedTier.price}
                </span>
              </div>
              
              {selectedAddOns.length > 0 && (
                <div className="space-y-2 border-t pt-2">
                  <h4 className="font-medium text-sm">Add-on Services:</h4>
                  {selectedAddOns.map(addOnId => {
                    const addOn = addOnServices.find(service => service.id === addOnId);
                    return addOn ? (
                      <div key={addOn.id} className="flex justify-between text-sm">
                        <span>{addOn.name}</span>
                        <span>${addOn.price}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
              
              {membershipEnabled && (
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-green-800">Membership Savings</span>
                    <span className="text-green-600 font-medium">-${calculateMonthlySavings()}</span>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center text-lg font-bold border-t pt-4">
                <span>Total</span>
                <span className="text-primary">${calculateSubtotal()}</span>
              </div>
              
              <Button onClick={handleBookNow} className="w-full" size="lg">
                Book Now - ${calculateSubtotal()}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                Estimated time on-site: {selectedTier.hours} hours • 2 professional cleaners included
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};