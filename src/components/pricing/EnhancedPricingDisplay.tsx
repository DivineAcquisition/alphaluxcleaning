import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PricingViewToggle, PricingView } from './PricingViewToggle';
import { calculatePricingBreakdown, formatPriceDisplay, getPromotionalMessage } from '@/lib/pricing-psychology';
import { useState } from 'react';
import { Clock, Sparkles, TrendingDown } from 'lucide-react';

interface EnhancedPricingDisplayProps {
  finalPrice: number;
  basePrice: number;
  discountAmount: number;
  frequency: string;
  serviceType: string;
  homeSizeId: string;
  showDeposit?: boolean;
  depositAmount?: number;
}

export function EnhancedPricingDisplay({
  finalPrice,
  basePrice,
  discountAmount,
  frequency,
  serviceType,
  homeSizeId,
  showDeposit = false,
  depositAmount = 49,
}: EnhancedPricingDisplayProps) {
  const [pricingView, setPricingView] = useState<PricingView>('clean');
  
  const breakdown = calculatePricingBreakdown(
    finalPrice,
    frequency,
    homeSizeId,
    basePrice
  );
  
  const promotionalMessage = getPromotionalMessage(frequency, breakdown.savingsPerYear);
  
  // Display price based on selected view
  const displayPrice = {
    clean: breakdown.perClean,
    hour: breakdown.perHour,
    day: breakdown.perDay,
  }[pricingView];
  
  const displayLabel = {
    clean: 'per clean',
    hour: 'per hour',
    day: 'per day',
  }[pricingView];

  const serviceLabels = {
    regular: 'Standard Clean',
    deep: 'Deep Clean',
    move_in_out: 'Move-In/Out',
  };

  return (
    <Card className="p-6 sticky top-4">
      <h3 className="text-lg font-semibold mb-4">Your Estimate</h3>
      
      <div className="space-y-4">
        {/* Service Details */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Service</span>
          <span className="font-medium">{serviceLabels[serviceType as keyof typeof serviceLabels]}</span>
        </div>
        
        <Separator />
        
        {/* Pricing View Toggle */}
        <PricingViewToggle
          selectedView={pricingView}
          onViewChange={setPricingView}
          frequency={frequency}
        />
        
        {/* Main Price Display */}
        <div className="text-center py-4">
          <div className="text-4xl font-bold text-primary mb-1">
            ${Math.round(displayPrice)}
          </div>
          <div className="text-sm text-muted-foreground">{displayLabel}</div>
          
          {pricingView === 'hour' && (
            <div className="flex items-center justify-center gap-1 mt-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>≈ {breakdown.estimatedHours} hours</span>
            </div>
          )}
        </div>
        
        {/* Discount Info */}
        {discountAmount > 0 && (
          <div className="bg-success/10 border border-success/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-success" />
              <span className="text-sm font-medium text-success">You're Saving</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground line-through">
                ${basePrice.toFixed(2)}
              </span>
              <Badge variant="secondary" className="bg-success text-success-foreground">
                Save ${discountAmount.toFixed(2)}
              </Badge>
            </div>
          </div>
        )}
        
        {/* Promotional Message */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
          <Sparkles className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <span>{promotionalMessage}</span>
        </div>
        
        {/* Annual Savings for Recurring */}
        {breakdown.savingsPerYear && breakdown.savingsPerYear > 0 && (
          <>
            <Separator />
            <div className="text-center py-2">
              <div className="text-xs text-muted-foreground mb-1">Total Annual Savings</div>
              <div className="text-2xl font-bold text-success">
                ${Math.round(breakdown.savingsPerYear)}
              </div>
            </div>
          </>
        )}
        
        {/* Deposit Info */}
        {showDeposit && (
          <>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due Today</span>
                <span className="font-bold text-primary">${depositAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Remaining Balance</span>
                <span className="font-medium">${(finalPrice - depositAmount).toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
