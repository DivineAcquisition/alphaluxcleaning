import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, Tag, Sparkles } from 'lucide-react';
import { formatPrice, calculateGlobalDiscountAmount } from '@/lib/pricing-utils';

interface BookingData {
  serviceType: string;
  homeSize: string;
  frequency: string;
  addOns: string[];
  basePrice: number;
  totalPrice: number;
  savings: number;
  discountPercentage?: number;
  originalBasePrice?: number;
}

interface ServiceType {
  id: string;
  name: string;
}

interface HomeSize {
  id: string;
  name: string;
  multiplier: number;
}

interface FrequencyOption {
  id: string;
  name: string;
  discount: number;
}

interface AddOnService {
  id: string;
  name: string;
  price: number;
}

interface PricingSummaryProps {
  bookingData: BookingData;
  serviceTypes: ServiceType[];
  homeSizes: HomeSize[];
  frequencyOptions: FrequencyOption[];
  addOnServices: AddOnService[];
}

export function PricingSummarySticky({
  bookingData,
  serviceTypes,
  homeSizes,
  frequencyOptions,
  addOnServices
}: PricingSummaryProps) {
  const selectedService = serviceTypes.find(s => s.id === bookingData.serviceType);
  const selectedSize = homeSizes.find(h => h.id === bookingData.homeSize);
  const selectedFrequency = frequencyOptions.find(f => f.id === bookingData.frequency);
  
  // Use actual pricing data from booking calculation
  const originalBasePrice = bookingData.originalBasePrice || bookingData.basePrice;
  const discountedBasePrice = bookingData.basePrice;

  // Calculate add-ons (no discount on add-ons)
  const addOnsTotal = bookingData.addOns.reduce((total, addOnId) => {
    const addOn = addOnServices.find(a => a.id === addOnId);
    return total + (addOn?.price || 0);
  }, 0);

  const originalSubtotal = originalBasePrice + addOnsTotal;
  const discountAmount = originalSubtotal - bookingData.totalPrice;
  const hasDiscount = discountAmount > 0;
  const discountPercentage = bookingData.discountPercentage || 0;

  if (!selectedService) {
    return (
      <div className="lg:sticky lg:top-8">
        <Card className="shadow-lg border-primary/20">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Pricing Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                Select your service to see pricing
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="lg:sticky lg:top-8">
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Pricing Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {/* Service Details */}
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-foreground">{selectedService.name}</p>
                {selectedSize && (
                  <p className="text-sm text-muted-foreground">{selectedSize.name}</p>
                )}
                {selectedFrequency && (
                  <p className="text-sm text-muted-foreground">{selectedFrequency.name}</p>
                )}
              </div>
              <p className="font-semibold text-right">
                {formatPrice(bookingData.basePrice)}
              </p>
            </div>
          </div>

          {/* Add-ons */}
          {bookingData.addOns.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Add-On Services</p>
                {bookingData.addOns.map(addOnId => {
                  const addOn = addOnServices.find(a => a.id === addOnId);
                  if (!addOn) return null;
                  
                  // Add-ons should not have discounts applied
                  return (
                    <div key={addOnId} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{addOn.name}</span>
                      <span className="font-medium">{formatPrice(addOn.price)}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Pricing Breakdown */}
          <Separator />
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatPrice(originalSubtotal)}</span>
            </div>
            {hasDiscount && (
              <div className="flex justify-between text-sm">
                <span className="text-success flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {discountPercentage > 0 
                    ? `${Math.round(discountPercentage)}% Savings Applied` 
                    : 'Savings Applied'}
                </span>
                <span className="font-medium text-success">-{formatPrice(discountAmount)}</span>
              </div>
            )}
          </div>

          {/* Total */}
          <Separator className="border-primary/20" />
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-foreground">Total</span>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                {formatPrice(bookingData.totalPrice)}
              </p>
              {hasDiscount && (
                <p className="text-xs text-success font-medium">
                  You save ${formatPrice(discountAmount)}!
                </p>
              )}
            </div>
          </div>

          {/* Payment Note */}
          <div className="pt-4 border-t border-border/50">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-success">Pay After Service</p>
              <p className="text-xs text-muted-foreground">
                No payment required now. You'll be charged only after your cleaning is complete.
              </p>
            </div>
          </div>

          {/* Service Guarantee */}
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-primary">100% Satisfaction Guarantee</p>
              <p className="text-xs text-muted-foreground">
                Not happy? We'll make it right or refund your money.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}