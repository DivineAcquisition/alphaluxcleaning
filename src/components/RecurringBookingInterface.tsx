import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Star, Shield, Heart, ArrowRight } from "lucide-react";

// Type definitions
interface BookingTier {
  id: string;
  name: string;
  hours: number;
  basePrice: number;
  membershipPrice: number;
  description: string;
  cleaners: number;
}

interface AddOnService {
  id: string;
  name: string;
  price: number;
  memberPrice: number;
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
  newClient?: boolean;
  existingMember?: boolean;
  onBookingUpdate: (data: any) => void;
}

// Data definitions
const bookingTiers: BookingTier[] = [
  {
    id: "essential",
    name: "Essential Clean",
    hours: 2,
    basePrice: 179,
    membershipPrice: 159,
    description: "Perfect for maintenance cleaning and smaller spaces",
    cleaners: 1
  },
  {
    id: "standard",
    name: "Standard Clean",
    hours: 3,
    basePrice: 249,
    membershipPrice: 229,
    description: "Most popular option for regular home cleaning",
    cleaners: 1
  },
  {
    id: "premium",
    name: "Deep Clean",
    hours: 4,
    basePrice: 349,
    membershipPrice: 329,
    description: "Comprehensive cleaning for maximum freshness",
    cleaners: 2
  },
  {
    id: "deluxe",
    name: "Deluxe Clean",
    hours: 6,
    basePrice: 469,
    membershipPrice: 449,
    description: "Ultimate cleaning experience for larger homes",
    cleaners: 2
  }
];

const addOnServices: AddOnService[] = [
  {
    id: "fridge",
    name: "Inside Fridge",
    price: 25,
    memberPrice: 20,
    description: "Deep clean inside your refrigerator"
  },
  {
    id: "oven",
    name: "Inside Oven",
    price: 25,
    memberPrice: 20,
    description: "Thorough oven interior cleaning"
  },
  {
    id: "windows",
    name: "Interior Windows",
    price: 4,
    memberPrice: 3,
    description: "Per window interior cleaning"
  },
  {
    id: "laundry",
    name: "Laundry Service",
    price: 25,
    memberPrice: 20,
    description: "Wash, dry, and fold one load"
  }
];

const recurringOptions: RecurringOption[] = [
  {
    id: "weekly",
    name: "Weekly",
    frequency: "weekly",
    discount: 10,
    description: "Every week - Maximum savings and convenience"
  },
  {
    id: "biweekly",
    name: "Bi-Weekly",
    frequency: "biweekly",
    discount: 8,
    description: "Every 2 weeks - Great balance of savings and cleanliness"
  },
  {
    id: "monthly",
    name: "Monthly",
    frequency: "monthly",
    discount: 5,
    description: "Once a month - Perfect for maintenance"
  },
  {
    id: "once",
    name: "One-Time",
    frequency: "once",
    discount: 0,
    description: "Single cleaning service"
  }
];

// Membership perks
const membershipPerks = [
  "Save $20 every month on any service",
  "Priority booking and scheduling",
  "Exclusive member pricing on add-ons",
  "Free service upgrades when available"
];

export function RecurringBookingInterface({ 
  newClient = false, 
  existingMember = false, 
  onBookingUpdate 
}: RecurringBookingInterfaceProps) {
  const [selectedTier, setSelectedTier] = useState<string>("premium");
  const [selectedRecurring, setSelectedRecurring] = useState<string>("once");
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [addMembership, setAddMembership] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);

  const calculatePricing = () => {
    const tier = bookingTiers.find(t => t.id === selectedTier);
    const recurring = recurringOptions.find(r => r.id === selectedRecurring);
    
    if (!tier || !recurring) return { total: 0, breakdown: {} };

    const isNewClientSpecial = newClient && tier.id === "premium";
    const hasActiveMembership = existingMember || addMembership;
    
    // Base price calculation
    let basePrice = tier.basePrice;
    if (isNewClientSpecial) {
      basePrice = 349; // Special price for new clients on premium tier
    } else if (hasActiveMembership) {
      basePrice = tier.membershipPrice;
    }

    // Add-ons calculation
    const addOnsCost = selectedAddOns.reduce((total, addOnId) => {
      const addOn = addOnServices.find(a => a.id === addOnId);
      if (!addOn) return total;
      
      const price = hasActiveMembership ? addOn.memberPrice : addOn.price;
      return total + price;
    }, 0);

    // Recurring discount
    const recurringDiscount = Math.round((basePrice + addOnsCost) * (recurring.discount / 100));
    
    // Membership discount (additional savings if adding membership)
    const membershipDiscount = addMembership && !existingMember ? 20 : 0;

    const subtotal = basePrice + addOnsCost;
    const total = subtotal - recurringDiscount - membershipDiscount;

    return {
      total: Math.max(total, 0),
      breakdown: {
        basePrice,
        addOnsCost,
        subtotal,
        recurringDiscount,
        membershipDiscount,
        savings: recurringDiscount + membershipDiscount
      }
    };
  };

  const handleAddOnToggle = (addOnId: string) => {
    setSelectedAddOns(prev => 
      prev.includes(addOnId) 
        ? prev.filter(id => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  const handleBookNow = () => {
    const tier = bookingTiers.find(t => t.id === selectedTier);
    const recurring = recurringOptions.find(r => r.id === selectedRecurring);
    const pricing = calculatePricing();
    
    if (tier && recurring) {
      const bookingData = {
        tier,
        recurring,
        addOns: selectedAddOns,
        membership: addMembership,
        pricing,
        termsAgreed
      };
      
      onBookingUpdate(bookingData);
    }
  };

  return (
    <div className="w-full space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-2xl lg:text-3xl font-bold">Professional Cleaning Services</h2>
        <p className="text-base lg:text-lg text-muted-foreground max-w-3xl mx-auto">
          Choose your perfect cleaning plan and save with recurring services
        </p>
      </div>

      {/* Step 1: BACP Club Membership */}
      {!existingMember && (
        <Card className="border-primary/30 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Join Clean & Covered™ Membership
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Save $20 every month + exclusive member benefits
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Checkbox
                id="membership"
                checked={addMembership}
                onCheckedChange={(checked) => setAddMembership(checked === true)}
              />
              <div className="flex-1 space-y-4">
                <Label htmlFor="membership" className="text-base font-medium cursor-pointer">
                  Add Clean & Covered™ Membership ($30/month)
                </Label>
                
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Member Benefits:
                  </h4>
                  <ul className="space-y-1 text-sm">
                    {membershipPerks.map((perk, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Heart className="h-3 w-3 text-red-500 flex-shrink-0" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </div>

                {addMembership && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                    <p className="text-sm font-medium text-primary">
                      🎉 Membership added! You'll save $20 on today's service and get exclusive member pricing.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Choose Your Service */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-xl lg:text-2xl font-bold flex items-center justify-center gap-2">
            <Clock className="h-6 w-6" />
            Choose Your Service
          </h3>
          <p className="text-muted-foreground">
            Select the perfect cleaning package for your home
          </p>
        </div>
        
        <RadioGroup value={selectedTier} onValueChange={setSelectedTier}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {bookingTiers.map((tier) => (
              <Label key={tier.id} htmlFor={tier.id} className="cursor-pointer">
                <Card className={`transition-all hover:shadow-lg hover:scale-105 ${
                  selectedTier === tier.id ? "ring-2 ring-primary border-primary shadow-lg" : ""
                }`}>
                  <RadioGroupItem value={tier.id} id={tier.id} className="sr-only" />
                  <CardContent className="p-6 text-center space-y-4">
                    <h3 className="font-bold text-lg">{tier.name}</h3>
                    <div className="text-3xl font-bold text-primary">
                      ${tier.basePrice}
                    </div>
                    <p className="text-muted-foreground">
                      {tier.hours} hours • {tier.cleaners} cleaner{tier.cleaners > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {tier.description}
                    </p>
                  </CardContent>
                </Card>
              </Label>
            ))}
          </div>
        </RadioGroup>
      </div>

      {/* Step 3: Add-ons */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-xl lg:text-2xl font-bold">Optional Add-ons</h3>
          <p className="text-muted-foreground">
            Enhance your cleaning with these popular extras
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {addOnServices.map((addOn) => (
            <Label key={addOn.id} htmlFor={addOn.id} className="cursor-pointer">
              <Card className={`transition-all hover:shadow-lg ${
                selectedAddOns.includes(addOn.id) ? "ring-2 ring-primary border-primary shadow-lg" : ""
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={addOn.id}
                      checked={selectedAddOns.includes(addOn.id)}
                      onCheckedChange={() => handleAddOnToggle(addOn.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{addOn.name}</h4>
                        <span className="font-bold text-primary">+${addOn.price}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {addOn.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Label>
          ))}
        </div>
      </div>

      {/* Step 4: Recurring Options */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-xl lg:text-2xl font-bold">Cleaning Frequency</h3>
          <p className="text-muted-foreground">Save more with recurring services</p>
        </div>
        
        <RadioGroup value={selectedRecurring} onValueChange={setSelectedRecurring}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {recurringOptions.map((option) => (
              <Label key={option.id} htmlFor={option.id} className="cursor-pointer">
                <Card className={`transition-all hover:shadow-lg hover:scale-105 ${
                  selectedRecurring === option.id ? "ring-2 ring-primary border-primary shadow-lg" : ""
                }`}>
                  <RadioGroupItem value={option.id} id={option.id} className="sr-only" />
                  <CardContent className="p-6 text-center space-y-3">
                    <h4 className="font-bold text-lg">{option.name}</h4>
                    {option.discount > 0 && (
                      <Badge variant="secondary" className="text-green-600 font-semibold">
                        Save {option.discount}%
                      </Badge>
                    )}
                    <p className="text-muted-foreground">
                      {option.description}
                    </p>
                  </CardContent>
                </Card>
              </Label>
            ))}
          </div>
        </RadioGroup>
      </div>

      {/* Terms Agreement */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms"
              checked={termsAgreed}
              onCheckedChange={(checked) => setTermsAgreed(checked === true)}
            />
            <Label htmlFor="terms" className="text-sm cursor-pointer">
              I agree to the Terms of Service and Privacy Policy. I understand that booking requires payment and that services are subject to availability.
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Booking Summary */}
      <div className="w-full max-w-md mx-auto">
        <Card className="sticky top-4">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Booking Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Service</span>
                <span>{bookingTiers.find(t => t.id === selectedTier)?.name}</span>
              </div>
              
              {selectedAddOns.length > 0 && (
                <div className="space-y-1">
                  {selectedAddOns.map(addOnId => {
                    const addOn = addOnServices.find(a => a.id === addOnId);
                    return (
                      <div key={addOnId} className="flex justify-between text-sm text-muted-foreground">
                        <span>+ {addOn?.name}</span>
                        <span>+${addOn?.price}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              
              <div className="flex justify-between text-sm">
                <span>Frequency</span>
                <span>{recurringOptions.find(r => r.id === selectedRecurring)?.name}</span>
              </div>
              
              {addMembership && (
                <div className="flex justify-between text-sm text-primary">
                  <span>Membership</span>
                  <span>-$20</span>
                </div>
              )}
              
              <div className="border-t pt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">${calculatePricing().total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleBookNow}
              disabled={!termsAgreed}
              className="w-full"
              size="lg"
            >
              Continue to Payment
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};