import { Card } from '@/components/ui/card';
import { TrendingDown, DollarSign } from 'lucide-react';

interface SavingsCalculatorProps {
  basePrice: number;
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
  discountRate: number;
}

export function SavingsCalculator({ basePrice, frequency, discountRate }: SavingsCalculatorProps) {
  const recurringPrice = basePrice * (1 - discountRate);
  const savingsPerVisit = basePrice - recurringPrice;
  
  // Calculate annual statistics
  const visitsPerYear = frequency === 'weekly' ? 52 : frequency === 'bi-weekly' ? 26 : 12;
  const annualOneTimePrice = basePrice * visitsPerYear;
  const annualRecurringPrice = recurringPrice * visitsPerYear;
  const annualSavings = annualOneTimePrice - annualRecurringPrice;

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="flex items-center gap-2 mb-6">
        <TrendingDown className="h-6 w-6 text-primary" />
        <h3 className="text-xl font-bold">Your Savings Breakdown</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Per Visit Savings */}
        <div className="space-y-3">
          <h4 className="font-semibold text-muted-foreground uppercase text-sm">Per Visit</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">One-time price:</span>
              <span className="font-medium line-through">${basePrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Recurring price:</span>
              <span className="text-2xl font-bold text-primary">${recurringPrice.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-primary/20">
              <div className="flex justify-between items-center">
                <span className="font-semibold">You save:</span>
                <span className="text-xl font-bold text-green-600">
                  ${savingsPerVisit.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Annual Savings */}
        <div className="space-y-3">
          <h4 className="font-semibold text-muted-foreground uppercase text-sm">Annual Impact</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">One-time total:</span>
              <span className="font-medium line-through">${annualOneTimePrice.toFixed(0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Recurring total:</span>
              <span className="text-2xl font-bold text-primary">${annualRecurringPrice.toFixed(0)}</span>
            </div>
            <div className="pt-2 border-t border-primary/20">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Annual savings:</span>
                <span className="text-xl font-bold text-green-600">
                  ${annualSavings.toFixed(0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="mt-6 pt-6 border-t border-primary/20">
        <div className="bg-background rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-5 w-5 text-primary" />
            <h4 className="font-semibold">Recurring vs One-Time</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount applied:</span>
              <span className="font-bold text-primary">{(discountRate * 100).toFixed(0)}% off every visit</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service frequency:</span>
              <span className="font-medium">{visitsPerYear} times per year</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total visits saved:</span>
              <span className="font-bold text-green-600">
                {Math.floor(annualSavings / recurringPrice)} free cleans!
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
