import React from 'react';
import { Navigation } from '@/components/Navigation';
import { ModernLegacyBooking } from '@/components/booking/ModernLegacyBooking';
export function DomainAwareHome() {
  // Check if we're on the book subdomain
  const isBookSubdomain = window.location.hostname === 'book.alphaluxclean.com';
  return <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        
        <ModernLegacyBooking />
      </div>
    </div>;
}