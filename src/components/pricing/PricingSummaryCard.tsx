import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, DollarSign, Sparkles } from 'lucide-react';
import { formatPrice } from '@/lib/pricing-utils';
import { PricingResult, HOME_SIZE_RANGES, DEFAULT_PRICING_CONFIG } from '@/lib/new-pricing-system';
import { calculateDallasPricing, DALLAS_DISCOUNT_RATE } from '@/lib/dallas-pricing-system';
import { cn } from '@/lib/utils';

interface PricingSummaryCardProps {
  result: PricingResult | null;
  homeSizeId?: string;
  serviceTypeId?: string;
  frequencyId?: string;
  stateCode?: string;
  squareFootage?: number;
  useDallasPricing?: boolean;
  className?: string;
}

export function PricingSummaryCard({ 
  result, 
  homeSizeId, 
  serviceTypeId, 
  frequencyId, 
  stateCode,
  squareFootage,
  useDallasPricing = true,
  className 
}: PricingSummaryCardProps) {
  const homeSize = HOME_SIZE_RANGES.find(h => h.id === homeSizeId);
  const serviceType = DEFAULT_PRICING_CONFIG.serviceTypes.find(s => s.id === serviceTypeId);
  const frequency = DEFAULT_PRICING_CONFIG.frequencies.find(f => f.id === frequencyId);
  const state = DEFAULT_PRICING_CONFIG.states.find(s => s.code === stateCode);

  // Use Dallas pricing if enabled and we have square footage
  const dallasPricing = useDallasPricing && squareFootage && serviceTypeId && frequencyId ? 
    calculateDallasPricing(
      squareFootage,
      serviceTypeId === 'standard' ? 'regular' : serviceTypeId === 'deep' ? 'deep' : 'move_in_out',
      frequencyId === 'one_time' ? 'one_time' : 
      frequencyId === 'weekly' ? 'weekly' : 
      frequencyId === 'bi_weekly' ? 'bi_weekly' : 'monthly'
    ) : null;

  if (dallasPricing && dallasPricing.tier.id === '5000_plus') {
    return (
      <Card className={cn("shadow-lg border-primary/20", className)}>
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Custom Estimate Required
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-8 space-y-4">
            <div className="text-6xl font-bold text-primary">
              Call
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium">Large Home Estimate</p>
              <p className="text-muted-foreground">
                Homes over 5,000 sq ft require personalized pricing
              </p>
            </div>
            <Badge className="bg-primary text-primary-foreground hover:bg-primary/80">
              Contact Required
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result || !homeSize || !serviceType || !frequency || !state) {
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

  // Dallas pricing display
  if (dallasPricing) {
    const isRecurring = dallasPricing.frequency !== 'one_time';
    const serviceTypeName = dallasPricing.serviceType === 'regular' ? 'Regular Clean' :
                           dallasPricing.serviceType === 'deep' ? 'Deep Clean' : 'Move-In/Out Clean';
    const frequencyName = dallasPricing.frequency === 'one_time' ? 'One-Time' :
                         dallasPricing.frequency === 'weekly' ? 'Weekly' :
                         dallasPricing.frequency === 'bi_weekly' ? 'Bi-Weekly' : 'Monthly';

    return (
      <Card className={cn("shadow-lg border-primary/20", className)}>
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Summary
            </CardTitle>
            <Badge className="bg-success text-success-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {Math.round(DALLAS_DISCOUNT_RATE * 100)}% Off!
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-3">
          {/* Original Price */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Original Price</span>
            <span className="text-sm text-muted-foreground line-through">
              ${dallasPricing.originalPrice.toFixed(0)}
            </span>
          </div>

          {/* Discount */}
          <div className="flex justify-between items-center text-success">
            <span className="text-sm font-medium">
              You Save {Math.round(DALLAS_DISCOUNT_RATE * 100)}%
            </span>
            <span className="font-medium">-${dallasPricing.savings.toFixed(0)}</span>
          </div>

          <Separator className="border-primary/20" />

          {/* Final Price */}
          <div className="flex justify-between items-center pt-2">
            <span className="text-lg font-bold text-foreground">
              {isRecurring ? 'Monthly' : 'Service'} Total
            </span>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                ${dallasPricing.discountedPrice.toFixed(0)}
              </p>
            </div>
          </div>

          {/* Per-clean breakdown for recurring */}
          {isRecurring && dallasPricing.recurringDetails && (
            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground">
                ${dallasPricing.recurringDetails.perClean.toFixed(0)} per clean × {dallasPricing.recurringDetails.cleansPerMonth} clean{dallasPricing.recurringDetails.cleansPerMonth > 1 ? 's' : ''}/month
              </p>
            </div>
          )}

          {/* Service details */}
          <Separator className="my-4" />
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{serviceTypeName} • {frequencyName}</p>
            <p className="text-xs text-muted-foreground">{dallasPricing.tier.label} • Dallas, TX</p>
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

  if (homeSize.requiresEstimate) {
    return (
      <Card className={cn("shadow-lg border-primary/20", className)}>
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Custom Estimate Required
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-8 space-y-4">
            <div className="text-6xl font-bold text-primary">
              Call
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium">Large Home Estimate</p>
              <p className="text-muted-foreground">
                Homes over 5,000 sq ft require personalized pricing
              </p>
            </div>
            <Badge className="bg-primary text-primary-foreground hover:bg-primary/80">
              Contact Required
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate pricing breakdown
  const basePrice = result.breakdown.baseCalculation;
  const subtotal = basePrice; // Will include add-ons when implemented
  const discountRate = 0.20; // 20% global discount
  const discountAmount = (result.finalPrice / 0.8) * 0.2;
  
  // Calculate per-clean breakdown for recurring services
  const isRecurring = frequency.id !== 'one-time';
  let cleansPerMonth = 0;
  if (isRecurring) {
    if (frequency.id === 'weekly') cleansPerMonth = 4;
    else if (frequency.id === 'bi-weekly') cleansPerMonth = 2;
    else if (frequency.id === 'monthly') cleansPerMonth = 1;
  }
  const perCleanPrice = isRecurring && cleansPerMonth > 0 ? result.finalPrice / cleansPerMonth : 0;

  return (
    <Card className={cn("shadow-lg border-primary/20", className)}>
      <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-3">
        {/* Base Price */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Base Price ({homeSize.label})</span>
          <span className="font-medium text-foreground">{formatPrice(basePrice)}</span>
        </div>

        {/* Add-ons section - placeholder for future implementation */}
        {/* When add-ons are added, they'll appear here as individual line items */}

        {/* Subtotal */}
        <Separator />
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-foreground">Subtotal</span>
          <span className="font-medium text-foreground">{formatPrice(subtotal)}</span>
        </div>

        {/* Discount */}
        <div className="flex justify-between items-center text-success">
          <span className="text-sm">
            {isRecurring ? 'Recurring Plan' : 'First-Time'} Discount ({Math.round(discountRate * 100)}%)
          </span>
          <span className="font-medium">-{formatPrice(discountAmount)}</span>
        </div>

        {/* Total */}
        <Separator className="border-primary/20" />
        <div className="flex justify-between items-center pt-2">
          <span className="text-lg font-bold text-foreground">
            {isRecurring ? 'Monthly' : 'Service'} Total
          </span>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">
              {formatPrice(result.finalPrice)}
            </p>
          </div>
        </div>

        {/* Per-clean breakdown for recurring */}
        {isRecurring && cleansPerMonth > 0 && (
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">
              {formatPrice(perCleanPrice)} per clean × {cleansPerMonth} clean{cleansPerMonth > 1 ? 's' : ''}/month
            </p>
          </div>
        )}

        {/* Service details */}
        <Separator className="my-4" />
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{serviceType.name}</p>
          <p className="text-xs text-muted-foreground">{frequency.name} • {state.name}</p>
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