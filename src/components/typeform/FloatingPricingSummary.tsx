import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChevronUp, ChevronDown, Tag, TrendingUp, Calculator } from 'lucide-react';
import { formatPrice } from '@/lib/pricing-utils';
import { PricingResult, HOME_SIZE_RANGES, DEFAULT_PRICING_CONFIG } from '@/lib/new-pricing-system';
import { cn } from '@/lib/utils';

interface FloatingPricingSummaryProps {
  result: PricingResult | null;
  homeSizeId?: string;
  serviceTypeId?: string;
  frequencyId?: string;
  stateCode?: string;
}

export function FloatingPricingSummary({
  result,
  homeSizeId,
  serviceTypeId,
  frequencyId,
  stateCode
}: FloatingPricingSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const homeSize = HOME_SIZE_RANGES.find(h => h.id === homeSizeId);
  const serviceType = DEFAULT_PRICING_CONFIG.serviceTypes.find(s => s.id === serviceTypeId);
  const frequency = DEFAULT_PRICING_CONFIG.frequencies.find(f => f.id === frequencyId);
  const state = DEFAULT_PRICING_CONFIG.states.find(s => s.code === stateCode);

  // Don't show if no pricing available
  if (!result || !homeSize || !serviceType || !frequency || !state) {
    return null;
  }

  // Don't show for homes requiring estimate
  if (homeSize.requiresEstimate) {
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

  const hasRecurring = result.mrrEstimate > 0;

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
                    {formatPrice(result.finalPrice)}
                  </span>
                  <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                    <Tag className="h-3 w-3 mr-1" />
                    20% Off
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Was {formatPrice(result.finalPrice / 0.8)}
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
                  Hide Details
                  <ChevronDown className="h-4 w-4" />
                </>
              ) : (
                <>
                  View Details
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
              <CardContent className="p-4 space-y-4">
                {/* Service Details */}
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{serviceType.name}</p>
                  <p className="text-sm text-muted-foreground">{homeSize.label}</p>
                  <p className="text-sm text-muted-foreground">{frequency.name} • {state.name}</p>
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

                {/* Global Discount */}
                <div className="flex justify-between text-sm text-success">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    20% Savings Applied
                  </span>
                  <span className="font-medium">-{formatPrice((result.finalPrice / 0.8) * 0.2)}</span>
                </div>

                {/* Total Price */}
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-foreground">Service Price</span>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      {formatPrice(result.finalPrice)}
                    </p>
                    <p className="text-xs text-success font-medium">
                      You save {formatPrice((result.finalPrice / 0.8) * 0.2)}!
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
                        Recurring Service
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Est. Monthly</span>
                        <span className="font-medium text-primary">{formatPrice(result.mrrEstimate)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Est. Annual</span>
                        <span className="font-medium text-primary">{formatPrice(result.arrEstimate)}</span>
                      </div>
                    </div>
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
