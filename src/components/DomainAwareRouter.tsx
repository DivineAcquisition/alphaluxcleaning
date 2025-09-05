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

  useEffect(() => {
    // Handle auth/portal redirects from book domain
    if (domainInfo.subdomain === 'book') {
      const authPaths = ['/auth', '/customer-portal', '/customer-portal-dashboard', '/portal'];
      const currentPath = location.pathname;
      
      if (authPaths.some(path => currentPath.startsWith(path))) {
        const redirectUrl = buildDomainUrl('portal', location.pathname, location.search, location.hash);
        window.location.href = redirectUrl;
        return;
      }
    }
  }, [location, domainInfo.subdomain]);

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

  // Check if current domain/role combination requires redirect
  const redirectCheck = shouldRedirectBasedOnDomainAndRole(
    domainInfo.subdomain,
    userRole,
    !!user
  );

  if (redirectCheck.shouldRedirect && redirectCheck.redirectUrl && domainInfo.isProduction) {
    // Only redirect in production environments
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

  return <>{children}</>;
}