import React, { useEffect, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { detectDomain, shouldRedirectBasedOnDomainAndRole, buildDomainUrl } from '@/utils/domainDetection';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { BookDomainGuard } from './BookDomainGuard';

interface DomainAwareRouterProps {
  children: React.ReactNode;
}

export function DomainAwareRouter({ children }: DomainAwareRouterProps) {
  const { user, userRole, loading } = useAuth();
  const location = useLocation();
  const [domainInfo] = useState(() => detectDomain());

  // Fast-load book domain with proper URL guard
  if (domainInfo.subdomain === 'book') {
    return <BookDomainGuard>{children}</BookDomainGuard>;
  }

  useEffect(() => {
    // Skip all redirect logic in non-production environments (Lovable preview, localhost, etc.)
    if (!domainInfo.isProduction) {
      return;
    }

    // Handle booking slug redirects with startsWith to catch all booking paths
    const bookingPaths = ['/booking', '/legacy-booking', '/new-booking'];
    const currentPath = location.pathname.replace(/\/+$/, '') || '/'; // Normalize trailing slashes
    
    // Check if current path starts with any booking path
    const isBookingPath = bookingPaths.some(path => currentPath === path || currentPath.startsWith(path + '/'));
    
    if (isBookingPath) {
      if (domainInfo.subdomain !== 'book') {
        // Redirect to book subdomain root
        const redirectUrl = buildDomainUrl('book', '/');
        window.location.href = redirectUrl;
        return;
      }
    }

    // Handle contractor portal redirects
    if (domainInfo.subdomain === 'contractor') {
      const contractorPaths = ['/contractor', '/admin'];
      
      if (!contractorPaths.some(path => currentPath.startsWith(path)) && currentPath !== '/auth') {
        const redirectUrl = buildDomainUrl('contractor', '/contractor', location.search, location.hash);
        window.location.href = redirectUrl;
        return;
      }
    }
  }, [location, domainInfo.subdomain, domainInfo.isProduction]);

  // Show loading while auth is determining
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Skip domain-based redirects in non-production environments
  if (domainInfo.isProduction) {
    // Check if current domain/role combination requires redirect
    const redirectCheck = shouldRedirectBasedOnDomainAndRole(
      domainInfo.subdomain,
      userRole,
      !!user
    );

    if (redirectCheck.shouldRedirect && redirectCheck.redirectUrl) {
      window.location.href = redirectCheck.redirectUrl;
      return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Redirecting to appropriate portal...</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}