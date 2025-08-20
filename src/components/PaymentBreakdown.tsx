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
      // For now, we'll create a mock breakdown since we don't have direct Stripe integration
      // In a real implementation, you'd fetch from Stripe API or your payment records
      
      const basePrice = Math.round(order.amount * 0.85); // Assume 85% is base price
      const addOns = Math.round(order.amount * 0.10); // 10% add-ons
      const taxes = order.amount - basePrice - addOns; // Remainder is taxes

      const breakdown = {
        basePrice,
        addOns,
        taxes,
        total: order.amount
      };

      // Mock payment method (in real app, fetch from Stripe)
      const paymentMethod = {
        type: 'card',
        last4: '4242',
        brand: 'visa'
      };

      // Calculate next payment for recurring services
      let nextPayment = null;
      if (order.frequency && order.frequency !== 'one_time') {
        const nextDate = new Date();
        switch (order.frequency.toLowerCase()) {
          case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case 'bi_weekly':
            nextDate.setDate(nextDate.getDate() + 14);
            break;
          case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
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
      console.error('Error fetching payment details:', error);
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
              <div className="flex justify-between">
                <span>Additional Services</span>
                <span>${(paymentDetails.breakdown.addOns / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes & Fees</span>
                <span>${(paymentDetails.breakdown.taxes / 100).toFixed(2)}</span>
              </div>
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