import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Clock, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ApplicationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  todaySubmissions: number;
  weekSubmissions: number;
  averageProcessingTime: number;
  failureRate: number;
}

interface FailedSubmission {
  id: string;
  timestamp: string;
  error: string;
  userAgent?: string;
  retries: number;
}

export const ApplicationMonitoringDashboard = () => {
  const [stats, setStats] = useState<ApplicationStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    todaySubmissions: 0,
    weekSubmissions: 0,
    averageProcessingTime: 0,
    failureRate: 0
  });
  
  const [failedSubmissions, setFailedSubmissions] = useState<FailedSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchApplicationStats();
    fetchFailedSubmissions();
    
    // Set up real-time subscription for new applications
    const channel = supabase
      .channel('application-monitoring')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'subcontractor_applications' },
        () => {
          fetchApplicationStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchApplicationStats = async () => {
    try {
      const { data: applications, error } = await supabase
        .from('subcontractor_applications')
        .select('id, status, created_at, reviewed_at');

      if (error) throw error;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const stats = applications.reduce((acc, app) => {
        acc.total++;
        if (app.status === 'pending') acc.pending++;
        if (app.status === 'approved') acc.approved++;
        if (app.status === 'rejected') acc.rejected++;
        
        const createdAt = new Date(app.created_at);
        if (createdAt >= today) acc.todaySubmissions++;
        if (createdAt >= weekAgo) acc.weekSubmissions++;

        return acc;
      }, {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        todaySubmissions: 0,
        weekSubmissions: 0,
        averageProcessingTime: 0,
        failureRate: 0
      } as ApplicationStats);

      // Calculate average processing time
      const processedApps = applications.filter(app => app.reviewed_at);
      if (processedApps.length > 0) {
        const totalTime = processedApps.reduce((sum, app) => {
          const created = new Date(app.created_at).getTime();
          const reviewed = new Date(app.reviewed_at).getTime();
          return sum + (reviewed - created);
        }, 0);
        stats.averageProcessingTime = Math.round(totalTime / processedApps.length / (1000 * 60 * 60)); // hours
      }

      setStats(stats);
    } catch (error) {
      console.error('Error fetching application stats:', error);
      toast.error('Failed to load application statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFailedSubmissions = async () => {
    // This would typically come from a logging service or error tracking table
    // For now, we'll simulate some failed submissions
    setFailedSubmissions([
      {
        id: '1',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        error: 'Missing required field: drivers_license_image_url',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
        retries: 2
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        error: 'Network timeout during submission',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        retries: 1
      }
    ]);
  };

  const getStatusColor = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case 'approved': return 'secondary';
      case 'rejected': return 'destructive';
      case 'pending': return 'outline';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Application Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Applications</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold text-warning">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold text-success">{stats.weekSubmissions}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Processing</p>
                <p className="text-2xl font-bold">{stats.averageProcessingTime}h</p>
              </div>
              <CheckCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Application Status Breakdown</CardTitle>
          <CardDescription>
            Overview of all application statuses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Badge variant={getStatusColor('pending')}>{stats.pending}</Badge>
              <span className="text-sm">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusColor('approved')}>{stats.approved}</Badge>
              <span className="text-sm">Approved</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusColor('rejected')}>{stats.rejected}</Badge>
              <span className="text-sm">Rejected</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Failed Submissions */}
      {failedSubmissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Recent Failed Submissions
            </CardTitle>
            <CardDescription>
              Applications that failed to submit successfully
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {failedSubmissions.map((failure) => (
                <div key={failure.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        <span className="font-medium text-sm">
                          {new Date(failure.timestamp).toLocaleString()}
                        </span>
                        <Badge variant="destructive" className="text-xs">
                          {failure.retries} retries
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{failure.error}</p>
                      {failure.userAgent && (
                        <p className="text-xs text-muted-foreground">
                          Device: {failure.userAgent.includes('iPhone') ? 'Mobile' : 'Desktop'}
                        </p>
                      )}
                    </div>
                    <Button variant="outline" size="sm">
                      Investigate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={fetchApplicationStats}>
              Refresh Statistics
            </Button>
            <Button variant="outline">
              Export Application Data
            </Button>
            <Button variant="outline">
              View All Applications
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};