import React from 'react';
import { Helmet } from 'react-helmet-async';
import { detectDomain } from '@/utils/domainDetection';

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
}

export function SEOHead({ title, description, canonical, noindex }: SEOHeadProps) {
  const domainInfo = detectDomain();
  
  const getDefaultTitle = () => {
    const titles = {
      admin: 'Admin Portal - Bay Area Cleaning Pros',
      book: 'Book Your Cleaning Service - Bay Area Cleaning Pros',
      sub: 'Contractor Portal - Bay Area Cleaning Pros', 
      portal: 'Customer Portal - Bay Area Cleaning Pros',
      try: 'Get Started - Bay Area Cleaning Pros',
      root: 'Professional Cleaning Services - Bay Area Cleaning Pros'
    };
    return titles[domainInfo.hostRole];
  };

  const getDefaultDescription = () => {
    const descriptions = {
      admin: 'Administrative portal for managing Bay Area Cleaning Pros operations, staff, and business analytics.',
      book: 'Book professional residential and commercial cleaning services in the Bay Area. Quick, reliable, and affordable.',
      sub: 'Contractor portal for Bay Area Cleaning Pros subcontractors to manage jobs, schedules, and assignments.',
      portal: 'Customer portal for Bay Area Cleaning Pros clients to track services, manage bookings, and access account information.',
      try: 'Start your cleaning service journey with Bay Area Cleaning Pros. Professional, reliable, and affordable cleaning solutions.',
      root: 'Bay Area Cleaning Pros offers professional residential and commercial cleaning services throughout the San Francisco Bay Area.'
    };
    return descriptions[domainInfo.hostRole];
  };

  const shouldNoIndex = noindex || ['sub', 'admin'].includes(domainInfo.hostRole);
  
  const canonicalUrl = canonical || window.location.href;

  return (
    <Helmet>
      <title>{title || getDefaultTitle()}</title>
      <meta name="description" content={description || getDefaultDescription()} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* SEO directives */}
      {shouldNoIndex && <meta name="robots" content="noindex,nofollow" />}
      
      {/* Security headers */}
      <meta httpEquiv="X-Frame-Options" content={domainInfo.hostRole === 'book' ? 'SAMEORIGIN' : 'DENY'} />
      <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      
      {/* Viewport */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Brand colors */}
      <meta name="theme-color" content={domainInfo.brandColor} />
      <meta name="msapplication-TileColor" content={domainInfo.brandColor} />
      
      {/* Open Graph */}
      <meta property="og:title" content={title || getDefaultTitle()} />
      <meta property="og:description" content={description || getDefaultDescription()} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Bay Area Cleaning Pros" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title || getDefaultTitle()} />
      <meta name="twitter:description" content={description || getDefaultDescription()} />
    </Helmet>
  );
}