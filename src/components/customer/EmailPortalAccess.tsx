import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Shield, ArrowRight } from 'lucide-react';

interface EmailPortalAccessProps {
  onEmailSubmit: (email: string) => void;
  loading?: boolean;
  error?: string | null;
}

export function EmailPortalAccess({ onEmailSubmit, loading = false, error }: EmailPortalAccessProps) {
  const [email, setEmail] = useState('');
  const [isValidEmail, setIsValidEmail] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setIsValidEmail(validateEmail(newEmail));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidEmail && !loading) {
      onEmailSubmit(email);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Access Your Services</CardTitle>
          <CardDescription>
            Enter your email address to view your cleaning services and account information
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={handleEmailChange}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
              {email && !isValidEmail && (
                <p className="text-sm text-destructive">Please enter a valid email address</p>
              )}
            </div>

            <Button 
              type="submit" 
              disabled={!isValidEmail || loading} 
              className="w-full"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Checking...' : 'Access My Services'}
            </Button>
          </form>

          <div className="text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Secure Access</span>
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              <p>✓ No password required</p>
              <p>✓ Instant access to your services</p>
              <p>✓ Secure and private</p>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Can't find your services? Contact us at{' '}
                <a href="mailto:support@bayareacleaningprofessionals.com" className="text-primary hover:underline">
                  support@bayareacleaningprofessionals.com
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}