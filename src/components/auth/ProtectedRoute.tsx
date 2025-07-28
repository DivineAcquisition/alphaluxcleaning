import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'employee' | 'customer';
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  redirectTo = '/auth' 
}: ProtectedRouteProps) {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('ProtectedRoute check:', { user: !!user, userRole, requiredRole, loading });
    
    if (!loading) {
      // If user is not authenticated, redirect to auth page
      if (!user) {
        console.log('No user, redirecting to:', redirectTo);
        navigate(redirectTo);
        return;
      }

      // If specific role is required, check if user has it
      if (requiredRole && userRole !== requiredRole) {
        console.log('Role mismatch. Required:', requiredRole, 'Actual:', userRole);
        // Only redirect if the role is actually different
        if (userRole && userRole !== requiredRole) {
          // Redirect based on user's actual role
          if (userRole === 'admin' || userRole === 'employee') {
            console.log('Redirecting admin/employee to dashboard');
            navigate('/admin-dashboard');
          } else if (userRole === 'customer') {
            console.log('Redirecting customer to services');
            navigate('/my-services');
          } else {
            console.log('Unknown role, redirecting to auth');
            navigate('/auth');
          }
        }
        // Don't redirect if userRole is null (still loading)
      }
    }
  }, [user, userRole, loading, navigate, requiredRole, redirectTo]);

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

  // If specific role is required and user doesn't have it, don't render children
  if (requiredRole && userRole !== requiredRole) {
    return null;
  }

  // Render protected content
  return <>{children}</>;
}