import React, { Suspense } from 'react';
import { EmbeddedPaymentForm, EmbeddedPaymentFormProps } from '@/components/booking/EmbeddedPaymentForm';
import { PaymentFormSkeleton } from '@/components/ui/loading-skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Wrapper component for instant payment form loading
 * Uses Suspense and optimistic rendering for zero loading time
 */
export const InstantPaymentForm: React.FC<EmbeddedPaymentFormProps> = (props) => {
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
      <EmbeddedPaymentForm {...props} />
    </Suspense>
  );
};