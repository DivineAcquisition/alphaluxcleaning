import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Minus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddOnsSectionProps {
  selectedAddOns: string[];
  onToggleAddOn: (addOnValue: string) => void;
  visible?: boolean;
}

const addOns = [
  { 
    value: 'fridge', 
    label: 'Inside Refrigerator', 
    price: 35,
    description: 'Deep clean inside your refrigerator',
    popular: false
  },
  { 
    value: 'oven', 
    label: 'Inside Oven', 
    price: 35,
    description: 'Professional oven interior cleaning',
    popular: true
  },
  { 
    value: 'baseboards', 
    label: 'Whole Home Baseboards', 
    price: 50,
    description: 'Clean all baseboards throughout home',
    popular: true
  },
  { 
    value: 'cabinet-fronts', 
    label: 'Cabinet Front Cleaning', 
    price: 50,
    description: 'Wipe down all cabinet fronts',
    popular: false
  },
  { 
    value: 'blinds', 
    label: 'Detailed Blind Cleaning', 
    price: 15,
    description: 'Clean window blinds and shades',
    popular: false
  },
  { 
    value: 'wall-washing', 
    label: 'Wall Washing', 
    price: 25,
    description: 'Spot clean walls and surfaces',
    popular: false
  },
  { 
    value: 'laundry', 
    label: 'Extra Laundry Folding', 
    price: 20,
    description: 'Fold and organize clean laundry',
    popular: false
  },
  { 
    value: 'garage', 
    label: 'Garage Sweeping', 
    price: 30,
    description: 'Sweep and tidy garage area',
    popular: false
  }
];

export function ModernAddOnsSection({ 
  selectedAddOns, 
  onToggleAddOn, 
  visible = true 
}: AddOnsSectionProps) {
  if (!visible) return null;

  const totalAddOnPrice = selectedAddOns.reduce((total, addOn) => {
    const addOnItem = addOns.find(a => a.value === addOn);
    return total + (addOnItem?.price || 0);
  }, 0);

  const popularAddOns = addOns.filter(addon => addon.popular);
  const otherAddOns = addOns.filter(addon => !addon.popular);

  return (
    <Card className="border-2 border-muted/50 shadow-lg animate-fade-in">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            Add-On Services
          </CardTitle>
          {totalAddOnPrice > 0 && (
            <Badge variant="secondary" className="text-sm font-semibold">
              +${totalAddOnPrice} total
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          Enhance your cleaning with these optional services
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Popular Add-ons */}
        {popularAddOns.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-primary mb-3 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Popular Add-ons
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {popularAddOns.map((addOn) => {
                const isSelected = selectedAddOns.includes(addOn.value);
                
                return (
                  <div
                    key={addOn.value}
                    className={cn(
                      "relative p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer",
                      isSelected 
                        ? "border-primary bg-primary/5 shadow-md" 
                        : "border-muted hover:border-primary/50 hover:shadow-sm"
                    )}
                    onClick={() => onToggleAddOn(addOn.value)}
                  >
                    <Badge className="absolute -top-2 left-2 bg-gradient-to-r from-primary to-primary/80 text-xs">
                      Popular
                    </Badge>
                    
                    <div className="flex items-start justify-between pt-2">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={addOn.value} className="font-semibold cursor-pointer">
                            {addOn.label}
                          </Label>
                          <span className="text-primary font-bold">
                            +${addOn.price}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {addOn.description}
                        </p>
                      </div>
                      <Switch
                        id={addOn.value}
                        checked={isSelected}
                        onCheckedChange={() => onToggleAddOn(addOn.value)}
                        className="ml-3"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Other Add-ons */}
        {otherAddOns.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Additional Services
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {otherAddOns.map((addOn) => {
                const isSelected = selectedAddOns.includes(addOn.value);
                
                return (
                  <div
                    key={addOn.value}
                    className={cn(
                      "relative p-4 rounded-lg border transition-all duration-200 cursor-pointer",
                      isSelected 
                        ? "border-primary bg-primary/5 shadow-sm" 
                        : "border-muted hover:border-muted-foreground/50"
                    )}
                    onClick={() => onToggleAddOn(addOn.value)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={addOn.value} className="font-semibold cursor-pointer text-sm">
                            {addOn.label}
                          </Label>
                          <span className="text-primary font-bold text-sm">
                            +${addOn.price}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {addOn.description}
                        </p>
                      </div>
                      <Switch
                        id={addOn.value}
                        checked={isSelected}
                        onCheckedChange={() => onToggleAddOn(addOn.value)}
                        className="ml-3"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No add-ons selected message */}
        {selectedAddOns.length === 0 && (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">
              No add-ons selected. Your standard cleaning includes everything you need!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
