import React from 'react';
import { TrendingDown, Info } from 'lucide-react';
import { HOME_SIZE_RANGES, DEFAULT_PRICING_CONFIG, type StateConfig } from '@/lib/new-pricing-system';

interface PriceRangeIndicatorProps {
  stateCode?: string;
  serviceTypeId?: string;
  homeSizeId?: string;
  className?: string;
}

export function PriceRangeIndicator({ 
  stateCode, 
  serviceTypeId, 
  homeSizeId,
  className = '' 
}: PriceRangeIndicatorProps) {
  const state = DEFAULT_PRICING_CONFIG.states.find(s => s.code === stateCode);
  
  // If no state selected yet, don't show anything
  if (!state) return null;

  const getPriceRange = () => {
    const filteredRanges = HOME_SIZE_RANGES.filter(range => !range.requiresEstimate);
    
    // If service type is selected, narrow down the range
    if (serviceTypeId) {
      const prices = filteredRanges.map(range => {
        let basePrice = 0;
        switch (serviceTypeId) {
          case 'regular':
            basePrice = range.regularPrice;
            break;
          case 'deep':
            basePrice = range.deepPrice;
            break;
          case 'move_in_out':
            basePrice = range.moveInOutPrice;
            break;
        }
        return Math.round(basePrice * state.multiplier);
      });
      
      return {
        min: Math.min(...prices),
        max: Math.max(...prices),
        isNarrowed: true
      };
    }
    
    // Otherwise show the full range for regular cleaning
    const prices = filteredRanges.map(range => 
      Math.round(range.regularPrice * state.multiplier)
    );
    
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      isNarrowed: false
    };
  };

  const { min, max, isNarrowed } = getPriceRange();
  const serviceType = DEFAULT_PRICING_CONFIG.serviceTypes.find(s => s.id === serviceTypeId);

  return (
    <div className={`bg-card border border-border rounded-lg p-4 md:p-5 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <TrendingDown className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          </div>
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="text-sm md:text-base font-semibold text-foreground">
              Your Price Range
            </h4>
            {isNarrowed && (
              <div className="px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30">
                <span className="text-[10px] md:text-xs font-medium text-primary">Narrowed</span>
              </div>
            )}
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-primary">
              ${min}
            </span>
            <span className="text-muted-foreground">-</span>
            <span className="text-2xl md:text-3xl font-bold text-primary">
              ${max}
            </span>
          </div>
          
          <p className="text-xs md:text-sm text-muted-foreground">
            {serviceType ? (
              <>For {serviceType.name} in {state.name}</>
            ) : (
              <>For Standard Cleaning in {state.name}</>
            )}
          </p>
          
          {!homeSizeId && (
            <div className="flex items-start gap-2 pt-2 mt-2 border-t border-border">
              <Info className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Your exact price will be shown after selecting your home size
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
