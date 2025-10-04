import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calculator, DollarSign } from 'lucide-react';
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

  return (
    <Card className={cn("shadow-lg border-primary/20", className)}>
      <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-3">

        {/* Discount Savings Banner */}
        {showDiscount && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
            <p className="text-sm font-semibold text-green-600">
              ✨ You save 15% today! ✨
            </p>
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

        {/* Payment Note */}
        <div className="pt-4 border-t border-border/50">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-success">Pay After Service</p>
            <p className="text-xs text-muted-foreground">
              No payment required now. You'll be charged only after completion.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
