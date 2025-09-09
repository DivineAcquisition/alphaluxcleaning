import React, { useEffect } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { detectDomain } from '@/utils/domainDetection';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { BrandedErrorPage } from './BrandedErrorPage';

interface HostBasedRouterProps {
  children: React.ReactNode;
}

export function HostBasedRouter({ children }: HostBasedRouterProps) {
  const { user, userRole, loading } = useAuth();
  const location = useLocation();
  const domainInfo = detectDomain();

  useEffect(() => {
    // Force HTTPS in production
    if (domainInfo.isProduction && window.location.protocol === 'http:') {
      window.location.href = window.location.href.replace('http:', 'https:');
      return;
    }

    // Handle redirecting hosts
    if (domainInfo.redirectTo) {
      window.location.href = domainInfo.redirectTo;
      return;
    }
  }, [domainInfo]);

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

  // Handle redirecting hosts during loading
  if (domainInfo.redirectTo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Check if current path is allowed on this host
  const currentPath = location.pathname.replace(/\/+$/, '') || '/';
  const isAllowedPath = domainInfo.allowedRoutes.some(allowedRoute => 
    currentPath === allowedRoute || 
    currentPath.startsWith(allowedRoute + '/') ||
    allowedRoute === '/' && currentPath === '/'
  );

  // Additional health endpoints
  if (currentPath === `/health/${domainInfo.hostRole}`) {
    return (
      <div className="p-4">
        <h1>Health Check - {domainInfo.hostRole}</h1>
        <p>Status: ✅ OK</p>
        <p>Host: {window.location.hostname}</p>
        <p>Timestamp: {new Date().toISOString()}</p>
      </div>
    );
  }

  // Show branded 404 for disallowed paths
  if (!isAllowedPath) {
    return <BrandedErrorPage 
      hostRole={domainInfo.hostRole}
      brandColor={domainInfo.brandColor}
      errorType="404"
    />;
  }

  // Host-specific authentication checks
  if (domainInfo.hostRole === 'admin' && currentPath !== '/auth' && currentPath !== '/login' && currentPath !== '/signup') {
    if (!user) {
      return <Navigate to="/auth" replace />;
    }
  }

  if (domainInfo.hostRole === 'sub' && currentPath !== '/contractor-auth') {
    if (!user || (userRole && !['contractor', 'admin', 'manager'].includes(userRole))) {
      return <Navigate to="/contractor-auth" replace />;
    }
  }

  if (domainInfo.hostRole === 'portal' && currentPath !== '/customer-auth') {
    if (!user || (userRole && userRole !== 'customer')) {
      return <Navigate to="/customer-auth" replace />;
    }
  }

  return <>{children}</>;
}