import React, { Suspense } from 'react';
import { EmbeddedStripePaymentForm } from '@/components/booking/EmbeddedStripePaymentForm';
import { PaymentFormSkeleton } from '@/components/ui/loading-skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface InstantPaymentFormProps {
  paymentAmount: number;
  fullAmount: number;
  paymentType: "full" | "deposit";
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  bookingId?: string;
  applyCredits?: boolean;
  creditsAmount?: number;
  onSuccess: (paymentId: string) => void;
  onCancel: () => void;
}

/**
 * Wrapper component for instant payment form loading
 * Uses Suspense and optimistic rendering for zero loading time
 */
export const InstantPaymentForm: React.FC<InstantPaymentFormProps> = (props) => {
  return (
    <Suspense
      fallback={
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-5 w-5 bg-primary/20 rounded animate-pulse" />
              Loading payment form...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentFormSkeleton />
          </CardContent>
        </Card>
      }
    >
      <EmbeddedStripePaymentForm {...props} />
    </Suspense>
  );
};