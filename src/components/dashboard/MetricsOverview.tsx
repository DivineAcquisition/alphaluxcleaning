import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, DollarSign, Users, TrendingUp } from "lucide-react";

interface MetricsOverviewProps {
  bookings: any[];
  orders: any[];
  subcontractors: any[];
}

export function MetricsOverview({ bookings, orders, subcontractors }: MetricsOverviewProps) {
  // Calculate current month metrics
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const currentMonthOrders = orders.filter(order => {
    const orderDate = new Date(order.created_at);
    return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
  });
  
  const currentMonthBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.created_at);
    return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
  });
  
  // Calculate total revenue
  const totalRevenue = orders.reduce((sum, order) => {
    return sum + (order.amount || 0);
  }, 0);
  
  const currentMonthRevenue = currentMonthOrders.reduce((sum, order) => {
    return sum + (order.amount || 0);
  }, 0);
  
  // Calculate average order value
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  
  // Calculate active subcontractors
  const activeSubcontractors = subcontractors.filter(sub => sub.is_available && sub.subscription_status === 'active').length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${(totalRevenue / 100).toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            ${(currentMonthRevenue / 100).toLocaleString()} this month
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{bookings.length}</div>
          <p className="text-xs text-muted-foreground">
            {currentMonthBookings.length} this month
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${(avgOrderValue / 100).toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Across {orders.length} orders
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Subcontractors</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeSubcontractors}</div>
          <p className="text-xs text-muted-foreground">
            {subcontractors.length} total registered
          </p>
        </CardContent>
      </Card>
    </div>
  );
}