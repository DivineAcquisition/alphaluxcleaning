import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export default function ContractorLogin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'otp' | 'token'>('email');
  const [tokenProcessing, setTokenProcessing] = useState(false);
  
  // Check for invite token
  const token = searchParams.get('token');
  const inviteToken = searchParams.get('invite');

  useEffect(() => {
    // Redirect authenticated contractors
    if (user) {
      navigate('/today');
      return;
    }

    // Handle invite token
    if (inviteToken) {
      handleInviteToken(inviteToken);
    }
  }, [user, inviteToken, navigate]);

  const handleInviteToken = async (token: string) => {
    setStep('token');
    setTokenProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('assignment-response', {
        body: { token, action: 'accept' }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Invite accepted! Please sign in to continue.');
        setStep('email');
      } else {
        toast.error(data.error || 'Failed to process invite');
        setStep('email');
      }
    } catch (error) {
      console.error('Error processing invite token:', error);
      toast.error('Failed to process invite token');
      setStep('email');
    } finally {
      setTokenProcessing(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/today`,
        }
      });

      if (error) throw error;

      setStep('otp');
      toast.success('Check your email for the verification code');
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      toast.error(error.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      toast.error('Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email,
        token: otp.trim(),
        type: 'email'
      });

      if (error) throw error;

      toast.success('Welcome back!');
      navigate('/today');
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      toast.error(error.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'token' && tokenProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Card>
              <CardContent className="pt-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <h2 className="text-lg font-semibold mb-2">Processing Invite</h2>
                <p className="text-muted-foreground">
                  Please wait while we process your invitation...
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Contractor Portal</CardTitle>
              <CardDescription>
                {step === 'email' 
                  ? 'Enter your email to receive a verification code'
                  : 'Enter the verification code sent to your email'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {inviteToken && (
                <Alert className="mb-4">
                  <CheckCircle className="w-4 h-4" />
                  <AlertDescription>
                    You've been invited to join as a contractor. Sign in to accept the invitation.
                  </AlertDescription>
                </Alert>
              )}

              {step === 'email' && (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Sending Code...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Verification Code
                      </>
                    )}
                  </Button>
                </form>
              )}

              {step === 'otp' && (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">Verification Code</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Code sent to: {email}
                    </p>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Verifying...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                  
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full" 
                    onClick={() => setStep('email')}
                  >
                    Back to Email
                  </Button>
                </form>
              )}

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Need help?{' '}
                  <a href="mailto:support@bayareacleaningpros.com" className="text-primary hover:underline">
                    Contact Support
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}