import React, { lazy, Suspense } from 'react';
import { Navigation } from '@/components/Navigation';
import { LiveBookingNotification } from '@/components/social-proof/LiveBookingNotification';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load the full booking flow (only loads when user starts booking)
const TypeformBookingFlow = lazy(() => 
  import('@/components/typeform/TypeformBookingFlow').then(module => ({
    default: module.TypeformBookingFlow
  }))
);

export function DomainAwareHome() {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Full Booking Flow (Lazy Loaded) */}
      <div id="booking-flow" className="pt-4">
        <Suspense fallback={
          <div className="container mx-auto px-4 py-12">
            <div className="space-y-4 max-w-2xl mx-auto">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        }>
          <TypeformBookingFlow />
        </Suspense>
      </div>
      
      {/* Live Booking Notifications */}
      <LiveBookingNotification />
    </div>
  );
}