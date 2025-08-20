import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, Mail, KeyRound, Shield, User, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CustomerPortalWrapperProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  requiresAuth?: boolean;
}

export function CustomerPortalWrapper({ 
  children, 
  title = "Customer Portal", 
  description = "Manage your cleaning services", 
  requiresAuth = true 
}: CustomerPortalWrapperProps) {
  const { user, userRole, signIn, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showLogin, setShowLogin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  
  // Login form state
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [resetEmail, setResetEmail] = useState('');
  const [signUpData, setSignUpData] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '', 
    fullName: '' 
  });

  // Check authentication status
  useEffect(() => {
    if (!requiresAuth) return;
    
    if (!loading && !user) {
      // User is not authenticated, show login
      setShowLogin(true);
    } else if (!loading && user && userRole) {
      // User is authenticated, check if they have customer access
      if (userRole === 'customer' || userRole === 'super_admin') {
        setShowLogin(false);
      } else {
        // User has different role, redirect appropriately
        toast.error('This portal is for customers only. Redirecting you to the appropriate dashboard.');
        setTimeout(() => {
          if (userRole === 'super_admin') {
            navigate('/admin');
          } else if (userRole === 'subcontractor') {
            navigate('/subcontractor-dashboard');
          } else if (userRole === 'office_manager') {
            navigate('/office-manager-dashboard');
          } else {
            navigate('/');
          }
        }, 2000);
      }
    }
  }, [user, userRole, loading, requiresAuth, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!loginData.email || !loginData.password) {
      setError('Please fill in all fields');
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await signIn(loginData.email, loginData.password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please check your email and confirm your account before signing in.');
        } else {
          setError(error.message);
        }
      } else {
        toast.success('Welcome back! Successfully signed in.');
        setShowLogin(false);
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!signUpData.email || !signUpData.password || !signUpData.confirmPassword || !signUpData.fullName) {
      setError('Please fill in all fields');
      setIsSubmitting(false);
      return;
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    if (signUpData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsSubmitting(false);
      return;
    }

    try {
      const redirectUrl = `${window.location.origin}/customer-portal-dashboard`;
      
      const { data, error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: signUpData.fullName,
            role: 'customer'
          }
        }
      });
      
      if (error) {
        if (error.message.includes('User already registered')) {
          setError('An account with this email already exists. Please sign in instead.');
        } else {
          setError(error.message);
        }
      } else {
        toast.success('Account created! Please check your email to confirm your account.');
        setShowSignUp(false);
        setShowLogin(true);
      }
    } catch (error) {
      setError('An unexpected error occurred during sign up');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!resetEmail) {
      setError('Please enter your email address');
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/customer-portal-dashboard`,
      });

      if (error) {
        setError(error.message);
      } else {
        toast.success('Password reset email sent! Check your inbox.');
        setShowPasswordReset(false);
        setResetEmail('');
      }
    } catch (error) {
      setError('Failed to send password reset email');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const callbackUrl = `${window.location.origin}/customer-portal-dashboard`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
        },
      });
      
      if (error) {
        setError(error.message);
        setIsSubmitting(false);
      }
    } catch (error) {
      setError('Failed to connect with Google');
      setIsSubmitting(false);
    }
  };

  // Show loading spinner while checking authentication
  if (loading && requiresAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading customer portal...</p>
        </div>
      </div>
    );
  }

  // Show login modal if authentication is required and user is not logged in
  if (showLogin && requiresAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Customer Portal Access</CardTitle>
            <CardDescription>
              Sign in to access your cleaning services dashboard
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {showPasswordReset ? (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email Address</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="Enter your email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                    Send Reset Email
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowPasswordReset(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : showSignUp ? (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={signUpData.fullName}
                    onChange={(e) => setSignUpData(prev => ({ ...prev, fullName: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email Address</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={signUpData.password}
                    onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={signUpData.confirmPassword}
                    onChange={(e) => setSignUpData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <User className="h-4 w-4 mr-2" />}
                    Create Account
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowSignUp(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={loginData.email}
                    onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
                  Sign In
                </Button>
              </form>
            )}

            {!showPasswordReset && !showSignUp && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleGoogleSignIn} 
                  disabled={isSubmitting}
                  className="w-full"
                >
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </Button>
              </>
            )}

            <div className="text-center space-y-2">
              {!showPasswordReset && !showSignUp && (
                <>
                  <Button 
                    type="button" 
                    variant="link" 
                    onClick={() => setShowPasswordReset(true)}
                    className="text-sm"
                  >
                    Forgot your password?
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <Button 
                      type="button" 
                      variant="link" 
                      onClick={() => setShowSignUp(true)}
                      className="text-primary p-0 h-auto"
                    >
                      Sign up
                    </Button>
                  </div>
                </>
              )}
              
              <div className="pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/')}
                  className="text-sm"
                >
                  Back to Homepage
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is authenticated (or auth not required), show the portal content
  return <>{children}</>;
}