import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing OAuth callback...');

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage(`OAuth error: ${error}`);
        toast({
          title: "Authentication Error",
          description: "Failed to connect Google Calendar. Please try again.",
          variant: "destructive"
        });
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('No authorization code received');
        toast({
          title: "Error",
          description: "Invalid OAuth response. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Call our edge function to handle the OAuth callback
      const { data, error: callbackError } = await supabase.functions.invoke('google-oauth-callback', {
        body: {
          code,
          state,
          redirect_uri: `${window.location.origin}/oauth/callback`
        }
      });

      if (callbackError) {
        console.error('Callback error:', callbackError);
        setStatus('error');
        setMessage('Failed to process OAuth callback');
        toast({
          title: "Error",
          description: "Failed to connect Google Calendar. Please try again.",
          variant: "destructive"
        });
        return;
      }

      if (data?.success) {
        setStatus('success');
        setMessage('Google Calendar connected successfully!');
        toast({
          title: "Success",
          description: "Google Calendar connected successfully!"
        });

        // Redirect to a relevant page after a short delay
        setTimeout(() => {
          navigate('/schedule-service'); // or wherever makes sense in your app
        }, 2000);
      } else {
        setStatus('error');
        setMessage(data?.error || 'Unknown error occurred');
        toast({
          title: "Error",
          description: data?.error || "Failed to connect Google Calendar",
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
    navigate('/schedule-service'); // or back to where they started
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'processing' && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
            {status === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
            Google Calendar Connection
          </CardTitle>
          <CardDescription>
            {status === 'processing' && 'Setting up your calendar connection...'}
            {status === 'success' && 'Your calendar has been connected successfully'}
            {status === 'error' && 'There was an issue connecting your calendar'}
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