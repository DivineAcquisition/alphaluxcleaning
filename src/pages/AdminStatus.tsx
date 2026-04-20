import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

interface AdminStatus {
  authUsers: any[];
  adminUsers: any[];
  allowlist: any[];
  currentSession: any;
}

const AdminStatus = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<AdminStatus | null>(null);
  const [fixing, setFixing] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data: adminUsers } = await supabase.functions.invoke('admin-auth-guard', {
        body: { action: 'list_users' }
      });

      const { data: allowlist } = await supabase.functions.invoke('admin-auth-guard', {
        body: { action: 'list_allowlist' }
      });

      setStatus({
        authUsers: [],
        adminUsers: adminUsers?.users || [],
        allowlist: allowlist?.allowlist || [],
        currentSession: session,
      });
    } catch (error) {
      console.error('Failed to load status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFixAdmin = async (email: string) => {
    setFixing(true);
    try {
      const { data, error } = await supabase.functions.invoke('dev-ensure-admin', {
        body: { email, password: 'Admin123!', role: 'admin' }
      });

      if (error) throw error;

      toast({
        title: "Admin Fixed",
        description: `Admin account for ${email} has been updated and confirmed.`,
      });

      await loadStatus();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fix Failed",
        description: error.message,
      });
    } finally {
      setFixing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin Status | AlphaLux Cleaning</title>
      </Helmet>

      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Admin System Status</h1>
            <div className="space-x-2">
              <Button variant="outline" onClick={loadStatus} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => navigate('/admin-auth-login')}>
                Back to Login
              </Button>
            </div>
          </div>

          {/* Current Session */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Current Session</h2>
            {status?.currentSession ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="font-medium">Logged In</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Email: {status.currentSession.user?.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  User ID: {status.currentSession.user?.id}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-destructive" />
                <span>Not logged in</span>
              </div>
            )}
          </Card>

          {/* Admin Users */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Admin Users</h2>
            {status?.adminUsers && status.adminUsers.length > 0 ? (
              <div className="space-y-3">
                {status.adminUsers.map((admin: any) => (
                  <div key={admin.user_id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{admin.email}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Role: {admin.role}</span>
                        <span>Status: {admin.status}</span>
                      </div>
                    </div>
                    {admin.status !== 'active' && (
                      <Button
                        size="sm"
                        onClick={() => handleFixAdmin(admin.email)}
                        disabled={fixing}
                      >
                        {fixing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Fix'
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-warning">
                <AlertCircle className="h-5 w-5" />
                <span>No admin users found</span>
              </div>
            )}
          </Card>

          {/* Allowlist */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Admin Allowlist</h2>
            {status?.allowlist && status.allowlist.length > 0 ? (
              <div className="space-y-2">
                {status.allowlist.map((item: any) => (
                  <div key={item.id} className="p-2 bg-muted rounded">
                    {item.email || item.domain}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No entries in allowlist</p>
            )}
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Button
                className="w-full"
                onClick={() => handleFixAdmin('info@alphaluxclean.com')}
                disabled={fixing}
              >
                {fixing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting Up...
                  </>
                ) : (
                  'Setup info@alphaluxclean.com as Admin'
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                This will create/update the admin account with password: Admin123!
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AdminStatus;
