import React from 'react';
import { HostBasedRouter } from './HostBasedRouter';
import { SEOHead } from './SEOHead';

interface DomainAwareRouterProps {
  children: React.ReactNode;
}

export function DomainAwareRouter({ children }: DomainAwareRouterProps) {
  return (
    <>
      <SEOHead />
      <HostBasedRouter>{children}</HostBasedRouter>
    </>
  );
}