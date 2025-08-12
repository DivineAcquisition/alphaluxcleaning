import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Shield, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  const location = useLocation();
  const [accessDenied, setAccessDenied] = useState(false);
  const [denialReason, setDenialReason] = useState('');

  const isDevelopment = import.meta.env.DEV;

  useEffect(() => {
    // Reset access denied state when location changes
    setAccessDenied(false);
    setDenialReason('');

    if (!loading && user) {
      if (isDevelopment) {
        console.log('ProtectedRoute check:', { 
          currentPath: location.pathname, 
          userRole, 
          requiredRole, 
          allowedRoles 
        });
      }

      // Skip protection for test routes ONLY in development
      if (location.pathname.startsWith('/test/')) {
        if (isDevelopment) {
          console.warn('SECURITY WARNING: Test route accessed in development mode');
          return;
        } else {
          console.error('SECURITY VIOLATION: Test route accessed in production mode');
          setAccessDenied(true);
          setDenialReason('Test routes are not available in production mode.');
          setTimeout(() => navigate('/auth'), 2000);
          return;
        }
      }

      // Super admin bypass - can access everything
      if (userRole === 'super_admin') {
        if (isDevelopment) {
          console.log('Super admin access granted');
        }
        return;
      }

      // Determine if user has access
      const hasAccess = allowedRoles 
        ? allowedRoles.includes(userRole || '')
        : !requiredRole || userRole === requiredRole;

      if (!hasAccess) {
        console.log('Access denied, showing error message...');
        
        let reason = '';
        if (requiredRole) {
          reason = `This page requires ${requiredRole} role. You have ${userRole} role.`;
        } else if (allowedRoles) {
          reason = `This page requires one of these roles: ${allowedRoles.join(', ')}. You have ${userRole} role.`;
        }
        
        setAccessDenied(true);
        setDenialReason(reason);
        
        // Redirect after showing error
        setTimeout(() => {
          // Prevent infinite redirects by checking current path
          const currentPath = location.pathname;
          
          // Redirect based on user's actual role
          if (userRole === 'owner' || userRole === 'enterprise_client') {
            if (!currentPath.startsWith('/admin') && currentPath !== '/admin') {
              navigate('/admin');
            }
          } else if (userRole === 'office_manager') {
            if (currentPath !== '/office-dashboard') {
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
            // User has no role, show error but don't redirect endlessly
            console.log('User has no role assigned');
            navigate('/auth');
          } else {
            navigate('/auth');
          }
        }, 3000);
      }
    } else if (!loading && !user) {
      console.log('No user, redirecting to auth');
      navigate(redirectTo);
    }
  }, [user, userRole, loading, navigate, requiredRole, allowedRoles, redirectTo, location.pathname, isDevelopment]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  // If user is not authenticated, don't render children
  if (!user) {
    return null;
  }

  // Show access denied message
  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{denialReason || 'You do not have permission to access this page.'}</AlertDescription>
            </Alert>
            <div className="text-center text-sm text-muted-foreground">
              Redirecting you to your dashboard in a moment...
            </div>
            <Button 
              onClick={() => navigate('/')} 
              variant="outline" 
              className="w-full"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Skip protection for test routes ONLY in development
  if (location.pathname.startsWith('/test/')) {
    if (isDevelopment) {
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