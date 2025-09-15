import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
}

export function SEOHead({ title, description, canonical, noindex }: SEOHeadProps) {
  const defaultTitle = 'Book Your Cleaning Service - AlphaLuxClean';
  const defaultDescription = 'Book professional residential cleaning services with AlphaLuxClean. Quick, reliable, and affordable cleaning solutions.';
  
  const canonicalUrl = canonical || window.location.href;

  return (
    <Helmet>
      <title>{title || defaultTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* SEO directives */}
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      
      {/* Security headers */}
      <meta httpEquiv="X-Frame-Options" content="SAMEORIGIN" />
      <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      
      {/* Viewport */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Brand colors */}
      <meta name="theme-color" content="#6600FF" />
      <meta name="msapplication-TileColor" content="#6600FF" />
      
      {/* Open Graph */}
      <meta property="og:title" content={title || defaultTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="AlphaLuxClean" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title || defaultTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
    </Helmet>
  );
}