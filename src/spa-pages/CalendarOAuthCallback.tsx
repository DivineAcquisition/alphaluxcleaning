import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle, Calendar } from "lucide-react";

export default function CalendarOAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Connecting your Google Calendar...');

  useEffect(() => {
    handleCalendarOAuthCallback();
  }, []);

  const handleCalendarOAuthCallback = async () => {
    try {
      // Check if there's an error from OAuth provider
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        setStatus('error');
        setMessage(`Calendar connection failed: ${errorDescription || error}`);
        toast({
          title: "Calendar Connection Error",
          description: "Failed to connect Google Calendar. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Get the authorization code
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code) {
        setStatus('error');
        setMessage('No authorization code received');
        toast({
          title: "Error",
          description: "Calendar connection failed. Please try again.",
          variant: "destructive"
        });
        return;
      }

      setMessage('Processing calendar connection...');

      // Call our edge function to complete the OAuth flow
      const { data, error: callbackError } = await supabase.functions.invoke('google-oauth-callback', {
        body: {
          code: code,
          state: state,
          redirect_uri: `${window.location.origin}/calendar/oauth/callback`
        }
      });

      if (callbackError || !data?.success) {
        console.error('Calendar OAuth callback error:', callbackError);
        setStatus('error');
        setMessage('Failed to complete calendar connection');
        toast({
          title: "Error",
          description: "Failed to connect calendar. Please try again.",
          variant: "destructive"
        });
        return;
      }

      setStatus('success');
      setMessage('Google Calendar connected successfully!');
      toast({
        title: "Success",
        description: "Your Google Calendar is now connected."
      });

      // Redirect back to where the user came from after a short delay
      setTimeout(() => {
        const returnUrl = sessionStorage.getItem('calendar_oauth_return_url') || '/subcontractor-dashboard';
        sessionStorage.removeItem('calendar_oauth_return_url');
        navigate(returnUrl);
      }, 2000);

    } catch (error) {
      console.error('Calendar OAuth callback error:', error);
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
    const returnUrl = sessionStorage.getItem('calendar_oauth_return_url') || '/subcontractor-dashboard';
    sessionStorage.removeItem('calendar_oauth_return_url');
    navigate(returnUrl);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'processing' && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
            {status === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
            <Calendar className="h-5 w-5" />
            Google Calendar
          </CardTitle>
          <CardDescription>
            {status === 'processing' && 'Connecting your calendar...'}
            {status === 'success' && 'Calendar connected successfully'}
            {status === 'error' && 'Calendar connection failed'}
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