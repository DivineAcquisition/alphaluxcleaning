import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HOME_SIZE_RANGES, type HomeSizeRange } from '@/lib/new-pricing-system';
import { Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HomeSizeGridProps {
  selectedId?: string;
  onSelect: (homeSizeId: string) => void;
  className?: string;
}

export function HomeSizeGrid({ selectedId, onSelect, className }: HomeSizeGridProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {HOME_SIZE_RANGES.map((range) => (
        <HomeSizeCard
          key={range.id}
          range={range}
          isSelected={selectedId === range.id}
          onSelect={() => onSelect(range.id)}
        />
      ))}
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
        <CardContent className="p-6">
          <div className="text-center space-y-3">
            <div className="space-y-1">
              <h3 className="font-semibold text-lg text-foreground">
                {range.label}
              </h3>
              <p className="text-sm text-muted-foreground">
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
        "cursor-pointer transition-all duration-200 hover:shadow-md border-2",
        isSelected 
          ? "border-[#ECC98B] bg-[#ECC98B]/5 shadow-md" 
          : "border-border hover:border-[#ECC98B]/50"
      )}
      onClick={onSelect}
    >
      <CardContent className="p-6">
        <div className="space-y-3">
          <div className="space-y-1">
            <h3 className={cn(
              "font-semibold text-lg",
              isSelected ? "text-[#ECC98B]" : "text-foreground"
            )}>
              {range.label}
            </h3>
            <p className="text-sm text-muted-foreground">
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