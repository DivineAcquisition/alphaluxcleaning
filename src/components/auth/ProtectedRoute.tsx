import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'owner' | 'office_manager' | 'field_cleaner' | 'recurring_cleaner' | 'subcontractor_partner' | 'client' | 'super_admin' | 'enterprise_client' | 'subcontractor' | 'customer';
  allowedRoles?: string[];
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  allowedRoles,
  redirectTo = '/auth' 
}: ProtectedRouteProps) {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      console.log('ProtectedRoute check:', { 
        currentPath: window.location.pathname, 
        userRole, 
        requiredRole, 
        allowedRoles 
      });

      // Skip protection for test routes ONLY in development
      if (window.location.pathname.startsWith('/test/')) {
        if (import.meta.env.DEV) {
          console.warn('SECURITY WARNING: Test route accessed in development mode');
          return;
        } else {
          console.error('SECURITY VIOLATION: Test route accessed in production mode');
          navigate('/auth');
          return;
        }
      }

      // Super admin bypass - can access everything
      if (userRole === 'super_admin') {
        console.log('Super admin access granted');
        return;
      }

      // Determine if user has access
      const hasAccess = allowedRoles 
        ? allowedRoles.includes(userRole || '')
        : !requiredRole || userRole === requiredRole;

      if (!hasAccess) {
        console.log('Access denied, redirecting...');
        // Prevent infinite redirects by checking current path
        const currentPath = window.location.pathname;
        
        // Redirect based on user's actual role
        if (userRole === 'owner' || userRole === 'enterprise_client') {
          if (!currentPath.startsWith('/admin') && currentPath !== '/admin-dashboard') {
            navigate('/admin-dashboard');
          }
        } else if (userRole === 'office_manager') {
          if (currentPath !== '/admin-dashboard/schedule' && currentPath !== '/office-dashboard') {
            navigate('/office-dashboard');
          }
        } else if (userRole === 'field_cleaner' || userRole === 'recurring_cleaner' || userRole === 'subcontractor_partner' || userRole === 'subcontractor') {
          if (currentPath !== '/subcontractor-dashboard' && currentPath !== '/subcontractor-mobile') {
            navigate('/subcontractor-dashboard');
          }
        } else if (userRole === 'client' || userRole === 'customer') {
          if (currentPath !== '/my-services') {
            navigate('/my-services');
          }
        } else if (!userRole) {
          // User has no role, don't redirect endlessly
          console.log('User has no role assigned');
          return;
        } else {
          navigate('/auth');
        }
      }
    } else if (!loading && !user) {
      console.log('No user, redirecting to auth');
      navigate(redirectTo);
    }
  }, [user, userRole, loading, navigate, requiredRole, allowedRoles, redirectTo]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // If user is not authenticated, don't render children
  if (!user) {
    return null;
  }

  // Skip protection for test routes ONLY in development
  if (window.location.pathname.startsWith('/test/')) {
    if (import.meta.env.DEV) {
      return <>{children}</>;
    } else {
      return null; // Block test routes in production
    }
  }

  // Super admin bypass
  if (userRole === 'super_admin') {
    return <>{children}</>;
  }

  // Check if user has required access
  const hasAccess = allowedRoles 
    ? allowedRoles.includes(userRole || '')
    : !requiredRole || userRole === requiredRole;

  if (!hasAccess) {
    return null;
  }

  // Render protected content
  return <>{children}</>;
}