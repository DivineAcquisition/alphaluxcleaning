import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Zap, Loader2 } from 'lucide-react';

interface EmailJob {
  id: string;
  to_email: string;
  template_name: string;
  status: string;
  attempts: number;
  created_at: string;
  sent_at: string | null;
  last_error: string | null;
}

export const EmailQueueMonitor = () => {
  const [emailJobs, setEmailJobs] = useState<EmailJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const loadEmailJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setEmailJobs(data || []);
    } catch (error: any) {
      console.error('Error loading email jobs:', error);
      toast({
        title: "Failed to load email jobs",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const processEmailQueue = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('emails-worker');
      
      if (error) throw error;

      toast({
        title: "Queue Processing Started",
        description: `Processing ${data.processed || 0} email jobs`,
      });
      
      // Refresh the list after processing
      setTimeout(() => {
        loadEmailJobs();
      }, 2000);
    } catch (error: any) {
      console.error('Error processing email queue:', error);
      toast({
        title: "Queue Processing Failed",
        description: error.message || 'Failed to process email queue',
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const isStuck = (job: EmailJob) => {
    if (job.status !== 'queued') return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(job.created_at) < fiveMinutesAgo;
  };

  const stuckCount = emailJobs.filter(isStuck).length;

  const getStatusBadge = (status: string, stuck: boolean = false) => {
    const variants = {
      'queued': 'secondary',
      'sending': 'default',
      'sent': 'default',
      'failed': 'destructive',
      'suppressed': 'outline'
    } as const;

    const colors = {
      'queued': stuck ? 'bg-orange-500' : 'bg-blue-500',
      'sending': 'bg-yellow-500',
      'sent': 'bg-green-500',
      'failed': 'bg-red-500',
      'suppressed': 'bg-gray-500'
    };

    return (
      <Badge 
        variant={variants[status as keyof typeof variants] || 'outline'}
        className={`${colors[status as keyof typeof colors]} text-white`}
      >
        {stuck ? '⚠️ STUCK' : status.toUpperCase()}
      </Badge>
    );
  };

  useEffect(() => {
    loadEmailJobs();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Queue Monitor</CardTitle>
        <CardDescription>
          View and manage queued email jobs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {stuckCount > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
            ⚠️ {stuckCount} email{stuckCount > 1 ? 's' : ''} stuck in queue for over 5 minutes. Click "Process Queue" to retry.
          </div>
        )}
        
        <div className="flex gap-2">
          <Button onClick={loadEmailJobs} disabled={loading} variant="outline">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
          <Button onClick={processEmailQueue} disabled={processing} variant="default">
            {processing ? (
              <>
                <Zap className="mr-2 h-4 w-4 animate-pulse" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Process Queue Now
              </>
            )}
          </Button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {emailJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No email jobs found
            </p>
          ) : (
            emailJobs.map((job) => {
              const stuck = isStuck(job);
              return (
                <div key={job.id} className={`flex items-center justify-between p-3 border rounded-lg ${stuck ? 'bg-orange-50 border-orange-200' : ''}`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{job.to_email}</span>
                      {getStatusBadge(job.status, stuck)}
                    </div>
                  <div className="text-xs text-muted-foreground">
                    Template: {job.template_name} • Attempts: {job.attempts}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(job.created_at).toLocaleString()}
                    {job.sent_at && (
                      <> • Sent: {new Date(job.sent_at).toLocaleString()}</>
                    )}
                  </div>
                  {job.last_error && (
                    <div className="text-xs text-red-600 mt-1">
                      Error: {job.last_error}
                    </div>
                  )}
                </div>
              </div>
            );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};