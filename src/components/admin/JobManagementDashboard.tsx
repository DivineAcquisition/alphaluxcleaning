import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminGrid } from "@/components/admin/AdminGrid";
import { AdminSection } from "@/components/admin/AdminSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { 
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Users,
  Activity
} from "lucide-react";
import { JobAssignmentManager } from "./JobAssignmentManager";

interface JobMetrics {
  totalAssignments: number;
  pendingAssignments: number;
  acceptedJobs: number;
  completedJobs: number;
  droppedJobs: number;
  completionRate: number;
  totalRevenue: number;
  avgRating: number;
}

interface JobAssignment {
  id: string;
  status: string;
  assigned_at: string;
  accepted_at: string;
  completed_at: string;
  dropped_at: string;
  drop_reason: string;
  customer_rating: number;
  bookings: {
    customer_name: string;
    service_date: string;
    service_time: string;
    service_address: string;
  };
  subcontractors: {
    full_name: string;
    email: string;
    rating: number;
    split_tier: string;
  };
}

export function JobManagementDashboard() {
  const [metrics, setMetrics] = useState<JobMetrics>({
    totalAssignments: 0,
    pendingAssignments: 0,
    acceptedJobs: 0,
    completedJobs: 0,
    droppedJobs: 0,
    completionRate: 0,
    totalRevenue: 0,
    avgRating: 0
  });
  const [recentAssignments, setRecentAssignments] = useState<JobAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all job assignments with related data
      const { data: assignments, error: assignmentsError } = await supabase
        .from('subcontractor_job_assignments')
        .select(`
          *,
          bookings (
            customer_name,
            service_date,
            service_time,
            service_address
          ),
          subcontractors (
            full_name,
            email,
            rating,
            split_tier
          )
        `)
        .order('assigned_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;

      // Calculate metrics
      const totalAssignments = assignments?.length || 0;
      const pendingAssignments = assignments?.filter(a => a.status === 'assigned').length || 0;
      const acceptedJobs = assignments?.filter(a => a.status === 'accepted').length || 0;
      const completedJobs = assignments?.filter(a => a.status === 'completed').length || 0;
      const droppedJobs = assignments?.filter(a => a.status === 'dropped').length || 0;
      const completionRate = totalAssignments > 0 ? (completedJobs / totalAssignments) * 100 : 0;

      // Get ratings for completed jobs
      const ratingsSum = assignments
        ?.filter(a => a.status === 'completed' && a.customer_rating)
        .reduce((sum, a) => sum + (a.customer_rating || 0), 0) || 0;
      const ratingsCount = assignments
        ?.filter(a => a.status === 'completed' && a.customer_rating).length || 0;
      const avgRating = ratingsCount > 0 ? ratingsSum / ratingsCount : 0;

      // Fetch payment data for revenue calculation
      const { data: payments, error: paymentsError } = await supabase
        .from('subcontractor_payments')
        .select('total_amount')
        .eq('payment_status', 'paid');

      if (paymentsError) throw paymentsError;

      const totalRevenue = payments?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;

      setMetrics({
        totalAssignments,
        pendingAssignments,
        acceptedJobs,
        completedJobs,
        droppedJobs,
        completionRate,
        totalRevenue,
        avgRating
      });

      setRecentAssignments(assignments?.slice(0, 10) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'accepted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'dropped':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Job Metrics Overview */}
      <AdminSection 
        title="Job Management Overview"
        description="Monitor job assignments, completion rates, and subcontractor performance"
      >
        <AdminGrid columns={4} gap="md">
          <AdminCard
            variant="metric"
            title="Total Assignments"
            icon={<Activity className="h-4 w-4" />}
          >
            <div className="text-3xl font-bold tracking-tight">{metrics.totalAssignments}</div>
            <p className="text-xs text-muted-foreground mt-1">All time assignments</p>
          </AdminCard>

          <AdminCard
            variant="metric"
            title="Pending Jobs"
            icon={<Clock className="h-4 w-4" />}
          >
            <div className="text-3xl font-bold tracking-tight text-warning">
              {metrics.pendingAssignments}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting acceptance</p>
          </AdminCard>

          <AdminCard
            variant="metric"
            title="Completion Rate"
            icon={<CheckCircle className="h-4 w-4" />}
          >
            <div className="text-3xl font-bold tracking-tight text-success">
              {metrics.completionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Job completion rate</p>
          </AdminCard>

          <AdminCard
            variant="metric"
            title="Average Rating"
            icon={<TrendingUp className="h-4 w-4" />}
          >
            <div className="text-3xl font-bold tracking-tight text-primary">
              {metrics.avgRating.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Customer satisfaction</p>
          </AdminCard>
        </AdminGrid>

        {/* Secondary Metrics */}
        <AdminGrid columns={3} gap="lg">
          <AdminCard
            variant="stat"
            title="Accepted Jobs"
            description="Jobs accepted by subcontractors"
            icon={<CheckCircle className="h-5 w-5" />}
          >
            <div className="text-4xl font-bold tracking-tight mb-3">{metrics.acceptedJobs}</div>
          </AdminCard>

          <AdminCard
            variant="stat"
            title="Completed Jobs"
            description="Successfully completed assignments"
            icon={<Calendar className="h-5 w-5" />}
          >
            <div className="text-4xl font-bold tracking-tight mb-3">{metrics.completedJobs}</div>
          </AdminCard>

          <AdminCard
            variant="stat"
            title="Total Revenue"
            description="Revenue from completed jobs"
            icon={<DollarSign className="h-5 w-5" />}
          >
            <div className="text-4xl font-bold tracking-tight mb-3">${metrics.totalRevenue.toFixed(2)}</div>
          </AdminCard>
        </AdminGrid>
      </AdminSection>

      {/* Job Management Tabs */}
      <Tabs defaultValue="assignments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assignments">Job Assignments</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-4">
          <JobAssignmentManager />
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <AdminCard
            title="Recent Job Activity"
            description="Latest job assignments and status updates"
          >
            {recentAssignments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4" />
                <p>No recent job activity</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Subcontractor</TableHead>
                    <TableHead>Service Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{assignment.bookings?.customer_name}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-32">
                            {assignment.bookings?.service_address}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{assignment.subcontractors?.full_name}</div>
                          <div className="text-sm text-muted-foreground">
                            ⭐ {assignment.subcontractors?.rating}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{new Date(assignment.bookings?.service_date).toLocaleDateString()}</div>
                          <div className="text-sm text-muted-foreground">
                            {assignment.bookings?.service_time}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(assignment.status)}>
                          {assignment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {assignment.customer_rating ? (
                          <div className="flex items-center gap-1">
                            ⭐ {assignment.customer_rating}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </AdminCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}