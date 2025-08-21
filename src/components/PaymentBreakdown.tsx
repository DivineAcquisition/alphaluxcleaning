import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, Calendar, DollarSign, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PaymentBreakdownProps {
  order: {
    id: string;
    amount: number;
    frequency?: string;
    status: string;
    service_details?: any;
    payment_details?: any;
    add_ons?: string[];
    scheduled_date?: string;
    stripe_payment_intent_id?: string;
    created_at: string;
  };
}

interface PaymentDetails {
  paymentMethod?: {
    type: string;
    last4?: string;
    brand?: string;
  };
  breakdown?: {
    basePrice: number;
    addOns: number;
    taxes: number;
    total: number;
    addOnsList?: Array<{name: string, price: number}>;
  };
  nextPayment?: {
    amount: number;
    date: string;
  };
}

export const PaymentBreakdown = ({ order }: PaymentBreakdownProps) => {
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentDetails();
  }, [order.id]);

  const fetchPaymentDetails = async () => {
    try {
      // Extract real pricing data from service_details
      const serviceDetails = order.service_details || {};
      const paymentDetails = order.payment_details || {};
      
      // Get base service price and add-ons from service_details
      let basePrice = order.amount;
      let addOnsTotal = 0;
      let addOnsList: Array<{name: string, price: number}> = [];
      
      // Try to extract pricing from service_details structure
      if (serviceDetails.pricing) {
        basePrice = Math.round((serviceDetails.pricing.basePrice || serviceDetails.pricing.subtotal || order.amount) * 100);
        addOnsTotal = Math.round((serviceDetails.pricing.addOnsTotal || 0) * 100);
        
        // Extract individual add-ons with prices
        if (serviceDetails.pricing.addOns && Array.isArray(serviceDetails.pricing.addOns)) {
          addOnsList = serviceDetails.pricing.addOns.map((addon: any) => ({
            name: addon.name || addon.title || addon.service || 'Additional Service',
            price: Math.round((addon.price || addon.cost || 0) * 100)
          }));
        }
      } else if (serviceDetails.addOns || order.add_ons) {
        // Fallback: estimate add-ons cost if no detailed pricing
        const addOns = serviceDetails.addOns || order.add_ons || [];
        if (addOns.length > 0) {
          addOnsTotal = Math.round(order.amount * 0.15); // Estimate 15% for add-ons
          basePrice = order.amount - addOnsTotal;
          
          addOnsList = addOns.map((addon: string) => ({
            name: addon.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
            price: Math.round(addOnsTotal / addOns.length) // Distribute evenly
          }));
        }
      }

      // Calculate taxes (typically remainder after base + addons)
      const taxes = order.amount - basePrice - addOnsTotal;

      const breakdown = {
        basePrice,
        addOns: addOnsTotal,
        taxes: Math.max(0, taxes), // Ensure non-negative
        total: order.amount,
        addOnsList
      };

      // Extract payment method from payment_details if available
      let paymentMethod = null;
      if (paymentDetails.payment_method || serviceDetails.paymentMethod) {
        const pmData = paymentDetails.payment_method || serviceDetails.paymentMethod;
        paymentMethod = {
          type: pmData.type || 'card',
          last4: pmData.last4 || '****',
          brand: pmData.brand || 'card'
        };
      }

      // Calculate next payment for recurring services
      let nextPayment = null;
      if (order.frequency && order.frequency !== 'one_time') {
        const nextDate = new Date();
        const scheduledDate = order.scheduled_date ? new Date(order.scheduled_date) : new Date();
        
        switch (order.frequency.toLowerCase()) {
          case 'weekly':
            nextDate.setDate(scheduledDate.getDate() + 7);
            break;
          case 'bi_weekly':
          case 'biweekly':
            nextDate.setDate(scheduledDate.getDate() + 14);
            break;
          case 'monthly':
            nextDate.setMonth(scheduledDate.getMonth() + 1);
            break;
          case 'quarterly':
            nextDate.setMonth(scheduledDate.getMonth() + 3);
            break;
        }
        
        nextPayment = {
          amount: order.amount,
          date: nextDate.toISOString()
        };
      }

      setPaymentDetails({
        paymentMethod,
        breakdown,
        nextPayment
      });
    } catch (error) {
      console.error('Error processing payment details:', error);
      // Fallback to basic display
      setPaymentDetails({
        breakdown: {
          basePrice: order.amount,
          addOns: 0,
          taxes: 0,
          total: order.amount,
          addOnsList: []
        }
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Payment Details
        </CardTitle>
        <CardDescription>
          Financial breakdown and payment information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payment Method */}
        {paymentDetails?.paymentMethod && (
          <div className="bg-muted/30 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4" />
              <span className="font-medium text-sm">Payment Method</span>
            </div>
            <div className="text-sm">
              {paymentDetails.paymentMethod.brand?.toUpperCase()} •••• {paymentDetails.paymentMethod.last4}
            </div>
          </div>
        )}

        {/* Price Breakdown */}
        {paymentDetails?.breakdown && (
          <div className="bg-muted/30 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Receipt className="h-4 w-4" />
              <span className="font-medium text-sm">Price Breakdown</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Base Service</span>
                <span>${(paymentDetails.breakdown.basePrice / 100).toFixed(2)}</span>
              </div>
              
              {/* Individual Add-ons */}
              {paymentDetails.breakdown.addOnsList && paymentDetails.breakdown.addOnsList.length > 0 ? (
                paymentDetails.breakdown.addOnsList.map((addon, index) => (
                  <div key={index} className="flex justify-between text-muted-foreground">
                    <span className="pl-2">+ {addon.name}</span>
                    <span>${(addon.price / 100).toFixed(2)}</span>
                  </div>
                ))
              ) : paymentDetails.breakdown.addOns > 0 ? (
                <div className="flex justify-between">
                  <span>Additional Services</span>
                  <span>${(paymentDetails.breakdown.addOns / 100).toFixed(2)}</span>
                </div>
              ) : null}
              
              {paymentDetails.breakdown.taxes > 0 && (
                <div className="flex justify-between">
                  <span>Taxes & Fees</span>
                  <span>${(paymentDetails.breakdown.taxes / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-medium">
                <span>Total Paid</span>
                <span>${(paymentDetails.breakdown.total / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Next Payment for Recurring Services */}
        {paymentDetails?.nextPayment && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm text-blue-900">Next Payment</span>
            </div>
            <div className="text-sm text-blue-800">
              <div className="font-medium">
                ${(paymentDetails.nextPayment.amount / 100).toFixed(2)}
              </div>
              <div>
                Due: {new Date(paymentDetails.nextPayment.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        )}

        {/* Payment Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Payment Status</span>
          <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
            {order.status === 'completed' ? 'Paid' : 'Pending'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};