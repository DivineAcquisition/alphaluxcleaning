import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Calendar, TrendingUp, ExternalLink, Clock, CheckCircle } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'sonner';

interface PayoutSummary {
  thisWeek: number;
  thisMonth: number;
  totalEarnings: number;
  completedJobs: number;
  averageJobPayout: number;
}

interface JobPayout {
  id: string;
  service_date: string;
  service_address: string;
  subcontractor_payout_amount: number;
  status: string;
  completed_at: string | null;
  customer_name: string;
}

export default function ContractorPayouts() {
  const [summary, setSummary] = useState<PayoutSummary>({
    thisWeek: 0,
    thisMonth: 0,
    totalEarnings: 0,
    completedJobs: 0,
    averageJobPayout: 0
  });
  const [weeklyJobs, setWeeklyJobs] = useState<JobPayout[]>([]);
  const [monthlyJobs, setMonthlyJobs] = useState<JobPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [stripeConnectUrl, setStripeConnectUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchPayoutData();
  }, []);

  const fetchPayoutData = async () => {
    try {
      // Get current user's subcontractor record
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: subcontractor } = await supabase
        .from('subcontractors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!subcontractor) return;

      // Get completed jobs for this subcontractor
      const { data: jobs, error } = await supabase
        .from('bookings')
        .select(`
          id,
          service_date,
          service_address,
          subcontractor_payout_amount,
          status,
          customer_name,
          completed_at: updated_at
        `)
        .eq('assigned_employee_id', subcontractor.id)
        .eq('status', 'completed')
        .not('subcontractor_payout_amount', 'is', null)
        .order('service_date', { ascending: false });

      if (error) throw error;

      // Calculate summary stats
      const now = new Date();
      const weekStart = startOfWeek(now);
      const weekEnd = endOfWeek(now);
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const weekJobs = jobs?.filter(job => {
        const jobDate = new Date(job.service_date);
        return jobDate >= weekStart && jobDate <= weekEnd;
      }) || [];

      const monthJobs = jobs?.filter(job => {
        const jobDate = new Date(job.service_date);
        return jobDate >= monthStart && jobDate <= monthEnd;
      }) || [];

      const totalEarnings = jobs?.reduce((sum, job) => sum + (job.subcontractor_payout_amount || 0), 0) || 0;
      const completedJobs = jobs?.length || 0;
      const thisWeekEarnings = weekJobs.reduce((sum, job) => sum + (job.subcontractor_payout_amount || 0), 0);
      const thisMonthEarnings = monthJobs.reduce((sum, job) => sum + (job.subcontractor_payout_amount || 0), 0);

      setSummary({
        thisWeek: thisWeekEarnings,
        thisMonth: thisMonthEarnings,
        totalEarnings,
        completedJobs,
        averageJobPayout: completedJobs > 0 ? totalEarnings / completedJobs : 0
      });

      setWeeklyJobs(weekJobs as JobPayout[]);
      setMonthlyJobs(monthJobs as JobPayout[]);

    } catch (error) {
      console.error('Error fetching payout data:', error);
      toast.error('Failed to load payout data');
    } finally {
      setLoading(false);
    }
  };

  const connectStripe = () => {
    // This would typically redirect to a Stripe Connect onboarding flow
    toast.info('Stripe Connect integration coming soon!');
  };

  const JobPayoutCard = ({ job }: { job: JobPayout }) => (
    <Card className="mb-3">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {format(new Date(job.service_date), 'MMM d')}
            </Badge>
            <Badge variant="default">
              <CheckCircle className="w-3 h-3 mr-1" />
              Completed
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-green-600">
              +${job.subcontractor_payout_amount?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>
        
        <div className="space-y-1">
          <p className="font-medium">{job.customer_name}</p>
          <p className="text-sm text-muted-foreground">
            {job.service_address}
          </p>
          <p className="text-xs text-muted-foreground">
            Job ID: {job.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading payout information...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Payouts & Earnings</h1>
            <p className="text-muted-foreground">
              Track your earnings and manage payout settings
            </p>
          </div>

          {/* Earnings Summary */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">This Week</span>
                </div>
                <p className="text-2xl font-bold">${summary.thisWeek.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">This Month</span>
                </div>
                <p className="text-2xl font-bold">${summary.thisMonth.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-600">Total Earnings</span>
                </div>
                <p className="text-2xl font-bold">${summary.totalEarnings.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-600">Jobs Completed</span>
                </div>
                <p className="text-2xl font-bold">{summary.completedJobs}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg: ${summary.averageJobPayout.toFixed(2)}/job
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Stripe Connect */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Payout Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Direct Bank Deposits</p>
                  <p className="text-sm text-muted-foreground">
                    Connect your bank account for automatic weekly payouts via Stripe
                  </p>
                </div>
                <Button 
                  onClick={connectStripe}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  {stripeConnectUrl ? 'Manage Account' : 'Connect Account'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Job History Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="week" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="week">This Week ({weeklyJobs.length})</TabsTrigger>
                  <TabsTrigger value="month">This Month ({monthlyJobs.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="week">
                  {weeklyJobs.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No Jobs This Week</h3>
                      <p className="text-muted-foreground">
                        Complete jobs to start earning this week!
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-green-800">
                          <strong>Weekly Total: ${summary.thisWeek.toFixed(2)}</strong> from {weeklyJobs.length} completed jobs
                        </p>
                      </div>
                      {weeklyJobs.map(job => (
                        <JobPayoutCard key={job.id} job={job} />
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="month">
                  {monthlyJobs.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No Jobs This Month</h3>
                      <p className="text-muted-foreground">
                        Complete jobs to start earning this month!
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-green-800">
                          <strong>Monthly Total: ${summary.thisMonth.toFixed(2)}</strong> from {monthlyJobs.length} completed jobs
                        </p>
                      </div>
                      {monthlyJobs.map(job => (
                        <JobPayoutCard key={job.id} job={job} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}