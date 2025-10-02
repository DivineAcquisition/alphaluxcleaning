import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Check, Sparkles, MapPin } from 'lucide-react';
import { 
  StateCode,
  getStateConfig,
  applyDiscount,
  calculateRecurringPricing,
  DISCOUNT_RATE 
} from '@/lib/state-pricing-system';
import { cn } from '@/lib/utils';

interface StatePricingTableProps {
  stateCode: StateCode;
  className?: string;
}

export function StatePricingTable({ stateCode, className }: StatePricingTableProps) {
  const state = getStateConfig(stateCode);
  
  if (!state) return null;

  return (
    <Card className={cn("shadow-lg", className)}>
      <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          {state.displayName} Pricing
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Pricing Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left py-3 px-2 font-semibold text-sm">Square Footage</th>
                  <th className="text-center py-3 px-2 font-semibold text-sm">Regular Clean</th>
                  <th className="text-center py-3 px-2 font-semibold text-sm">Deep Clean</th>
                  <th className="text-center py-3 px-2 font-semibold text-sm">Move-In/Out</th>
                </tr>
              </thead>
              <tbody>
                {state.tiers.filter(tier => tier.id !== '5000_plus').map((tier, index) => {
                  return (
                    <React.Fragment key={tier.id}>
                      <tr className={cn(
                        "border-b border-border hover:bg-muted/50 transition-colors",
                        index % 2 === 0 && "bg-muted/20"
                      )}>
                        <td className="py-4 px-2 font-medium text-sm">{tier.label}</td>
                        <td className="text-center py-4 px-2">
                          <span className="text-lg font-bold text-primary">
                            ${tier.regular}
                          </span>
                        </td>
                        <td className="text-center py-4 px-2">
                          <span className="text-lg font-bold text-primary">
                            ${tier.deep}
                          </span>
                        </td>
                        <td className="text-center py-4 px-2">
                          <span className="text-lg font-bold text-primary">
                            ${tier.moveInOut}
                          </span>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
                {/* 5000+ Custom Quote */}
                <tr className="border-b border-border bg-accent/10">
                  <td className="py-4 px-2 font-medium text-sm">5,000+ sq ft</td>
                  <td colSpan={3} className="text-center py-4 px-2">
                    <Badge variant="outline" className="text-sm">
                      Custom Quote Required
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <Separator />

          {/* Recurring Pricing Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              Regular Clean Recurring Options
            </h3>
            
            <div className="grid gap-3">
              {state.tiers.filter(tier => tier.id !== '5000_plus').slice(0, 3).map((tier) => {
                const recurring = calculateRecurringPricing(tier.regular);

                return (
                  <details key={tier.id} className="group">
                    <summary className="cursor-pointer list-none">
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                        <span className="text-sm font-medium">{tier.label}</span>
                        <span className="text-xs text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                      </div>
                    </summary>
                    <div className="mt-2 pl-4 space-y-2 text-sm">
                      <div className="flex justify-between items-center py-2">
                        <span className="text-muted-foreground">Weekly (4× / month)</span>
                        <div className="text-right">
                          <div className="font-bold text-primary">
                            ${recurring.weeklyMonthly}/mo
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ${recurring.weeklyPerClean}/clean
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-muted-foreground">Bi-Weekly (2× / month)</span>
                        <div className="text-right">
                          <div className="font-bold text-primary">
                            ${recurring.biWeeklyMonthly}/mo
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ${recurring.biWeeklyPerClean}/clean
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-muted-foreground">Monthly (1× / month)</span>
                        <div className="text-right">
                          <div className="font-bold text-primary">
                            ${recurring.monthlyMonthly}/mo
                          </div>
                        </div>
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Service Notes */}
          <div className="space-y-2 text-xs text-muted-foreground">
            <p className="flex items-start gap-2">
              <Check className="h-3 w-3 text-success mt-0.5 flex-shrink-0" />
              <span><strong>Regular Clean:</strong> Available one-time or recurring (weekly, bi-weekly, monthly)</span>
            </p>
            <p className="flex items-start gap-2">
              <Check className="h-3 w-3 text-success mt-0.5 flex-shrink-0" />
              <span><strong>Deep Clean:</strong> One-time service only (~35% more thorough than regular)</span>
            </p>
            <p className="flex items-start gap-2">
              <Check className="h-3 w-3 text-success mt-0.5 flex-shrink-0" />
              <span><strong>Move-In/Out:</strong> One-time service only (~50% more comprehensive)</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
