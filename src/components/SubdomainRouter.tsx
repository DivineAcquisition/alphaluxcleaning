import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { 
  getCurrentSubdomain, 
  isRoleAllowedOnSubdomain, 
  redirectToCorrectSubdomain,
  isRouteAllowedOnSubdomain,
  getCurrentSubdomainConfig
} from '@/utils/subdomain';
import { Loader2 } from 'lucide-react';

interface SubdomainRouterProps {
  children: React.ReactNode;
}

export function SubdomainRouter({ children }: SubdomainRouterProps) {
  const { user, userRole, loading } = useAuth();
  const location = useLocation();
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // Debug logging for development
  useEffect(() => {
    if (window.location.hostname === 'localhost') {
      console.log('🔍 SubdomainRouter Debug:', {
        currentSubdomain: getCurrentSubdomain(),
        pathname: location.pathname,
        userRole,
        user: !!user,
        loading,
        isRedirecting
      });
    }
  }, [user, userRole, loading, location.pathname, isRedirecting]);
  
  useEffect(() => {
    // Skip redirects during loading or if already redirecting
    if (loading || isRedirecting) return;
    
    // Skip redirects for localhost to avoid development issues
    if (window.location.hostname === 'localhost') return;
    
    // Skip redirects for auth/oauth routes
    if (location.pathname.startsWith('/auth') || location.pathname.startsWith('/oauth')) return;
    
    // If user is authenticated but on wrong subdomain, redirect
    if (user && userRole) {
      const shouldRedirect = redirectToCorrectSubdomain(userRole);
      if (shouldRedirect) {
        setIsRedirecting(true);
        return;
      }
    }
  }, [user, userRole, loading, location.pathname, isRedirecting]);

  // Show loading during auth check or redirect
  if (loading || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  // Check if current route is allowed on this subdomain
  if (!isRouteAllowedOnSubdomain(location.pathname)) {
    const config = getCurrentSubdomainConfig();
    console.warn('🚫 Route not allowed:', {
      route: location.pathname,
      subdomain: getCurrentSubdomain(),
      defaultRoute: config.defaultRoute
    });
    return <Navigate to={config.defaultRoute} replace />;
  }

  // Check role permissions for protected subdomains
  const config = getCurrentSubdomainConfig();
  
  // If subdomain requires authentication and user is not authenticated
  if (!config.isPublic && !user) {
    return <Navigate to="/auth" replace />;
  }
  
  // If user is authenticated but doesn't have permission for this subdomain
  if (!config.isPublic && user && !isRoleAllowedOnSubdomain(userRole)) {
    // Show access denied message
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access this area.
          </p>
          <button 
            onClick={() => window.location.href = '/auth'}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}