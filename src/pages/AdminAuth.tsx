import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { PublicFooter } from "@/components/footer/PublicFooter";
import { User, Session } from '@supabase/supabase-js';
import { Chrome } from "lucide-react";

const AdminAuth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Direct path for admin users
        if (session?.user) {
          setTimeout(() => {
            handleAdminAccess(session.user);
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        handleAdminAccess(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAdminAccess = async (user: any) => {
    // SECURITY: Always validate role through database, never trust email alone
    await checkUserRole(user.id);
  };

  const checkUserRole = async (userId: string) => {
    try {
      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error || !roleData) {
        console.log('No admin role found');
        toast.error('Access denied. Admin privileges required.');
        await supabase.auth.signOut();
        return;
      }
      
      if (roleData.role === 'admin' || roleData.role === 'employee') {
        navigate('/admin-panel');
      } else {
        toast.error('Access denied. Admin privileges required.');
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error('Role check error:', error);
      toast.error('Access denied. Admin privileges required.');
      await supabase.auth.signOut();
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        resetEmail,
        {
          redirectTo: `${window.location.origin}/password-reset`
        }
      );

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Password reset email sent! Check your inbox.");
        setIsResetMode(false);
        setResetEmail("");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/admin-auth`
        }
      });

      if (error) {
        console.error('Google OAuth error:', error);
        toast.error(`Google sign-in failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Unexpected Google OAuth error:', error);
      toast.error("An unexpected error occurred during Google sign-in");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const redirectToAdminSetup = () => {
    navigate('/admin-setup');
  };

  const resetAdminPasswords = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('reset-admin-passwords');
      
      if (error) {
        console.error('Reset passwords error:', error);
        toast.error(`Failed to reset passwords: ${error.message}`);
      } else {
        console.log('Passwords reset:', data);
        toast.success("Admin passwords reset successfully. Check email for new credentials.");
      }
    } catch (error) {
      console.error('Unexpected reset password error:', error);
      toast.error("An unexpected error occurred while resetting passwords");
    }
  };

  if (user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Admin Portal</CardTitle>
          <CardDescription>
            Sign in to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isResetMode ? (
            <>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="mt-4">
                <Separator className="my-4" />
                <Button
                  onClick={handleGoogleSignIn}
                  variant="outline"
                  className="w-full"
                  disabled={isGoogleLoading}
                >
                  <Chrome className="mr-2 h-4 w-4" />
                  {isGoogleLoading ? "Connecting..." : "Continue with Google"}
                </Button>
              </div>

              <div className="mt-4 text-center space-y-2">
                <Button
                  variant="link"
                  onClick={() => setIsResetMode(true)}
                  className="text-sm"
                >
                  Forgot your password?
                </Button>
                <div>
                  <Button
                    variant="outline"
                    onClick={resetAdminPasswords}
                    className="text-sm mb-2 mr-2"
                  >
                    Reset Admin Passwords
                  </Button>
                  <Button
                    variant="outline"
                    onClick={redirectToAdminSetup}
                    className="text-sm mb-2"
                  >
                    Admin Setup Portal
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">Email</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Password Reset"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setIsResetMode(false);
                  setResetEmail("");
                }}
              >
                Back to Sign In
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuth;