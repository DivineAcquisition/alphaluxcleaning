import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Home, Bath, Bed, Building } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PropertyDetailsSelectorProps {
  bedrooms: string;
  bathrooms: string;
  dwellingType: string;
  flooringType: string;
  onBedroomsChange: (value: string) => void;
  onBathroomsChange: (value: string) => void;
  onDwellingTypeChange: (value: string) => void;
  onFlooringTypeChange: (value: string) => void;
}

const flooringOptions = [
  { id: 'hardwood', name: 'Hardwood', icon: '🪵' },
  { id: 'carpet', name: 'Carpet', icon: '🪣' },
  { id: 'tile', name: 'Tile', icon: '🏺' },
  { id: 'laminate', name: 'Laminate', icon: '📋' },
  { id: 'mixed', name: 'Mixed', icon: '🔄' }
];

const dwellingOptions = [
  { id: 'house', name: 'House', icon: '🏠' },
  { id: 'apartment', name: 'Apartment', icon: '🏢' },
  { id: 'condo', name: 'Condo', icon: '🏛️' },
  { id: 'townhouse', name: 'Townhouse', icon: '🏘️' }
];

interface CountSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min: number;
  max: number;
  icon: React.ReactNode;
}

function CountSelector({ label, value, onChange, min, max, icon }: CountSelectorProps) {
  const currentValue = parseInt(value) || min;
  
  const increment = () => {
    if (currentValue < max) {
      onChange((currentValue + 1).toString());
    }
  };
  
  const decrement = () => {
    if (currentValue > min) {
      onChange((currentValue - 1).toString());
    }
  };
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 justify-center">
        {icon}
        <span className="font-medium text-foreground">{label}</span>
      </div>
      
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="mobile-touch-target w-12 h-12 rounded-full"
          onClick={decrement}
          disabled={currentValue <= min}
        >
          <Minus className="h-4 w-4" />
        </Button>
        
        <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
          <span className="text-2xl font-bold text-primary">{currentValue}</span>
        </div>
        
        <Button
          variant="outline"
          size="icon"
          className="mobile-touch-target w-12 h-12 rounded-full"
          onClick={increment}
          disabled={currentValue >= max}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function PropertyDetailsSelector({
  bedrooms,
  bathrooms,
  dwellingType,
  flooringType,
  onBedroomsChange,
  onBathroomsChange,
  onDwellingTypeChange,
  onFlooringTypeChange
}: PropertyDetailsSelectorProps) {
  return (
    <div className="space-y-6">
      {/* Bedroom and Bathroom Count */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            Property Details
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Tell us about your space for accurate pricing
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <CountSelector
              label="Bedrooms"
              value={bedrooms}
              onChange={onBedroomsChange}
              min={1}
              max={6}
              icon={<Bed className="h-5 w-5 text-primary" />}
            />
            
            <CountSelector
              label="Bathrooms"
              value={bathrooms}
              onChange={onBathroomsChange}
              min={1}
              max={6}
              icon={<Bath className="h-5 w-5 text-primary" />}
            />
          </div>
        </CardContent>
      </Card>

      {/* Flooring Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-5 h-5 text-primary">🏠</div>
            Flooring Type
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Select your primary flooring type (you can select multiple)
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {flooringOptions.map((option) => {
              const isSelected = flooringType.includes(option.id);
              
              return (
                <Card
                  key={option.id}
                  className={cn(
                    "cursor-pointer border-2 transition-all duration-200 mobile-touch-target",
                    isSelected
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-border hover:border-primary/50 hover:bg-primary/5"
                  )}
                  onClick={() => {
                    // Toggle selection for multi-select
                    const currentTypes = flooringType.split(',').filter(Boolean);
                    if (isSelected) {
                      const newTypes = currentTypes.filter(t => t !== option.id);
                      onFlooringTypeChange(newTypes.join(','));
                    } else {
                      onFlooringTypeChange([...currentTypes, option.id].join(','));
                    }
                  }}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl mb-2">{option.icon}</div>
                    <div className={cn(
                      "font-medium text-sm",
                      isSelected ? "text-primary" : "text-foreground"
                    )}>
                      {option.name}
                    </div>
                    {isSelected && (
                      <Badge className="mt-2 bg-primary/20 text-primary border-primary/30" variant="outline">
                        Selected
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dwelling Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            Dwelling Type
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            What type of property do you live in?
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {dwellingOptions.map((option) => {
              const isSelected = dwellingType === option.id;
              
              return (
                <Card
                  key={option.id}
                  className={cn(
                    "cursor-pointer border-2 transition-all duration-200 mobile-touch-target",
                    isSelected
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-border hover:border-primary/50 hover:bg-primary/5"
                  )}
                  onClick={() => onDwellingTypeChange(option.id)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl mb-2">{option.icon}</div>
                    <div className={cn(
                      "font-medium",
                      isSelected ? "text-primary" : "text-foreground"
                    )}>
                      {option.name}
                    </div>
                    {isSelected && (
                      <Badge className="mt-2 bg-primary/20 text-primary border-primary/30" variant="outline">
                        Selected
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}