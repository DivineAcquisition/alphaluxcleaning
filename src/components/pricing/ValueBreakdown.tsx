import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Check } from 'lucide-react';

interface ValueBreakdownProps {
  basePrice: number;
  discountAmount: number;
  finalPrice: number;
  frequency: string;
  estimatedHours: number;
}

export function ValueBreakdown({ 
  basePrice, 
  discountAmount, 
  finalPrice,
  frequency,
  estimatedHours 
}: ValueBreakdownProps) {
  const discountPercentage = (discountAmount / basePrice) * 100;
  const perDay = frequency !== 'one_time' 
    ? finalPrice / (frequency === 'weekly' ? 7 : frequency === 'bi_weekly' ? 14 : 30)
    : 0;
  
  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-4">Your Value Breakdown</h3>
      
      <div className="space-y-4">
        {/* Base Service Value */}
        <div className="flex justify-between items-center pb-3 border-b">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-primary" />
            <span className="font-medium">Professional Service Value</span>
          </div>
          <span className="text-lg font-semibold">${Math.round(basePrice)}</span>
        </div>
        
        {/* Discount Applied */}
        {discountAmount > 0 && (
          <div className="flex justify-between items-center pb-3 border-b">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-600">
                {discountPercentage.toFixed(0)}% Discount Applied
              </span>
            </div>
            <span className="text-lg font-semibold text-green-600">
              -${Math.round(discountAmount)}
            </span>
          </div>
        )}
        
        {/* Final Price */}
        <div className="flex justify-between items-center pt-2">
          <span className="text-xl font-bold">Your Price</span>
          <span className="text-3xl font-bold text-primary">
            ${Math.round(finalPrice)}
          </span>
        </div>
        
        {/* Savings Progress Bar */}
        {discountAmount > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Total Savings</span>
              <span className="font-medium">${Math.round(discountAmount)}</span>
            </div>
            <Progress value={discountPercentage} className="h-2" />
          </div>
        )}
        
        {/* Cost Breakdown */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t">
          <div className="bg-muted/50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-primary">
              ${Math.round(finalPrice / estimatedHours)}
            </div>
            <div className="text-xs text-muted-foreground">per hour</div>
          </div>
          
          {frequency !== 'one_time' && perDay > 0 && (
            <div className="bg-muted/50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">
                ${Math.round(perDay)}
              </div>
              <div className="text-xs text-muted-foreground">per day</div>
            </div>
          )}
          
          {frequency === 'one_time' && (
            <div className="bg-muted/50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">
                {estimatedHours}
              </div>
              <div className="text-xs text-muted-foreground">hours service</div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
