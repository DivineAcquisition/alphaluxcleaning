import React from 'react';
import { Navigation } from '@/components/Navigation';
import { ModernLegacyBooking } from '@/components/booking/ModernLegacyBooking';

export function DomainAwareHome() {
  // Check if we're on the book subdomain
  const isBookSubdomain = window.location.hostname === 'book.alphaluxclean.com';
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-4">
            {isBookSubdomain ? 'Book Your Service' : 'Book Your Cleaning Service'}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience premium cleaning services with AlphaLux Cleaning. Professional, reliable, and affordable throughout {isBookSubdomain ? 'California & Texas' : 'Cali & Texas'}.
          </p>
        </div>
        <ModernLegacyBooking />
      </div>
    </div>
  );
}