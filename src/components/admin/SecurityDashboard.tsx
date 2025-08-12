import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertTriangle, Users, Activity, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SecurityEvent {
  id: string;
  user_id: string;
  action_type: string;
  resource_type: string;
  resource_id: string;
  timestamp: string;
  risk_level: string;
  ip_address: unknown;
  user_email?: string;
}

interface FailedLogin {
  id: string;
  email: string;
  ip_address: unknown;
  attempt_time: string;
  failure_reason: string;
}

interface ActiveSession {
  id: string;
  user_id: string;
  ip_address: unknown;
  user_agent: string;
  created_at: string;
  last_activity: string;
  user_email?: string;
}

export const SecurityDashboard: React.FC = () => {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [failedLogins, setFailedLogins] = useState<FailedLogin[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_events: 0,
    high_risk_events: 0,
    failed_logins_24h: 0,
    active_sessions: 0
  });

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);

      // Fetch security audit logs
      const { data: auditLogs, error: auditError } = await supabase
        .from('security_audit_log')
        .select(`
          *,
          profiles!inner(full_name)
        `)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (auditError) throw auditError;

      // Fetch failed login attempts
      const { data: failedLoginData, error: loginError } = await supabase
        .from('failed_login_attempts')
        .select('*')
        .order('attempt_time', { ascending: false })
        .limit(50);

      if (loginError) throw loginError;

      // Fetch active sessions
      const { data: sessionData, error: sessionError } = await supabase
        .from('user_sessions')
        .select(`
          *,
          profiles!inner(full_name)
        `)
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      if (sessionError) throw sessionError;

      setSecurityEvents(auditLogs || []);
      setFailedLogins(failedLoginData || []);
      setActiveSessions(sessionData || []);

      // Calculate stats
      const highRiskEvents = auditLogs?.filter(event => 
        ['high', 'critical'].includes(event.risk_level)
      ).length || 0;

      const failedLogins24h = failedLoginData?.filter(login => 
        new Date(login.attempt_time) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length || 0;

      setStats({
        total_events: auditLogs?.length || 0,
        high_risk_events: highRiskEvents,
        failed_logins_24h: failedLogins24h,
        active_sessions: sessionData?.length || 0
      });

    } catch (error) {
      console.error('Error fetching security data:', error);
      toast.error('Failed to load security data');
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const formatIpAddress = (ip: unknown): string => {
    return ip ? String(ip) : 'Unknown';
  };

  const terminateSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ 
          is_active: false, 
          terminated_reason: 'Admin terminated' 
        })
        .eq('id', sessionId);

      if (error) throw error;

      toast.success('Session terminated successfully');
      fetchSecurityData();
    } catch (error) {
      console.error('Error terminating session:', error);
      toast.error('Failed to terminate session');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
          <p className="text-muted-foreground">Monitor system security and user activity</p>
        </div>
        <Button onClick={fetchSecurityData}>
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Security Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_events}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.high_risk_events}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins (24h)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.failed_logins_24h}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_sessions}</div>
          </CardContent>
        </Card>
      </div>

      {/* High Risk Alert */}
      {stats.high_risk_events > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {stats.high_risk_events} high-risk security events detected. Please review immediately.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="audit-log" className="space-y-4">
        <TabsList>
          <TabsTrigger value="audit-log">Audit Log</TabsTrigger>
          <TabsTrigger value="failed-logins">Failed Logins</TabsTrigger>
          <TabsTrigger value="active-sessions">Active Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="audit-log">
          <Card>
            <CardHeader>
              <CardTitle>Security Audit Log</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {securityEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        {new Date(event.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>{event.user_email || 'System'}</TableCell>
                      <TableCell>{event.action_type}</TableCell>
                      <TableCell>{event.resource_type}</TableCell>
                      <TableCell>
                        <Badge variant={getRiskBadgeColor(event.risk_level)}>
                          {event.risk_level}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatIpAddress(event.ip_address)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failed-logins">
          <Card>
            <CardHeader>
              <CardTitle>Failed Login Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {failedLogins.map((login) => (
                    <TableRow key={login.id}>
                      <TableCell>
                        {new Date(login.attempt_time).toLocaleString()}
                      </TableCell>
                      <TableCell>{login.email}</TableCell>
                      <TableCell>{formatIpAddress(login.ip_address)}</TableCell>
                      <TableCell>{login.failure_reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active-sessions">
          <Card>
            <CardHeader>
              <CardTitle>Active User Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>{session.user_email || 'Unknown'}</TableCell>
                      <TableCell>{formatIpAddress(session.ip_address)}</TableCell>
                      <TableCell>
                        {new Date(session.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {new Date(session.last_activity).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => terminateSession(session.id)}
                        >
                          Terminate
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};