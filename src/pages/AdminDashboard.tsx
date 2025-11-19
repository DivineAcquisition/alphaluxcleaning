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
  Timer,
  Activity,
  TestTube,
  Database
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
            <Button onClick={() => window.location.href = '/admin/csr-booking'}>
              <Phone className="w-4 h-4 mr-2" />
              CSR Booking
            </Button>
            <Button variant="outline" size="sm" onClick={refetch}>
              <Clock className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <KPICards kpis={kpis} />

        {/* Developer Tools - Real-Time Monitoring & Testing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Developer Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Booking Monitor */}
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2"
                onClick={() => window.location.href = '/admin/booking-monitor'}
              >
                <div className="flex items-center gap-2 w-full">
                  <Activity className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Booking Monitor</span>
                </div>
                <p className="text-xs text-muted-foreground text-left">
                  Real-time tracking of active bookings, conversion funnel, and live activity feed
                </p>
              </Button>

              {/* Automated Tester */}
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2"
                onClick={() => window.location.href = '/admin/booking-tester'}
              >
                <div className="flex items-center gap-2 w-full">
                  <TestTube className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Automated Tester</span>
                </div>
                <p className="text-xs text-muted-foreground text-left">
                  Run automated test suites on booking flow with detailed validation reports
                </p>
              </Button>

              {/* Database Watcher */}
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2"
                onClick={() => window.location.href = '/admin/database-watcher'}
              >
                <div className="flex items-center gap-2 w-full">
                  <Database className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Database Watcher</span>
                </div>
                <p className="text-xs text-muted-foreground text-left">
                  Monitor live database changes across all tables with real-time event stream
                </p>
              </Button>

              {/* Conversion Optimization */}
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2"
                onClick={() => window.location.href = '/admin/conversion'}
              >
                <div className="flex items-center gap-2 w-full">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Conversion Optimization</span>
                </div>
                <p className="text-xs text-muted-foreground text-left">
                  A/B test results, drop-off heatmaps, and pricing sensitivity analysis
                </p>
              </Button>
            </div>
          </CardContent>
        </Card>

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