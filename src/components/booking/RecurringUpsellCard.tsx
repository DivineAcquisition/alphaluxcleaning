import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecurringUpsellCardProps {
  oneTimePrice: number;
  monthlyPrice: number;
  onSelectOneTime: () => void;
  onSelectMonthly: () => void;
  selectedFrequency: string;
}

export function RecurringUpsellCard({
  oneTimePrice,
  monthlyPrice,
  onSelectOneTime,
  onSelectMonthly,
  selectedFrequency,
}: RecurringUpsellCardProps) {
  const savings = oneTimePrice - monthlyPrice;
  const annualSavings = savings * 12;

  return (
    <Card className="p-6 border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 mb-6">
      <div className="flex items-start gap-3 mb-4">
        <Sparkles className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
        <div>
          <h3 className="text-xl font-bold mb-1">
            💡 Convert to Monthly Home Reset Membership
          </h3>
          <p className="text-sm text-muted-foreground">
            Lock in a better rate and never worry about scheduling again
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* One-Time Option */}
        <button
          onClick={onSelectOneTime}
          className={cn(
            'p-4 rounded-lg border-2 transition-all text-left',
            selectedFrequency === 'one_time'
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50'
          )}
        >
          <div className="text-sm text-muted-foreground mb-2">One-Time Clean</div>
          <div className="text-3xl font-bold mb-3">${oneTimePrice}</div>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Pay once, no commitment</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Book again anytime</span>
            </div>
          </div>
        </button>

        {/* Monthly Membership Option */}
        <button
          onClick={onSelectMonthly}
          className={cn(
            'p-4 rounded-lg border-2 transition-all text-left relative',
            selectedFrequency === 'monthly'
              ? 'border-primary bg-primary/10'
              : 'border-primary/50 hover:border-primary'
          )}
        >
          <Badge className="absolute -top-2 -right-2 bg-success">
            Save ${savings}
          </Badge>
          <div className="text-sm text-muted-foreground mb-2">Monthly Membership</div>
          <div className="flex items-baseline gap-2 mb-3">
            <div className="text-3xl font-bold">${monthlyPrice}</div>
            <div className="text-sm text-muted-foreground line-through">${oneTimePrice}</div>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span className="font-medium">Same cleaner, same time</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Priority rescheduling</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Cancel after 3 months</span>
            </div>
          </div>
        </button>
      </div>

      <div className="bg-success/10 rounded-lg p-4 border border-success/30">
        <p className="text-sm font-medium text-center">
          ✨ Save ${annualSavings}/year with Monthly Membership
        </p>
      </div>
    </Card>
  );
}
