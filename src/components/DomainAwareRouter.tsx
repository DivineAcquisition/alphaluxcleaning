/**
 * Domain-Aware Router Component
 * Provides intelligent routing based on current domain while preserving all booking functionality
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getCurrentDomain, 
  getCurrentDomainConfig, 
  isRoleAllowedOnCurrentDomain,
  shouldBypassDomainRestrictions,
  getDefaultRedirectForUser,
  getDomainForRole,
  DomainType
} from '@/utils/domainDetection';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle } from 'lucide-react';

interface DomainAwareRouterProps {
  children: React.ReactNode;
}

export function DomainAwareRouter({ children }: DomainAwareRouterProps) {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [domainError, setDomainError] = useState<string | null>(null);

  useEffect(() => {
    // Don't run domain checks while auth is loading
    if (loading) return;

    const currentDomain = getCurrentDomain();
    const currentPath = location.pathname;
    
    // Development mode - allow everything
    if (currentDomain === 'localhost') {
      setDomainError(null);
      return;
    }

    // Check domain access permissions
    const config = getCurrentDomainConfig();
    
    // Handle domain-specific default redirects when visiting root path - BEFORE bypass check
    if (currentPath === '/' && currentDomain !== 'www') {
      const defaultPath = config.defaultRedirectPath;
      if (defaultPath !== '/') {
        navigate(defaultPath, { replace: true });
        return;
      }
    }
    
    // Always allow booking routes - CRITICAL for preserving booking functionality
    if (shouldBypassDomainRestrictions(currentPath)) {
      setDomainError(null);
      return;
    }
    
    // For secure domains, check if user is authenticated and has proper role
    if (config.isSecure) {
      if (!user) {
        // Redirect to auth but preserve intended destination
        const redirectPath = encodeURIComponent(currentPath);
        navigate(`/auth?redirect=${redirectPath}`);
        return;
      }

      if (!isRoleAllowedOnCurrentDomain(userRole)) {
        // User doesn't have access to this domain - redirect to their appropriate domain
        const userDomainUrl = getDomainForRole(userRole || 'customer');
        const userDefaultPath = getDefaultRedirectForUser(userRole);
        
        setDomainError(
          `You don't have access to this section. You'll be redirected to your dashboard.`
        );
        
        // In production, redirect to the correct domain
        if (currentDomain !== ('localhost' as DomainType)) {
          setTimeout(() => {
            window.location.href = `${userDomainUrl}${userDefaultPath}`;
          }, 3000);
        } else {
          // In development, just navigate to the appropriate path
          setTimeout(() => {
            navigate(userDefaultPath);
            setDomainError(null);
          }, 3000);
        }
        return;
      }
    }

    // Clear any existing domain errors
    setDomainError(null);
  }, [user, userRole, loading, location.pathname, navigate]);

  // Show domain access error if present
  if (domainError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4">
          <Alert className="border-destructive">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              {domainError}
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={() => {
              const userDefaultPath = getDefaultRedirectForUser(userRole);
              navigate(userDefaultPath);
              setDomainError(null);
            }}
            className="w-full"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Render children if all domain checks pass
  return <>{children}</>;
}

/**
 * Enhanced Protected Route Component with Domain Awareness
 */
interface DomainAwareProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  allowedRoles?: string[];
  bypassDomainCheck?: boolean;
}

export function DomainAwareProtectedRoute({ 
  children, 
  requireAdmin = false, 
  allowedRoles = [],
  bypassDomainCheck = false 
}: DomainAwareProtectedRouteProps) {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    // Bypass all checks if explicitly requested (for booking routes)
    if (bypassDomainCheck) return;

    // Check authentication
    if (!user) {
      const redirectPath = encodeURIComponent(location.pathname);
      navigate(`/auth?redirect=${redirectPath}`);
      return;
    }

    // Check admin requirement
    if (requireAdmin && userRole !== 'super_admin') {
      navigate('/customer-portal-dashboard');
      return;
    }

    // Check allowed roles if specified
    if (allowedRoles.length > 0 && userRole && !allowedRoles.includes(userRole)) {
      const defaultPath = getDefaultRedirectForUser(userRole);
      navigate(defaultPath);
      return;
    }

    // Check domain permissions
    if (!isRoleAllowedOnCurrentDomain(userRole) && !shouldBypassDomainRestrictions(location.pathname)) {
      const defaultPath = getDefaultRedirectForUser(userRole);
      navigate(defaultPath);
      return;
    }
  }, [user, userRole, loading, requireAdmin, allowedRoles, bypassDomainCheck, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}