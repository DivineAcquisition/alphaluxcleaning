import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Search, 
  Filter,
  Star,
  AlertTriangle,
  MessageSquare,
  Camera,
  Flag,
  TrendingDown,
  TrendingUp,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function OfficeManagerQuality() {
  // Mock data - replace with real data from Supabase
  const qualityReports = [
    {
      id: 1,
      client: "Sarah Johnson",
      cleaner: "Maria Garcia",
      jobDate: "2024-01-15",
      rating: 5,
      comment: "Absolutely amazing service! The house looks spotless.",
      photos: 2,
      category: "positive",
      status: "resolved",
      response: null
    },
    {
      id: 2,
      client: "Mike Chen",
      cleaner: "David Rodriguez", 
      jobDate: "2024-01-14",
      rating: 2,
      comment: "Bathroom wasn't cleaned properly and there were streaks on the windows.",
      photos: 3,
      category: "complaint",
      status: "pending",
      response: null
    },
    {
      id: 3,
      client: "Lisa Thompson",
      cleaner: "Anna Kowalski",
      jobDate: "2024-01-13",
      rating: 4,
      comment: "Good job overall, just missed cleaning under the couch.",
      photos: 0,
      category: "feedback",
      status: "acknowledged",
      response: "Thank you for the feedback. We'll ensure better attention to detail."
    },
    {
      id: 4,
      client: "Robert Wilson",
      cleaner: "David Rodriguez",
      jobDate: "2024-01-12", 
      rating: 1,
      comment: "Cleaner showed up 30 minutes late and didn't clean the kitchen properly.",
      photos: 1,
      category: "complaint",
      status: "escalated",
      response: null
    }
  ];

  const cleanerPerformance = [
    {
      name: "Maria Garcia",
      avgRating: 4.8,
      totalReviews: 145,
      complaints: 2,
      trend: "up"
    },
    {
      name: "David Rodriguez", 
      avgRating: 3.9,
      totalReviews: 89,
      complaints: 8,
      trend: "down"
    },
    {
      name: "Anna Kowalski",
      avgRating: 4.6,
      totalReviews: 67,
      complaints: 3,
      trend: "up"
    }
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'complaint':
        return 'bg-red-100 text-red-800';
      case 'feedback':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'acknowledged':
        return 'bg-blue-100 text-blue-800';
      case 'escalated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <AdminLayout title="Quality Control" description="Monitor customer feedback and team performance">
      <div className="space-y-6">
        {/* Quality Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{qualityReports.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(qualityReports.reduce((sum, r) => sum + r.rating, 0) / qualityReports.length).toFixed(1)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Complaints</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {qualityReports.filter(r => r.category === 'complaint' && r.status !== 'resolved').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Photos Submitted</CardTitle>
              <Camera className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {qualityReports.reduce((sum, r) => sum + r.photos, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Feedback */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Feedback</CardTitle>
                  <CardDescription>Latest customer reviews and complaints</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search..."
                      className="pl-10 w-48"
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {qualityReports.map((report) => (
                  <div key={report.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium">{report.client}</p>
                          <Badge className={getCategoryColor(report.category)}>
                            {report.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {report.cleaner} • {report.jobDate}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex">{renderStars(report.rating)}</div>
                        {report.photos > 0 && (
                          <Badge variant="outline">
                            <Camera className="h-3 w-3 mr-1" />
                            {report.photos}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm mb-3">{report.comment}</p>
                    
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Respond</DropdownMenuItem>
                          {report.photos > 0 && (
                            <DropdownMenuItem>View Photos</DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Flag Cleaner</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Escalate to Owner</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    {report.response && (
                      <div className="mt-3 p-3 bg-blue-50 rounded">
                        <p className="text-sm text-blue-800">
                          <strong>Response:</strong> {report.response}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cleaner Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Cleaner Performance</CardTitle>
              <CardDescription>Track individual performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cleanerPerformance.map((cleaner, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{cleaner.name}</p>
                        {cleaner.trend === 'up' ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Star className="h-3 w-3 mr-1 text-yellow-500 fill-yellow-500" />
                          {cleaner.avgRating} avg
                        </div>
                        <div>{cleaner.totalReviews} reviews</div>
                        <div className="text-red-600">{cleaner.complaints} complaints</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {cleaner.complaints > 5 && (
                        <Button size="sm" variant="outline">
                          <Flag className="h-3 w-3 mr-1" />
                          Flag
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Response Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg">
              <MessageSquare className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Quick Response</DialogTitle>
              <DialogDescription>
                Respond to customer feedback or complaint
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea placeholder="Type your response here..." />
            </div>
            <DialogFooter>
              <Button variant="outline">Save Draft</Button>
              <Button>Send Response</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}