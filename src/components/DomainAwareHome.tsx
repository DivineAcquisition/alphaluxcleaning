import React from 'react';
import { Navigation } from '@/components/Navigation';
import { ModernLegacyBooking } from '@/components/booking/ModernLegacyBooking';
import { HeroSection } from '@/components/landing/HeroSection';
import { TestimonialSection } from '@/components/landing/TestimonialSection';
import { WhyChooseUsSection } from '@/components/landing/WhyChooseUsSection';
export function DomainAwareHome() {
  // Check if we're on the book subdomain
  const isBookSubdomain = window.location.hostname === 'book.alphaluxclean.com';
  return <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Navigation />
      
      {/* Hero Section - Above the fold with pricing transparency and value props */}
      <HeroSection />
      
      {/* Mobile-Optimized ZIP Entry and Booking Process */}
      <div className="container mx-auto px-4 py-6 lg:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Mobile-First ZIP Code Entry Enhancement - 80px height target */}
          
          
          <ModernLegacyBooking />
        </div>
      </div>
      
      {/* Trust & Social Proof Sections */}
      <TestimonialSection />
      <WhyChooseUsSection />
    </div>;
}