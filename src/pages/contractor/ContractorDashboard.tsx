import { useState, useEffect } from "react";
import { ContractorPortalLayout } from "@/components/contractor/ContractorPortalLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Truck,
  MapPin,
  Phone
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSubcontractors } from "@/hooks/useSubcontractors";

interface Job {
  id: string;
  customer_name: string;
  service_address: string;
  job_date: string;
  job_time: string;
  status: string;
  assigned_cleaner_id?: string;
  priority: string;
  estimated_duration: number;
  special_instructions?: string;
}

export default function ContractorDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningJob, setAssigningJob] = useState<string | null>(null);
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<string>("");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const { subcontractors } = useSubcontractors();

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('service_date', { ascending: true })
        .limit(20);

      if (error) throw error;
      
      // Transform booking data to job format
      const transformedJobs = data?.map(booking => ({
        id: booking.id,
        customer_name: booking.customer_name,
        service_address: booking.service_address,
        job_date: booking.service_date,
        job_time: booking.service_time,
        status: booking.status,
        assigned_cleaner_id: booking.assigned_employee_id,
        priority: booking.priority || 'normal',
        estimated_duration: booking.estimated_duration || 120,
        special_instructions: booking.special_instructions
      })) || [];

      setJobs(transformedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSmartAssignment = async (jobId: string) => {
    setAssigningJob(jobId);
    try {
      const { data, error } = await supabase.functions.invoke('smart-job-assignment', {
        body: { bookingId: jobId }
      });

      if (error) throw error;

      toast.success('Job assigned successfully with smart algorithm!');
      await fetchJobs();
    } catch (error: any) {
      console.error('Smart assignment error:', error);
      toast.error(error.message || 'Failed to assign job automatically');
    } finally {
      setAssigningJob(null);
    }
  };

  const handleManualAssignment = async (jobId: string) => {
    if (!selectedSubcontractor) {
      toast.error('Please select a subcontractor');
      return;
    }

    setAssigningJob(jobId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          assigned_employee_id: selectedSubcontractor,
          status: 'assigned'
        })
        .eq('id', jobId);

      if (error) throw error;

      toast.success('Job assigned manually!');
      setSelectedSubcontractor("");
      setAssignmentNotes("");
      await fetchJobs();
    } catch (error: any) {
      console.error('Manual assignment error:', error);
      toast.error('Failed to assign job manually');
    } finally {
      setAssigningJob(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'secondary';
      case 'assigned': return 'default';
      case 'in_progress': return 'default'; // Changed from 'warning' 
      case 'completed': return 'default'; // Changed from 'success'
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-green-500" />;
    }
  };

  const stats = {
    totalJobs: jobs.length,
    unassigned: jobs.filter(job => !job.assigned_cleaner_id).length,
    inProgress: jobs.filter(job => job.status === 'in_progress').length,
    completed: jobs.filter(job => job.status === 'completed').length,
    availableCleaners: subcontractors.filter(s => s.is_available).length
  };

  if (loading) {
    return (
      <ContractorPortalLayout title="Dispatch Dashboard" description="Loading jobs...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent" />
        </div>
      </ContractorPortalLayout>
    );
  }

  return (
    <ContractorPortalLayout 
      title="Dispatch Dashboard" 
      description="Manage job assignments and track subcontractor performance"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{stats.totalJobs}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-yellow-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unassigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold text-yellow-600">{stats.unassigned}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold text-blue-600">{stats.inProgress}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold text-green-600">{stats.completed}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-purple-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Cleaners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <span className="text-2xl font-bold text-purple-600">{stats.availableCleaners}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Job Assignment Center
          </CardTitle>
          <CardDescription>
            Assign jobs to subcontractors using smart algorithms or manual selection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {jobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No jobs found
              </div>
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="border border-border/40 rounded-xl p-6 bg-card/20 hover:bg-card/40 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        {getPriorityIcon(job.priority)}
                        <h3 className="font-semibold text-lg">{job.customer_name}</h3>
                        <Badge variant={getStatusColor(job.status)}>
                          {job.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{job.service_address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(job.job_date).toLocaleDateString()} at {job.job_time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{job.estimated_duration} minutes</span>
                        </div>
                        {job.assigned_cleaner_id && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>Assigned to cleaner</span>
                          </div>
                        )}
                      </div>

                      {job.special_instructions && (
                        <p className="text-sm bg-muted/50 p-3 rounded-lg">
                          <strong>Instructions:</strong> {job.special_instructions}
                        </p>
                      )}
                    </div>

                    {!job.assigned_cleaner_id && (
                      <div className="flex flex-col gap-3 min-w-[200px]">
                        <Button
                          onClick={() => handleSmartAssignment(job.id)}
                          disabled={assigningJob === job.id}
                          className="bg-gradient-to-r from-primary to-primary/80"
                        >
                          {assigningJob === job.id ? "Assigning..." : "Smart Assign"}
                        </Button>
                        
                        <div className="space-y-2">
                          <Select 
                            value={selectedSubcontractor} 
                            onValueChange={setSelectedSubcontractor}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select cleaner" />
                            </SelectTrigger>
                            <SelectContent>
                              {subcontractors
                                .filter(s => s.is_available)
                                .map((subcontractor) => (
                                <SelectItem key={subcontractor.id} value={subcontractor.id}>
                                  {subcontractor.full_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Button
                            variant="outline"
                            onClick={() => handleManualAssignment(job.id)}
                            disabled={assigningJob === job.id || !selectedSubcontractor}
                            className="w-full"
                          >
                            Manual Assign
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </ContractorPortalLayout>
  );
}