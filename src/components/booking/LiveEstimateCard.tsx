import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface LiveEstimateCardProps {
  serviceType: string;
  frequency: string;
  basePrice: number;
  discountAmount: number;
  discountRate?: number;
  finalPrice: number;
  depositAmount: number;
  showDeposit?: boolean;
  className?: string;
}

export function LiveEstimateCard({
  serviceType,
  frequency,
  basePrice,
  discountAmount,
  discountRate,
  finalPrice,
  depositAmount,
  showDeposit = false,
  className = '',
}: LiveEstimateCardProps) {
  const serviceTypeLabels: Record<string, string> = {
    regular: 'Standard Cleaning',
    deep: 'Deep Cleaning',
    move_in_out: 'Move-In/Out Cleaning',
  };

  const frequencyLabels: Record<string, string> = {
    one_time: 'One-Time',
    weekly: 'Weekly',
    bi_weekly: 'Bi-Weekly',
    monthly: 'Monthly',
  };

  return (
    <Card className={`sticky top-24 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Your Estimate</span>
          {discountAmount > 0 && (
            <Badge className="ml-auto bg-success text-success-foreground">
              Save ${discountAmount.toFixed(0)}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Service:</span>
            <span className="text-sm font-medium">
              {serviceTypeLabels[serviceType] || serviceType}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Frequency:</span>
            <span className="text-sm font-medium">
              {frequencyLabels[frequency] || frequency}
            </span>
          </div>
          
          <Separator />
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Subtotal:</span>
            <span className="text-sm">${basePrice.toFixed(2)}</span>
          </div>
          
          {discountAmount > 0 && (
            <div className="flex justify-between text-success">
              <span className="text-sm">
                Discount {discountRate ? `(${discountRate}%)` : ''}:
              </span>
              <span className="text-sm font-medium">
                -${discountAmount.toFixed(2)}
              </span>
            </div>
          )}
          
          <Separator />
          
          <div className="flex justify-between items-center">
            <span className="font-semibold">Estimated Total:</span>
            <span className="text-2xl font-bold text-primary">
              ${finalPrice.toFixed(2)}
            </span>
          </div>
          
          {showDeposit && (
            <>
              <Separator />
              <div className="bg-primary/10 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Due Today:</span>
                  <span className="text-xl font-bold text-primary">
                    ${depositAmount.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Remaining ${(finalPrice - depositAmount).toFixed(2)} due after service
                </p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
