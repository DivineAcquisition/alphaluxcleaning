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

const servicePrices = {
  residential: {
    basic: 0.15,
    deep: 0.25,
    moveout: 0.35
  },
  commercial: {
    basic: 0.12,
    deep: 0.20,
    moveout: 0.30
  },
  office: {
    basic: 0.10,
    deep: 0.18,
    moveout: 0.25
  }
};

const frequencyMultipliers = {
  one_time: 1.0,
  weekly: 0.85,
  biweekly: 0.90,
  monthly: 0.95
};

const addOnPrices = {
  inside_fridge: 25,
  inside_oven: 20,
  inside_cabinets: 30,
  garage: 40,
  basement: 35,
  windows: 50
};

export function PricingCalculator() {
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
    if (!pricingData.serviceType || !pricingData.cleaningType || !pricingData.frequency) {
      setCalculatedPrice(0);
      return;
    }

    const baseRate = servicePrices[pricingData.serviceType as keyof typeof servicePrices]?.[pricingData.cleaningType as keyof typeof servicePrices.residential] || 0;
    const basePrice = pricingData.squareFootage * baseRate;
    const frequencyMultiplier = frequencyMultipliers[pricingData.frequency as keyof typeof frequencyMultipliers];
    const adjustedPrice = basePrice * frequencyMultiplier;
    
    const addOnTotal = pricingData.addOns.reduce((total, addOn) => {
      return total + (addOnPrices[addOn as keyof typeof addOnPrices] || 0);
    }, 0);

    const finalPrice = adjustedPrice + addOnTotal;
    
    setPriceBreakdown({
      basePrice: basePrice,
      frequencyDiscount: basePrice - adjustedPrice,
      addOnTotal: addOnTotal,
      finalPrice: finalPrice
    });
    
    setCalculatedPrice(finalPrice);
  };

  useEffect(() => {
    calculatePrice();
  }, [pricingData]);

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

          {/* Service Type */}
          <div className="space-y-2">
            <Label>Property Type</Label>
            <Select value={pricingData.serviceType} onValueChange={(value) => 
              setPricingData(prev => ({ ...prev, serviceType: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Select property type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="residential">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Residential Home
                  </div>
                </SelectItem>
                <SelectItem value="commercial">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Commercial Space
                  </div>
                </SelectItem>
                <SelectItem value="office">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Office Building
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
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
                <SelectItem value="basic">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Basic Cleaning
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
                    Weekly (15% discount)
                  </div>
                </SelectItem>
                <SelectItem value="biweekly">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Bi-weekly (10% discount)
                  </div>
                </SelectItem>
                <SelectItem value="monthly">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Monthly (5% discount)
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
          {calculatedPrice > 0 ? (
            <div className="space-y-6">
              {/* Main Price */}
              <div className="text-center p-6 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
                <div className="text-4xl font-bold text-primary mb-2">
                  ${calculatedPrice.toFixed(2)}
                </div>
                <div className="text-muted-foreground">
                  Total estimated cost
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Price Breakdown</h4>
                
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Base cleaning service</span>
                  <span className="font-medium">${priceBreakdown.basePrice?.toFixed(2)}</span>
                </div>

                {priceBreakdown.frequencyDiscount > 0 && (
                  <div className="flex justify-between items-center py-2 border-b text-success">
                    <span>Frequency discount</span>
                    <span className="font-medium">-${priceBreakdown.frequencyDiscount?.toFixed(2)}</span>
                  </div>
                )}

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
                    {pricingData.serviceType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
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

              {/* CTA Button */}
              <Button className="w-full" size="lg">
                Book This Service
              </Button>
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