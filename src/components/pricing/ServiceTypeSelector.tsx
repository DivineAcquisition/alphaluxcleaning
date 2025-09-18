import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DEFAULT_PRICING_CONFIG, type ServiceTypeConfig } from '@/lib/new-pricing-system';
import { Sparkles, Home, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceTypeSelectorProps {
  selectedId?: string;
  onSelect: (serviceTypeId: string) => void;
  className?: string;
}

const serviceIcons = {
  standard: Home,
  deep: Sparkles,
  move_in_out: ArrowRightLeft
};

export function ServiceTypeSelector({ selectedId, onSelect, className }: ServiceTypeSelectorProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
      {DEFAULT_PRICING_CONFIG.serviceTypes.map((serviceType) => (
        <ServiceTypeCard
          key={serviceType.id}
          serviceType={serviceType}
          isSelected={selectedId === serviceType.id}
          onSelect={() => onSelect(serviceType.id)}
        />
      ))}
    </div>
  );
}

interface ServiceTypeCardProps {
  serviceType: ServiceTypeConfig;
  isSelected: boolean;
  onSelect: () => void;
}

function ServiceTypeCard({ serviceType, isSelected, onSelect }: ServiceTypeCardProps) {
  const Icon = serviceIcons[serviceType.id as keyof typeof serviceIcons] || Home;
  const multiplierText = serviceType.multiplier === 1.0 
    ? 'Base Price' 
    : `+${Math.round((serviceType.multiplier - 1) * 100)}%`;

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
              "h-6 w-6",
              isSelected ? "text-[#ECC98B]" : "text-muted-foreground"
            )} />
            
            {isSelected && (
              <div className="w-2 h-2 rounded-full bg-[#ECC98B]" />
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className={cn(
              "font-semibold text-lg",
              isSelected ? "text-[#ECC98B]" : "text-foreground"
            )}>
              {serviceType.name}
            </h3>
            
            <Badge 
              variant={isSelected ? "default" : "secondary"}
              className={cn(
                "text-xs",
                isSelected && "bg-[#ECC98B] text-[#ECC98B]-foreground hover:bg-[#ECC98B]/80"
              )}
            >
              {multiplierText}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}