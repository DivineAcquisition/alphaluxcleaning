import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useMemo } from "react";

interface RevenueChartProps {
  orders: any[];
  detailed?: boolean;
}

export function RevenueChart({ orders, detailed = false }: RevenueChartProps) {
  const chartData = useMemo(() => {
    // Group orders by month
    const monthlyRevenue = orders.reduce((acc, order) => {
      const date = new Date(order.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          revenue: 0,
          orders: 0,
          avgOrderValue: 0
        };
      }
      
      acc[monthKey].revenue += (order.amount || 0) / 100; // Convert from cents
      acc[monthKey].orders += 1;
      
      return acc;
    }, {} as Record<string, any>);
    
    // Calculate average order value for each month
    Object.values(monthlyRevenue).forEach((month: any) => {
      month.avgOrderValue = month.orders > 0 ? month.revenue / month.orders : 0;
    });
    
    return Object.values(monthlyRevenue).sort((a: any, b: any) => a.month.localeCompare(b.month));
  }, [orders]);

  const totalRevenue = orders.reduce((sum, order) => sum + (order.amount || 0), 0) / 100;
  const previousMonthRevenue = chartData.length > 1 ? (chartData[chartData.length - 2] as any)?.revenue || 0 : 0;
  const currentMonthRevenue = chartData.length > 0 ? (chartData[chartData.length - 1] as any)?.revenue || 0 : 0;
  const growthRate = previousMonthRevenue > 0 ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : 0;

  return (
    <Card className={detailed ? "col-span-full" : ""}>
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
        <CardDescription>
          Total revenue: ${totalRevenue.toLocaleString()} 
          {growthRate !== 0 && (
            <span className={`ml-2 ${growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
              ({growthRate > 0 ? '+' : ''}{growthRate.toFixed(1)}% from last month)
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <ResponsiveContainer width="100%" height={detailed ? 400 : 350}>
          {detailed ? (
            <BarChart data={chartData}>
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
                formatter={(value: any, name: string) => [
                  name === 'revenue' ? `$${value.toLocaleString()}` : 
                  name === 'orders' ? value :
                  `$${value.toFixed(2)}`,
                  name === 'revenue' ? 'Revenue' :
                  name === 'orders' ? 'Orders' : 'Avg Order Value'
                ]}
                labelFormatter={(value) => {
                  const [year, month] = value.split('-');
                  return `${month}/${year}`;
                }}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" name="revenue" />
              <Bar dataKey="avgOrderValue" fill="hsl(var(--secondary))" name="avgOrderValue" />
            </BarChart>
          ) : (
            <LineChart data={chartData}>
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
                formatter={(value: any) => [`$${value.toLocaleString()}`, 'Revenue']}
                labelFormatter={(value) => {
                  const [year, month] = value.split('-');
                  return `${month}/${year}`;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}