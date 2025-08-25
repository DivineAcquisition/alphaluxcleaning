import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Home, Building, Sparkles, RefreshCw, Star, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceSelectionProps {
  selectedHomeSize?: string;
  selectedFrequency?: string;
  onHomeSizeSelect: (size: string) => void;
  onFrequencySelect: (frequency: string) => void;
  pricing: { [key: string]: number };
  originalPricing: { [key: string]: number };
  offerEligible: boolean;
}

const homeSizes = [
  {
    value: 'under-1000',
    label: 'Under 1,000 sq ft',
    icon: Home,
    description: 'Cozy homes and apartments',
    bedrooms: '1-2 bedrooms',
  },
  {
    value: '1001-1400',
    label: '1,001-1,400 sq ft',
    icon: Home,
    description: 'Small to medium homes',
    bedrooms: '2-3 bedrooms',
    popular: true
  },
  {
    value: '1401-1800',
    label: '1,401-1,800 sq ft',
    icon: Home,
    description: 'Medium sized homes',
    bedrooms: '3-4 bedrooms',
  },
  {
    value: '1801-2400',
    label: '1,801-2,400 sq ft',
    icon: Home,
    description: 'Large family homes',
    bedrooms: '4-5 bedrooms',
  },
  {
    value: '2401-2800',
    label: '2,401-2,800 sq ft',
    icon: Building,
    description: 'Very large homes',
    bedrooms: '5+ bedrooms',
  },
  {
    value: '2801+',
    label: '2,801+ sq ft',
    icon: Building,
    description: 'Custom estate',
    bedrooms: 'Estate homes',
    premium: true
  }
];

const frequencyOptions = [
  {
    value: 'one-time',
    label: 'One-Time Service',
    icon: Sparkles,
    priceKey: 'oneTime',
    description: 'Perfect for special occasions',
    badge: null
  },
  {
    value: 'bi-weekly',
    label: 'Every Other Week',
    icon: RefreshCw,
    priceKey: 'biweekly',
    description: 'Most popular choice',
    badge: 'Most Popular'
  },
  {
    value: 'monthly',
    label: 'Monthly Service',
    icon: RefreshCw,
    priceKey: 'monthly',
    description: 'Consistent maintenance',
    badge: null
  },
  {
    value: 'deep-clean',
    label: 'Ultimate Deep Clean',
    icon: Star,
    priceKey: 'deepClean',
    description: 'Premium deep cleaning',
    badge: 'Recommended'
  }
];

export function ModernServiceSelection({
  selectedHomeSize,
  selectedFrequency,
  onHomeSizeSelect,
  onFrequencySelect,
  pricing,
  originalPricing,
  offerEligible
}: ServiceSelectionProps) {
  const calculateSavings = (priceKey: string) => {
    if (!offerEligible) return 0;
    const original = originalPricing[priceKey] || 0;
    const current = pricing[priceKey] || 0;
    return Math.round((original - current) * 100) / 100;
  };

  return (
    <div className="space-y-8">
      {/* Home Size Selection */}
      <Card className="border-2 border-muted/50 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Home className="h-5 w-5 text-primary" />
            Select Your Home Size
          </CardTitle>
          <p className="text-muted-foreground">Choose the option that best describes your home</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {homeSizes.map((size) => {
              const Icon = size.icon;
              const isSelected = selectedHomeSize === size.value;
              
              return (
                <Button
                  key={size.value}
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
                    "h-auto p-4 flex-col items-start text-left relative transition-all duration-200",
                    isSelected && "ring-2 ring-primary ring-offset-2",
                    !isSelected && "hover:border-primary/50 hover:shadow-md"
                  )}
                  onClick={() => onHomeSizeSelect(size.value)}
                >
                  {size.popular && (
                    <Badge className="absolute -top-2 left-2 bg-gradient-to-r from-primary to-primary/80">
                      Most Popular
                    </Badge>
                  )}
                  {size.premium && (
                    <Badge className="absolute -top-2 left-2 bg-gradient-to-r from-amber-500 to-amber-600">
                      Premium
                    </Badge>
                  )}
                  
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={cn("h-5 w-5", isSelected ? "text-primary-foreground" : "text-primary")} />
                    {isSelected && <Check className="h-4 w-4 text-primary-foreground ml-auto" />}
                  </div>
                  
                  <div className="space-y-1">
                    <div className={cn("font-semibold", isSelected ? "text-primary-foreground" : "text-foreground")}>
                      {size.label}
                    </div>
                    <div className={cn("text-sm", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                      {size.description}
                    </div>
                    <div className={cn("text-xs", isSelected ? "text-primary-foreground/70" : "text-muted-foreground")}>
                      {size.bedrooms}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Frequency Selection */}
      {selectedHomeSize && (
        <Card className="border-2 border-muted/50 shadow-lg animate-fade-in">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <RefreshCw className="h-5 w-5 text-primary" />
              Choose Service Frequency
            </CardTitle>
            <p className="text-muted-foreground">Select how often you'd like cleaning service</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {frequencyOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedFrequency === option.value;
                const price = pricing[option.priceKey] || 0;
                const originalPrice = originalPricing[option.priceKey] || 0;
                const savings = calculateSavings(option.priceKey);
                
                return (
                  <Button
                    key={option.value}
                    variant={isSelected ? "default" : "outline"}
                    className={cn(
                      "h-auto p-6 flex-col items-start text-left relative transition-all duration-200",
                      isSelected && "ring-2 ring-primary ring-offset-2",
                      !isSelected && "hover:border-primary/50 hover:shadow-md"
                    )}
                    onClick={() => onFrequencySelect(option.value)}
                  >
                    {option.badge && (
                      <Badge className={cn(
                        "absolute -top-2 left-2",
                        option.badge === 'Most Popular' && "bg-gradient-to-r from-primary to-primary/80",
                        option.badge === 'Recommended' && "bg-gradient-to-r from-amber-500 to-amber-600"
                      )}>
                        {option.badge}
                      </Badge>
                    )}
                    
                    <div className="flex items-center justify-between w-full mb-3">
                      <div className="flex items-center gap-2">
                        <Icon className={cn("h-5 w-5", isSelected ? "text-primary-foreground" : "text-primary")} />
                        <span className={cn("font-semibold", isSelected ? "text-primary-foreground" : "text-foreground")}>
                          {option.label}
                        </span>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary-foreground" />}
                    </div>
                    
                    <p className={cn("text-sm mb-3", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                      {option.description}
                    </p>
                    
                    <div className="space-y-1">
                      {savings > 0 && (
                        <div className="flex items-center gap-2">
                          <span className={cn("text-lg font-bold", isSelected ? "text-primary-foreground" : "text-foreground")}>
                            ${price}
                          </span>
                          <span className={cn("text-sm line-through", isSelected ? "text-primary-foreground/60" : "text-muted-foreground")}>
                            ${originalPrice}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            Save ${savings}
                          </Badge>
                        </div>
                      )}
                      {savings === 0 && price > 0 && (
                        <span className={cn("text-lg font-bold", isSelected ? "text-primary-foreground" : "text-foreground")}>
                          ${price}
                        </span>
                      )}
                      {price === 0 && (
                        <span className={cn("text-sm", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                          Custom Quote Required
                        </span>
                      )}
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}