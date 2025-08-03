import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  CalendarDays, 
  Search, 
  Filter,
  MapPin,
  Clock,
  User,
  MoreVertical,
  Plus
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function OfficeManagerJobs() {
  // Mock data - replace with real data from Supabase
  const jobs = [
    {
      id: 1,
      client: "Sarah Johnson",
      address: "123 Oak St, San Jose",
      date: "2024-01-15",
      time: "9:00 AM",
      duration: "2 hours",
      cleaner: "Maria Garcia",
      status: "completed",
      instructions: "Focus on kitchen deep clean",
      checkIn: "8:55 AM",
      checkOut: "11:10 AM"
    },
    {
      id: 2,
      client: "Mike Chen", 
      address: "456 Pine Ave, Palo Alto",
      date: "2024-01-15",
      time: "11:30 AM",
      duration: "1.5 hours",
      cleaner: "David Rodriguez",
      status: "in_progress",
      instructions: "Pet-friendly products only",
      checkIn: "11:45 AM",
      checkOut: null
    },
    {
      id: 3,
      client: "Lisa Thompson",
      address: "789 Elm Dr, Mountain View", 
      date: "2024-01-15",
      time: "2:00 PM",
      duration: "3 hours",
      cleaner: "Anna Kowalski",
      status: "scheduled",
      instructions: "Move-out cleaning",
      checkIn: null,
      checkOut: null
    },
    {
      id: 4,
      client: "Robert Wilson",
      address: "321 Maple Ave, Sunnyvale",
      date: "2024-01-16", 
      time: "10:00 AM",
      duration: "2 hours",
      cleaner: null,
      status: "unassigned",
      instructions: "Standard clean",
      checkIn: null,
      checkOut: null
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'unassigned':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout title="Jobs Management" description="View and manage all cleaning jobs">
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex flex-1 items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search jobs..."
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Job
          </Button>
        </div>

        {/* Jobs Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Jobs</CardTitle>
            <CardDescription>Manage scheduling and assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Cleaner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check In/Out</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{job.client}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          {job.address}
                        </div>
                        {job.instructions && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Note: {job.instructions}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{job.date}</p>
                          <p className="text-sm text-muted-foreground">{job.time} ({job.duration})</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {job.cleaner ? (
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-muted-foreground" />
                          {job.cleaner}
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-red-600">
                          Unassigned
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(job.status)}>
                        {job.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {job.checkIn && (
                          <div className="flex items-center text-green-600">
                            <Clock className="h-3 w-3 mr-1" />
                            In: {job.checkIn}
                          </div>
                        )}
                        {job.checkOut && (
                          <div className="flex items-center text-blue-600">
                            <Clock className="h-3 w-3 mr-1" />
                            Out: {job.checkOut}
                          </div>
                        )}
                        {!job.checkIn && !job.checkOut && (
                          <span className="text-muted-foreground">Pending</span>
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
                          <DropdownMenuItem>Edit Job</DropdownMenuItem>
                          <DropdownMenuItem>Assign Cleaner</DropdownMenuItem>
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Reschedule</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Cancel Job</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}