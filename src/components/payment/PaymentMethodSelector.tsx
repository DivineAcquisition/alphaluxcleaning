import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentMethodSelectorProps {
  selectedMethod: 'stripe_checkout' | 'embedded_payment';
  onMethodChange: (method: 'stripe_checkout' | 'embedded_payment') => void;
  amount: number;
}

export function PaymentMethodSelector({ selectedMethod, onMethodChange, amount }: PaymentMethodSelectorProps) {
  return (
    <Card className="shadow-clean">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Choose Payment Method</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => onMethodChange('embedded_payment')}
            className={cn(
              "p-4 rounded-lg border-2 text-left transition-all duration-200",
              selectedMethod === 'embedded_payment'
                ? "border-primary bg-primary/5 shadow-clean"
                : "border-border hover:border-primary/50"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={cn(
                "w-4 h-4 rounded-full border-2",
                selectedMethod === 'embedded_payment' ? "border-primary bg-primary" : "border-muted"
              )}>
                {selectedMethod === 'embedded_payment' && (
                  <div className="w-2 h-2 rounded-full bg-white m-0.5" />
                )}
              </div>
              <CreditCard className="h-5 w-5" />
              <span className="font-semibold">Pay Here</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Complete payment without leaving this page
            </p>
            <div className="text-xs text-success mt-2">
              ✓ Faster checkout ✓ More secure
            </div>
          </button>

          <button
            onClick={() => onMethodChange('stripe_checkout')}
            className={cn(
              "p-4 rounded-lg border-2 text-left transition-all duration-200",
              selectedMethod === 'stripe_checkout'
                ? "border-primary bg-primary/5 shadow-clean"
                : "border-border hover:border-primary/50"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={cn(
                "w-4 h-4 rounded-full border-2",
                selectedMethod === 'stripe_checkout' ? "border-primary bg-primary" : "border-muted"
              )}>
                {selectedMethod === 'stripe_checkout' && (
                  <div className="w-2 h-2 rounded-full bg-white m-0.5" />
                )}
              </div>
              <ExternalLink className="h-5 w-5" />
              <span className="font-semibold">Stripe Checkout</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Redirects to Stripe's secure payment page
            </p>
            <div className="text-xs text-muted-foreground mt-2">
              Traditional checkout flow
            </div>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}