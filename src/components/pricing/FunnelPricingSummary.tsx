import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/pricing-utils';
import { Sparkles, Shield, Clock, TrendingDown } from 'lucide-react';

interface FunnelPricingSummaryProps {
  serviceName?: string;
  homeSize?: string;
  frequency?: string;
  addOnsCount?: number;
  subtotal?: number;
  discount?: number;
  total?: number;
  savings?: number;
  recurringService?: boolean;
  monthlyEstimate?: number;
}

export function FunnelPricingSummary({
  serviceName,
  homeSize,
  frequency,
  addOnsCount = 0,
  subtotal = 0,
  discount = 0,
  total = 0,
  savings = 0,
  recurringService = false,
  monthlyEstimate
}: FunnelPricingSummaryProps) {
  const hasSelection = serviceName && homeSize && frequency;
  
  if (!hasSelection) {
    return (
      <Card className="sticky top-24 funnel-card">
        <CardHeader className="bg-gradient-to-br from-primary/5 to-accent/5 border-b">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Your Booking Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center space-y-4 py-8">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Start Your Booking</p>
              <p className="text-sm text-muted-foreground">
                Select your service options to see your personalized pricing
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="sticky top-24 funnel-card border-primary/20">
      <CardHeader className="bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border-b">
        <div className="flex items-start justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Booking Summary
          </CardTitle>
          {savings > 0 && (
            <Badge className="bg-funnel-success text-white animate-bounce-subtle">
              Save ${savings.toFixed(0)}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-6">
        {/* Service Details */}
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Service Type</p>
            <p className="font-semibold text-foreground">{serviceName}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Home Size</p>
              <p className="font-medium text-sm text-foreground">{homeSize}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Frequency</p>
              <p className="font-medium text-sm text-foreground">{frequency}</p>
            </div>
          </div>
          {addOnsCount > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Add-ons</p>
              <Badge variant="outline" className="text-xs">
                {addOnsCount} selected
              </Badge>
            </div>
          )}
        </div>

        <Separator />

        {/* Pricing Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatPrice(subtotal)}</span>
          </div>
          
          {discount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-funnel-success" />
                Discount (20%)
              </span>
              <span className="font-medium text-funnel-success">-{formatPrice(discount)}</span>
            </div>
          )}

          <Separator />

          {/* Total Price - Emphasized */}
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Original Price</span>
              <span className="text-sm line-through text-muted-foreground">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-semibold text-foreground">Your Price</span>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">
                  {formatPrice(total)}
                </div>
                {savings > 0 && (
                  <p className="text-xs text-funnel-success font-medium">
                    You save {formatPrice(savings)}!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recurring Revenue Estimate */}
        {recurringService && monthlyEstimate && (
          <div className="bg-funnel-success-light border border-funnel-success/20 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-funnel-success mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-funnel-success mb-1">
                  Recurring Service
                </p>
                <p className="text-sm text-muted-foreground">
                  Est. {formatPrice(monthlyEstimate)}/month
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Trust Indicators */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-4 w-4 text-primary" />
            <span>Pay only after service completion</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>100% Satisfaction Guarantee</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
