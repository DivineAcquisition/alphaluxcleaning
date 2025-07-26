import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useMemo } from "react";

interface BookingsChartProps {
  bookings: any[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export function BookingsChart({ bookings }: BookingsChartProps) {
  const monthlyBookings = useMemo(() => {
    const monthlyData = bookings.reduce((acc, booking) => {
      const date = new Date(booking.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          total: 0,
          scheduled: 0,
          completed: 0,
          cancelled: 0
        };
      }
      
      acc[monthKey].total += 1;
      acc[monthKey][booking.status] = (acc[monthKey][booking.status] || 0) + 1;
      
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(monthlyData).sort((a: any, b: any) => a.month.localeCompare(b.month));
  }, [bookings]);

  const statusDistribution = useMemo(() => {
    const statusCounts = bookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const totalBookings = Number(bookings.length);
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      percentage: totalBookings > 0 ? ((Number(count) / totalBookings) * 100).toFixed(1) : '0'
    }));
  }, [bookings]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Monthly Bookings</CardTitle>
          <CardDescription>Booking trends over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyBookings}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const [year, month] = value.split('-');
                  return `${month}/${year.slice(2)}`;
                }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                labelFormatter={(value) => {
                  const [year, month] = value.split('-');
                  return `${month}/${year}`;
                }}
              />
              <Bar dataKey="total" fill="hsl(var(--primary))" name="Total Bookings" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Booking Status Distribution</CardTitle>
          <CardDescription>Current status breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} (${percentage}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}