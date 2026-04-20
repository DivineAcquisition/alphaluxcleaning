import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { RefreshCw, Filter, Loader2 } from 'lucide-react';
import { AdminRoute } from '@/components/AdminRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface EmailJob {
  id: string;
  to_email: string;
  to_name: string | null;
  template_name: string;
  status: string;
  attempts: number;
  last_error: string | null;
  sent_at: string | null;
  created_at: string;
  category: string;
}

const statusColors = {
  queued: 'default',
  sending: 'secondary',
  sent: 'default',
  failed: 'destructive',
  suppressed: 'outline'
} as const;

export default function AdminEmailLogs() {
  const [jobs, setJobs] = useState<EmailJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    template: '',
    search: ''
  });

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      let query = supabase
        .from('email_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.template) {
        query = query.eq('template_name', filters.template);
      }
      if (filters.search) {
        query = query.ilike('to_email', `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setJobs(data || []);
    } catch (error) {
      console.error('Failed to load email jobs:', error);
      toast.error('Failed to load email logs');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryFailed = async () => {
    try {
      const { error } = await supabase
        .from('email_jobs')
        .update({ 
          status: 'queued', 
          attempts: 0,
          last_error: null
        })
        .eq('status', 'failed');

      if (error) throw error;
      
      toast.success('Failed emails queued for retry');
      loadJobs();
    } catch (error) {
      console.error('Failed to retry emails:', error);
      toast.error('Failed to retry emails');
    }
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('email_jobs')
        .update({ 
          status: 'queued', 
          attempts: 0,
          last_error: null
        })
        .eq('id', jobId);

      if (error) throw error;
      
      toast.success('Email queued for retry');
      loadJobs();
    } catch (error) {
      console.error('Failed to retry email:', error);
      toast.error('Failed to retry email');
    }
  };

  return (
    <AdminRoute requiredRole="ops">
      <Helmet>
        <title>Email Logs - Admin</title>
      </Helmet>
      
      <AdminLayout title="Email Logs">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Email Logs</h1>
              <p className="text-muted-foreground">
                Monitor and manage email delivery
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={loadJobs} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleRetryFailed}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Failed
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium">Search by email</label>
                  <Input
                    placeholder="user@example.com"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select value={filters.status} onValueChange={(value) => 
                    setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      <SelectItem value="queued">Queued</SelectItem>
                      <SelectItem value="sending">Sending</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="suppressed">Suppressed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Template</label>
                  <Input
                    placeholder="template_name"
                    value={filters.template}
                    onChange={(e) => setFilters(prev => ({ ...prev, template: e.target.value }))}
                    className="w-40"
                  />
                </div>
                <Button onClick={loadJobs}>Apply</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Jobs</CardTitle>
              <CardDescription>
                Recent email delivery attempts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{job.to_name || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">{job.to_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{job.template_name}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusColors[job.status as keyof typeof statusColors]}>
                            {job.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{job.attempts}</TableCell>
                        <TableCell>
                          {new Date(job.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {job.sent_at ? new Date(job.sent_at).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          {job.status === 'failed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRetryJob(job.id)}
                            >
                              <RefreshCw className="w-4 h-4" />
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
    </AdminRoute>
  );
}