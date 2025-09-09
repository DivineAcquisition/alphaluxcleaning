import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  MapPin, 
  User, 
  DollarSign, 
  MoreHorizontal,
  UserPlus,
  CheckCircle,
  Eye,
  CreditCard,
  Download
} from 'lucide-react';
import { DashboardJob } from '@/hooks/useDashboardData';
import { format, isToday, isTomorrow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface JobsWorkboardProps {
  jobs: DashboardJob[];
  onAssignJob: (jobId: string) => void;
  onRefresh: () => void;
}

export function JobsWorkboard({ jobs, onAssignJob, onRefresh }: JobsWorkboardProps) {
  const [activeTab, setActiveTab] = useState('today');

  // Filter jobs by tab
  const todayJobs = jobs.filter(job => isToday(new Date(job.service_date)));
  const upcomingJobs = jobs.filter(job => {
    const jobDate = new Date(job.service_date);
    return !isToday(jobDate) && jobDate > new Date();
  });
  const unassignedJobs = jobs.filter(job => !job.subcontractor_id);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default">Confirmed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getDateBadge = (date: string) => {
    const jobDate = new Date(date);
    if (isToday(jobDate)) return { label: 'Today', variant: 'default' as const };
    if (isTomorrow(jobDate)) return { label: 'Tomorrow', variant: 'secondary' as const };
    return { label: format(jobDate, 'MMM d'), variant: 'outline' as const };
  };

  const JobCard = ({ job }: { job: DashboardJob }) => {
    const dateBadge = getDateBadge(job.service_date);
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Badge variant={dateBadge.variant}>
                {dateBadge.label}
              </Badge>
              <span className="text-sm font-medium">{job.service_time}</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(job.status)}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!job.subcontractor_id && (
                    <DropdownMenuItem onClick={() => onAssignJob(job.id)}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Assign Subcontractor
                    </DropdownMenuItem>
                  )}
                  {job.subcontractor_id && (
                    <DropdownMenuItem onClick={() => onAssignJob(job.id)}>
                      <User className="w-4 h-4 mr-2" />
                      Reassign
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem>
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Confirmed
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="w-4 h-4 mr-2" />
                    Generate .ics
                  </DropdownMenuItem>
                  {job.payment_status === 'pending' && (
                    <DropdownMenuItem>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Capture Payment
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">{job.customer_name}</p>
                <p className="text-sm text-muted-foreground">{job.service_type}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
              <p className="text-sm text-muted-foreground flex-1">
                {job.service_address}
              </p>
            </div>
            
            {job.subcontractor_name && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm">
                  <span className="text-muted-foreground">Assigned to:</span>{' '}
                  <span className="font-medium">{job.subcontractor_name}</span>
                </p>
              </div>
            )}
            
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">${(job.amount / 100).toFixed(2)}</span>
                {getPaymentBadge(job.payment_status)}
              </div>
              {job.subcontractor_payout_amount && (
                <div className="text-sm text-muted-foreground">
                  Payout: ${job.subcontractor_payout_amount.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({ type }: { type: string }) => (
    <div className="text-center py-12">
      <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
      <h3 className="text-lg font-semibold mb-2">
        {type === 'today' && 'No jobs today'}
        {type === 'upcoming' && 'No upcoming jobs'}
        {type === 'unassigned' && 'No unassigned jobs'}
      </h3>
      <p className="text-muted-foreground mb-4">
        {type === 'today' && 'Share your booking link to get started'}
        {type === 'upcoming' && 'All caught up for the week!'}
        {type === 'unassigned' && 'All jobs have been assigned'}
      </p>
      {type === 'today' && (
        <Button variant="outline" onClick={() => {
          navigator.clipboard.writeText('https://book.bayareacleaningpros.com/');
        }}>
          Copy Booking Link
        </Button>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Jobs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today">Today ({todayJobs.length})</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming ({upcomingJobs.length})</TabsTrigger>
            <TabsTrigger value="unassigned">Unassigned ({unassignedJobs.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="today" className="mt-4">
            {todayJobs.length === 0 ? (
              <EmptyState type="today" />
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {todayJobs.map(job => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="upcoming" className="mt-4">
            {upcomingJobs.length === 0 ? (
              <EmptyState type="upcoming" />
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {upcomingJobs.map(job => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="unassigned" className="mt-4">
            {unassignedJobs.length === 0 ? (
              <EmptyState type="unassigned" />
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {unassignedJobs.map(job => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}