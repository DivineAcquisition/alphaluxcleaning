import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Shield, Eye, Clock, User, Database } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SecurityEvent {
  id: string;
  user_id: string;
  action_type: string;
  resource_type: string;
  resource_id?: string;
  old_values?: any;
  new_values?: any;
  risk_level: string; // Changed from union type to string
  timestamp: string;
  ip_address?: string;
}

export const SecurityAuditPanel: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchSecurityEvents();
  }, [filter]);

  const fetchSecurityEvents = async () => {
    try {
      let query = supabase
        .from('security_audit_log')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (filter !== 'all') {
        query = query.eq('risk_level', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEvents((data || []).map(event => ({
        ...event,
        ip_address: event.ip_address as string || undefined
      })));
    } catch (error) {
      console.error('Error fetching security events:', error);
      toast({
        title: "Error",
        description: "Failed to load security audit events.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelConfig = (level: string) => {
    switch (level) {
      case 'critical':
        return { color: 'destructive', icon: AlertTriangle };
      case 'high':
        return { color: 'secondary', icon: Shield };
      case 'medium':
        return { color: 'default', icon: Eye };
      case 'low':
        return { color: 'outline', icon: Clock };
      default:
        return { color: 'outline', icon: Clock };
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionDescription = (event: SecurityEvent) => {
    switch (event.action_type) {
      case 'account_status_change':
        return `Changed account status from ${event.old_values?.account_status} to ${event.new_values?.account_status}`;
      case 'role_assigned':
        return `Assigned role: ${event.new_values?.role}`;
      case 'role_removed':
        return `Removed role: ${event.old_values?.role}`;
      case 'login_failed':
        return 'Failed login attempt';
      case 'data_access':
        return `Accessed ${event.resource_type} data`;
      default:
        return event.action_type.replace(/_/g, ' ').toUpperCase();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Security Audit Log</CardTitle>
          <CardDescription>Loading security events...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Audit Log
        </CardTitle>
        <CardDescription>
          Monitor security events and administrative actions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filter Controls */}
          <div className="flex gap-2">
            {['all', 'critical', 'high', 'medium', 'low'].map((level) => (
              <Button
                key={level}
                variant={filter === level ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(level)}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Button>
            ))}
          </div>

          {/* Events Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>User ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No security events found
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((event) => {
                    const riskConfig = getRiskLevelConfig(event.risk_level);
                    const RiskIcon = riskConfig.icon;

                    return (
                      <TableRow key={event.id}>
                        <TableCell className="font-mono text-sm">
                          {formatTimestamp(event.timestamp)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={riskConfig.color as any} className="flex items-center gap-1 w-fit">
                            <RiskIcon className="h-3 w-3" />
                            {event.risk_level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{getActionDescription(event)}</div>
                            {event.new_values?.reason && (
                              <div className="text-sm text-muted-foreground">
                                Reason: {event.new_values.reason}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Database className="h-3 w-3" />
                            <span className="text-sm">{event.resource_type}</span>
                            {event.resource_id && (
                              <span className="text-xs text-muted-foreground">
                                ({event.resource_id.slice(0, 8)}...)
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="text-xs font-mono">
                              {event.user_id ? event.user_id.slice(0, 8) + '...' : 'System'}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Showing latest {events.length} events</span>
            <Button variant="outline" size="sm" onClick={fetchSecurityEvents}>
              Refresh
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};