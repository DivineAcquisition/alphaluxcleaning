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
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
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
  const discountText = frequency.discount === 0 
    ? 'No Discount' 
    : `Save ${Math.round(frequency.discount * 100)}%`;

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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Icon className={cn(
              "h-5 w-5",
              isSelected ? "text-[#ECC98B]" : "text-muted-foreground"
            )} />
            
            {isSelected && (
              <div className="w-2 h-2 rounded-full bg-[#ECC98B]" />
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className={cn(
              "font-medium",
              isSelected ? "text-[#ECC98B]" : "text-foreground"
            )}>
              {frequency.name}
            </h3>
            
            <Badge 
              variant={frequency.discount > 0 ? "default" : "secondary"}
              className={cn(
                "text-xs",
                frequency.discount > 0 && isSelected && "bg-[#ECC98B] text-[#ECC98B]-foreground hover:bg-[#ECC98B]/80",
                frequency.discount > 0 && !isSelected && "bg-green-500 text-white"
              )}
            >
              {discountText}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}