import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface RecentBookingsProps {
  bookings: any[];
}

export function RecentBookings({ bookings }: RecentBookingsProps) {
  const recentBookings = bookings
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Bookings</CardTitle>
        <CardDescription>Latest customer bookings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentBookings.map((booking) => (
            <div key={booking.id} className="flex items-center justify-between space-x-4">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  {booking.customer_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {booking.service_address}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(booking.created_at), { addSuffix: true })}
                </p>
              </div>
              <div className="flex flex-col items-end space-y-1">
                <Badge className={getStatusColor(booking.status)}>
                  {booking.status}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {new Date(booking.service_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
          {recentBookings.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent bookings found
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}