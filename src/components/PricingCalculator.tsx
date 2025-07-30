import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface PricingCalculatorProps {
  onPriceUpdate: (data: any, price: number, breakdown: any) => void;
}

export function PricingCalculator({ onPriceUpdate }: PricingCalculatorProps) {
  const [cleaningType, setCleaningType] = useState("standard");
  const [frequency, setFrequency] = useState("one-time");
  const [squareFootage, setSquareFootage] = useState("");
  const [addOns, setAddOns] = useState<string[]>([]);

  const cleaningTypes = [
    { id: "standard", name: "Standard Clean", basePrice: 80, description: "Regular maintenance cleaning" },
    { id: "deep", name: "Deep Clean", basePrice: 150, description: "Comprehensive deep cleaning" },
    { id: "move", name: "Move In/Out", basePrice: 200, description: "Complete move-in/out cleaning" }
  ];

  const frequencies = [
    { id: "one-time", name: "One-Time", discount: 0 },
    { id: "weekly", name: "Weekly", discount: 0.15 },
    { id: "bi-weekly", name: "Bi-Weekly", discount: 0.10 },
    { id: "monthly", name: "Monthly", discount: 0.05 }
  ];

  const addOnOptions = [
    { id: "oven", name: "Oven Cleaning", price: 25 },
    { id: "fridge", name: "Refrigerator Cleaning", price: 20 },
    { id: "windows", name: "Window Cleaning", price: 30 },
    { id: "garage", name: "Garage Cleaning", price: 40 }
  ];

  const calculatePrice = () => {
    const selectedType = cleaningTypes.find(t => t.id === cleaningType);
    if (!selectedType || !squareFootage) return 0;

    let basePrice = selectedType.basePrice;
    
    // Square footage multiplier
    const sqft = parseInt(squareFootage);
    if (sqft > 2000) {
      basePrice *= 1.5;
    } else if (sqft > 1500) {
      basePrice *= 1.3;
    } else if (sqft > 1000) {
      basePrice *= 1.1;
    }

    // Add-ons
    const addOnPrice = addOns.reduce((total, addOn) => {
      const addon = addOnOptions.find(a => a.id === addOn);
      return total + (addon?.price || 0);
    }, 0);

    // Frequency discount
    const selectedFrequency = frequencies.find(f => f.id === frequency);
    const discount = selectedFrequency?.discount || 0;
    
    const subtotal = basePrice + addOnPrice;
    const finalPrice = subtotal * (1 - discount);

    const breakdown = {
      basePrice,
      addOnPrice,
      discount: subtotal * discount,
      finalPrice
    };

    const data = {
      cleaningType,
      frequency,
      squareFootage,
      addOns
    };

    onPriceUpdate(data, finalPrice, breakdown);
    return finalPrice;
  };

  const handleAddOnToggle = (addOnId: string) => {
    setAddOns(prev => 
      prev.includes(addOnId) 
        ? prev.filter(id => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  const price = calculatePrice();

  return (
    <div className="space-y-6">
      {/* Cleaning Type */}
      <div>
        <Label className="text-base font-semibold mb-3 block">Cleaning Type</Label>
        <RadioGroup value={cleaningType} onValueChange={setCleaningType}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cleaningTypes.map((type) => (
              <div key={type.id} className="relative">
                <RadioGroupItem value={type.id} id={type.id} className="peer sr-only" />
                <Label
                  htmlFor={type.id}
                  className="flex flex-col items-center justify-center p-4 border-2 border-muted rounded-lg cursor-pointer hover:bg-accent peer-checked:border-primary peer-checked:bg-primary/5 transition-all"
                >
                  <span className="font-semibold">{type.name}</span>
                  <span className="text-sm text-muted-foreground">{type.description}</span>
                  <Badge variant="outline" className="mt-2">${type.basePrice}+</Badge>
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>

      {/* Square Footage */}
      <div>
        <Label htmlFor="squareFootage" className="text-base font-semibold mb-3 block">
          Square Footage
        </Label>
        <Input
          id="squareFootage"
          type="number"
          placeholder="Enter square footage"
          value={squareFootage}
          onChange={(e) => setSquareFootage(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Frequency */}
      <div>
        <Label className="text-base font-semibold mb-3 block">Frequency</Label>
        <RadioGroup value={frequency} onValueChange={setFrequency}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {frequencies.map((freq) => (
              <div key={freq.id} className="relative">
                <RadioGroupItem value={freq.id} id={freq.id} className="peer sr-only" />
                <Label
                  htmlFor={freq.id}
                  className="flex flex-col items-center justify-center p-4 border-2 border-muted rounded-lg cursor-pointer hover:bg-accent peer-checked:border-primary peer-checked:bg-primary/5 transition-all"
                >
                  <span className="font-semibold">{freq.name}</span>
                  {freq.discount > 0 && (
                    <Badge variant="secondary" className="mt-1">
                      {Math.round(freq.discount * 100)}% OFF
                    </Badge>
                  )}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>

      {/* Add-ons */}
      <div>
        <Label className="text-base font-semibold mb-3 block">Add-on Services</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {addOnOptions.map((addon) => (
            <div key={addon.id} className="flex items-center space-x-3 p-3 border rounded-lg">
              <Checkbox
                id={addon.id}
                checked={addOns.includes(addon.id)}
                onCheckedChange={() => handleAddOnToggle(addon.id)}
              />
              <Label htmlFor={addon.id} className="flex-1 cursor-pointer">
                <span className="font-medium">{addon.name}</span>
                <span className="text-muted-foreground ml-2">+${addon.price}</span>
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Display */}
      {price > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-center">Estimated Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">${Math.round(price)}</div>
              <p className="text-sm text-muted-foreground mt-2">
                Final price may vary based on actual conditions
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}