import React from 'react';
import { Navigation } from '@/components/Navigation';
import { TypeformBookingFlow } from '@/components/typeform/TypeformBookingFlow';
import { HeroSection } from '@/components/landing/HeroSection';
import { TestimonialSection } from '@/components/landing/TestimonialSection';
import { WhyChooseUsSection } from '@/components/landing/WhyChooseUsSection';

export function DomainAwareHome() {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <HeroSection />
      
      {/* Typeform-Style Booking Flow */}
      <TypeformBookingFlow />
      
      {/* Trust & Social Proof Sections */}
      <TestimonialSection />
      <WhyChooseUsSection />
    </div>
  );
}