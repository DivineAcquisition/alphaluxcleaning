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
  Plus,
  Loader2
} from "lucide-react";
import { JobActionMenu } from "@/components/admin/JobActionMenu";
import { useJobs } from "@/hooks/useJobs";

export default function OfficeManagerJobs() {
  const { 
    jobs, 
    loading, 
    searchTerm, 
    setSearchTerm, 
    updateJobStatus, 
    assignCleaner 
  } = useJobs();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
      case 'assigned':
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800';
      case 'unassigned':
      case 'pending':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading jobs...</span>
              </div>
            ) : (
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
                  {jobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center p-8 text-muted-foreground">
                        No jobs found. Try adjusting your search criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    jobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{job.client}</p>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3 mr-1" />
                              {job.address}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{job.date}</p>
                              <p className="text-sm text-muted-foreground">{job.time}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {job.cleaner !== 'Unassigned' ? (
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
                          <JobActionMenu
                            job={job}
                            onStatusUpdate={updateJobStatus}
                            onAssignCleaner={assignCleaner}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}