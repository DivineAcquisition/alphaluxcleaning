import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft, Loader2, Chrome } from 'lucide-react';

interface OTPFormProps {
  type: 'admin' | 'customer';
  onOTPSent: () => void;
  onOTPVerified: () => void;
  requestOTP: (email: string, name?: string) => Promise<{ error: any }>;
  verifyOTP: (email: string, token: string, name?: string) => Promise<{ error: any }>;
  onGoogleSignIn?: () => Promise<{ error: any }>;
}

export function OTPForm({ 
  type, 
  onOTPSent, 
  onOTPVerified, 
  requestOTP, 
  verifyOTP,
  onGoogleSignIn 
}: OTPFormProps) {
  const [step, setStep] = useState<'email' | 'verify'>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error } = await requestOTP(email, name);
    
    if (!error) {
      setStep('verify');
      onOTPSent();
      // Start cooldown timer
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setError(error.message);
    }
    
    setIsLoading(false);
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setError(null);

    const { error } = await requestOTP(email, name);
    
    if (!error) {
      // Start cooldown timer
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setError(error.message);
    }
    
    setIsLoading(false);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Please enter the verification code');
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error } = await verifyOTP(email, token, name);
    
    if (!error) {
      onOTPVerified();
    } else {
      setError(error.message);
    }
    
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    if (!onGoogleSignIn) return;
    
    setIsLoading(true);
    setError(null);

    const { error } = await onGoogleSignIn();
    
    if (error) {
      setError(error.message);
    }
    
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <Mail className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">
          {type === 'admin' ? 'Admin Sign In' : 'Customer Portal'}
        </CardTitle>
        <CardDescription>
          {step === 'email' 
            ? `Enter your email to receive a verification code`
            : 'Enter the verification code sent to your email'
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 'email' ? (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
                required
              />
            </div>

            {type === 'customer' && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name (Optional)</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11"
                />
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-11" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Code...
                </>
              ) : (
                'Send Verification Code'
              )}
            </Button>

            {type === 'admin' && onGoogleSignIn && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full h-11"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <Chrome className="mr-2 h-4 w-4" />
                  Continue with Google
                </Button>
              </>
            )}
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Verification Code</Label>
              <Input
                id="token"
                type="text"
                placeholder="Enter 6-digit code"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="h-11 text-center text-lg tracking-widest"
                maxLength={6}
                autoComplete="one-time-code"
                required
              />
              <p className="text-sm text-muted-foreground text-center">
                Code sent to {email}
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11" 
              disabled={isLoading || token.length !== 6}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Sign In'
              )}
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleResendCode}
                disabled={isLoading || resendCooldown > 0}
              >
                {resendCooldown > 0 ? (
                  `Resend in ${resendCooldown}s`
                ) : (
                  'Resend Code'
                )}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  setStep('email');
                  setToken('');
                  setError(null);
                  setResendCooldown(0);
                }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}