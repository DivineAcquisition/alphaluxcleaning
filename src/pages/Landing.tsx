import React from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { HeroSection } from '@/components/landing/HeroSection';
import { QuickBenefitsBar } from '@/components/landing/QuickBenefitsBar';
import { QuickQuoteWidget } from '@/components/booking/QuickQuoteWidget';
import { TestimonialSection } from '@/components/landing/TestimonialSection';
import { WhyChooseUsSection } from '@/components/landing/WhyChooseUsSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { LiveBookingNotification } from '@/components/social-proof/LiveBookingNotification';

export function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection bookingFlowUrl="/book/zip" />

        {/* Quick Benefits Bar */}
        <QuickBenefitsBar />

        {/* Quick Quote Widget */}
        <QuickQuoteWidget />

        {/* Why Choose Us */}
        <WhyChooseUsSection />

        {/* Testimonials */}
        <TestimonialSection />

        {/* FAQ Section */}
        <FAQSection />

        {/* Live Booking Notifications */}
        <LiveBookingNotification />
      </main>

      <Footer />
    </div>
  );
}
