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
  Search, 
  Filter,
  Calendar,
  DollarSign,
  AlertTriangle,
  Clock,
  MapPin,
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

export default function OfficeManagerBookings() {
  // Mock data - replace with real data from Supabase
  const bookings = [
    {
      id: 1,
      client: "Sarah Johnson",
      service: "Deep Clean",
      address: "123 Oak St, San Jose",
      date: "2024-01-20",
      time: "9:00 AM",
      duration: "3 hours",
      price: 180,
      paymentStatus: "paid",
      bookingStatus: "confirmed",
      lastModified: "2024-01-10"
    },
    {
      id: 2,
      client: "Mike Chen",
      service: "Regular Clean", 
      address: "456 Pine Ave, Palo Alto",
      date: "2024-01-22",
      time: "2:00 PM",
      duration: "2 hours",
      price: 120,
      paymentStatus: "pending",
      bookingStatus: "confirmed",
      lastModified: "2024-01-12"
    },
    {
      id: 3,
      client: "Lisa Thompson",
      service: "Move-out Clean",
      address: "789 Elm Dr, Mountain View",
      date: "2024-01-18",
      time: "10:00 AM", 
      duration: "4 hours",
      price: 250,
      paymentStatus: "deposit_only",
      bookingStatus: "pending",
      lastModified: "2024-01-15"
    },
    {
      id: 4,
      client: "Robert Wilson",
      service: "Post Construction",
      address: "321 Maple Ave, Sunnyvale",
      date: "2024-01-25",
      time: "8:00 AM",
      duration: "6 hours", 
      price: 400,
      paymentStatus: "unpaid",
      bookingStatus: "needs_assignment",
      lastModified: "2024-01-14"
    }
  ];

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'deposit_only':
        return 'bg-blue-100 text-blue-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'needs_assignment':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const hasSchedulingConflict = (booking: any) => {
    // Mock logic for detecting conflicts
    return booking.id === 3; // Example conflict
  };

  return (
    <AdminLayout title="Bookings Management" description="Manage customer bookings and scheduling">
      <div className="space-y-6">
        {/* Booking Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookings.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {bookings.filter(b => b.bookingStatus === 'confirmed').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${bookings.reduce((sum, b) => sum + b.price, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payment Issues</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {bookings.filter(b => b.paymentStatus === 'unpaid').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex flex-1 items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search bookings..."
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
        </div>

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Bookings</CardTitle>
            <CardDescription>Manage dates, times, pricing and assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client & Service</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issues</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{booking.client}</p>
                        <p className="text-sm text-muted-foreground">{booking.service}</p>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {booking.address}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-2 text-muted-foreground" />
                          <span className="text-sm font-medium">{booking.date}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-2 text-muted-foreground" />
                          <span className="text-sm">{booking.time} ({booking.duration})</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">${booking.price}</p>
                        <Badge className={getPaymentStatusColor(booking.paymentStatus)}>
                          {booking.paymentStatus.replace('_', ' ')}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getBookingStatusColor(booking.bookingStatus)}>
                        {booking.bookingStatus.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {hasSchedulingConflict(booking) && (
                        <div className="flex items-center text-red-600">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          <span className="text-sm">Conflict</span>
                        </div>
                      )}
                      {booking.paymentStatus === 'unpaid' && (
                        <div className="flex items-center text-red-600">
                          <DollarSign className="h-4 w-4 mr-1" />
                          <span className="text-sm">Payment</span>
                        </div>
                      )}
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
                          <DropdownMenuItem>Edit Booking</DropdownMenuItem>
                          <DropdownMenuItem>Change Date/Time</DropdownMenuItem>
                          <DropdownMenuItem>Update Pricing</DropdownMenuItem>
                          <DropdownMenuItem>Assign Cleaner</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Send Reminder</DropdownMenuItem>
                          <DropdownMenuItem>Process Payment</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">Cancel Booking</DropdownMenuItem>
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