import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, Home, Building, Star, Clock } from "lucide-react";
import { trackQuoteCalculated, trackInitiateCheckout } from "@/lib/facebook-pixel";

interface PricingData {
  squareFootage: number;
  serviceType: string; // 'residential', 'commercial', 'office', 'carpet'
  cleaningType: string;
  frequency: string;
  addOns: string[];
  bedrooms?: number;
  bathrooms?: number;
}

interface PricingCalculatorProps {
  onPriceUpdate?: (data: PricingData, price: number, breakdown: any) => void;
}

// Bay Area Cleaning Professionals pricing structure - THESE ARE THE FINAL PRICES
const pricingTiers = [
  { min: 0, max: 1000, weekly: 97.50, biweekly: 118.59, monthly: 171.26, oneTime: 225.31, deepClean: 305.05 },
  { min: 1001, max: 1400, weekly: 115.94, biweekly: 125.58, monthly: 186.59, oneTime: 235.09, deepClean: 327.77 },
  { min: 1401, max: 1800, weekly: 125.67, biweekly: 140.06, monthly: 225.73, oneTime: 255.27, deepClean: 355.94 },
  { min: 1801, max: 2400, weekly: 132.81, biweekly: 150.15, monthly: 234.87, oneTime: 265.41, deepClean: 385.13 },
  { min: 2401, max: 2800, weekly: 158.26, biweekly: 175.14, monthly: 245.76, oneTime: 285.28, deepClean: 405.01 },
  { min: 2801, max: 3300, weekly: 168.73, biweekly: 188.62, monthly: 287.92, oneTime: 297.46, deepClean: 459.16 },
  { min: 3301, max: 3900, weekly: 178.82, biweekly: 197.61, monthly: 307.81, oneTime: 346.34, deepClean: 478.39 },
  { min: 3901, max: 4500, weekly: 215.29, biweekly: 231.58, monthly: 368.69, oneTime: 378.67, deepClean: 512.60 },
  { min: 4501, max: 5100, weekly: 228.56, biweekly: 242.05, monthly: 428.17, oneTime: 461.37, deepClean: 564.24 }
];

const addOnPrices = {
  baseboards: 50,
  dishes: 40,
  door_facings: 50,
  wall_spot_clean: 25,
  wall_wash_per_room: 75,
  blinds_feather: 65,
  blinds_blade: 15,
  oven_fridge: 35,
  cabinet_fronts: 50,
  window_sills: 25,
  light_fixtures: 35,
  laundry_basket: 20
};

// Carpet cleaning pricing (per room)
const carpetCleaningPrices = {
  standardRoom: 35,
  livingRoom: 50,
  stairs: 25,
  hallway: 20
};

export function PricingCalculator({ onPriceUpdate }: PricingCalculatorProps = {}) {
  const [pricingData, setPricingData] = useState<PricingData>({
    squareFootage: 1000,
    serviceType: "residential",
    cleaningType: "",
    frequency: "",
    addOns: [],
    bedrooms: undefined,
    bathrooms: undefined
  });

  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);
  const [priceBreakdown, setPriceBreakdown] = useState<any>({});

  const calculatePrice = () => {
    if (!pricingData.serviceType || !pricingData.cleaningType || !pricingData.frequency) {
      setCalculatedPrice(0);
      return;
    }

    // Commercial and Office cleaning requires estimate
    if (pricingData.serviceType === 'commercial' || pricingData.serviceType === 'office') {
      setCalculatedPrice(0);
      setPriceBreakdown({
        requiresEstimate: true,
        serviceType: pricingData.serviceType
      });
      return;
    }

    // Handle homes over 5100 sq ft for residential
    if (pricingData.serviceType === 'residential' && pricingData.squareFootage > 5100) {
      setCalculatedPrice(0);
      setPriceBreakdown({
        requiresEstimate: true,
        serviceType: 'residential'
      });
      return;
    }

    // Handle carpet cleaning
    if (pricingData.cleaningType === 'carpet') {
      const basePrice = carpetCleaningPrices.standardRoom * Math.ceil(pricingData.squareFootage / 200); // Estimate rooms based on sq ft
      const addOnTotal = pricingData.addOns.reduce((total, addOn) => {
        return total + (addOnPrices[addOn as keyof typeof addOnPrices] || 0);
      }, 0);
      const finalPrice = basePrice + addOnTotal;
      
      setPriceBreakdown({
        basePrice: basePrice,
        addOnTotal: addOnTotal,
        finalPrice: finalPrice,
        estimatedRooms: Math.ceil(pricingData.squareFootage / 200)
      });
      setCalculatedPrice(finalPrice);
      return;
    }

    // Find the appropriate pricing tier for residential
    const tier = pricingTiers.find(t => 
      pricingData.squareFootage >= t.min && pricingData.squareFootage <= t.max
    );

    if (!tier) {
      setCalculatedPrice(0);
      return;
    }

    let basePrice = 0;
    const frequency = pricingData.frequency;
    const cleaningType = pricingData.cleaningType;

    // Get base price based on frequency and cleaning type
    if (frequency === 'weekly') {
      basePrice = tier.weekly;
    } else if (frequency === 'biweekly') {
      basePrice = tier.biweekly;
    } else if (frequency === 'monthly') {
      basePrice = tier.monthly;
    } else if (frequency === 'one_time') {
      basePrice = tier.oneTime;
    }

    // For deep cleaning ONE-TIME only, apply $75 discount
    if ((cleaningType === 'deep' || cleaningType === 'moveout') && frequency === 'one_time') {
      basePrice = tier.deepClean - 75; // Apply $75 discount for deep cleaning
    }
    
    const addOnTotal = pricingData.addOns.reduce((total, addOn) => {
      return total + (addOnPrices[addOn as keyof typeof addOnPrices] || 0);
    }, 0);

    const finalPrice = basePrice + addOnTotal;
    
    setPriceBreakdown({
      basePrice: basePrice,
      addOnTotal: addOnTotal,
      finalPrice: finalPrice,
      tierInfo: `${tier.min === 0 ? 'Under' : tier.min}-${tier.max} sq ft`,
      hasDeepCleanDiscount: (cleaningType === 'deep' || cleaningType === 'moveout') && frequency === 'one_time'
    });
    
    setCalculatedPrice(finalPrice);
  };

  useEffect(() => {
    calculatePrice();
    if (onPriceUpdate) {
      onPriceUpdate(pricingData, calculatedPrice, priceBreakdown);
    }
    
    // Track Facebook Pixel event when a valid quote is calculated
    if (calculatedPrice > 0 && pricingData.cleaningType && pricingData.frequency) {
      trackQuoteCalculated(
        pricingData.cleaningType,
        calculatedPrice,
        pricingData.frequency
      );
    }
  }, [pricingData, calculatedPrice, priceBreakdown, onPriceUpdate]);

  const toggleAddOn = (addOn: string) => {
    setPricingData(prev => ({
      ...prev,
      addOns: prev.addOns.includes(addOn)
        ? prev.addOns.filter(item => item !== addOn)
        : [...prev.addOns, addOn]
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calculator Form */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary to-accent text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Select your cleaning request
          </CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Get an instant quote for your cleaning service
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Square Footage */}
          <div className="space-y-2">
            <Label>Square Footage *</Label>
            <Select 
              value={pricingData.squareFootage.toString()} 
              onValueChange={(value) => setPricingData(prev => ({ ...prev, squareFootage: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select here" />
              </SelectTrigger>
              <SelectContent>
                {pricingTiers.map((tier, index) => (
                  <SelectItem key={index} value={Math.floor((tier.min + tier.max) / 2).toString()}>
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      {tier.min === 0 ? `Under ${tier.max.toLocaleString()}` : `${tier.min.toLocaleString()} - ${tier.max.toLocaleString()}`} sq ft
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bedroom and Bathroom Count */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bedrooms</Label>
              <Select 
                value={pricingData.bedrooms?.toString() || ""} 
                onValueChange={(value) => setPricingData(prev => ({ ...prev, bedrooms: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select here" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Bedroom</SelectItem>
                  <SelectItem value="2">2 Bedrooms</SelectItem>
                  <SelectItem value="3">3 Bedrooms</SelectItem>
                  <SelectItem value="4">4 Bedrooms</SelectItem>
                  <SelectItem value="5">5+ Bedrooms</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Bathrooms</Label>
              <Select 
                value={pricingData.bathrooms?.toString() || ""} 
                onValueChange={(value) => setPricingData(prev => ({ ...prev, bathrooms: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select here" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Bathroom</SelectItem>
                  <SelectItem value="2">2 Bathrooms</SelectItem>
                  <SelectItem value="3">3 Bathrooms</SelectItem>
                  <SelectItem value="4">4 Bathrooms</SelectItem>
                  <SelectItem value="5">5+ Bathrooms</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>


          {/* Cleaning Type */}
          <div className="space-y-2">
            <Label>Cleaning Type</Label>
            <Select 
              value={pricingData.cleaningType} 
              onValueChange={(value) => setPricingData(prev => ({ ...prev, cleaningType: value }))}
              disabled={!pricingData.serviceType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select here" />
              </SelectTrigger>
              <SelectContent>
                <>
                  <SelectItem value="general">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      General Cleaning
                    </div>
                  </SelectItem>
                  <SelectItem value="deep">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-current" />
                      Deep Cleaning
                    </div>
                  </SelectItem>
                  <SelectItem value="moveout">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-current" />
                      Move-out Cleaning
                    </div>
                  </SelectItem>
                  <SelectItem value="carpet">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Carpet Cleaning
                    </div>
                  </SelectItem>
                </>
              </SelectContent>
            </Select>
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label>Service Frequency</Label>
            <Select 
              value={pricingData.frequency} 
              onValueChange={(value) => setPricingData(prev => ({ ...prev, frequency: value }))}
              disabled={!pricingData.cleaningType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select here" />
              </SelectTrigger>
              <SelectContent>
                <>
                  <SelectItem value="one_time">One-time Service</SelectItem>
                  <SelectItem value="weekly">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Weekly
                    </div>
                  </SelectItem>
                  <SelectItem value="biweekly">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Every Other Week (EOW)
                    </div>
                  </SelectItem>
                  <SelectItem value="monthly">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      4 Weeks/Monthly
                    </div>
                  </SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="biannual">Twice a Year</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </>
              </SelectContent>
            </Select>
          </div>

          {/* Add-ons - Always show for residential services */}
          {(
          <div className="space-y-3">
            <Label>🔧 Additional Services Available</Label>
            <div className="grid grid-cols-1 gap-2">
              {(() => {
                const isDeepCleaning = pricingData.cleaningType === 'deep' || pricingData.cleaningType === 'moveout';
                const isBaseboartsIncluded = isDeepCleaning;
                
                return (
                  <Button
                    variant={pricingData.addOns.includes('baseboards') ? "default" : "outline"}
                    size="sm"
                    onClick={() => !isBaseboartsIncluded && toggleAddOn('baseboards')}
                    className={`justify-between h-auto p-3 ${isBaseboartsIncluded ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isBaseboartsIncluded}
                  >
                    <span>Baseboards {isBaseboartsIncluded && '(Included)'}</span>
                    <Badge variant="secondary">{isBaseboartsIncluded ? 'Included' : '$50.00'}</Badge>
                  </Button>
                );
              })()}
              <Button
                variant={pricingData.addOns.includes('dishes') ? "default" : "outline"}
                size="sm"
                onClick={() => toggleAddOn('dishes')}
                className="justify-between h-auto p-3"
              >
                <span>Dishes</span>
                <Badge variant="secondary">$40.00</Badge>
              </Button>
              <Button
                variant={pricingData.addOns.includes('door_facings') ? "default" : "outline"}
                size="sm"
                onClick={() => toggleAddOn('door_facings')}
                className="justify-between h-auto p-3"
              >
                <span>Door facings/moldings</span>
                <Badge variant="secondary">$50.00</Badge>
              </Button>
              <Button
                variant={pricingData.addOns.includes('wall_spot_clean') ? "default" : "outline"}
                size="sm"
                onClick={() => toggleAddOn('wall_spot_clean')}
                className="justify-between h-auto p-3"
              >
                <span>Wall spot cleaning</span>
                <Badge variant="secondary">$25.00</Badge>
              </Button>
              <Button
                variant={pricingData.addOns.includes('wall_wash_per_room') ? "default" : "outline"}
                size="sm"
                onClick={() => toggleAddOn('wall_wash_per_room')}
                className="justify-between h-auto p-3"
              >
                <span>Wall wash (per room)</span>
                <Badge variant="secondary">$75.00</Badge>
              </Button>
              <Button
                variant={pricingData.addOns.includes('blinds_feather') ? "default" : "outline"}
                size="sm"
                onClick={() => toggleAddOn('blinds_feather')}
                className="justify-between h-auto p-3"
              >
                <span>Blinds (feather dust)</span>
                <Badge variant="secondary">$65.00</Badge>
              </Button>
              <Button
                variant={pricingData.addOns.includes('blinds_blade') ? "default" : "outline"}
                size="sm"
                onClick={() => toggleAddOn('blinds_blade')}
                className="justify-between h-auto p-3"
              >
                <span>Blinds (blade by blade)</span>
                <Badge variant="secondary">$15.00 per blind</Badge>
              </Button>
              {(() => {
                const isDeepCleaning = pricingData.cleaningType === 'deep' || pricingData.cleaningType === 'moveout';
                const isOvenFridgeIncluded = isDeepCleaning;
                
                return (
                  <Button
                    variant={pricingData.addOns.includes('oven_fridge') ? "default" : "outline"}
                    size="sm"
                    onClick={() => !isOvenFridgeIncluded && toggleAddOn('oven_fridge')}
                    className={`justify-between h-auto p-3 ${isOvenFridgeIncluded ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isOvenFridgeIncluded}
                  >
                    <span>Oven or refrigerator {isOvenFridgeIncluded && '(Included)'}</span>
                    <Badge variant="secondary">{isOvenFridgeIncluded ? 'Included' : '$35.00'}</Badge>
                  </Button>
                );
              })()}
              <Button
                variant={pricingData.addOns.includes('cabinet_fronts') ? "default" : "outline"}
                size="sm"
                onClick={() => toggleAddOn('cabinet_fronts')}
                className="justify-between h-auto p-3"
              >
                <span>Cabinet fronts</span>
                <Badge variant="secondary">$50.00</Badge>
              </Button>
              {(() => {
                const isDeepCleaning = pricingData.cleaningType === 'deep' || pricingData.cleaningType === 'moveout';
                const isWindowSillsIncluded = isDeepCleaning;
                
                return (
                  <Button
                    variant={pricingData.addOns.includes('window_sills') ? "default" : "outline"}
                    size="sm"
                    onClick={() => !isWindowSillsIncluded && toggleAddOn('window_sills')}
                    className={`justify-between h-auto p-3 ${isWindowSillsIncluded ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isWindowSillsIncluded}
                  >
                    <span>Window sills {isWindowSillsIncluded && '(Included)'}</span>
                    <Badge variant="secondary">{isWindowSillsIncluded ? 'Included' : '$25.00'}</Badge>
                  </Button>
                );
              })()}
              <Button
                variant={pricingData.addOns.includes('light_fixtures') ? "default" : "outline"}
                size="sm"
                onClick={() => toggleAddOn('light_fixtures')}
                className="justify-between h-auto p-3"
              >
                <span>Light fixtures</span>
                <Badge variant="secondary">$35.00</Badge>
              </Button>
              <Button
                variant={pricingData.addOns.includes('laundry_basket') ? "default" : "outline"}
                size="sm"
                onClick={() => toggleAddOn('laundry_basket')}
                className="justify-between h-auto p-3"
              >
                <span>Laundry (per basket)</span>
                <Badge variant="secondary">$20.00</Badge>
              </Button>
            </div>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Price Display */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-success to-accent text-white rounded-t-lg">
          <CardTitle>Your Quote</CardTitle>
          <CardDescription className="text-success-foreground/80">
            Instant pricing calculation
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {priceBreakdown.requiresEstimate ? (
            <div className="text-center py-12">
              <Calculator className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-bold text-foreground mb-2">
                {pricingData.serviceType === 'commercial' ? 'Commercial Estimate Required' :
                 pricingData.serviceType === 'office' ? 'Office Estimate Required' :
                 'Custom Estimate Required'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {pricingData.serviceType === 'commercial' || pricingData.serviceType === 'office' 
                  ? 'Commercial and office spaces require an in-person walkthrough for accurate pricing.'
                  : 'Homes greater than 5,100 sq ft require an in-person estimate.'
                }
              </p>
              <Button className="w-full" size="lg">
                Call for Estimate: (281) 201-6112
              </Button>
            </div>
          ) : calculatedPrice > 0 ? (
            <div className="space-y-6">
              {/* Main Price */}
              <div className="text-center p-6 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
                <div className="text-4xl font-bold text-primary mb-2">
                  ${calculatedPrice.toFixed(2)}
                </div>
                <div className="text-muted-foreground">
                  {priceBreakdown.tierInfo}
                </div>
              </div>

              {/* Service Summary */}
              <div className="space-y-3 mb-6">
                <h4 className="font-semibold text-foreground">Service Details</h4>
                <div className="space-y-2">
                  <div className="text-lg font-medium text-foreground">
                    {pricingData.serviceType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - {pricingData.cleaningType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Cleaning
                  </div>
                  <div className="text-muted-foreground">
                    {pricingData.frequency?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} • {priceBreakdown.tierInfo || `${pricingData.squareFootage} sq ft`}
                    {pricingData.serviceType === 'carpet' && priceBreakdown.estimatedRooms && (
                      <span> • ~{priceBreakdown.estimatedRooms} rooms</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Price Breakdown with Math */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Price Breakdown</h4>
                
                {priceBreakdown.hasDeepCleanDiscount && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Original Deep Clean Price</span>
                    <span className="font-medium">${(priceBreakdown.basePrice + 75).toFixed(2)}</span>
                  </div>
                )}
                
                {priceBreakdown.hasDeepCleanDiscount && (
                  <div className="flex justify-between items-center py-2 text-green-600">
                    <span>$75 One-Time Deep Cleaning Discount</span>
                    <span>-$75.00</span>
                  </div>
                )}

                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Service Total</span>
                  <span className="font-medium">${priceBreakdown.basePrice?.toFixed(2)}</span>
                </div>

                {priceBreakdown.addOnTotal > 0 && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Additional Services</span>
                    <span className="font-medium">+${priceBreakdown.addOnTotal?.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center py-3 text-lg font-bold border-t-2">
                  <span>Total</span>
                  <span className="text-primary">${calculatedPrice.toFixed(2)}</span>
                </div>
              </div>

              {pricingData.addOns.length > 0 && (
                <div className="mt-3">
                  <div className="text-sm text-muted-foreground mb-2">Add-ons:</div>
                  <div className="space-y-1">
                    {pricingData.addOns.map(addOn => (
                      <Badge key={addOn} variant="secondary" className="mr-2">
                        {addOn.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* This section is now handled by PaymentForm component */}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Calculator className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Complete the form to see your instant quote</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}