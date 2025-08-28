import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw } from "lucide-react";

interface SecurityMetrics {
  totalEvents: number;
  highRiskEvents: number;
  failedLogins: number;
  activeSessions: number;
  rateLimitedAttempts: number;
  adminAccessAttempts: number;
}

interface SecurityEvent {
  id: string;
  action_type: string;
  resource_type: string;
  risk_level: string;
  timestamp: string;
  user_id?: string;
  metadata?: any;
}

export function SecurityEnhancedMonitoring() {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalEvents: 0,
    highRiskEvents: 0,
    failedLogins: 0,
    activeSessions: 0,
    rateLimitedAttempts: 0,
    adminAccessAttempts: 0
  });
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSecurityData = async () => {
    try {
      setLoading(true);

      let auditLogs: any[] = [];
      let failedLogins: any[] = [];
      let rateLimitEvents: any[] = [];

      // Safely fetch security audit logs for the last 24 hours
      try {
        const { data } = await supabase
          .from('security_audit_log')
          .select('*')
          .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('timestamp', { ascending: false })
          .limit(50);
        auditLogs = data || [];
      } catch (error) {
        console.log('Security audit log not available, using fallback data');
        auditLogs = [];
      }

      // Safely fetch failed login attempts
      try {
        const { data } = await supabase
          .from('failed_login_attempts')
          .select('*')
          .gte('attempt_time', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
        failedLogins = data || [];
      } catch (error) {
        console.log('Failed login attempts not available, using fallback data');
        failedLogins = [];
      }

      // Safely fetch rate limiting events
      try {
        const { data } = await supabase
          .from('auth_rate_limits')
          .select('*')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
        rateLimitEvents = data || [];
      } catch (error) {
        console.log('Auth rate limits not available, using fallback data');
        rateLimitEvents = [];
      }

      // Calculate metrics with fallback values
      const highRiskEvents = auditLogs.filter(log => 
        ['high', 'critical'].includes(log.risk_level)
      ).length;

      const adminAccessAttempts = auditLogs.filter(log => 
        log.action_type.includes('admin_access')
      ).length;

      const rateLimitedAttempts = rateLimitEvents.filter(event =>
        event.blocked_until && new Date(event.blocked_until) > new Date()
      ).length;

      setMetrics({
        totalEvents: auditLogs.length,
        highRiskEvents,
        failedLogins: failedLogins.length,
        activeSessions: 8, // Mock data - would need to implement session tracking
        rateLimitedAttempts,
        adminAccessAttempts
      });

      setRecentEvents(auditLogs);

    } catch (error) {
      console.error('Error fetching security data:', error);
      // Set fallback metrics
      setMetrics({
        totalEvents: 0,
        highRiskEvents: 0,
        failedLogins: 0,
        activeSessions: 0,
        rateLimitedAttempts: 0,
        adminAccessAttempts: 0
      });
      setRecentEvents([]);
      
      toast({
        title: "Security Data Unavailable",
        description: "Using fallback security monitoring data",
        variant: "default"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getActionTypeIcon = (actionType: string) => {
    if (actionType.includes('admin')) return <Shield className="h-4 w-4" />;
    if (actionType.includes('denied') || actionType.includes('failed')) return <XCircle className="h-4 w-4" />;
    if (actionType.includes('granted') || actionType.includes('success')) return <CheckCircle className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Security Enhanced Monitoring</CardTitle>
          <CardDescription>Loading security data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Status Alert */}
      {metrics.highRiskEvents > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {metrics.highRiskEvents} high-risk security events detected in the last 24 hours. 
            Immediate review recommended.
          </AlertDescription>
        </Alert>
      )}

      {/* Enhanced Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Events</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalEvents}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{metrics.highRiskEvents}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.failedLogins}</div>
            <p className="text-xs text-muted-foreground">Authentication failures</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rate Limited</CardTitle>
            <Shield className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.rateLimitedAttempts}</div>
            <p className="text-xs text-muted-foreground">Currently blocked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Access</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.adminAccessAttempts}</div>
            <p className="text-xs text-muted-foreground">Access attempts</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Security Events */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Security Events</CardTitle>
            <CardDescription>Latest security audit log entries</CardDescription>
          </div>
          <Button onClick={fetchSecurityData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentEvents.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No recent security events</p>
            ) : (
              recentEvents.slice(0, 10).map((event) => (
                <div key={event.id} className="flex items-start justify-between border-b pb-3">
                  <div className="flex items-start space-x-3">
                    {getActionTypeIcon(event.action_type)}
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{event.action_type}</span>
                        <Badge variant={getRiskBadgeVariant(event.risk_level)}>
                          {event.risk_level}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Resource: {event.resource_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}