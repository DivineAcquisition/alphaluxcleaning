import React, { lazy, Suspense } from 'react';
import { Navigation } from '@/components/Navigation';
import { HeroSection } from '@/components/landing/HeroSection';
import { QuickBenefitsBar } from '@/components/landing/QuickBenefitsBar';
import { QuickQuoteWidget } from '@/components/booking/QuickQuoteWidget';
import { TestimonialSection } from '@/components/landing/TestimonialSection';
import { WhyChooseUsSection } from '@/components/landing/WhyChooseUsSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { ExitIntentPopup } from '@/components/landing/ExitIntentPopup';
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
      
      {/* Hero Section - Compelling above-the-fold content */}
      <HeroSection />
      
      {/* Quick Benefits Bar */}
      <QuickBenefitsBar />
      
      {/* Quick Quote Widget - Simplified 4-field form */}
      <QuickQuoteWidget />
      
      {/* Trust & Social Proof Sections */}
      <TestimonialSection />
      <WhyChooseUsSection />
      
      {/* FAQ Section */}
      <FAQSection />
      
      {/* Full Booking Flow (Lazy Loaded) */}
      <div id="booking-flow">
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
      
      {/* Exit Intent Popup */}
      <ExitIntentPopup />
      
      {/* Live Booking Notifications */}
      <LiveBookingNotification />
    </div>
  );
}