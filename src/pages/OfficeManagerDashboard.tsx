import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  CalendarDays, 
  Users, 
  MapPin, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Timer,
  TrendingUp,
  Phone,
  MessageSquare,
  Settings,
  RefreshCw,
  Bell,
  DollarSign
} from "lucide-react";

export default function OfficeManagerDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Real-time stats - enhanced with more metrics
  const [todayStats, setTodayStats] = useState({
    totalJobs: 12,
    completed: 8,
    inProgress: 3,
    missed: 1,
    availableCleaners: 6,
    revenue: 2840,
    avgRating: 4.8,
    customerSatisfaction: 96
  });

  const todayJobs = [
    {
      id: 1,
      client: "Sarah Johnson",
      time: "9:00 AM",
      cleaner: "Maria Garcia",
      status: "completed",
      location: "123 Oak St, San Jose"
    },
    {
      id: 2,
      client: "Mike Chen",
      time: "11:30 AM", 
      cleaner: "David Rodriguez",
      status: "in_progress",
      location: "456 Pine Ave, Palo Alto"
    },
    {
      id: 3,
      client: "Lisa Thompson",
      time: "2:00 PM",
      cleaner: "Anna Kowalski",
      status: "scheduled",
      location: "789 Elm Dr, Mountain View"
    }
  ];

  const alerts = [
    {
      id: 1,
      type: "late",
      message: "David Rodriguez is 15 minutes late for Mike Chen appointment",
      time: "5 minutes ago"
    },
    {
      id: 2,
      type: "quality",
      message: "Client complaint received for yesterday's cleaning at Oak Street",
      time: "2 hours ago"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Timer className="h-4 w-4 text-blue-500" />;
      case 'missed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'missed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      // Simulate data refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Data Refreshed",
        description: "Dashboard data has been updated."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Office Manager Dashboard" description="Real-time operations command center">
      <div className="space-y-6">
        {/* Enhanced Header with Quick Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">Today's Operations</h2>
            <p className="text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refreshData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Enhanced Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Jobs Today</CardTitle>
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{todayStats.totalJobs}</div>
                  <Progress value={(todayStats.completed / todayStats.totalJobs) * 100} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round((todayStats.completed / todayStats.totalJobs) * 100)}% complete
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Daily Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">${todayStats.revenue}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <TrendingUp className="h-3 w-3 inline mr-1" />
                    +12% from yesterday
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Team Performance</CardTitle>
                  <Timer className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{todayStats.avgRating}</div>
                  <p className="text-xs text-muted-foreground mt-1">Average rating today</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
                  <CheckCircle className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">{todayStats.customerSatisfaction}%</div>
                  <p className="text-xs text-muted-foreground mt-1">This week</p>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Job Management */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Today's Schedule</CardTitle>
                    <CardDescription>Real-time job tracking and management</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {todayJobs.map((job) => (
                        <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                          <div className="flex items-center space-x-4">
                            {getStatusIcon(job.status)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{job.client}</p>
                                <Badge variant="outline" className="text-xs">{job.time}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{job.cleaner}</p>
                              <div className="flex items-center text-xs text-muted-foreground mt-1">
                                <MapPin className="h-3 w-3 mr-1" />
                                {job.location}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost">
                              <Phone className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <MessageSquare className="h-3 w-3" />
                            </Button>
                            <Badge className={getStatusColor(job.status)}>
                              {job.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Enhanced Sidebar */}
              <div className="space-y-6">
                {/* Priority Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-red-600">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      Urgent Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {alerts.map((alert) => (
                      <div key={alert.id} className="p-3 border rounded-lg border-red-200 bg-red-50">
                        <p className="text-sm font-medium text-red-800">{alert.message}</p>
                        <p className="text-xs text-red-600 mt-1">{alert.time}</p>
                        <Button size="sm" className="w-full mt-2" variant="destructive">
                          Handle Now
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Team Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Team Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Active Cleaners</span>
                        <Badge variant="secondary">{todayStats.availableCleaners}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">On Break</span>
                        <Badge variant="outline">2</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Off Duty</span>
                        <Badge variant="outline">4</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Management</CardTitle>
                <CardDescription>Comprehensive job scheduling and tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Advanced job management interface coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Management</CardTitle>
                <CardDescription>Monitor and manage your cleaning team</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Team management dashboard coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
                <CardDescription>Deep insights into operational performance</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Advanced analytics dashboard coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}