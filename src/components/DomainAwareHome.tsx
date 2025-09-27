import React from 'react';
import { Navigation } from '@/components/Navigation';
import { ModernLegacyBooking } from '@/components/booking/ModernLegacyBooking';
import { HeroSection } from '@/components/landing/HeroSection';
import { TestimonialSection } from '@/components/landing/TestimonialSection';
import { WhyChooseUsSection } from '@/components/landing/WhyChooseUsSection';

export function DomainAwareHome() {
  // Check if we're on the book subdomain
  const isBookSubdomain = window.location.hostname === 'book.alphaluxclean.com';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Navigation />
      
      {/* Hero Section - Above the fold with pricing transparency and value props */}
      <HeroSection />
      
      {/* Mobile-Optimized ZIP Entry and Booking Process */}
      <div className="container mx-auto px-4 py-6 lg:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Mobile-First ZIP Code Entry Enhancement - 80px height target */}
          <div className="text-center mb-6">
            <h2 className="mobile-subheadline lg:text-2xl font-bold text-foreground mb-3">Get Your Instant Quote</h2>
            <p className="mobile-body text-muted-foreground mb-4">Check availability and exact pricing for your area</p>
            
            {/* Fast Process Indicator - Mobile Optimized */}
            <div className="inline-flex items-center gap-2 bg-success/10 border border-success/20 rounded-full px-4 py-2 mb-6 mobile-touch-target">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-success-foreground font-medium text-sm lg:text-base">2-minute booking process</span>
            </div>
          </div>
          
          <ModernLegacyBooking />
        </div>
      </div>
      
      {/* Trust & Social Proof Sections */}
      <TestimonialSection />
      <WhyChooseUsSection />
    </div>
  );
}