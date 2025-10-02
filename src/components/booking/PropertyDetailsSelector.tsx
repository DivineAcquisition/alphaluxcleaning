import React from 'react';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
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
        <span className="font-semibold text-white">{label}</span>
      </div>
      
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="mobile-touch-target w-12 h-12 rounded-full bg-white/20 border-white/30 hover:bg-white/30 text-white"
          onClick={decrement}
          disabled={currentValue <= min}
        >
          <Minus className="h-4 w-4" />
        </Button>
        
        <div className="w-20 h-20 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center backdrop-blur-sm animate-glow-pulse">
          <span className="text-3xl font-bold text-white">{currentValue}</span>
        </div>
        
        <Button
          variant="outline"
          size="icon"
          className="mobile-touch-target w-12 h-12 rounded-full bg-white/20 border-white/30 hover:bg-white/30 text-white"
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
      <GlassCard variant="gradient-blue" className="animate-scale-in">
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2 text-white">
            <Home className="h-6 w-6" />
            Property Details
          </GlassCardTitle>
          <p className="text-sm text-white/90">
            Tell us about your space for accurate pricing
          </p>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <CountSelector
              label="Bedrooms"
              value={bedrooms}
              onChange={onBedroomsChange}
              min={1}
              max={6}
              icon={<Bed className="h-5 w-5 text-white" />}
            />
            
            <CountSelector
              label="Bathrooms"
              value={bathrooms}
              onChange={onBathroomsChange}
              min={1}
              max={6}
              icon={<Bath className="h-5 w-5 text-white" />}
            />
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Flooring Type */}
      <GlassCard className="animate-scale-in" style={{ animationDelay: '0.1s' }}>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <div className="w-6 h-6 text-2xl">🏠</div>
            Flooring Type
          </GlassCardTitle>
          <p className="text-sm text-muted-foreground">
            Select your primary flooring type (you can select multiple)
          </p>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {flooringOptions.map((option) => {
              const isSelected = flooringType.includes(option.id);
              
              return (
                <GlassCard
                  key={option.id}
                  variant={isSelected ? "gradient-mint" : "default"}
                  className={cn(
                    "cursor-pointer transition-all duration-300 mobile-touch-target hover:scale-105",
                    isSelected && "ring-2 ring-primary/50 shadow-xl"
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
                  <GlassCardContent className="p-4 text-center">
                    <div className="text-3xl mb-2">{option.icon}</div>
                    <div className={cn(
                      "font-semibold text-sm",
                      isSelected ? "text-white" : "text-foreground"
                    )}>
                      {option.name}
                    </div>
                    {isSelected && (
                      <Badge className="mt-2 bg-white/20 text-white border-white/30">
                        Selected
                      </Badge>
                    )}
                  </GlassCardContent>
                </GlassCard>
              );
            })}
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Dwelling Type */}
      <GlassCard className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Building className="h-6 w-6 text-primary" />
            Dwelling Type
          </GlassCardTitle>
          <p className="text-sm text-muted-foreground">
            What type of property do you live in?
          </p>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {dwellingOptions.map((option) => {
              const isSelected = dwellingType === option.id;
              
              return (
                <GlassCard
                  key={option.id}
                  variant={isSelected ? "gradient-coral" : "default"}
                  className={cn(
                    "cursor-pointer transition-all duration-300 mobile-touch-target hover:scale-105",
                    isSelected && "ring-2 ring-primary/50 shadow-xl"
                  )}
                  onClick={() => onDwellingTypeChange(option.id)}
                >
                  <GlassCardContent className="p-4 text-center">
                    <div className="text-4xl mb-2">{option.icon}</div>
                    <div className={cn(
                      "font-semibold",
                      isSelected ? "text-white" : "text-foreground"
                    )}>
                      {option.name}
                    </div>
                    {isSelected && (
                      <Badge className="mt-2 bg-white/20 text-white border-white/30">
                        Selected
                      </Badge>
                    )}
                  </GlassCardContent>
                </GlassCard>
              );
            })}
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}