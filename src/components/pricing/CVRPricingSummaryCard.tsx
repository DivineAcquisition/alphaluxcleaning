import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, TrendingUp, DollarSign, Tag, Sparkles, Shield, CheckCircle, Zap } from 'lucide-react';
import { formatPrice } from '@/lib/pricing-utils';
import { PricingResult, HOME_SIZE_RANGES, DEFAULT_PRICING_CONFIG } from '@/lib/new-pricing-system';
import { cn } from '@/lib/utils';

interface CVRPricingSummaryCardProps {
  result: PricingResult | null;
  homeSizeId?: string;
  serviceTypeId?: string;
  frequencyId?: string;
  stateCode?: string;
  className?: string;
}

export function CVRPricingSummaryCard({ 
  result, 
  homeSizeId, 
  serviceTypeId, 
  frequencyId, 
  stateCode,
  className 
}: CVRPricingSummaryCardProps) {
  const homeSize = HOME_SIZE_RANGES.find(h => h.id === homeSizeId);
  const serviceType = DEFAULT_PRICING_CONFIG.serviceTypes.find(s => s.id === serviceTypeId);
  const frequency = DEFAULT_PRICING_CONFIG.frequencies.find(f => f.id === frequencyId);
  const state = DEFAULT_PRICING_CONFIG.states.find(s => s.code === stateCode);

  if (!result || !homeSize || !serviceType || !frequency || !state) {
    return (
      <Card className={cn("shadow-premium border-primary/20 hover-lift", className)}>
        <CardHeader className="gradient-premium text-white">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 animate-pulse" />
            Your Instant Quote
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-8 space-y-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto animate-pulse-glow">
              <DollarSign className="h-10 w-10 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground mb-2">
                Get Your Price Instantly
              </p>
              <p className="text-sm text-muted-foreground">
                Select your options above to see your personalized quote
              </p>
            </div>
            <Badge className="gradient-trust text-white px-4 py-2">
              <CheckCircle className="w-4 h-4 mr-2" />
              100% Satisfaction Guaranteed
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (homeSize.requiresEstimate) {
    return (
      <Card className={cn("shadow-premium border-primary/20", className)}>
        <CardHeader className="gradient-premium text-white">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Custom Quote Needed
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-8 space-y-4">
            <div className="text-6xl font-bold text-primary animate-bounce-subtle">
              📞
            </div>
            <div className="space-y-2">
              <p className="text-xl font-bold text-foreground">Large Home?</p>
              <p className="text-lg font-medium text-muted-foreground">
                We'll create a custom quote for your 5,000+ sq ft home
              </p>
            </div>
            <Badge className="gradient-urgency text-white px-6 py-3 text-base">
              <Shield className="w-4 h-4 mr-2" />
              Premium Service Available
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  const originalPrice = result.finalPrice / 0.8;
  const savings = originalPrice - result.finalPrice;
  const savingsPercent = Math.round((savings / originalPrice) * 100);
  const hasRecurring = result.mrrEstimate > 0;

  return (
    <Card className={cn("shadow-premium border-primary/20 animate-fade-in hover-lift", className)}>
      <CardHeader className="gradient-premium text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 animate-pulse" />
              Your Deal
            </CardTitle>
            <Badge className="bg-white/20 text-white border-white/30 animate-pulse">
              🔥 LIMITED TIME
            </Badge>
          </div>
          <p className="text-white/90 text-sm">All savings applied - Book now!</p>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-4">
        {/* Service Details with Icons */}
        <div className="space-y-3 p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 border-primary/20">
              <Zap className="w-3 h-3 mr-1" />
              {serviceType.name}
            </Badge>
            <Badge variant="outline" className="bg-accent/10 border-accent/20">
              {homeSize.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">{frequency.name}</span>
            <span>•</span>
            <span>{state.name}</span>
            <span>•</span>
            <span className="text-success font-medium">~{homeSize.estimatedHours}h service</span>
          </div>
        </div>

        {/* Dramatic Price Display */}
        <div className="text-center p-6 gradient-premium rounded-xl space-y-3 animate-scale-in">
          <div className="space-y-1">
            <p className="text-sm text-white/80 font-medium">Your Price Today</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl line-through text-white/60">
                {formatPrice(originalPrice)}
              </span>
              <Badge className="bg-destructive text-white px-3 py-1 text-lg font-bold">
                -{savingsPercent}%
              </Badge>
            </div>
            <div className="text-5xl font-bold text-white animate-pulse">
              {formatPrice(result.finalPrice)}
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-white/90 text-sm">
            <Tag className="h-4 w-4" />
            <span className="font-semibold">You save {formatPrice(savings)}!</span>
          </div>
        </div>

        {/* Value Props */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Shield, text: '20% Deposit Only', color: 'text-success' },
            { icon: CheckCircle, text: 'Pay After Clean', color: 'text-primary' },
            { icon: Sparkles, text: 'Pro Team', color: 'text-accent' },
            { icon: TrendingUp, text: '5-Star Rated', color: 'text-warning' }
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
              <item.icon className={cn("h-4 w-4", item.color)} />
              <span className="text-xs font-medium text-foreground">{item.text}</span>
            </div>
          ))}
        </div>

        {/* Pricing Breakdown (Collapsible Style) */}
        <details className="group">
          <summary className="cursor-pointer list-none flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
            <span className="text-sm font-medium text-foreground">View Price Breakdown</span>
            <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-2 p-4 bg-muted/20 rounded-lg space-y-2 text-sm animate-fade-in">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base ({homeSize.estimatedHours}h × 2 pros)</span>
              <span className="font-medium">{formatPrice(result.breakdown.baseCalculation)}</span>
            </div>
            {result.breakdown.stateMultiplier !== 1 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{state.name} rate</span>
                <span className="font-medium">×{result.breakdown.stateMultiplier}</span>
              </div>
            )}
            {result.breakdown.frequencyDiscount > 0 && (
              <div className="flex justify-between text-success">
                <span>Frequency savings</span>
                <span className="font-medium">-{Math.round(result.breakdown.frequencyDiscount * 100)}%</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-success font-medium">
              <span>20% Limited Offer</span>
              <span>-{formatPrice(savings)}</span>
            </div>
          </div>
        </details>

        {/* Recurring Revenue Highlight */}
        {hasRecurring && (
          <div className="p-4 gradient-trust rounded-lg text-white space-y-2 animate-fade-in">
            <div className="flex items-center gap-2 font-semibold">
              <TrendingUp className="h-5 w-5" />
              <span>Recurring Service Value</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-white/80">Monthly</p>
                <p className="text-xl font-bold">{formatPrice(result.mrrEstimate)}</p>
              </div>
              <div>
                <p className="text-xs text-white/80">Yearly Value</p>
                <p className="text-xl font-bold">{formatPrice(result.arrEstimate)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Trust Footer */}
        <div className="pt-4 border-t border-border/50 space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-5 w-5 text-success" />
            <p className="text-sm font-bold text-success">100% Satisfaction Guaranteed</p>
          </div>
          <p className="text-xs text-center text-muted-foreground">
            Only 20% deposit required • Remaining balance due after service • Cancel anytime
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
