import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChevronUp, ChevronDown, Calculator, Sparkles } from 'lucide-react';
import { formatPrice } from '@/lib/pricing-utils';
import { PricingResult, HOME_SIZE_RANGES, DEFAULT_PRICING_CONFIG } from '@/lib/new-pricing-system';
import { calculatePricing, DISCOUNT_RATE, StateCode } from '@/lib/state-pricing-system';
import { cn } from '@/lib/utils';

interface FloatingPricingSummaryProps {
  result: PricingResult | null;
  homeSizeId?: string;
  serviceTypeId?: string;
  frequencyId?: string;
  stateCode?: string;
  squareFootage?: number;
  useStatePricing?: boolean;
}

export function FloatingPricingSummary({
  result,
  homeSizeId,
  serviceTypeId,
  frequencyId,
  stateCode,
  squareFootage,
  useStatePricing = true
}: FloatingPricingSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const homeSize = HOME_SIZE_RANGES.find(h => h.id === homeSizeId);
  const serviceType = DEFAULT_PRICING_CONFIG.serviceTypes.find(s => s.id === serviceTypeId);
  const frequency = DEFAULT_PRICING_CONFIG.frequencies.find(f => f.id === frequencyId);
  const state = DEFAULT_PRICING_CONFIG.states.find(s => s.code === stateCode);

  // Use state-level pricing if enabled
  const statePricing = useStatePricing && squareFootage && serviceTypeId && frequencyId && stateCode ? 
    calculatePricing(
      stateCode as StateCode,
      squareFootage,
      serviceTypeId === 'standard' ? 'regular' : serviceTypeId === 'deep' ? 'deep' : 'move_in_out',
      frequencyId === 'one_time' ? 'one_time' : 
      frequencyId === 'weekly' ? 'weekly' : 
      frequencyId === 'bi_weekly' ? 'bi_weekly' : 'monthly'
    ) : null;

  // Don't show if no pricing available
  if ((!result || !homeSize || !serviceType || !frequency || !state) && !statePricing) {
    return null;
  }

  // Don't show for homes requiring estimate
  if ((homeSize?.requiresEstimate) || (statePricing && statePricing.tier.id === '5000_plus')) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg">
        <div className="max-w-4xl mx-auto p-4">
          <div className="text-center">
            <p className="text-lg font-bold text-primary">Custom Estimate Required</p>
            <p className="text-sm text-muted-foreground">Contact us for large home pricing</p>
          </div>
        </div>
      </div>
    );
  }

  // State pricing display
  if (statePricing) {
    const isRecurring = statePricing.frequency !== 'one_time';
    const cleansPerMonth = statePricing.recurringDetails?.cleansPerMonth || 0;

    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg">
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
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">
                      ${statePricing.discountedPrice.toFixed(0)}
                    </span>
                    <Badge variant="secondary" className="bg-success/10 text-success border-success/20 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      {Math.round(DISCOUNT_RATE * 100)}% Off
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isRecurring && cleansPerMonth > 0 
                      ? `$${statePricing.recurringDetails!.perClean.toFixed(0)} per clean × ${cleansPerMonth}/month`
                      : `Was $${statePricing.originalPrice.toFixed(0)}`
                    }
                  </p>
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
                  {/* Original Price */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Original Price</span>
                    <span className="text-sm text-muted-foreground line-through">
                      ${statePricing.originalPrice.toFixed(0)}
                    </span>
                  </div>

                  {/* Discount */}
                  <div className="flex justify-between items-center text-success">
                    <span className="text-sm font-medium">
                      You Save {Math.round(DISCOUNT_RATE * 100)}%
                    </span>
                    <span className="font-medium">-${statePricing.savings.toFixed(0)}</span>
                  </div>

                  <Separator className="border-primary/20" />

                  {/* Total */}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-base font-bold text-foreground">
                      {isRecurring ? 'Monthly' : 'Service'} Total
                    </span>
                    <p className="text-xl font-bold text-primary">
                      ${statePricing.discountedPrice.toFixed(0)}
                    </p>
                  </div>

                  {/* Per-clean breakdown */}
                  {isRecurring && cleansPerMonth > 0 && (
                    <div className="text-center pt-1">
                      <p className="text-xs text-muted-foreground">
                        ${statePricing.recurringDetails!.perClean.toFixed(0)} per clean × {cleansPerMonth} clean{cleansPerMonth > 1 ? 's' : ''}/month
                      </p>
                    </div>
                  )}

                  {/* Service details */}
                  <Separator className="mt-3" />
                  <div className="space-y-1 pt-1">
                    <p className="text-xs text-muted-foreground">
                      {statePricing.serviceType === 'regular' ? 'Regular Clean' : 
                       statePricing.serviceType === 'deep' ? 'Deep Clean' : 'Move-In/Out Clean'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {statePricing.tier.label} • {statePricing.state.displayName}
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

  // Calculate pricing breakdown (legacy fallback)
  const basePrice = result?.breakdown.baseCalculation || 0;
  const subtotal = basePrice;
  const discountRate = 0.20;
  const discountAmount = result ? (result.finalPrice / 0.8) * 0.2 : 0;
  
  const isRecurring = frequency?.id !== 'one-time';
  let cleansPerMonth = 0;
  if (isRecurring) {
    if (frequency?.id === 'weekly') cleansPerMonth = 4;
    else if (frequency?.id === 'bi-weekly') cleansPerMonth = 2;
    else if (frequency?.id === 'monthly') cleansPerMonth = 1;
  }
  const perCleanPrice = isRecurring && cleansPerMonth > 0 && result ? result.finalPrice / cleansPerMonth : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg">
      <div className="max-w-4xl mx-auto">
        {/* Collapsed View - Always Visible */}
        <div className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-primary">
                <Calculator className="h-5 w-5" />
                <span className="font-semibold">Total:</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(result?.finalPrice || 0)}
                  </span>
                  <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                    20% Off
                  </Badge>
                </div>
                  <p className="text-xs text-muted-foreground">
                    {isRecurring && cleansPerMonth > 0 
                      ? `${formatPrice(perCleanPrice)} per clean × ${cleansPerMonth}/month`
                      : `Was ${formatPrice((result?.finalPrice || 0) / 0.8)}`
                    }
                </p>
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

        {/* Expanded View - Detailed Breakdown */}
        {isExpanded && (
          <div className="border-t border-border">
            <Card className="rounded-none border-0 shadow-none">
              <CardContent className="p-4 space-y-3">
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
                  <span className="text-base font-bold text-foreground">
                    {isRecurring ? 'Monthly' : 'Service'} Total
                  </span>
                  <p className="text-xl font-bold text-primary">
                    {formatPrice(result?.finalPrice || 0)}
                  </p>
                </div>

                {/* Per-clean breakdown for recurring */}
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
                  <p className="text-xs text-muted-foreground">{serviceType?.name}</p>
                  <p className="text-xs text-muted-foreground">{frequency?.name} • {state?.name}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
