import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Star,
  Clock,
  DollarSign,
  Award,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle,
  XCircle,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function OfficeManagerPerformance() {
  // Mock data - replace with real data from Supabase
  const performanceMetrics = [
    {
      id: 1,
      name: "Maria Garcia",
      avatar: null,
      role: "Senior Cleaner",
      onTimePercentage: 95,
      avgRating: 4.8,
      jobsCompleted: 45,
      noShows: 0,
      lateArrivals: 2,
      estimatedPayout: 1850,
      bonusEligible: true,
      recentTrend: "up",
      lastWeekJobs: 12
    },
    {
      id: 2,
      name: "David Rodriguez",
      avatar: null,
      role: "Cleaner", 
      onTimePercentage: 78,
      avgRating: 3.9,
      jobsCompleted: 32,
      noShows: 3,
      lateArrivals: 7,
      estimatedPayout: 1200,
      bonusEligible: false,
      recentTrend: "down",
      lastWeekJobs: 8
    },
    {
      id: 3,
      name: "Anna Kowalski",
      avatar: null,
      role: "Cleaner",
      onTimePercentage: 88,
      avgRating: 4.6,
      jobsCompleted: 28,
      noShows: 1,
      lateArrivals: 3,
      estimatedPayout: 1450,
      bonusEligible: true,
      recentTrend: "up",
      lastWeekJobs: 10
    },
    {
      id: 4,
      name: "James Wilson",
      avatar: null,
      role: "Team Lead",
      onTimePercentage: 92,
      avgRating: 4.9,
      jobsCompleted: 38,
      noShows: 0,
      lateArrivals: 2,
      estimatedPayout: 3200,
      bonusEligible: true,
      recentTrend: "up",
      lastWeekJobs: 11
    }
  ];

  const recentIncidents = [
    {
      id: 1,
      cleaner: "David Rodriguez",
      type: "late_arrival",
      description: "Arrived 25 minutes late to Mike Chen appointment",
      date: "2024-01-15",
      status: "documented"
    },
    {
      id: 2,
      cleaner: "Anna Kowalski", 
      type: "no_show",
      description: "No-show for scheduled appointment at Oak Street",
      date: "2024-01-14",
      status: "flagged"
    }
  ];

  const getOnTimeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getIncidentTypeColor = (type: string) => {
    switch (type) {
      case 'late_arrival':
        return 'bg-yellow-100 text-yellow-800';
      case 'no_show':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout title="Performance Tracking" description="Monitor cleaner metrics and weekly payouts">
      <div className="space-y-6">
        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Avg Rating</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(performanceMetrics.reduce((sum, p) => sum + p.avgRating, 0) / performanceMetrics.length).toFixed(1)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(performanceMetrics.reduce((sum, p) => sum + p.onTimePercentage, 0) / performanceMetrics.length)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Payout</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${performanceMetrics.reduce((sum, p) => sum + p.estimatedPayout, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bonus Eligible</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performanceMetrics.filter(p => p.bonusEligible).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Individual Performance</CardTitle>
            <CardDescription>Track metrics and estimated payouts for each team member</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cleaner</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Jobs This Week</TableHead>
                  <TableHead>Issues</TableHead>
                  <TableHead>Payout Estimate</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {performanceMetrics.map((metric) => (
                  <TableRow key={metric.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={metric.avatar || undefined} />
                          <AvatarFallback>{getInitials(metric.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{metric.name}</p>
                          <p className="text-sm text-muted-foreground">{metric.role}</p>
                        </div>
                        {metric.recentTrend === 'up' ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <Star className="h-3 w-3 mr-1 text-yellow-500 fill-yellow-500" />
                          <span className={`text-sm font-medium ${getRatingColor(metric.avgRating)}`}>
                            {metric.avgRating}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                          <span className={`text-sm ${getOnTimeColor(metric.onTimePercentage)}`}>
                            {metric.onTimePercentage}% on-time
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                          <span className="text-sm font-medium">{metric.lastWeekJobs} jobs</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {metric.jobsCompleted} total completed
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {metric.noShows > 0 && (
                          <div className="flex items-center text-red-600">
                            <XCircle className="h-3 w-3 mr-1" />
                            <span className="text-sm">{metric.noShows} no-shows</span>
                          </div>
                        )}
                        {metric.lateArrivals > 0 && (
                          <div className="flex items-center text-yellow-600">
                            <Clock className="h-3 w-3 mr-1" />
                            <span className="text-sm">{metric.lateArrivals} late</span>
                          </div>
                        )}
                        {metric.noShows === 0 && metric.lateArrivals === 0 && (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            <span className="text-sm">No issues</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">${metric.estimatedPayout.toLocaleString()}</p>
                        {metric.bonusEligible && (
                          <Badge className="bg-green-100 text-green-800">
                            <Award className="h-3 w-3 mr-1" />
                            Bonus Eligible
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>View Full History</DropdownMenuItem>
                          <DropdownMenuItem>Assign Bonus</DropdownMenuItem>
                          <DropdownMenuItem>Performance Review</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Mark Late Arrival</DropdownMenuItem>
                          <DropdownMenuItem>Record No-Show</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">Flag Performance Issue</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Incidents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
              Recent Incidents
            </CardTitle>
            <CardDescription>Track no-shows, late arrivals, and performance flags</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentIncidents.map((incident) => (
                <div key={incident.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge className={getIncidentTypeColor(incident.type)}>
                      {incident.type.replace('_', ' ')}
                    </Badge>
                    <div>
                      <p className="font-medium">{incident.cleaner}</p>
                      <p className="text-sm text-muted-foreground">{incident.description}</p>
                      <p className="text-xs text-muted-foreground">{incident.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {incident.status}
                    </Badge>
                    <Button size="sm" variant="outline">
                      Review
                    </Button>
                  </div>
                </div>
              ))}
              
              {recentIncidents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p>No recent incidents to report</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}