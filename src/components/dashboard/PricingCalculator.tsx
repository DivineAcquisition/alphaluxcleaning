import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, Home, Building, Star, Clock } from "lucide-react";

interface PricingData {
  squareFootage: number;
  serviceType: string;
  cleaningType: string;
  frequency: string;
  addOns: string[];
}

interface PricingCalculatorProps {
  onPriceUpdate?: (data: PricingData, price: number, breakdown: any) => void;
}

// Bay Area Cleaning Pros pricing structure (reduced by 10%)
const pricingTiers = [
  { min: 0, max: 1000, weekly: 87.75, biweekly: 106.73, monthly: 154.13, oneTime: 202.78, deepClean: 274.55 },
  { min: 1001, max: 1400, weekly: 104.35, biweekly: 113.02, monthly: 167.93, oneTime: 211.58, deepClean: 294.99 },
  { min: 1401, max: 1800, weekly: 113.10, biweekly: 126.05, monthly: 203.16, oneTime: 229.74, deepClean: 320.35 },
  { min: 1801, max: 2400, weekly: 119.53, biweekly: 135.14, monthly: 211.38, oneTime: 238.87, deepClean: 346.62 },
  { min: 2401, max: 2800, weekly: 142.43, biweekly: 157.63, monthly: 221.18, oneTime: 256.75, deepClean: 364.51 },
  { min: 2801, max: 3300, weekly: 151.86, biweekly: 169.76, monthly: 259.13, oneTime: 267.71, deepClean: 413.24 },
  { min: 3301, max: 3900, weekly: 160.94, biweekly: 177.85, monthly: 277.03, oneTime: 311.71, deepClean: 430.55 },
  { min: 3901, max: 4500, weekly: 193.76, biweekly: 208.42, monthly: 331.82, oneTime: 340.80, deepClean: 461.34 },
  { min: 4501, max: 5100, weekly: 205.70, biweekly: 217.85, monthly: 385.35, oneTime: 415.23, deepClean: 507.82 }
];

const addOnPrices = {
  inside_fridge: 25,
  inside_oven: 20,
  inside_cabinets: 30,
  garage: 40,
  basement: 35,
  windows: 50
};

export function PricingCalculator({ onPriceUpdate }: PricingCalculatorProps = {}) {
  const [pricingData, setPricingData] = useState<PricingData>({
    squareFootage: 1000,
    serviceType: "",
    cleaningType: "",
    frequency: "",
    addOns: []
  });

  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);
  const [priceBreakdown, setPriceBreakdown] = useState<any>({});

  const calculatePrice = () => {
    if (!pricingData.cleaningType || !pricingData.frequency) {
      setCalculatedPrice(0);
      return;
    }

    // Handle homes over 5100 sq ft
    if (pricingData.squareFootage > 5100) {
      setCalculatedPrice(0);
      setPriceBreakdown({
        requiresEstimate: true
      });
      return;
    }

    // Find the appropriate pricing tier
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

    // Adjust for deep clean/move out
    if (cleaningType === 'deep' || cleaningType === 'moveout') {
      basePrice = tier.deepClean;
    }
    
    const addOnTotal = pricingData.addOns.reduce((total, addOn) => {
      return total + (addOnPrices[addOn as keyof typeof addOnPrices] || 0);
    }, 0);

    const finalPrice = basePrice + addOnTotal;
    
    setPriceBreakdown({
      basePrice: basePrice,
      addOnTotal: addOnTotal,
      finalPrice: finalPrice,
      tierInfo: `${tier.min === 0 ? 'Under' : tier.min}-${tier.max} sq ft`
    });
    
    setCalculatedPrice(finalPrice);
  };

  useEffect(() => {
    calculatePrice();
    if (onPriceUpdate) {
      onPriceUpdate(pricingData, calculatedPrice, priceBreakdown);
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
            Instant Price Calculator
          </CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Get an instant quote for your cleaning service
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Square Footage */}
          <div className="space-y-2">
            <Label htmlFor="squareFootage">Square Footage</Label>
            <Input
              id="squareFootage"
              type="number"
              value={pricingData.squareFootage}
              onChange={(e) => setPricingData(prev => ({
                ...prev,
                squareFootage: parseInt(e.target.value) || 0
              }))}
              className="text-lg"
            />
          </div>


          {/* Cleaning Type */}
          <div className="space-y-2">
            <Label>Cleaning Type</Label>
            <Select value={pricingData.cleaningType} onValueChange={(value) => 
              setPricingData(prev => ({ ...prev, cleaningType: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Select cleaning type" />
              </SelectTrigger>
              <SelectContent>
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
              </SelectContent>
            </Select>
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label>Cleaning Frequency</Label>
            <Select value={pricingData.frequency} onValueChange={(value) => 
              setPricingData(prev => ({ ...prev, frequency: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
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
              </SelectContent>
            </Select>
          </div>

          {/* Add-ons */}
          <div className="space-y-3">
            <Label>Additional Services</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(addOnPrices).map(([key, price]) => (
                <Button
                  key={key}
                  variant={pricingData.addOns.includes(key) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleAddOn(key)}
                  className="justify-start h-auto p-3"
                >
                  <div className="text-left">
                    <div className="font-medium">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div className="text-xs opacity-70">+${price}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
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
              <h3 className="text-xl font-bold text-foreground mb-2">Custom Estimate Required</h3>
              <p className="text-muted-foreground mb-4">
                Homes greater than 5,100 sq ft require an in-person estimate.
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

              {/* Price Breakdown */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Price Breakdown</h4>
                
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Cleaning service</span>
                  <span className="font-medium">${priceBreakdown.basePrice?.toFixed(2)}</span>
                </div>

                {priceBreakdown.addOnTotal > 0 && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Additional services</span>
                    <span className="font-medium">+${priceBreakdown.addOnTotal?.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center py-3 text-lg font-bold border-t-2">
                  <span>Total</span>
                  <span className="text-primary">${calculatedPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Service Summary */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Service Summary</h4>
                <div className="space-y-2">
                  <Badge variant="outline" className="mr-2">
                    {pricingData.squareFootage} sq ft
                  </Badge>
                  <Badge variant="outline" className="mr-2">
                    {pricingData.cleaningType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Cleaning
                  </Badge>
                  <Badge variant="outline">
                    {pricingData.frequency?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
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
              </div>

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