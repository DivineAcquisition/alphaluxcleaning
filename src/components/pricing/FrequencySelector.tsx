import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DEFAULT_PRICING_CONFIG, type FrequencyConfig } from '@/lib/new-pricing-system';
import { Calendar, Clock, RefreshCw, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FrequencySelectorProps {
  selectedId?: string;
  onSelect: (frequencyId: string) => void;
  className?: string;
}

const frequencyIcons = {
  one_time: Timer,
  weekly: Calendar,
  bi_weekly: RefreshCw,
  monthly: Clock
};

export function FrequencySelector({ selectedId, onSelect, className }: FrequencySelectorProps) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4", className)}>
      {DEFAULT_PRICING_CONFIG.frequencies.map((frequency) => (
        <FrequencyCard
          key={frequency.id}
          frequency={frequency}
          isSelected={selectedId === frequency.id}
          onSelect={() => onSelect(frequency.id)}
        />
      ))}
    </div>
  );
}

interface FrequencyCardProps {
  frequency: FrequencyConfig;
  isSelected: boolean;
  onSelect: () => void;
}

function FrequencyCard({ frequency, isSelected, onSelect }: FrequencyCardProps) {
  const Icon = frequencyIcons[frequency.id as keyof typeof frequencyIcons] || Timer;
  
  // Display recurring info for recurring frequencies
  const frequencyInfo = frequency.cleansPerMonth 
    ? `${frequency.cleansPerMonth}x per month`
    : 'Single service';

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md border-2 touch-manipulation",
        isSelected 
          ? "border-[#0F77CC] bg-[#0F77CC]/5 shadow-md" 
          : "border-border hover:border-[#0F77CC]/50"
      )}
      onClick={onSelect}
    >
      <CardContent className="p-4 md:p-6">
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center justify-between">
            <Icon className={cn(
              "h-6 w-6 md:h-5 md:w-5",
              isSelected ? "text-[#0F77CC]" : "text-muted-foreground"
            )} />
            
            {isSelected && (
              <div className="w-2 h-2 rounded-full bg-[#0F77CC]" />
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className={cn(
              "font-medium text-sm md:text-base",
              isSelected ? "text-[#0F77CC]" : "text-foreground"
            )}>
              {frequency.name}
            </h3>
            
            <Badge 
              variant="secondary"
              className="text-[10px] md:text-xs"
            >
              {frequencyInfo}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}