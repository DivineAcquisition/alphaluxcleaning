import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard } from "@/components/admin/AdminCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { 
  Search,
  Filter,
  UserCheck,
  UserX,
  Calendar,
  AlertTriangle
} from "lucide-react";

interface SubcontractorPerformance {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  rating: number;
  split_tier: string;
  is_available: boolean;
  subscription_status: string;
  total_assignments: number;
  completed_jobs: number;
  dropped_jobs: number;
  completion_rate: number;
  total_earnings: number;
  current_month_jobs: number;
  avg_customer_rating: number;
  last_job_date: string;
}

export function SubcontractorJobTracker() {
  const [subcontractors, setSubcontractors] = useState<SubcontractorPerformance[]>([]);
  const [filteredSubcontractors, setFilteredSubcontractors] = useState<SubcontractorPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [performanceFilter, setPerformanceFilter] = useState("all");

  useEffect(() => {
    fetchSubcontractorPerformance();
  }, []);

  useEffect(() => {
    filterSubcontractors();
  }, [subcontractors, searchTerm, statusFilter, performanceFilter]);

  const fetchSubcontractorPerformance = async () => {
    try {
      // Fetch subcontractors with job statistics
      const { data: subcontractorsData, error: subcontractorsError } = await supabase
        .from('subcontractors')
        .select('*')
        .order('created_at', { ascending: false });

      if (subcontractorsError) throw subcontractorsError;

      // Get performance data for each subcontractor
      const performancePromises = subcontractorsData?.map(async (sub) => {
        // Get job assignments
        const { data: assignments } = await supabase
          .from('subcontractor_job_assignments')
          .select(`
            *,
            bookings (service_date)
          `)
          .eq('subcontractor_id', sub.id);

        // Get payments
        const { data: payments } = await supabase
          .from('subcontractor_payments')
          .select('subcontractor_amount, paid_at')
          .eq('subcontractor_id', sub.id)
          .eq('payment_status', 'paid');

        const totalAssignments = assignments?.length || 0;
        const completedJobs = assignments?.filter(a => a.status === 'completed').length || 0;
        const droppedJobs = assignments?.filter(a => a.status === 'dropped').length || 0;
        const completionRate = totalAssignments > 0 ? (completedJobs / totalAssignments) * 100 : 0;
        const totalEarnings = payments?.reduce((sum, p) => sum + (p.subcontractor_amount || 0), 0) || 0;

        // Current month jobs
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const currentMonthJobs = assignments?.filter(a => {
          const jobDate = new Date(a.bookings?.service_date);
          return jobDate.getMonth() === currentMonth && jobDate.getFullYear() === currentYear;
        }).length || 0;

        // Average customer rating
        const ratingsSum = assignments
          ?.filter(a => a.customer_rating)
          .reduce((sum, a) => sum + (a.customer_rating || 0), 0) || 0;
        const ratingsCount = assignments?.filter(a => a.customer_rating).length || 0;
        const avgCustomerRating = ratingsCount > 0 ? ratingsSum / ratingsCount : 0;

        // Last job date
        const lastJob = assignments
          ?.filter(a => a.completed_at)
          .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())[0];

        return {
          ...sub,
          total_assignments: totalAssignments,
          completed_jobs: completedJobs,
          dropped_jobs: droppedJobs,
          completion_rate: completionRate,
          total_earnings: totalEarnings,
          current_month_jobs: currentMonthJobs,
          avg_customer_rating: avgCustomerRating,
          last_job_date: lastJob?.completed_at || ''
        };
      }) || [];

      const performanceData = await Promise.all(performancePromises);
      setSubcontractors(performanceData);
    } catch (error) {
      console.error('Error fetching subcontractor performance:', error);
      toast.error('Failed to load subcontractor data');
    } finally {
      setLoading(false);
    }
  };

  const filterSubcontractors = () => {
    let filtered = [...subcontractors];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(sub =>
        sub.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter(sub => sub.is_available && sub.subscription_status === 'active');
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter(sub => !sub.is_available || sub.subscription_status !== 'active');
      }
    }

    // Performance filter
    if (performanceFilter !== "all") {
      if (performanceFilter === "high") {
        filtered = filtered.filter(sub => sub.completion_rate >= 80 && sub.avg_customer_rating >= 4.5);
      } else if (performanceFilter === "medium") {
        filtered = filtered.filter(sub => sub.completion_rate >= 60 && sub.completion_rate < 80);
      } else if (performanceFilter === "low") {
        filtered = filtered.filter(sub => sub.completion_rate < 60);
      }
    }

    setFilteredSubcontractors(filtered);
  };

  const toggleAvailability = async (subcontractorId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('subcontractors')
        .update({ is_available: !currentStatus })
        .eq('id', subcontractorId);

      if (error) throw error;

      toast.success(`Subcontractor ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchSubcontractorPerformance();
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Failed to update subcontractor status');
    }
  };

  const getPerformanceColor = (completionRate: number, avgRating: number) => {
    if (completionRate >= 80 && avgRating >= 4.5) return 'text-success';
    if (completionRate >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getPerformanceBadge = (completionRate: number, avgRating: number) => {
    if (completionRate >= 80 && avgRating >= 4.5) return { label: 'Excellent', variant: 'default' as const };
    if (completionRate >= 60) return { label: 'Good', variant: 'secondary' as const };
    return { label: 'Needs Improvement', variant: 'destructive' as const };
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading subcontractor data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <AdminCard title="Search & Filter Subcontractors">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search subcontractors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Performance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Performance</SelectItem>
              <SelectItem value="high">High Performers</SelectItem>
              <SelectItem value="medium">Medium Performers</SelectItem>
              <SelectItem value="low">Low Performers</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </AdminCard>

      {/* Subcontractor Table */}
      <AdminCard title="Subcontractor Performance" description="Monitor and manage your cleaning team">
        {filteredSubcontractors.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Filter className="h-12 w-12 mx-auto mb-4" />
            <p>No subcontractors match the current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Subcontractor</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-center py-3 px-4">Jobs</th>
                  <th className="text-center py-3 px-4">Completion</th>
                  <th className="text-center py-3 px-4">Rating</th>
                  <th className="text-center py-3 px-4">Earnings</th>
                  <th className="text-center py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubcontractors.map((sub) => {
                  const performance = getPerformanceBadge(sub.completion_rate, sub.avg_customer_rating);
                  
                  return (
                    <tr key={sub.id} className="border-b hover:bg-muted/50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <UserCheck className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{sub.full_name}</div>
                            <div className="text-sm text-muted-foreground">{sub.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          <Badge variant={sub.is_available ? 'default' : 'secondary'} className="w-fit">
                            {sub.is_available ? 'Available' : 'Unavailable'}
                          </Badge>
                          <Badge variant={performance.variant} className="w-fit text-xs">
                            {performance.label}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="font-semibold">{sub.total_assignments}</div>
                        <div className="text-xs text-muted-foreground">
                          {sub.current_month_jobs} this month
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className={`font-semibold ${getPerformanceColor(sub.completion_rate, sub.avg_customer_rating)}`}>
                          {sub.completion_rate.toFixed(1)}%
                        </div>
                        {sub.dropped_jobs > 0 && (
                          <div className="text-xs text-warning flex items-center justify-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {sub.dropped_jobs} dropped
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="font-semibold">⭐ {sub.avg_customer_rating.toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">{sub.split_tier.replace('_', '/')}</div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="font-semibold">${sub.total_earnings.toFixed(0)}</div>
                        <div className="text-xs text-muted-foreground">
                          {sub.last_job_date 
                            ? new Date(sub.last_job_date).toLocaleDateString()
                            : 'No jobs'
                          }
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2 justify-center">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant={sub.is_available ? "destructive" : "default"} 
                                size="sm"
                                className="h-8"
                              >
                                {sub.is_available ? (
                                  <UserX className="h-3 w-3" />
                                ) : (
                                  <UserCheck className="h-3 w-3" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {sub.is_available ? 'Deactivate' : 'Activate'} Subcontractor
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to {sub.is_available ? 'deactivate' : 'activate'} {sub.full_name}? 
                                  {sub.is_available 
                                    ? ' They will no longer receive new job assignments.'
                                    : ' They will be able to receive new job assignments.'
                                  }
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => toggleAvailability(sub.id, sub.is_available)}
                                  className={sub.is_available ? "bg-destructive hover:bg-destructive/90" : ""}
                                >
                                  {sub.is_available ? 'Deactivate' : 'Activate'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          
                          <Button variant="outline" size="sm" className="h-8">
                            <Calendar className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}