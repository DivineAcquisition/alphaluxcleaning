import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ChevronUp, ChevronDown, Calculator } from 'lucide-react';
import { formatPrice } from '@/lib/pricing-utils';
import { DEFAULT_PRICING_CONFIG } from '@/lib/new-pricing-system';
import { calculateFixedPricing, SERVICE_TYPE_NAMES, FREQUENCY_NAMES } from '@/lib/fixed-pricing-system';
import { cn } from '@/lib/utils';

interface FloatingPricingSummaryProps {
  result?: any;
  serviceTypeId?: string;
  frequencyId?: string;
  className?: string;
}

export function FloatingPricingSummary({
  serviceTypeId,
  frequencyId,
  className
}: FloatingPricingSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't show if no pricing data available
  if (!serviceTypeId || !frequencyId) {
    return null;
  }

  // Calculate fixed pricing
  const pricing = calculateFixedPricing(serviceTypeId, frequencyId);
  const serviceType = DEFAULT_PRICING_CONFIG.serviceTypes.find(s => s.id === serviceTypeId);
  const frequency = DEFAULT_PRICING_CONFIG.frequencies.find(f => f.id === frequencyId);

  const isRecurring = pricing.isRecurring;
  const cleansPerMonth = pricing.cleansPerMonth || 0;

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
                  {formatPrice(pricing.finalPrice)}
                </span>
                <p className="text-xs text-muted-foreground">
                  {isRecurring && cleansPerMonth > 0 
                    ? `${formatPrice(pricing.perCleanPrice || 0)} per clean × ${cleansPerMonth}/month`
                    : `${isRecurring ? 'Monthly' : 'Service'} Total`
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
                {/* Total */}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-base font-bold text-foreground">
                    {isRecurring ? 'Monthly' : 'Service'} Total
                  </span>
                  <p className="text-xl font-bold text-primary">
                    {formatPrice(pricing.finalPrice)}
                  </p>
                </div>

                {/* Per-clean breakdown */}
                {isRecurring && cleansPerMonth > 0 && (
                  <div className="text-center pt-1">
                    <p className="text-xs text-muted-foreground">
                      {formatPrice(pricing.perCleanPrice || 0)} per clean × {cleansPerMonth} clean{cleansPerMonth > 1 ? 's' : ''}/month
                    </p>
                  </div>
                )}

                {/* Service details */}
                <Separator className="mt-3" />
                <div className="space-y-1 pt-1">
                  <p className="text-xs text-muted-foreground">
                    {serviceType?.name || SERVICE_TYPE_NAMES[pricing.serviceType as keyof typeof SERVICE_TYPE_NAMES]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {frequency?.name || FREQUENCY_NAMES[pricing.frequency as keyof typeof FREQUENCY_NAMES]}
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
