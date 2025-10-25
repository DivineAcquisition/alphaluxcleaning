import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { HOME_SIZE_RANGES, type HomeSizeRange } from '@/lib/new-pricing-system';
import { Phone, Ruler } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HomeSizeGridProps {
  selectedId?: string;
  customSqFt?: number;
  onSelect: (homeSizeId: string) => void;
  onCustomSqFtChange?: (sqft: number | null) => void;
  className?: string;
}

export function HomeSizeGrid({ selectedId, customSqFt, onSelect, onCustomSqFtChange, className }: HomeSizeGridProps) {
  const [showCustomInput, setShowCustomInput] = useState(!!customSqFt);
  const [customValue, setCustomValue] = useState(customSqFt?.toString() || '');

  const handleCustomSqFtToggle = () => {
    const newState = !showCustomInput;
    setShowCustomInput(newState);
    if (!newState) {
      setCustomValue('');
      onCustomSqFtChange?.(null);
    }
  };

  const handleCustomSqFtChange = (value: string) => {
    setCustomValue(value);
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 500 && numValue <= 10000) {
      onCustomSqFtChange?.(numValue);
    } else if (value === '') {
      onCustomSqFtChange?.(null);
    }
  };

  const handleRangeSelect = (rangeId: string) => {
    onSelect(rangeId);
    setShowCustomInput(false);
    setCustomValue('');
    onCustomSqFtChange?.(null);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Custom Square Footage Toggle */}
      {onCustomSqFtChange && (
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardContent className="p-3 md:p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-medium">I know my exact square footage</Label>
                </div>
                <Button
                  variant={showCustomInput ? "default" : "outline"}
                  size="sm"
                  onClick={handleCustomSqFtToggle}
                >
                  {showCustomInput ? 'Use Ranges' : 'Enter Exact'}
                </Button>
              </div>
              
              {showCustomInput && (
                <div className="space-y-2">
                  <Input
                    type="number"
                    min="500"
                    max="10000"
                    value={customValue}
                    onChange={(e) => handleCustomSqFtChange(e.target.value)}
                    placeholder="Enter square footage (500-10,000)"
                    className="text-center"
                    autoFocus
                  />
                  <p className="text-xs text-center text-muted-foreground">
                    More accurate pricing based on your exact square footage
                  </p>
                  {customValue && (parseInt(customValue) < 500 || parseInt(customValue) > 10000) && (
                    <p className="text-xs text-center text-destructive">
                      Please enter a value between 500 and 10,000 sq ft
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Home Size Range Grid */}
      {!showCustomInput && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {HOME_SIZE_RANGES.map((range) => (
            <HomeSizeCard
              key={range.id}
              range={range}
              isSelected={selectedId === range.id}
              onSelect={() => handleRangeSelect(range.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface HomeSizeCardProps {
  range: HomeSizeRange;
  isSelected: boolean;
  onSelect: () => void;
}

function HomeSizeCard({ range, isSelected, onSelect }: HomeSizeCardProps) {
  if (range.requiresEstimate) {
    return (
      <Card className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md border-2",
        "border-border bg-card text-card-foreground"
      )}>
        <CardContent className="p-4 md:p-6">
          <div className="text-center space-y-2 md:space-y-3">
            <div className="space-y-1">
              <h3 className="font-semibold text-base md:text-lg text-foreground">
                {range.label}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                {range.bedroomRange}
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-2 p-3 bg-primary/10 rounded-lg">
              <Phone className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Call Required
              </span>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Large homes require personalized estimates
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md border-2 touch-manipulation",
        isSelected 
          ? "border-[#ECC98B] bg-[#ECC98B]/5 shadow-md" 
          : "border-border hover:border-[#ECC98B]/50"
      )}
      onClick={onSelect}
    >
      <CardContent className="p-4 md:p-6">
        <div className="space-y-2 md:space-y-3">
          <div className="space-y-1">
            <h3 className={cn(
              "font-semibold text-base md:text-lg",
              isSelected ? "text-[#ECC98B]" : "text-foreground"
            )}>
              {range.label}
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              {range.bedroomRange}
            </p>
          </div>
          
          <div className="flex items-center justify-end">
            {isSelected && (
              <div className="w-2 h-2 rounded-full bg-[#ECC98B]" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}