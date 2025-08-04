import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminGrid } from "@/components/admin/AdminGrid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Database,
  Zap,
  Globe,
  Search,
  Filter,
  Download,
  RefreshCw
} from "lucide-react";

interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  category: 'database' | 'api' | 'payment' | 'email' | 'auth' | 'integration';
  message: string;
  details?: string;
  resolved: boolean;
}

export default function SystemLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchSystemLogs();
    }
  }, [user]);

  const fetchSystemLogs = async () => {
    // Mock system logs - in real app, this would come from logging service
    const mockLogs: SystemLog[] = [
      {
        id: '1',
        timestamp: '2024-01-04T10:15:30Z',
        level: 'error',
        category: 'payment',
        message: 'Stripe webhook failed for order #12345',
        details: 'HTTP 500 error from Stripe API. Customer payment not processed.',
        resolved: false
      },
      {
        id: '2',
        timestamp: '2024-01-04T09:45:12Z',
        level: 'warning',
        category: 'integration',
        message: 'GoHighLevel API rate limit exceeded',
        details: 'Temporarily throttling requests to prevent service disruption.',
        resolved: true
      },
      {
        id: '3',
        timestamp: '2024-01-04T09:30:45Z',
        level: 'critical',
        category: 'database',
        message: 'Database connection pool exhausted',
        details: 'All 20 connections in use. New requests failing.',
        resolved: true
      },
      {
        id: '4',
        timestamp: '2024-01-04T08:22:18Z',
        level: 'error',
        category: 'email',
        message: 'Failed to send welcome email',
        details: 'Resend API returned 422: Invalid email address format.',
        resolved: false
      },
      {
        id: '5',
        timestamp: '2024-01-04T07:55:33Z',
        level: 'warning',
        category: 'auth',
        message: 'Multiple failed login attempts detected',
        details: 'IP 192.168.1.100 attempted 5 failed logins in 2 minutes.',
        resolved: false
      },
      {
        id: '6',
        timestamp: '2024-01-04T07:12:09Z',
        level: 'info',
        category: 'api',
        message: 'Calendar sync completed successfully',
        details: 'Synced 150 busy slots for 12 subcontractors.',
        resolved: true
      },
      {
        id: '7',
        timestamp: '2024-01-04T06:45:22Z',
        level: 'error',
        category: 'integration',
        message: 'Zapier webhook delivery failed',
        details: 'Booking data not sent to CRM. Webhook timeout after 30s.',
        resolved: false
      },
      {
        id: '8',
        timestamp: '2024-01-04T06:30:15Z',
        level: 'warning',
        category: 'database',
        message: 'Slow query detected',
        details: 'SELECT query on orders table took 5.2 seconds to execute.',
        resolved: true
      }
    ];

    setLogs(mockLogs);
    setLoading(false);
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
    return matchesSearch && matchesLevel && matchesCategory;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'outline';
      default: return 'outline';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'critical': return <XCircle className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'info': return <CheckCircle className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'database': return <Database className="h-4 w-4" />;
      case 'api': return <Globe className="h-4 w-4" />;
      case 'integration': return <Zap className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const markResolved = (logId: string) => {
    setLogs(prev => prev.map(log => 
      log.id === logId ? { ...log, resolved: true } : log
    ));
  };

  const stats = {
    criticalErrors: logs.filter(l => l.level === 'critical' && !l.resolved).length,
    unresolvedErrors: logs.filter(l => (l.level === 'error' || l.level === 'critical') && !l.resolved).length,
    warnings: logs.filter(l => l.level === 'warning' && !l.resolved).length,
    totalLogs: logs.length
  };

  return (
    <AdminLayout 
      title="System Logs" 
      description="Monitor system events, errors, and integration status"
    >
      <div className="space-y-6">
        {/* System Health Stats */}
        <AdminGrid columns={4} gap="md">
          <AdminCard
            variant="metric"
            title="Critical Errors"
            icon={<XCircle className="h-4 w-4" />}
          >
            <div className="text-3xl font-bold tracking-tight text-destructive">
              {stats.criticalErrors}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Unresolved critical issues</p>
          </AdminCard>

          <AdminCard
            variant="metric"
            title="Active Errors"
            icon={<AlertTriangle className="h-4 w-4" />}
          >
            <div className="text-3xl font-bold tracking-tight text-destructive">
              {stats.unresolvedErrors}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Require attention</p>
          </AdminCard>

          <AdminCard
            variant="metric"
            title="Warnings"
            icon={<AlertTriangle className="h-4 w-4" />}
          >
            <div className="text-3xl font-bold tracking-tight text-warning">
              {stats.warnings}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Monitor closely</p>
          </AdminCard>

          <AdminCard
            variant="metric"
            title="Total Events"
            icon={<Database className="h-4 w-4" />}
          >
            <div className="text-3xl font-bold tracking-tight">{stats.totalLogs}</div>
            <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
          </AdminCard>
        </AdminGrid>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>System Event Log</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={fetchSystemLogs}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="database">Database</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="auth">Auth</SelectItem>
                  <SelectItem value="integration">Integration</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading system logs...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getLevelColor(log.level) as any} className="gap-1">
                          {getLevelIcon(log.level)}
                          {log.level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(log.category)}
                          <span className="capitalize">{log.category}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{log.message}</p>
                          {log.details && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {log.details}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={log.resolved ? 'default' : 'destructive'}>
                          {log.resolved ? 'Resolved' : 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!log.resolved && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markResolved(log.id)}
                          >
                            Mark Resolved
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
      </div>
    </AdminLayout>
  );
}