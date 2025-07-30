import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'customer';
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

      // Determine if user has access
      const hasAccess = allowedRoles 
        ? allowedRoles.includes(userRole || '')
        : !requiredRole || userRole === requiredRole;

      if (!hasAccess) {
        console.log('Access denied, redirecting...');
        // Redirect based on user's actual role
        if (userRole === 'admin') {
          // Don't redirect if already on admin pages
          if (!window.location.pathname.startsWith('/admin')) {
            navigate('/admin-dashboard');
          }
        } else if (userRole === 'customer') {
          if (window.location.pathname !== '/my-services') {
            navigate('/my-services');
          }
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