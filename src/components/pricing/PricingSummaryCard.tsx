import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calculator, DollarSign, Sparkles } from 'lucide-react';
import { formatPrice } from '@/lib/pricing-utils';
import { DEFAULT_PRICING_CONFIG } from '@/lib/new-pricing-system';
import { getPriceQuote } from '@/lib/pricing-adapter';
import { cn } from '@/lib/utils';

interface PricingSummaryCardProps {
  result?: any;
  serviceTypeId?: string;
  frequencyId?: string;
  homeSizeId?: string;
  stateCode?: string;
  className?: string;
}

export function PricingSummaryCard({ 
  serviceTypeId, 
  frequencyId,
  homeSizeId,
  stateCode,
  className 
}: PricingSummaryCardProps) {
  const serviceType = DEFAULT_PRICING_CONFIG.serviceTypes.find(s => s.id === serviceTypeId);
  const frequency = DEFAULT_PRICING_CONFIG.frequencies.find(f => f.id === frequencyId);

  if (!serviceTypeId) {
    return (
      <Card className={cn("shadow-lg border-primary/20", className)}>
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Pricing Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Select your options to see pricing
            </p>
          </div>
        </CardContent>
      </Card>
    );
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
    return (
      <Card className={cn("shadow-lg border-primary/20", className)}>
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Pricing Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Unable to calculate pricing. Please check your selections.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isRecurring = pricingResult.recurringDetails !== undefined;
  const perCleanPrice = pricingResult.recurringDetails?.perClean || 0;
  const cleansPerMonth = pricingResult.recurringDetails?.cleansPerMonth || 0;
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

  // Get base price and discount info from the new pricing result
  const showDiscount = pricingResult.discountedPrice > 0;

  // Detect if this is a deep cleaning service
  const isDeepCleaning = serviceTypeId === 'deep';

  // Calculate deep clean discount if applicable
  const deepCleanDiscount = isDeepCleaning ? 25 : 0;
  const priceBeforeDeepCleanDiscount = isDeepCleaning 
    ? pricingResult.discountedPrice + 25  // Add back the $25 discount
    : pricingResult.discountedPrice;

  return (
    <Card className={cn("shadow-lg border-primary/20", className)}>
      <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-3">

        {/* Regional Adjustment Notice */}
        {stateCode && stateCode !== 'TX' && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <p className="text-xs text-blue-700 font-medium">
              {stateCode === 'CA' && '📍 California pricing: Base rate +10%'}
              {stateCode === 'NY' && '📍 New York pricing: Base rate +15%'}
            </p>
          </div>
        )}

        {/* Deep Clean Discount Banner */}
        {isDeepCleaning && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
            <p className="text-sm font-semibold text-blue-600">
              ✨ Deep Cleaning Special: $25 OFF ✨
            </p>
          </div>
        )}
        
        {/* Standard One-Time Discount Banner */}
        {serviceTypeId === 'regular' && frequencyId === 'one_time' && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
            <p className="text-sm font-semibold text-green-600">
              ✨ First-Time Special: 10% OFF ✨
            </p>
          </div>
        )}

        {/* Recurring Frequency Discount Banner */}
        {showDiscount && frequencyId !== 'one_time' && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
            <p className="text-sm font-semibold text-green-600">
              {frequencyId === 'weekly' && '✨ Save 15% with weekly service! ✨'}
              {frequencyId === 'bi_weekly' && '✨ Save 10% with bi-weekly service! ✨'}
              {frequencyId === 'monthly' && '✨ Save 5% with monthly service! ✨'}
            </p>
          </div>
        )}

        {/* Pricing Breakdown - Show if deep cleaning */}
        {isDeepCleaning && (
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Base Price</span>
              <span className="font-medium">{formatPrice(priceBeforeDeepCleanDiscount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-blue-600 font-medium flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Deep Clean Discount (20%)
              </span>
              <span className="font-medium text-blue-600">-{formatPrice(deepCleanDiscount)}</span>
            </div>
            <Separator className="my-2" />
          </div>
        )}
        
        {/* Standard One-Time Discount Breakdown */}
        {serviceTypeId === 'regular' && frequencyId === 'one_time' && (
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Base Price</span>
              <span className="font-medium">{formatPrice(pricingResult.discountedPrice / 0.90)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-600 font-medium flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                First-Time Discount (10%)
              </span>
              <span className="font-medium text-green-600">-{formatPrice(pricingResult.discountedPrice * 0.1111)}</span>
            </div>
            <Separator className="my-2" />
          </div>
        )}

        {/* Final Price */}
        <div className="flex justify-between items-center pt-2">
          <span className="text-lg font-bold text-foreground">
            {priceLabel}
          </span>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">
              {formatPrice(finalPrice)}
            </p>
          </div>
        </div>

        {/* Per-clean breakdown for recurring */}
        {isRecurring && cleansPerMonth > 0 && (
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">
              {cleansPerMonth} clean{cleansPerMonth > 1 ? 's' : ''} per month
            </p>
          </div>
        )}

        {/* Service details */}
        <Separator className="my-4" />
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            {serviceType?.name} • {pricingResult.tierLabel}
          </p>
          <p className="text-xs text-muted-foreground">
            {frequency?.name}
          </p>
        </div>

        {/* Deposit Information */}
        <div className="pt-4 border-t border-border/50">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">25% Deposit:</span>
              <span className="text-sm font-semibold text-primary">
                {formatPrice(pricingResult.depositAmount)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground text-center pt-2">
              💳 Deposits get priority scheduling. Or choose to pay after service.
            </p>
          </div>
        </div>

        {/* Deep Clean Recommendation */}
        {serviceTypeId === 'regular' && (
          <div className="pt-3 border-t border-border/50">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <p className="text-xs text-amber-700">
                💡 <strong>Tip:</strong> If your home hasn't been professionally cleaned in over 2 months, 
                we recommend starting with a Deep Cleaning for best results.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
