import React, { lazy, Suspense } from 'react';
import { Navigation } from '@/components/Navigation';
import { LiveBookingNotification } from '@/components/social-proof/LiveBookingNotification';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

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
      
      {/* Promotional Banner */}
      <div className="bg-gradient-to-r from-success/10 via-primary/10 to-success/10 border-b py-4 md:py-6">
        <div className="container mx-auto px-4">
          <Card className="border-success/30 bg-success/5 shadow-lg">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row items-center justify-center gap-3 text-center md:text-left">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-success animate-pulse" />
                  <Badge className="bg-success text-success-foreground text-xl md:text-2xl px-4 md:px-6 py-2 md:py-3 whitespace-nowrap">
                    $50 OFF
                  </Badge>
                </div>
                <div>
                  <h2 className="font-bold text-lg md:text-xl text-foreground mb-1">
                    Limited Time: Save $50 on Your First Cleaning!
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground">
                    All one-time cleaning services include $50 instant discount. Book now!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
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