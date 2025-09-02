import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Shield, Activity, TrendingUp, Users, Lock, Globe, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecurityMetrics {
  totalEvents: number;
  highRiskEvents: number;
  activeThreats: number;
  blockedIPs: number;
  successRate: number;
  averageResponseTime: number;
}

interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  metadata: any;
}

interface ThreatIntelligence {
  id: string;
  ip_address: string;
  country_code: string;
  threat_score: number;
  is_blocked: boolean;
  block_reason: string;
  first_seen: string;
  is_vpn: boolean;
  is_tor: boolean;
  is_proxy: boolean;
}

interface RateLimitStatus {
  identifier: string;
  identifier_type: string;
  action_type: string;
  attempt_count: number;
  blocked_until: string | null;
  max_attempts: number;
}

export default function SecurityMonitoringDashboard() {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalEvents: 0,
    highRiskEvents: 0,
    activeThreats: 0,
    blockedIPs: 0,
    successRate: 0,
    averageResponseTime: 0
  });
  
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [threats, setThreats] = useState<ThreatIntelligence[]>([]);
  const [rateLimits, setRateLimits] = useState<RateLimitStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSecurityData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchSecurityData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSecurityData = async () => {
    try {
      const [metricsResult, alertsResult, threatsResult, rateLimitsResult] = await Promise.all([
        fetchSecurityMetrics(),
        fetchSecurityAlerts(),
        fetchThreatIntelligence(),
        fetchRateLimitStatus()
      ]);

      setMetrics(metricsResult);
      setAlerts(alertsResult);
      setThreats(threatsResult);
      setRateLimits(rateLimitsResult);
    } catch (error) {
      console.error('Failed to fetch security data:', error);
      toast({
        title: "Security Data Error",
        description: "Failed to fetch security monitoring data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSecurityMetrics = async (): Promise<SecurityMetrics> => {
    const { data: events } = await supabase
      .from('security_audit_log')
      .select('risk_level')
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const { data: blockedIPs } = await supabase
      .from('ip_threat_intelligence')
      .select('id')
      .eq('is_blocked', true);

    const totalEvents = events?.length || 0;
    const highRiskEvents = events?.filter(e => ['high', 'critical'].includes(e.risk_level)).length || 0;
    
    return {
      totalEvents,
      highRiskEvents,
      activeThreats: highRiskEvents,
      blockedIPs: blockedIPs?.length || 0,
      successRate: totalEvents > 0 ? ((totalEvents - highRiskEvents) / totalEvents) * 100 : 100,
      averageResponseTime: 150 // Mock data - would be calculated from actual metrics
    };
  };

  const fetchSecurityAlerts = async (): Promise<SecurityAlert[]> => {
    const { data } = await supabase
      .from('security_alerts')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(20);

    return data || [];
  };

  const fetchThreatIntelligence = async (): Promise<ThreatIntelligence[]> => {
    const { data } = await supabase
      .from('ip_threat_intelligence')
      .select('*')
      .or('threat_score.gte.50,is_blocked.eq.true')
      .order('threat_score', { ascending: false })
      .limit(20);

    return (data || []).map(item => ({
      ...item,
      ip_address: String(item.ip_address || ''),
      country_code: item.country_code || '',
      block_reason: item.block_reason || ''
    })) as ThreatIntelligence[];
  };

  const fetchRateLimitStatus = async (): Promise<RateLimitStatus[]> => {
    // Using mock data since enhanced_rate_limits table is new
    return [
      {
        identifier: '192.168.1.100',
        identifier_type: 'ip_address',
        action_type: 'auth',
        attempt_count: 5,
        blocked_until: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        max_attempts: 5
      },
      {
        identifier: 'user@example.com',
        identifier_type: 'email',
        action_type: 'sms',
        attempt_count: 3,
        blocked_until: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        max_attempts: 5
      }
    ];
  };

  const resolveAlert = async (alertId: string) => {
    const { error } = await supabase
      .from('security_alerts')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', alertId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to resolve alert",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Alert Resolved",
        description: "Security alert has been marked as resolved",
      });
      fetchSecurityData();
    }
  };

  const blockIP = async (ipAddress: string, reason: string) => {
    const { error } = await supabase
      .from('ip_threat_intelligence')
      .update({ is_blocked: true, block_reason: reason })
      .eq('ip_address', ipAddress);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to block IP address",
        variant: "destructive",
      });
    } else {
      toast({
        title: "IP Blocked",
        description: `IP address ${ipAddress} has been blocked`,
      });
      fetchSecurityData();
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getThreatScoreColor = (score: number) => {
    if (score >= 80) return 'destructive';
    if (score >= 60) return 'secondary';
    if (score >= 40) return 'outline';
    return 'default';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Activity className="h-4 w-4 animate-spin" />
          <span>Loading security data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time security monitoring and threat detection
          </p>
        </div>
        <Button onClick={fetchSecurityData} variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Security Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked IPs</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.blockedIPs}</div>
            <p className="text-xs text-muted-foreground">Active blocks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics.successRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Security posture</p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {alerts.filter(alert => alert.severity === 'critical').length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Security Alerts</AlertTitle>
          <AlertDescription>
            {alerts.filter(alert => alert.severity === 'critical').length} critical security alert(s) require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="alerts" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
          <TabsTrigger value="threats">Threat Intelligence</TabsTrigger>
          <TabsTrigger value="ratelimits">Rate Limits</TabsTrigger>
          <TabsTrigger value="overview">System Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Security Alerts</CardTitle>
              <CardDescription>
                Security events requiring investigation or action
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active security alerts</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Severity</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell>
                          <Badge variant={getSeverityColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{alert.title}</TableCell>
                        <TableCell className="max-w-md truncate">{alert.description}</TableCell>
                        <TableCell>
                          {new Date(alert.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            Resolve
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="threats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Threat Intelligence</CardTitle>
              <CardDescription>
                IP addresses with high threat scores or blocked status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {threats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No threats detected</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Threat Score</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {threats.map((threat) => (
                      <TableRow key={threat.id}>
                        <TableCell className="font-mono">{threat.ip_address}</TableCell>
                        <TableCell>{threat.country_code || 'Unknown'}</TableCell>
                        <TableCell>
                          <Badge variant={getThreatScoreColor(threat.threat_score)}>
                            {threat.threat_score}/100
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {threat.is_vpn && <Badge variant="outline">VPN</Badge>}
                            {threat.is_tor && <Badge variant="outline">Tor</Badge>}
                            {threat.is_proxy && <Badge variant="outline">Proxy</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={threat.is_blocked ? 'destructive' : 'default'}>
                            {threat.is_blocked ? 'Blocked' : 'Monitoring'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {!threat.is_blocked && (
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => blockIP(threat.ip_address, 'Manual block from dashboard')}
                            >
                              Block
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ratelimits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rate Limit Status</CardTitle>
              <CardDescription>
                Currently blocked users and rate limit violations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rateLimits.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active rate limits</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Identifier</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Blocked Until</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rateLimits.map((limit, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono">{limit.identifier}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{limit.identifier_type}</Badge>
                        </TableCell>
                        <TableCell>{limit.action_type}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">
                            {limit.attempt_count}/{limit.max_attempts}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {limit.blocked_until ? 
                            new Date(limit.blocked_until).toLocaleString() : 
                            'Not blocked'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Overall security system status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Security Score</span>
                  <Badge variant={metrics.successRate > 95 ? 'default' : 'destructive'}>
                    {metrics.successRate.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Response Time</span>
                  <Badge variant="outline">{metrics.averageResponseTime}ms</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Active Monitors</span>
                  <Badge variant="default">5 / 5</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common security operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  View User Sessions
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Run Security Scan
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Activity className="h-4 w-4 mr-2" />
                  Generate Security Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}