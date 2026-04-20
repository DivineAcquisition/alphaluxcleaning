import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, RotateCcw, Eye, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getHCPSyncLogs, retryFailedSync } from '@/lib/hcp';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SyncLog {
  id: string;
  booking_id: string;
  hcp_customer_id?: string;
  hcp_job_id?: string;
  status: 'pending' | 'success' | 'failed';
  attempts: number;
  last_error?: string;
  created_at: string;
  updated_at: string;
  bookings?: {
    id: string;
    customer_id: string;
    customers: {
      name: string;
      email: string;
    };
  };
}

export default function HousecallProLogs() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [retrying, setRetrying] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadLogs();
  }, [statusFilter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const filters = statusFilter !== 'all' ? { status: statusFilter } : {};
      const syncLogs = await getHCPSyncLogs(filters);
      setLogs(syncLogs || []);
    } catch (error) {
      console.error('Failed to load HCP sync logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sync logs',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (bookingId: string) => {
    try {
      setRetrying(bookingId);
      await retryFailedSync(bookingId);
      toast({
        title: 'Success',
        description: 'Retry initiated successfully'
      });
      // Reload logs to see the updated status
      await loadLogs();
    } catch (error) {
      console.error('Failed to retry sync:', error);
      toast({
        title: 'Error',
        description: 'Failed to retry sync',
        variant: 'destructive'
      });
    } finally {
      setRetrying(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredLogs = logs.filter(log => 
    statusFilter === 'all' || log.status === statusFilter
  );

  return (
    <AdminLayout 
      title="Housecall Pro Sync Logs" 
      description="Monitor and manage booking synchronization with Housecall Pro"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={loadLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sync Activity</CardTitle>
            <CardDescription>
              Recent booking synchronization attempts with Housecall Pro
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading sync logs...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No sync logs found for the selected filter
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>HCP Customer ID</TableHead>
                    <TableHead>HCP Job ID</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.bookings?.customers?.name}</div>
                          <div className="text-sm text-muted-foreground">{log.bookings?.customers?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.booking_id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell>{log.attempts}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.hcp_customer_id || '-'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.hcp_job_id || '-'}
                      </TableCell>
                      <TableCell>{formatDate(log.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {log.last_error && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Error Details</DialogTitle>
                                  <DialogDescription>
                                    Error information for booking {log.booking_id}
                                  </DialogDescription>
                                </DialogHeader>
                                <Alert>
                                  <AlertTriangle className="h-4 w-4" />
                                  <AlertDescription className="mt-2">
                                    <pre className="whitespace-pre-wrap text-sm">
                                      {log.last_error}
                                    </pre>
                                  </AlertDescription>
                                </Alert>
                              </DialogContent>
                            </Dialog>
                          )}
                          {log.status === 'failed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRetry(log.booking_id)}
                              disabled={retrying === log.booking_id}
                            >
                              <RotateCcw className={`h-4 w-4 ${retrying === log.booking_id ? 'animate-spin' : ''}`} />
                            </Button>
                          )}
                        </div>
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