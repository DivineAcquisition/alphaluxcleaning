import React from 'react';
import { Navigation } from '@/components/Navigation';
import { HeroSection } from '@/components/landing/HeroSection';
import { QuickBenefitsBar } from '@/components/landing/QuickBenefitsBar';
import { QuickQuoteWidget } from '@/components/booking/QuickQuoteWidget';
import { TestimonialSection } from '@/components/landing/TestimonialSection';
import { WhyChooseUsSection } from '@/components/landing/WhyChooseUsSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { LiveBookingNotification } from '@/components/social-proof/LiveBookingNotification';

export function Landing() {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section - Compelling above-the-fold content */}
      <HeroSection bookingFlowUrl="/book/home-details" />
      
      {/* Quick Benefits Bar */}
      <QuickBenefitsBar />
      
      {/* Quick Quote Widget - Simplified 4-field form */}
      <QuickQuoteWidget />
      
      {/* Trust & Social Proof Sections */}
      <TestimonialSection />
      <WhyChooseUsSection />
      
      {/* FAQ Section */}
      <FAQSection />
      
      {/* Live Booking Notifications */}
      <LiveBookingNotification />
    </div>
  );
}
