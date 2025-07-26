import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useMemo } from "react";

interface RetentionMetricsProps {
  orders: any[];
}

export function RetentionMetrics({ orders }: RetentionMetricsProps) {
  const retentionData = useMemo(() => {
    // Group orders by customer email
    const customerOrders = orders.reduce((acc, order) => {
      if (!order.customer_email) return acc;
      
      if (!acc[order.customer_email]) {
        acc[order.customer_email] = [];
      }
      acc[order.customer_email].push(order);
      return acc;
    }, {} as Record<string, any[]>);

    // Calculate retention metrics
    const totalCustomers = Object.keys(customerOrders).length;
    const repeatCustomers = Object.values(customerOrders).filter((orders: any[]) => orders.length > 1).length;
    const retentionRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

    // Calculate monthly retention
    const monthlyRetention = orders.reduce((acc, order) => {
      const date = new Date(order.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          newCustomers: new Set(),
          returningCustomers: new Set(),
          totalCustomers: new Set()
        };
      }
      
      const email = order.customer_email;
      if (!email) return acc;
      
      acc[monthKey].totalCustomers.add(email);
      
      // Check if this customer had orders before this month
      const hasEarlierOrders = orders.some(prevOrder => {
        const prevDate = new Date(prevOrder.created_at);
        const prevMonthKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
        return prevOrder.customer_email === email && prevMonthKey < monthKey;
      });
      
      if (hasEarlierOrders) {
        acc[monthKey].returningCustomers.add(email);
      } else {
        acc[monthKey].newCustomers.add(email);
      }
      
      return acc;
    }, {} as Record<string, any>);

    // Convert to chart format
    const chartData = Object.entries(monthlyRetention)
      .map(([month, data]: [string, any]) => ({
        month,
        newCustomers: data.newCustomers.size,
        returningCustomers: data.returningCustomers.size,
        totalCustomers: data.totalCustomers.size,
        retentionRate: data.totalCustomers.size > 0 ? 
          (data.returningCustomers.size / data.totalCustomers.size) * 100 : 0
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return { chartData, totalCustomers, repeatCustomers, retentionRate };
  }, [orders]);

  const avgOrdersPerCustomer = retentionData.totalCustomers > 0 ? 
    orders.length / retentionData.totalCustomers : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Retention Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{retentionData.retentionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {retentionData.repeatCustomers} of {retentionData.totalCustomers} customers returned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Orders per Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgOrdersPerCustomer.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Total customers: {retentionData.totalCustomers}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Repeat Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{retentionData.repeatCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {((retentionData.repeatCustomers / retentionData.totalCustomers) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Customer Retention</CardTitle>
          <CardDescription>New vs returning customers over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={retentionData.chartData}>
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
                formatter={(value: any, name: string) => [
                  name === 'retentionRate' ? `${value.toFixed(1)}%` : value,
                  name === 'newCustomers' ? 'New Customers' :
                  name === 'returningCustomers' ? 'Returning Customers' :
                  name === 'totalCustomers' ? 'Total Customers' : 'Retention Rate'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="newCustomers" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="newCustomers"
              />
              <Line 
                type="monotone" 
                dataKey="returningCustomers" 
                stroke="hsl(var(--secondary))" 
                strokeWidth={2}
                name="returningCustomers"
              />
              <Line 
                type="monotone" 
                dataKey="retentionRate" 
                stroke="hsl(var(--accent))" 
                strokeWidth={2}
                name="retentionRate"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}