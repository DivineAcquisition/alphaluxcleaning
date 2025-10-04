import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ChevronUp, ChevronDown, Calculator } from 'lucide-react';
import { formatPrice } from '@/lib/pricing-utils';
import { DEFAULT_PRICING_CONFIG } from '@/lib/new-pricing-system';
import { getPriceQuote } from '@/lib/pricing-adapter';
import { cn } from '@/lib/utils';

interface FloatingPricingSummaryProps {
  result?: any;
  serviceTypeId?: string;
  frequencyId?: string;
  homeSizeId?: string;
  stateCode?: string;
  className?: string;
}

export function FloatingPricingSummary({
  serviceTypeId,
  frequencyId,
  homeSizeId,
  stateCode,
  className
}: FloatingPricingSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't show if no pricing data available
  if (!serviceTypeId || !frequencyId || !homeSizeId || !stateCode) {
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

  const sqft = getSquareFootageFromHomeSizeId(homeSizeId);
  
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

  const isRecurring = pricingResult.recurringDetails !== undefined;
  const cleansPerMonth = pricingResult.recurringDetails?.cleansPerMonth || 0;
  const perCleanPrice = pricingResult.recurringDetails?.perClean || 0;
  const finalPrice = isRecurring 
    ? (pricingResult.recurringDetails?.monthlyTotal ?? pricingResult.discountedPrice)
    : pricingResult.discountedPrice;

  const showDiscount = pricingResult.discountedPrice > 0;

  return (
    <div className={cn("fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg", className)}>
      <div className="max-w-4xl mx-auto">
        {/* Collapsed View */}
        <div className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-primary">
                <Calculator className="h-5 w-5" />
                <span className="font-semibold">Total:</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(finalPrice)}
                </span>
                <p className="text-xs text-muted-foreground">
                  {isRecurring && cleansPerMonth > 0 
                    ? `${formatPrice(perCleanPrice)} per clean × ${cleansPerMonth}/month`
                    : `${isRecurring ? 'Monthly' : 'Service'} Total`
                  }
                </p>
                {showDiscount && (
                  <p className="text-xs font-semibold text-green-600">
                    ✨ 15% off included!
                  </p>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="gap-2"
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
          </div>
        </div>

        {/* Expanded View */}
        {isExpanded && (
          <div className="border-t border-border">
            <Card className="rounded-none border-0 shadow-none">
              <CardContent className="p-4 space-y-3">
                {/* Discount Banner */}
                {showDiscount && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 text-center">
                    <p className="text-xs font-semibold text-green-600">
                      ✨ 15% discount applied! ✨
                    </p>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-base font-bold text-foreground">
                    {isRecurring ? 'Monthly' : 'Service'} Total
                  </span>
                  <p className="text-xl font-bold text-primary">
                    {formatPrice(finalPrice)}
                  </p>
                </div>

                {/* Per-clean breakdown */}
                {isRecurring && cleansPerMonth > 0 && (
                  <div className="text-center pt-1">
                    <p className="text-xs text-muted-foreground">
                      {formatPrice(perCleanPrice)} per clean × {cleansPerMonth} clean{cleansPerMonth > 1 ? 's' : ''}/month
                    </p>
                  </div>
                )}

                {/* Service details */}
                <Separator className="mt-3" />
                <div className="space-y-1 pt-1">
                  <p className="text-xs text-muted-foreground">
                    {serviceType?.name} • {pricingResult.tierLabel}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {frequency?.name}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
