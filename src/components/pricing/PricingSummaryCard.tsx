import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calculator, DollarSign } from 'lucide-react';
import { formatPrice } from '@/lib/pricing-utils';
import { DEFAULT_PRICING_CONFIG } from '@/lib/new-pricing-system';
import { calculateFixedPricing, SERVICE_TYPE_NAMES, FREQUENCY_NAMES } from '@/lib/fixed-pricing-system';
import { cn } from '@/lib/utils';

interface PricingSummaryCardProps {
  result?: any;
  serviceTypeId?: string;
  frequencyId?: string;
  className?: string;
}

export function PricingSummaryCard({ 
  serviceTypeId, 
  frequencyId, 
  className 
}: PricingSummaryCardProps) {
  const serviceType = DEFAULT_PRICING_CONFIG.serviceTypes.find(s => s.id === serviceTypeId);
  const frequency = DEFAULT_PRICING_CONFIG.frequencies.find(f => f.id === frequencyId);

  if (!serviceTypeId || !frequencyId) {
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

  // Calculate fixed pricing
  const pricing = calculateFixedPricing(serviceTypeId, frequencyId);
  const isRecurring = pricing.isRecurring;
  const serviceTypeName = SERVICE_TYPE_NAMES[pricing.serviceType as keyof typeof SERVICE_TYPE_NAMES];
  const frequencyName = FREQUENCY_NAMES[pricing.frequency as keyof typeof FREQUENCY_NAMES];

  return (
    <Card className={cn("shadow-lg border-primary/20", className)}>
      <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-3">

        {/* Final Price */}
        <div className="flex justify-between items-center pt-2">
          <span className="text-lg font-bold text-foreground">
            {isRecurring ? 'Monthly' : 'Service'} Total
          </span>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">
              {formatPrice(pricing.finalPrice)}
            </p>
          </div>
        </div>

        {/* Per-clean breakdown for recurring */}
        {isRecurring && pricing.cleansPerMonth && (
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">
              {formatPrice(pricing.perCleanPrice || 0)} per clean × {pricing.cleansPerMonth} clean{pricing.cleansPerMonth > 1 ? 's' : ''}/month
            </p>
          </div>
        )}

        {/* Service details */}
        <Separator className="my-4" />
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            {serviceType?.name || serviceTypeName} • {frequency?.name || frequencyName}
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
