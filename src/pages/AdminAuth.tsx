import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
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
        
        // Defer role check to prevent deadlock
        if (session?.user) {
          setTimeout(() => {
            checkUserRole(session.user.id);
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkUserRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkUserRole = async (userId: string) => {
    try {
      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Role check error:', error);
        
        // If user doesn't have a role, create a customer role for them
        if (error.code === 'PGRST116' || !roleData) {
          console.log('No role found, creating customer role...');
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert({
              user_id: userId,
              role: 'customer'
            });
          
          if (insertError) {
            console.error('Error creating role:', insertError);
            toast.error('Error setting up user permissions');
            await supabase.auth.signOut();
            return;
          }
          
          toast.error('Access denied. Admin or employee privileges required.');
          await supabase.auth.signOut();
          return;
        } else {
          toast.error('Error checking user permissions');
          await supabase.auth.signOut();
          return;
        }
      }
      
      if (roleData && (roleData.role === 'admin' || roleData.role === 'employee')) {
        navigate('/admin-panel');
      } else {
        toast.error('Access denied. Admin or employee privileges required.');
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error('Unexpected error during role check:', error);
      toast.error('Authentication error occurred');
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

  const sendAdminInvites = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('send-admin-invites');
      
      if (error) {
        console.error('Admin invite error:', error);
        toast.error(`Failed to send admin invites: ${error.message}`);
      } else {
        console.log('Admin invites sent:', data);
        toast.success("Admin invitation emails sent successfully!");
      }
    } catch (error) {
      console.error('Unexpected admin invite error:', error);
      toast.error("An unexpected error occurred while sending invites");
    }
  };

  const createTestAdmin = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-test-admin');
      
      if (error) {
        console.error('Test admin creation error:', error);
        toast.error(`Failed to create test admin: ${error.message}`);
      } else {
        console.log('Test admin created:', data);
        toast.success("Test admin created! Email: admin@test.com, Password: admin123");
      }
    } catch (error) {
      console.error('Unexpected test admin error:', error);
      toast.error("An unexpected error occurred while creating test admin");
    }
  };

  const fixAdminUsers = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fix-admin-users');
      
      if (error) {
        console.error('Fix admin users error:', error);
        toast.error(`Failed to fix admin users: ${error.message}`);
      } else {
        console.log('Admin users fixed:', data);
        toast.success("Admin users fixed! Use divine@bayareacleaningpros.com instead");
      }
    } catch (error) {
      console.error('Unexpected fix admin error:', error);
      toast.error("An unexpected error occurred while fixing admin users");
    }
  };

  const resetAdminPasswords = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('reset-admin-passwords');
      
      if (error) {
        console.error('Reset passwords error:', error);
        toast.error(`Failed to reset passwords: ${error.message}`);
      } else {
        console.log('Passwords reset:', data);
        toast.success("All admin passwords reset to: Bacp2025!-");
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
                    onClick={fixAdminUsers}
                    className="text-sm mb-2 mr-2"
                  >
                    Fix Admin Users
                  </Button>
                  <br />
                  <Button
                    variant="outline"
                    onClick={sendAdminInvites}
                    className="text-sm mb-2 mr-2"
                  >
                    Send Admin Setup Emails
                  </Button>
                  <Button
                    variant="outline"
                    onClick={createTestAdmin}
                    className="text-sm"
                  >
                    Create Test Admin (admin@test.com)
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