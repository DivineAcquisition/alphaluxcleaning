import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useContractorJobs } from "@/hooks/useContractorJobs";
import { useTimesheets } from "@/hooks/useTimesheets";
import { useSubcontractors } from "@/hooks/useSubcontractors";
import { ContractorJobCard } from "@/components/contractor/ContractorJobCard";
import { TimesheetForm } from "@/components/contractor/TimesheetForm";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Briefcase, Clock, DollarSign, CheckCircle } from "lucide-react";

export default function ContractorDashboard() {
  const [contractorId, setContractorId] = useState<string | null>(null);
  const { jobs, loading: jobsLoading, respondToAssignment } = useContractorJobs(contractorId || undefined);
  const { timesheets, loading: timesheetsLoading, createTimesheet } = useTimesheets(contractorId || undefined);

  useEffect(() => {
    const getCurrentContractor = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: contractor } = await supabase
          .from('subcontractors')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (contractor) {
          setContractorId(contractor.id);
        }
      }
    };

    getCurrentContractor();
  }, []);

  const pendingJobs = jobs.filter(job => job.assignment?.acceptance_status === 'pending');
  const assignedJobs = jobs.filter(job => job.assignment?.acceptance_status === 'accepted');
  const completedJobs = jobs.filter(job => job.status === 'completed');
  const pendingTimesheets = timesheets.filter(t => t.status === 'submitted' || t.status === 'manager_review');
  const approvedTimesheets = timesheets.filter(t => t.status === 'approved');

  const totalHours = approvedTimesheets.reduce((sum, t) => sum + t.hours_calc, 0);

  if (!contractorId) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading contractor profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contractor Dashboard</h1>
          <p className="text-muted-foreground">Manage your jobs, timesheets, and earnings</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingJobs.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting your response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedJobs.length}</div>
            <p className="text-xs text-muted-foreground">
              Jobs in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours This Month</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Approved hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedJobs.length}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="jobs" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="jobs">
            Jobs ({pendingJobs.length + assignedJobs.length})
          </TabsTrigger>
          <TabsTrigger value="timesheets">
            Timesheets ({timesheets.length})
          </TabsTrigger>
          <TabsTrigger value="submit-timesheet">
            Submit Timesheet
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Jobs</h2>
            
            {pendingJobs.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-orange-600">
                  Pending Response ({pendingJobs.length})
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {pendingJobs.map(job => (
                    <ContractorJobCard
                      key={job.id}
                      job={job}
                      onAccept={(assignmentId) => respondToAssignment(assignmentId, 'accept')}
                      onDecline={(assignmentId) => respondToAssignment(assignmentId, 'decline')}
                    />
                  ))}
                </div>
              </div>
            )}

            {assignedJobs.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  Assigned Jobs ({assignedJobs.length})
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {assignedJobs.map(job => (
                    <ContractorJobCard key={job.id} job={job} />
                  ))}
                </div>
              </div>
            )}

            {jobs.length === 0 && !jobsLoading && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No jobs available</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="timesheets" className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Timesheets</h2>
            
            <div className="grid gap-4">
              {timesheets.map(timesheet => (
                <Card key={timesheet.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {timesheet.job?.service_type} - {timesheet.job?.client?.name}
                      </CardTitle>
                      <Badge variant={
                        timesheet.status === 'approved' ? 'default' :
                        timesheet.status === 'rejected' ? 'destructive' :
                        'secondary'
                      }>
                        {timesheet.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Start Time</p>
                        <p className="text-muted-foreground">
                          {format(new Date(timesheet.start_time), 'MMM d, h:mm a')}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">End Time</p>
                        <p className="text-muted-foreground">
                          {format(new Date(timesheet.end_time), 'MMM d, h:mm a')}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Hours</p>
                        <p className="text-muted-foreground">{timesheet.hours_calc.toFixed(2)}</p>
                      </div>
                    </div>
                    {timesheet.notes_text && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="font-medium text-sm">Notes</p>
                        <p className="text-sm text-muted-foreground">{timesheet.notes_text}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {timesheets.length === 0 && !timesheetsLoading && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No timesheets submitted</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="submit-timesheet">
          <TimesheetForm
            jobs={jobs}
            contractorId={contractorId}
            onSubmit={createTimesheet}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}