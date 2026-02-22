import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Sparkles } from 'lucide-react';

interface PriceSummaryProps {
  basePrice: number;
  addOnsTotal: number;
  subtotal: number;
  recurringDiscount: number;
  membershipDiscount: number;
  referralDiscount?: number;
  codeDiscount?: number;
  creditsDiscount?: number;
  total: number;
  membershipFee?: number;
  selectedTier?: any;
  selectedAddOns?: any[];
  selectedRecurring?: any;
  membership?: boolean;
  newClient?: boolean;
}

export function PriceSummaryCard({
  basePrice,
  addOnsTotal,
  subtotal,
  recurringDiscount,
  membershipDiscount,
  referralDiscount = 0,
  codeDiscount = 0,
  creditsDiscount = 0,
  total,
  membershipFee = 0,
  selectedTier,
  selectedAddOns = [],
  selectedRecurring,
  membership = false,
  newClient = false
}: PriceSummaryProps) {
  const totalSavings = recurringDiscount + membershipDiscount + referralDiscount + codeDiscount + creditsDiscount;
  
  // Show placeholder when no service is selected
  if (!selectedTier) {
    return (
      <Card className="sticky top-4 border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-primary to-accent text-white">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="text-center py-8">
            <div className="text-muted-foreground mb-2">
              Select a service to see pricing
            </div>
            <div className="text-2xl font-bold text-primary">
              $--
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="sticky top-4 border-0 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-primary to-accent text-white">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5" />
          Order Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* Service Details */}
        {selectedTier && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-medium">
                  {selectedTier.id === 'general' ? 'General Cleaning' : 
                   selectedTier.id === 'complete' ? 'Deep Clean' : 
                   'Premium Deep Clean'}
                </span>
                <div className="text-sm text-muted-foreground">
                  {selectedTier.hours} hours • {selectedTier.cleaners} cleaners
                </div>
              </div>
              <div className="text-right">
                {basePrice < selectedTier.basePrice ? (
                  <div className="flex items-center gap-2">
                    <div>
                      <span className="line-through text-muted-foreground text-sm mr-2">${selectedTier.basePrice}</span>
                      <span className="font-semibold">${basePrice}</span>
                    </div>
                    {newClient && selectedTier.id === 'complete' ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                        New Client Special
                      </Badge>
                    ) : selectedTier.id === 'premium' ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                        20% off
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                        15% off
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="font-semibold">${basePrice}</span>
                )}
              </div>
            </div>
            
            {newClient && selectedTier.id === 'complete' && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                New Client Special Applied
              </Badge>
            )}
          </div>
        )}

        {/* Add-ons */}
        {selectedAddOns.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Add-ons:</div>
            {selectedAddOns.map((addOn, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{addOn.name}</span>
                <span>${addOn.price}</span>
              </div>
            ))}
          </div>
        )}

        <Separator />

        {/* Pricing Breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${subtotal}</span>
          </div>

          {/* Recurring Discount */}
          {recurringDiscount > 0 && selectedRecurring && (
            <div className="flex justify-between text-green-600">
              <span>{selectedRecurring?.name || 'Recurring'} Discount ({selectedRecurring?.discount || 0}%)</span>
              <span>-${recurringDiscount}</span>
            </div>
          )}

          {/* Membership Discount */}
          {membershipDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>AlphaLux Club™ Discount</span>
              <span>-${membershipDiscount}</span>
            </div>
          )}

          {/* Referral Discount */}
          {referralDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Referral Discount (10%)</span>
              <span>-${referralDiscount.toFixed(2)}</span>
            </div>
          )}

          {/* Discount Code */}
          {codeDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount Code (50%)</span>
              <span>-${codeDiscount.toFixed(2)}</span>
            </div>
          )}

          {/* Referral Credits */}
          {creditsDiscount > 0 && (
            <div className="flex justify-between text-green-600 font-semibold">
              <span>Referral Credits Applied 🎁</span>
              <span>-${creditsDiscount.toFixed(2)}</span>
            </div>
          )}

          {/* Membership Fee */}
          {membershipFee > 0 && (
            <div className="flex justify-between">
              <span>AlphaLux Club™ Membership</span>
              <span>${membershipFee}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Total */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xl font-bold bg-primary/10 p-3 rounded-lg">
            <span>Total</span>
            <span className="text-primary text-2xl">${total}</span>
          </div>

          {/* Savings Highlight */}
          {totalSavings > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <span className="font-semibold">You're saving ${totalSavings}!</span>
              </div>
              {selectedRecurring?.frequency !== 'once' && (
                <p className="text-sm text-green-700 mt-1">
                  With {selectedRecurring?.name?.toLowerCase() || 'recurring'} service
                </p>
              )}
            </div>
          )}

          {/* Recurring Service Highlight */}
          {selectedRecurring?.frequency !== 'once' && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <div className="text-primary font-medium text-sm">
                🔄 Recurring {selectedRecurring?.name || 'Service'} Service
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Your next service will be automatically scheduled
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}