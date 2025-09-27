import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Shield, Mail } from 'lucide-react';

export default function AdminAuthLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check if user has admin access
        try {
          const { data } = await supabase.functions.invoke('admin-auth-guard');
          if (data?.role) {
            navigate('/admin', { replace: true });
          }
        } catch (error) {
          // User is authenticated but not admin - stay on login page
        }
      }
    };
    checkAuth();
  }, [navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/admin`
          }
        });

        if (error) throw error;
        toast.success('Check your email for the confirmation link');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        // Check admin access after successful login
        const { data, error: guardError } = await supabase.functions.invoke('admin-auth-guard');
        
        if (guardError || !data?.role) {
          await supabase.auth.signOut();
          toast.error('Access denied. Your email is not authorized for admin access.');
          return;
        }

        toast.success('Successfully signed in');
        navigate('/admin', { replace: true });
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      if (error.message?.includes('Invalid login credentials')) {
        toast.error('Invalid email or password');
      } else if (error.message?.includes('Email not confirmed')) {
        toast.error('Please check your email and confirm your account. You can also use Development Mode to bypass email confirmation.');
      } else {
        toast.error(error.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDevModeSignIn = async () => {
    if (!email || !password) {
      toast.error('Please enter both email and password for development mode');
      return;
    }

    setLoading(true);
    try {
      // Use the new dev-create-admin-user edge function
      const { data, error } = await supabase.functions.invoke('dev-create-admin-user', {
        body: {
          email: email,
          role: 'admin',
          password: password
        }
      });

      if (error) throw error;

      // Automatically sign in after user creation
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        toast.error('User created but sign-in failed. Please try signing in manually.');
        setDevMode(false);
        return;
      }

      // Check admin access after successful login
      const { data: guardData, error: guardError } = await supabase.functions.invoke('admin-auth-guard');
      
      if (guardError || !guardData?.role) {
        await supabase.auth.signOut();
        toast.error('User created but admin access verification failed.');
        return;
      }

      if (data.existing) {
        toast.success('Admin user updated and signed in successfully!');
      } else {
        toast.success('Development admin user created and signed in successfully!');
      }
      
      navigate('/admin', { replace: true });
    } catch (error: any) {
      console.error('Dev mode error:', error);
      toast.error(error.message || 'Failed to create development user');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast.error('Please enter your email first');
      return;
    }

    setResendingEmail(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`
        }
      });

      if (error) throw error;
      toast.success('Verification email sent! Check your inbox.');
    } catch (error: any) {
      console.error('Resend error:', error);
      toast.error(error.message || 'Failed to resend verification email');
    } finally {
      setResendingEmail(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/admin`
        }
      });

      if (error) {
        toast.error('Google sign in failed: ' + error.message);
      }
    } catch (error) {
      console.error('Google auth error:', error);
      toast.error('Google sign in failed');
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin Login - AlphaLuxClean</title>
        <meta name="description" content="Secure admin access for AlphaLuxClean management system" />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">
              {devMode ? 'Development Mode' : 'Admin Access'}
            </CardTitle>
            <CardDescription>
              {devMode 
                ? 'Create an admin user for development/testing purposes'
                : isSignUp 
                  ? 'Create your admin account with an authorized email'
                  : 'Sign in to access the AlphaLuxClean admin system'
              }
            </CardDescription>
          </CardHeader>

{devMode ? (
            <CardContent className="space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Development Mode:</strong> This will create an admin user and set a password.
                  Use this only for development/testing purposes.
                </p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="dev-email" className="text-sm font-medium">Email</label>
                <Input
                  id="dev-email"
                  type="email"
                  placeholder="your-email@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="dev-password" className="text-sm font-medium">Password</label>
                <Input
                  id="dev-password"
                  type="password"
                  placeholder="Create a secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button 
                onClick={handleDevModeSignIn}
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating Dev Admin...
                  </>
                ) : (
                  'Create Development Admin User'
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setDevMode(false)}
              >
                Back to Normal Login
              </Button>
            </CardContent>
          ) : (
            <>
              <form onSubmit={handleEmailAuth}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">Email</label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@alphaluxclean.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium">Password</label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        {isSignUp ? 'Creating Account...' : 'Signing In...'}
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        {isSignUp ? 'Create Account' : 'Sign In'}
                      </>
                     )}
                   </Button>

                   {/* Resend verification button */}
                   <Button 
                     type="button" 
                     variant="outline" 
                     size="sm"
                     className="w-full"
                     onClick={handleResendVerification}
                     disabled={resendingEmail || !email}
                   >
                     {resendingEmail ? (
                       <>
                         <Loader2 className="w-4 h-4 animate-spin mr-2" />
                         Sending...
                       </>
                     ) : (
                       <>
                         <Mail className="w-4 h-4 mr-2" />
                         Resend Verification Email
                       </>
                     )}
                   </Button>

                   <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>

                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={handleGoogleSignIn}
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </Button>
                </CardContent>
              </form>

              <CardFooter className="flex flex-col space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full text-sm" 
                  onClick={() => setIsSignUp(!isSignUp)}
                  type="button"
                >
                  {isSignUp 
                    ? 'Already have an account? Sign in' 
                    : 'Need an account? Sign up'
                  }
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDevMode(true)}
                  className="text-xs text-muted-foreground"
                >
                  Development Mode
                </Button>
              </CardFooter>
            </>
          )}

        </Card>
      </div>
    </>
  );
}