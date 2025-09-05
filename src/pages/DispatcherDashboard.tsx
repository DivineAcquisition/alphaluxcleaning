import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { JobBoard } from '@/components/jobs/JobBoard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, AlertTriangle, TrendingUp } from 'lucide-react';
import { useJobsDemo } from '@/hooks/useJobsDemo';
import { useCleaners } from '@/hooks/useCleaners';

export default function DispatcherDashboard() {
  const { jobs } = useJobsDemo();
  const { cleaners } = useCleaners();

  const todayJobs = jobs.filter(job => {
    const jobDate = new Date(job.job_date);
    const today = new Date();
    return jobDate.toDateString() === today.toDateString();
  });

  const stats = {
    totalJobs: todayJobs.length,
    unassigned: todayJobs.filter(j => j.status === 'unassigned').length,
    inProgress: todayJobs.filter(j => j.status === 'in_progress').length,
    completed: todayJobs.filter(j => j.status === 'completed').length,
    activeCleaner: cleaners.filter(c => c.status === 'active').length
  };

  return (
    <AdminLayout 
      title="Dispatch Operations" 
      description="Real-time job management and cleaner assignment dashboard"
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Jobs</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalJobs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.unassigned}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Cleaners</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeCleaner}</div>
            </CardContent>
          </Card>
        </div>

        {/* Alert Badges */}
        <div className="flex gap-2 flex-wrap">
          {stats.unassigned > 0 && (
            <Badge variant="destructive">
              {stats.unassigned} unassigned jobs need attention
            </Badge>
          )}
          {stats.inProgress > 5 && (
            <Badge variant="secondary">
              High volume: {stats.inProgress} jobs in progress
            </Badge>
          )}
        </div>

        {/* Job Board */}
        <JobBoard />
      </div>
    </AdminLayout>
  );
}