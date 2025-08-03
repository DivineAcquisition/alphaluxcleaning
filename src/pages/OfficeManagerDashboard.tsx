import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CalendarDays, 
  Users, 
  MapPin, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Timer
} from "lucide-react";

export default function OfficeManagerDashboard() {
  // Mock data - replace with real data from Supabase
  const todayStats = {
    totalJobs: 12,
    completed: 8,
    inProgress: 3,
    missed: 1,
    availableCleaners: 6
  };

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

  return (
    <AdminLayout title="Dashboard" description="Overview of today's operations">
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs Today</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.totalJobs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{todayStats.completed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Timer className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{todayStats.inProgress}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Missed</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{todayStats.missed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Cleaners</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.availableCleaners}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Jobs */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Jobs</CardTitle>
              <CardDescription>All scheduled cleaning appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <p className="font-medium">{job.client}</p>
                        <p className="text-sm text-muted-foreground">{job.time} • {job.cleaner}</p>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {job.location}
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(job.status)}>
                      {job.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                View All Jobs
              </Button>
            </CardContent>
          </Card>

          {/* Alerts & Issues */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                Alerts & Issues
              </CardTitle>
              <CardDescription>Items requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className="p-3 border rounded-lg border-amber-200 bg-amber-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-800">{alert.message}</p>
                        <p className="text-xs text-amber-600 mt-1">{alert.time}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        Resolve
                      </Button>
                    </div>
                  </div>
                ))}
                
                {alerts.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p>No alerts at this time</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for managing operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex flex-col">
                <CalendarDays className="h-5 w-5 mb-2" />
                Schedule Job
              </Button>
              <Button variant="outline" className="h-20 flex flex-col">
                <Users className="h-5 w-5 mb-2" />
                Assign Cleaner
              </Button>
              <Button variant="outline" className="h-20 flex flex-col">
                <MapPin className="h-5 w-5 mb-2" />
                View Map
              </Button>
              <Button variant="outline" className="h-20 flex flex-col">
                <AlertTriangle className="h-5 w-5 mb-2" />
                Report Issue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}