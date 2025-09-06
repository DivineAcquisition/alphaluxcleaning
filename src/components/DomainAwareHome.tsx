import React from 'react';
import { detectDomain } from '@/utils/domainDetection';
import { Navigation } from '@/components/Navigation';
import { ModernLegacyBooking } from '@/components/booking/ModernLegacyBooking';
import Index from '@/pages/Index';

export function DomainAwareHome() {
  const domainInfo = detectDomain();
  
  // If it's the book subdomain, show the direct booking flow
  if (domainInfo.subdomain === 'book') {
    return (
      <div className="min-h-screen">
        <Navigation />
        <ModernLegacyBooking />
      </div>
    );
  }
  
  // For all other subdomains, show the full Index page with tabs
  return <Index />;
}