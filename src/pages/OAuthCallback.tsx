import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getUserRole } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing OAuth callback...');

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      // Check if there's an error from OAuth provider
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        setStatus('error');
        setMessage(`Authentication failed: ${errorDescription || error}`);
        toast({
          title: "Authentication Error",
          description: "Failed to sign in with Google. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Wait for Supabase to process the OAuth session
      setMessage('Completing sign in...');
      
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        setStatus('error');
        setMessage('Failed to retrieve authentication session');
        toast({
          title: "Error",
          description: "Authentication failed. Please try again.",
          variant: "destructive"
        });
        return;
      }

      if (session?.user) {
        setStatus('success');
        setMessage('Successfully signed in with Google!');
        toast({
          title: "Success",
          description: "Welcome! You're now signed in."
        });

        // Determine redirect URL based on current domain and user role
        const determineRedirectUrl = async () => {
          try {
            const userRole = await getUserRole();
            const hostname = window.location.hostname;
            
            // Check if on subdomain
            if (hostname.startsWith('portal.')) {
              return '/customer-portal-dashboard';
            }
            
            // Redirect based on user role
            switch (userRole) {
              case 'admin':
              case 'super_admin':
                return '/admin-portal';
              case 'office_manager':
                return '/office-manager-dashboard';
              case 'subcontractor':
                return '/subcontractor-dashboard';
              case 'customer':
              default:
                return '/customer-portal-dashboard';
            }
          } catch (error) {
            console.error('Error determining redirect URL:', error);
            return '/customer-portal-dashboard'; // Fallback
          }
        };

        // Redirect after determining the correct URL
        setTimeout(async () => {
          const redirectUrl = await determineRedirectUrl();
          navigate(redirectUrl);
        }, 1500);
      } else {
        setStatus('error');
        setMessage('No valid session found');
        toast({
          title: "Error",
          description: "Authentication failed. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      setStatus('error');
      setMessage('Unexpected error occurred');
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRetry = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'processing' && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
            {status === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
            Google Authentication
          </CardTitle>
          <CardDescription>
            {status === 'processing' && 'Completing your sign in...'}
            {status === 'success' && 'You have been signed in successfully'}
            {status === 'error' && 'There was an issue signing you in'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
          
          {status === 'success' && (
            <div className="text-center">
              <p className="text-sm">Redirecting you back...</p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="flex flex-col gap-2">
              <Button onClick={handleRetry} className="w-full">
                Go Back
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}