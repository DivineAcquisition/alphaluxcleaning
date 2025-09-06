import React, { useEffect, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { detectDomain, shouldRedirectBasedOnDomainAndRole, buildDomainUrl } from '@/utils/domainDetection';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface DomainAwareRouterProps {
  children: React.ReactNode;
}

export function DomainAwareRouter({ children }: DomainAwareRouterProps) {
  const { user, userRole, loading } = useAuth();
  const location = useLocation();
  const [domainInfo] = useState(() => detectDomain());

  // EMERGENCY HOTFIX: Bypass all routing logic on book subdomain to ensure instant loading
  if (domainInfo.subdomain === 'book') {
    return <>{children}</>;
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
      } else {
        // Already on book subdomain, replace URL with root
        window.history.replaceState(null, '', '/');
        return;
      }
    }

    // Enforce pure link on book subdomain - only allow specific whitelisted paths
    if (domainInfo.subdomain === 'book') {
      const allowedPaths = [
        '/',
        '/order-confirmation', 
        '/payment-confirmation', 
        '/payment-success', 
        '/booking-confirmation', 
        '/order-status',
        '/oauth/callback'
      ];
      
      const isAllowedPath = allowedPaths.some(path => 
        currentPath === path || currentPath.startsWith(path + '?') || currentPath.startsWith(path + '#')
      );
      
      if (!isAllowedPath) {
        window.history.replaceState(null, '', '/');
        return;
      }
    }

    // Handle auth/portal redirects based on domain
    if (domainInfo.subdomain === 'book') {
      const authPaths = ['/auth', '/customer-portal', '/customer-portal-dashboard', '/portal'];
      
      if (authPaths.some(path => currentPath.startsWith(path))) {
        const redirectUrl = buildDomainUrl('portal', location.pathname, location.search, location.hash);
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