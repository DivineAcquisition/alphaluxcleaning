import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Users, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp,
  MapPin,
  Phone,
  Eye,
  UserPlus,
  Filter,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Timer
} from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { useDashboardData } from '@/hooks/useDashboardData';
import { KPICards } from '@/components/dashboard/KPICards';
import { JobsWorkboard } from '@/components/dashboard/JobsWorkboard';
import { SubcontractorsWorkboard } from '@/components/dashboard/SubcontractorsWorkboard';
import { PayoutsAlertsSection } from '@/components/dashboard/PayoutsAlertsSection';
import { AssignmentDrawer } from '@/components/dashboard/AssignmentDrawer';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [assignmentDrawerOpen, setAssignmentDrawerOpen] = useState(false);
  
  const {
    kpis,
    jobs,
    subcontractors,
    payouts,
    alerts,
    loading,
    error,
    refetch
  } = useDashboardData();

  const handleAssignJob = (jobId: string) => {
    setSelectedJob(jobId);
    setAssignmentDrawerOpen(true);
  };

  const handleAssignmentComplete = () => {
    setAssignmentDrawerOpen(false);
    setSelectedJob(null);
    refetch();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-destructive mb-2">Dashboard Error</h2>
              <p className="text-muted-foreground mb-4">
                Failed to load dashboard data. Please try again.
              </p>
              <Button onClick={refetch} variant="outline">
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Navigation />
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refetch}>
              <Clock className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <KPICards kpis={kpis} />

        {/* Workboard */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Jobs Section */}
          <div className="space-y-4">
            <JobsWorkboard 
              jobs={jobs}
              onAssignJob={handleAssignJob}
              onRefresh={refetch}
            />
          </div>

          {/* Subcontractors Section */}
          <div className="space-y-4">
            <SubcontractorsWorkboard 
              subcontractors={subcontractors}
              onAssignJob={handleAssignJob}
            />
          </div>
        </div>

        {/* Payouts & Alerts */}
        <PayoutsAlertsSection 
          payouts={payouts}
          alerts={alerts}
          onRefresh={refetch}
        />

        {/* Assignment Drawer */}
        <AssignmentDrawer
          open={assignmentDrawerOpen}
          onClose={() => setAssignmentDrawerOpen(false)}
          jobId={selectedJob}
          onAssignmentComplete={handleAssignmentComplete}
        />
      </div>
    </div>
  );
}