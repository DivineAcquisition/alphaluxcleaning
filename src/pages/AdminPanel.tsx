import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { LogOut, CheckCircle, UserCheck, Mail } from "lucide-react";
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

const AdminPanel = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [emailsSent, setEmailsSent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        if (!session?.user) {
          navigate('/admin-auth');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      if (!session?.user) {
        navigate('/admin-auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchUserRole();
    }
  }, [user]);

  const fetchUserRole = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setUserRole(data.role);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const sendAdminInvites = async () => {
    try {
      setEmailsSent(false);
      const { error } = await supabase.functions.invoke('send-admin-invites');
      
      if (error) {
        toast.error("Failed to send admin invites");
      } else {
        toast.success("Admin invitation emails sent successfully!");
        setEmailsSent(true);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/admin-auth');
  };

  const goToMainDashboard = () => {
    navigate('/admin-dashboard');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Control Panel</h1>
            <p className="text-muted-foreground mt-2">
              Welcome, {user.email} ({userRole || 'loading...'})
            </p>
          </div>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Admin Setup Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Admin Account Setup
            </CardTitle>
            <CardDescription>
              Send invitation emails to admin users to set up their accounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Admin Email Addresses:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• admin1@bayareacleaningpros.com</li>
                <li>• ellie@bayareacleaningpros.com</li>
                <li>• divineacquisition.io@gmail.com</li>
              </ul>
            </div>
            
            {emailsSent && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Admin invitation emails have been sent successfully! 
                  Check the recipient inboxes for setup instructions.
                </AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={sendAdminInvites} 
              className="w-full"
              size="lg"
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Admin Setup Emails
            </Button>
          </CardContent>
        </Card>

        {/* Navigation Section */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Access main dashboard and other admin functions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={goToMainDashboard} 
              className="w-full" 
              size="lg"
              variant="outline"
            >
              Go to Booking Management Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;