import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ChevronUp, ChevronDown, Calculator } from 'lucide-react';
import { formatPrice } from '@/lib/pricing-utils';
import { DEFAULT_PRICING_CONFIG, HOME_SIZE_RANGES } from '@/lib/new-pricing-system';
import { getPriceQuote } from '@/lib/pricing-adapter';
import { cn } from '@/lib/utils';

interface FloatingPricingSummaryProps {
  result?: any;
  serviceTypeId?: string;
  frequencyId?: string;
  homeSizeId?: string;
  customSqFt?: number;
  stateCode?: string;
  className?: string;
  onProceed?: () => void;
}

export function FloatingPricingSummary({
  serviceTypeId,
  frequencyId,
  homeSizeId,
  customSqFt,
  stateCode,
  className,
  onProceed
}: FloatingPricingSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't show if no service selected
  if (!serviceTypeId) {
    return null;
  }

  // Convert homeSizeId to square footage
  const getSquareFootageFromHomeSizeId = (homeSizeId: string): number => {
    const sizeMap: Record<string, number> = {
      'under_1000': 750,
      '1000_1500': 1250,
      '1501_2000': 1750,
      '2001_2500': 2250,
      '2501_3000': 2750,
      '3001_3500': 3250,
      '3501_4000': 3750,
      '4001_4500': 4250,
      '4501_5000': 4750,
      '5000_plus': 5500
    };
    return sizeMap[homeSizeId] || 1250;
  };

  // Use custom square footage if provided, otherwise use range midpoint
  const sqft = customSqFt || getSquareFootageFromHomeSizeId(homeSizeId);
  
  // Calculate pricing using adapter
  const pricingResult = getPriceQuote({
    stateCode,
    sqft,
    homeSizeId,
    serviceTypeId,
    frequencyId
  });

  if (!pricingResult) {
    return null;
  }

  const serviceType = DEFAULT_PRICING_CONFIG.serviceTypes.find(s => s.id === serviceTypeId);
  const frequency = DEFAULT_PRICING_CONFIG.frequencies.find(f => f.id === frequencyId);
  const homeSize = HOME_SIZE_RANGES.find(h => h.id === homeSizeId);

  const isRecurring = pricingResult.recurringDetails !== undefined;
  const cleansPerMonth = pricingResult.recurringDetails?.cleansPerMonth || 0;
  const perCleanPrice = pricingResult.recurringDetails?.perClean || 0;
  const monthlyTotal = pricingResult.recurringDetails?.monthlyTotal || 0;
  
  // Determine display price and label based on frequency
  let finalPrice = pricingResult.discountedPrice;
  let priceLabel = 'Service Total';
  
  if (isRecurring) {
    if (frequencyId === 'weekly') {
      finalPrice = perCleanPrice;
      priceLabel = 'Per Week';
    } else if (frequencyId === 'bi_weekly') {
      finalPrice = perCleanPrice;
      priceLabel = 'Every Other Week';
    } else if (frequencyId === 'monthly') {
      finalPrice = monthlyTotal;
      priceLabel = 'Per Month';
    }
  }

  const showDiscount = pricingResult.discountAmount > 0;
  const discountPercentage = frequency?.discount ? (frequency.discount * 100).toFixed(0) : '0';

  return (
    <div className={cn("fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg", className)}>
      <div className="max-w-4xl mx-auto">
        {/* Collapsed View */}
        <div className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Calculator className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {serviceType?.name} • {customSqFt ? `${customSqFt} sq ft` : homeSize?.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {frequency?.name}
                {showDiscount && ` • ${discountPercentage}% savings applied`}
              </p>
              <div>
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(finalPrice)}
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  {isRecurring && cleansPerMonth > 0 
                    ? `per visit (${cleansPerMonth}x/month)`
                    : priceLabel
                  }
                </span>
              </div>
            </div>

            {onProceed && (
              <Button
                variant="default"
                size="lg"
                onClick={onProceed}
                className="gap-2 shrink-0"
              >
                Continue →
              </Button>
            )}
            
            {!onProceed && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="gap-2 shrink-0"
              >
                {isExpanded ? (
                  <>
                    Hide
                    <ChevronDown className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Details
                    <ChevronUp className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Expanded View */}
        {isExpanded && (
          <div className="border-t border-border">
            <Card className="rounded-none border-0 shadow-none">
              <CardContent className="p-4 space-y-3">
                {/* Service Summary */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">📋 Service Summary</p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>• {serviceType?.name}</p>
                    <p>• {customSqFt ? `${customSqFt} sq ft (exact)` : homeSize?.label}</p>
                    <p>• {frequency?.name} {isRecurring && cleansPerMonth > 0 ? `(${cleansPerMonth}x per month)` : ''}</p>
                  </div>
                </div>

                <Separator />

                {/* Pricing Breakdown */}
                <div className="space-y-2">
                  {showDiscount && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Original Price:</span>
                        <span className="text-foreground">{formatPrice(pricingResult.basePrice)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-green-600">
                        <span>{frequency?.name} Savings ({discountPercentage}%):</span>
                        <span>-{formatPrice(pricingResult.discountAmount)}</span>
                      </div>
                      <Separator />
                    </>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-foreground">
                      {priceLabel}
                    </span>
                    <p className="text-xl font-bold text-primary">
                      {formatPrice(finalPrice)}
                    </p>
                  </div>

                  {/* Monthly Total for recurring */}
                  {isRecurring && monthlyTotal > 0 && (
                    <div className="text-center pt-2 bg-primary/5 rounded-lg p-2">
                      <p className="text-xs text-muted-foreground">
                        Monthly Total: <span className="font-semibold text-foreground">{formatPrice(monthlyTotal)}</span>
                      </p>
                    </div>
                  )}
                </div>

                {onProceed && (
                  <>
                    <Separator />
                    <Button
                      variant="default"
                      size="lg"
                      onClick={onProceed}
                      className="w-full gap-2"
                    >
                      Continue to Next Step →
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
