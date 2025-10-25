import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DEFAULT_PRICING_CONFIG, HOME_SIZE_RANGES, type ServiceTypeConfig } from '@/lib/new-pricing-system';
import { Sparkles, Home, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceTypeSelectorProps {
  selectedId?: string;
  onSelect: (serviceTypeId: string) => void;
  className?: string;
}

const serviceIcons = {
  regular: Home,
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
  const recurringText = serviceType.allowsRecurring ? 'One-time & Recurring' : 'One-time only';

  // Get the minimum price for this service type
  const getMinPrice = () => {
    const filteredRanges = HOME_SIZE_RANGES.filter(range => !range.requiresEstimate);
    const prices = filteredRanges.map(range => {
      switch (serviceType.id) {
        case 'regular':
          return range.regularPrice;
        case 'deep':
          return range.deepPrice;
        case 'move_in_out':
          return range.moveInOutPrice;
        default:
          return 0;
      }
    });
    return Math.min(...prices);
  };

  const minPrice = getMinPrice();
  
  // Calculate discounted price
  const discount = serviceType.id === 'regular' ? 0.10 : serviceType.id === 'deep' ? 0.20 : 0;
  const discountedPrice = discount > 0 ? Math.round(minPrice * (1 - discount)) : minPrice;

  return (
    <Card 
      className={cn(
        "relative cursor-pointer transition-all duration-200 hover:shadow-md border-2",
        isSelected 
          ? "border-[#ECC98B] bg-[#ECC98B]/5 shadow-md" 
          : "border-border hover:border-[#ECC98B]/50"
      )}
      onClick={onSelect}
    >
      <CardContent className="p-4 md:p-6">
        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-3 right-3 md:top-4 md:right-4">
            {serviceType.id === 'regular' && (
              <div className="px-2 py-1 rounded-full bg-green-500 text-white text-[10px] md:text-xs font-bold shadow-sm">
                10% OFF
              </div>
            )}
            {serviceType.id === 'deep' && (
              <div className="px-2 py-1 rounded-full bg-[#ECC98B] text-[#1A1F2C] text-[10px] md:text-xs font-bold shadow-sm">
                20% OFF
              </div>
            )}
          </div>
        )}
        
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center justify-between pr-12 md:pr-16">
            <Icon className={cn(
              "h-5 w-5 md:h-6 md:w-6",
              isSelected ? "text-[#ECC98B]" : "text-muted-foreground"
            )} />
            
            {isSelected && (
              <div className="w-2 h-2 rounded-full bg-[#ECC98B]" />
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className={cn(
              "font-semibold text-base md:text-lg",
              isSelected ? "text-[#ECC98B]" : "text-foreground"
            )}>
              {serviceType.name}
            </h3>
            
            <div className="flex flex-col gap-1.5">
              <Badge 
                variant={isSelected ? "default" : "secondary"}
                className={cn(
                  "text-xs w-fit",
                  isSelected && "bg-[#ECC98B] text-[#ECC98B]-foreground hover:bg-[#ECC98B]/80"
                )}
              >
                {recurringText}
              </Badge>
              
              <div className="pt-1">
                <p className="text-xs text-muted-foreground">Starting at</p>
                {discount > 0 ? (
                  <div className="space-y-0.5">
                    <p className="text-sm text-muted-foreground line-through">
                      ${minPrice}
                    </p>
                    <p className={cn(
                      "text-xl md:text-2xl font-bold",
                      isSelected ? "text-[#ECC98B]" : "text-foreground"
                    )}>
                      ${discountedPrice}
                    </p>
                  </div>
                ) : (
                  <p className={cn(
                    "text-xl md:text-2xl font-bold",
                    isSelected ? "text-[#ECC98B]" : "text-foreground"
                  )}>
                    ${minPrice}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}