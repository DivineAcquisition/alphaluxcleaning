import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { Calendar, CreditCard, Shield, CheckCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ConnectPortal = () => {
  const [searchParams] = useSearchParams();
  const [authStatus, setAuthStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [connectionType, setConnectionType] = useState<string>('');
  const [authData, setAuthData] = useState<any>(null);

  useEffect(() => {
    // Handle OAuth callbacks
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const provider = searchParams.get('provider') || 'google';
    
    if (code) {
      handleOAuthCallback(provider, code, state);
    } else {
      setAuthStatus('error');
    }
  }, [searchParams]);

  const handleOAuthCallback = async (provider: string, code: string, state: string | null) => {
    setConnectionType(provider);
    
    try {
      // Handle Google Calendar OAuth
      if (provider === 'google') {
        const { data, error } = await supabase.functions.invoke('google-oauth-callback', {
          body: {
            code,
            state,
            redirect_uri: `${window.location.origin}/connect`
          }
        });

        if (error) throw error;

        setAuthData(data);
        setAuthStatus('success');
        toast.success('Google Calendar connected successfully!');
      }
      // Handle Stripe OAuth (future implementation)
      else if (provider === 'stripe') {
        // Stripe Connect OAuth handling
        toast.success('Stripe account connected successfully!');
        setAuthStatus('success');
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      setAuthStatus('error');
      toast.error('Failed to connect account');
    }
  };

  const initiateGoogleAuth = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('google-oauth-initiate', {
        body: {
          redirect_uri: `${window.location.origin}/connect?provider=google`
        }
      });

      if (error) throw error;

      // Redirect to Google OAuth
      window.location.href = data.authorization_url;
    } catch (error) {
      console.error('Error initiating Google auth:', error);
      toast.error('Failed to initiate Google authentication');
    }
  };

  const initiateStripeConnect = () => {
    // Stripe Connect OAuth URL (would need to be configured in Stripe dashboard)
    const stripeConnectUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${process.env.STRIPE_CONNECT_CLIENT_ID}&scope=read_write&redirect_uri=${encodeURIComponent(window.location.origin + '/connect?provider=stripe')}`;
    
    toast.info('Stripe Connect integration coming soon!');
    // window.location.href = stripeConnectUrl;
  };

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Processing connection...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          
          {/* Header */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary to-accent text-white text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <Shield className="h-6 w-6" />
                Account Connections
              </CardTitle>
              <p className="text-primary-foreground/80">
                Secure OAuth connections for enhanced functionality
              </p>
            </CardHeader>
          </Card>

          {/* Connection Status */}
          {authStatus === 'success' && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                  <h3 className="text-xl font-bold text-green-800">Connection Successful!</h3>
                  <p className="text-green-600">
                    Your {connectionType} account has been successfully connected.
                  </p>
                  
                  {authData && (
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Connection Details:</h4>
                      <div className="text-sm space-y-1">
                        <p><strong>Provider:</strong> {connectionType}</p>
                        <p><strong>Connected At:</strong> {new Date().toLocaleString()}</p>
                        {authData.email && <p><strong>Account:</strong> {authData.email}</p>}
                      </div>
                    </div>
                  )}
                  
                  <Button onClick={() => window.close()} className="mt-4">
                    Close Window
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {authStatus === 'error' && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
                  <h3 className="text-xl font-bold text-red-800">Connection Failed</h3>
                  <p className="text-red-600">
                    There was an error connecting your account. Please try again.
                  </p>
                  <Button onClick={() => window.location.reload()} variant="outline">
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Available Connections */}
          <Card>
            <CardHeader>
              <CardTitle>Available Integrations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Google Calendar */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-blue-600" />
                  <div>
                    <h4 className="font-semibold">Google Calendar</h4>
                    <p className="text-sm text-muted-foreground">
                      Sync your availability and automate scheduling
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {authData?.provider === 'google' ? (
                    <Badge variant="default">Connected</Badge>
                  ) : (
                    <Button onClick={initiateGoogleAuth} size="sm">
                      Connect
                    </Button>
                  )}
                </div>
              </div>

              {/* Stripe Connect */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-8 w-8 text-purple-600" />
                  <div>
                    <h4 className="font-semibold">Stripe Connect</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive payments directly to your account
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Coming Soon</Badge>
                  <Button onClick={initiateStripeConnect} size="sm" disabled>
                    Connect
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 mt-1" />
                <div className="text-sm">
                  <h4 className="font-semibold text-blue-800 mb-1">Security & Privacy</h4>
                  <p className="text-blue-700">
                    All connections use secure OAuth 2.0 authentication. We only access the minimum 
                    permissions required for functionality and never store your passwords.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ConnectPortal;