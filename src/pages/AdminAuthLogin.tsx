import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, AlertCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const AdminAuthLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: adminCheck } = await supabase.functions.invoke('admin-auth-guard');
        if (adminCheck && !adminCheck.error) {
          navigate('/admin', { replace: true });
          return;
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setCheckingSession(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes('Email not confirmed')) {
          toast({
            variant: "destructive",
            title: "Email Not Confirmed",
            description: "Please check your email to confirm your account, or use Development Mode to create an admin account.",
          });
        } else if (authError.message.includes('Invalid login credentials')) {
          toast({
            variant: "destructive",
            title: "Invalid Credentials",
            description: "Please check your email and password.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Login Failed",
            description: authError.message,
          });
        }
        setLoading(false);
        return;
      }

      if (!authData.session) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Unable to create session.",
        });
        setLoading(false);
        return;
      }

      const { data: adminCheck, error: adminError } = await supabase.functions.invoke('admin-auth-guard');

      if (adminError || adminCheck?.error) {
        await supabase.auth.signOut();
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You don't have admin privileges. Please contact an administrator.",
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Login Successful",
        description: `Welcome back, ${adminCheck.email}!`,
      });

      navigate('/admin', { replace: true });
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDevModeSetup = async () => {
    setLoading(true);
    try {
      const devEmail = email || 'admin@alphaluxclean.com';
      const devPassword = password || 'Admin123!';

      const { data, error } = await supabase.functions.invoke('dev-ensure-admin', {
        body: { email: devEmail, password: devPassword, role: 'admin' }
      });

      if (error) throw error;

      if (data.error) {
        toast({
          variant: "destructive",
          title: "Setup Failed",
          description: data.error,
        });
        return;
      }

      toast({
        title: "Admin Setup Complete",
        description: `Admin account created/updated. Email: ${devEmail}`,
      });

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: devEmail,
        password: devPassword,
      });

      if (!loginError) {
        navigate('/admin', { replace: true });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to set up admin account.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin Login | AlphaLuxClean</title>
        <meta name="description" content="Secure admin portal login for AlphaLuxClean management system" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md p-8 space-y-6">
          <div className="text-center space-y-2">
            <Shield className="h-12 w-12 mx-auto text-primary" />
            <h1 className="text-2xl font-bold">Admin Portal</h1>
            <p className="text-sm text-muted-foreground">Sign in to access the management system</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
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
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Development Mode</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
              <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Development Mode creates or updates an admin account with the provided credentials, skipping email confirmation.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleDevModeSetup}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting Up...
                </>
              ) : (
                'Setup Admin Account'
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full text-xs"
              onClick={() => navigate('/admin-status')}
            >
              Check Admin Status
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
};

export default AdminAuthLogin;
