import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, TrendingUp, DollarSign } from 'lucide-react';
import { formatPrice } from '@/lib/pricing-utils';
import { PricingResult, HOME_SIZE_RANGES, DEFAULT_PRICING_CONFIG } from '@/lib/new-pricing-system';
import { cn } from '@/lib/utils';

interface PricingSummaryCardProps {
  result: PricingResult | null;
  homeSizeId?: string;
  serviceTypeId?: string;
  frequencyId?: string;
  stateCode?: string;
  className?: string;
}

export function PricingSummaryCard({ 
  result, 
  homeSizeId, 
  serviceTypeId, 
  frequencyId, 
  stateCode,
  className 
}: PricingSummaryCardProps) {
  const homeSize = HOME_SIZE_RANGES.find(h => h.id === homeSizeId);
  const serviceType = DEFAULT_PRICING_CONFIG.serviceTypes.find(s => s.id === serviceTypeId);
  const frequency = DEFAULT_PRICING_CONFIG.frequencies.find(f => f.id === frequencyId);
  const state = DEFAULT_PRICING_CONFIG.states.find(s => s.code === stateCode);

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
            <div className="text-6xl font-bold text-[#ECC98B]">
              Call
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium">Large Home Estimate</p>
              <p className="text-muted-foreground">
                Homes over 5,000 sq ft require personalized pricing
              </p>
            </div>
            <Badge className="bg-[#ECC98B] text-[#ECC98B]-foreground hover:bg-[#ECC98B]/80">
              Contact Required
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasRecurring = result.mrrEstimate > 0;

  return (
    <Card className={cn("shadow-lg border-primary/20", className)}>
      <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Pricing Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {/* Service Details */}
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="font-medium text-foreground">{serviceType.name}</p>
            <p className="text-sm text-muted-foreground">{homeSize.label}</p>
            <p className="text-sm text-muted-foreground">{frequency.name} • {state.name}</p>
          </div>
        </div>

        {/* Pricing Breakdown */}
        <Separator />
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Base ({homeSize.estimatedHours}h × 2 cleaners)</span>
            <span className="font-medium">{formatPrice(result.breakdown.baseCalculation)}</span>
          </div>
          
          {result.breakdown.stateMultiplier !== 1 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{state.name} adjustment</span>
              <span className="font-medium">×{result.breakdown.stateMultiplier}</span>
            </div>
          )}
          
          {result.breakdown.serviceMultiplier !== 1 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Service type</span>
              <span className="font-medium">×{result.breakdown.serviceMultiplier}</span>
            </div>
          )}
          
          {result.breakdown.frequencyDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Frequency discount</span>
              <span className="font-medium">-{Math.round(result.breakdown.frequencyDiscount * 100)}%</span>
            </div>
          )}
        </div>

        {/* Total Price */}
        <Separator className="border-primary/20" />
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-foreground">Service Price</span>
          <div className="text-right">
            <p className="text-2xl font-bold text-[#ECC98B]">
              {formatPrice(result.finalPrice)}
            </p>
          </div>
        </div>

        {/* Recurring Revenue */}
        {hasRecurring && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <TrendingUp className="h-4 w-4" />
                Recurring Revenue
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Est. Monthly</span>
                <span className="font-medium text-[#ECC98B]">{formatPrice(result.mrrEstimate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Est. Annual</span>
                <span className="font-medium text-[#ECC98B]">{formatPrice(result.arrEstimate)}</span>
              </div>
            </div>
          </>
        )}

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