import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, MapPin, User, DollarSign, Phone } from 'lucide-react';
import { Job, useJobsDemo } from '@/hooks/useJobsDemo';
import { useCleaners } from '@/hooks/useCleaners';
import { format } from 'date-fns';

const statusColumns = [
  { key: 'unassigned', title: 'Unassigned', color: 'bg-red-50 border-red-200' },
  { key: 'offered', title: 'Offered', color: 'bg-yellow-50 border-yellow-200' },
  { key: 'accepted', title: 'Accepted', color: 'bg-blue-50 border-blue-200' },
  { key: 'in_progress', title: 'In Progress', color: 'bg-purple-50 border-purple-200' },
  { key: 'completed', title: 'Completed', color: 'bg-green-50 border-green-200' }
] as const;

const statusColors = {
  unassigned: 'bg-red-100 text-red-800',
  offered: 'bg-yellow-100 text-yellow-800', 
  accepted: 'bg-blue-100 text-blue-800',
  declined: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  no_show: 'bg-orange-100 text-orange-800',
  cancelled: 'bg-red-100 text-red-800',
  paid: 'bg-emerald-100 text-emerald-800'
};

interface JobCardProps {
  job: Job;
  onStatusUpdate: (jobId: string, status: Job['status']) => void;
  onAssignCleaner: (jobId: string, cleanerId: string) => void;
  cleaners: any[];
}

function JobCard({ job, onStatusUpdate, onAssignCleaner, cleaners }: JobCardProps) {
  const [selectedCleaner, setSelectedCleaner] = useState<string>('');

  const handleAssign = () => {
    if (selectedCleaner) {
      onAssignCleaner(job.id, selectedCleaner);
      setSelectedCleaner('');
    }
  };

  const getAddress = () => {
    if (typeof job.address_json === 'object' && job.address_json) {
      return job.address_json.address || job.address_json.street || 'Address not specified';
    }
    return 'Address not specified';
  };

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              {job.customer?.first_name} {job.customer?.last_name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{job.service_type}</p>
          </div>
          <Badge className={statusColors[job.status]}>
            {job.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{format(new Date(job.job_date), 'MMM dd, yyyy')}</span>
          <Clock className="h-4 w-4 text-muted-foreground ml-2" />
          <span className="capitalize">{job.time_window}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="line-clamp-1">{getAddress()}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span>${(job.price_cents / 100).toFixed(2)}</span>
          <span className="text-muted-foreground">
            ({job.duration_est_mins} mins)
          </span>
        </div>

        {job.cleaner && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{job.cleaner.name}</span>
            <Badge variant="outline">★ {job.cleaner.rating}</Badge>
          </div>
        )}

        {job.customer?.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{job.customer.phone}</span>
          </div>
        )}

        {job.special_instructions && (
          <div className="text-sm">
            <p className="font-medium">Special Instructions:</p>
            <p className="text-muted-foreground">{job.special_instructions}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {job.status === 'unassigned' && (
            <div className="flex gap-2 w-full">
              <Select value={selectedCleaner} onValueChange={setSelectedCleaner}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Assign cleaner" />
                </SelectTrigger>
                <SelectContent>
                  {cleaners.map((cleaner) => (
                    <SelectItem key={cleaner.id} value={cleaner.id}>
                      {cleaner.name} (★ {cleaner.rating})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAssign} disabled={!selectedCleaner}>
                Assign
              </Button>
            </div>
          )}

          {job.status === 'offered' && (
            <Button
              variant="outline"
              onClick={() => onStatusUpdate(job.id, 'unassigned')}
            >
              Reassign
            </Button>
          )}

          {job.status === 'accepted' && (
            <Button
              variant="default"
              onClick={() => onStatusUpdate(job.id, 'in_progress')}
            >
              Start Job
            </Button>
          )}

          {job.status === 'in_progress' && (
            <Button
              variant="default"
              onClick={() => onStatusUpdate(job.id, 'completed')}
            >
              Complete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function JobBoard() {
  const { jobs, loading, updateJobStatus, assignCleaner } = useJobsDemo();
  const { cleaners } = useCleaners();
  const [selectedDate, setSelectedDate] = useState('today');
  const [selectedTimeWindow, setSelectedTimeWindow] = useState('all');

  const filteredJobs = jobs.filter(job => {
    const jobDate = new Date(job.job_date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dateMatch = true;
    if (selectedDate === 'today') {
      dateMatch = jobDate.toDateString() === today.toDateString();
    } else if (selectedDate === 'tomorrow') {
      dateMatch = jobDate.toDateString() === tomorrow.toDateString();
    }

    const timeMatch = selectedTimeWindow === 'all' || job.time_window === selectedTimeWindow;

    return dateMatch && timeMatch;
  });

  const getJobsByStatus = (status: string) => {
    return filteredJobs.filter(job => job.status === status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Select value={selectedDate} onValueChange={setSelectedDate}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="tomorrow">Tomorrow</SelectItem>
            <SelectItem value="all">All Dates</SelectItem>
          </SelectContent>
        </Select>

        <Tabs value={selectedTimeWindow} onValueChange={setSelectedTimeWindow}>
          <TabsList>
            <TabsTrigger value="all">All Times</TabsTrigger>
            <TabsTrigger value="morning">Morning</TabsTrigger>
            <TabsTrigger value="afternoon">Afternoon</TabsTrigger>
            <TabsTrigger value="evening">Evening</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {statusColumns.map((column) => (
          <div key={column.key} className={`${column.color} rounded-lg p-4`}>
            <h3 className="font-semibold mb-4 flex items-center justify-between">
              {column.title}
              <Badge variant="secondary">
                {getJobsByStatus(column.key).length}
              </Badge>
            </h3>
            <div className="space-y-3">
              {getJobsByStatus(column.key).map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onStatusUpdate={updateJobStatus}
                  onAssignCleaner={assignCleaner}
                  cleaners={cleaners}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}