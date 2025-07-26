import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from "recharts";
import { useMemo } from "react";

interface LTVMetricsProps {
  orders: any[];
}

export function LTVMetrics({ orders }: LTVMetricsProps) {
  const ltvData = useMemo(() => {
    // Group orders by customer
    const customerData = orders.reduce((acc, order) => {
      if (!order.customer_email) return acc;
      
      if (!acc[order.customer_email]) {
        acc[order.customer_email] = {
          email: order.customer_email,
          orders: [],
          totalSpent: 0,
          orderCount: 0,
          firstOrderDate: null,
          lastOrderDate: null
        };
      }
      
      const customer = acc[order.customer_email];
      customer.orders.push(order);
      customer.totalSpent += (order.amount || 0) / 100; // Convert from cents
      customer.orderCount += 1;
      
      const orderDate = new Date(order.created_at);
      if (!customer.firstOrderDate || orderDate < customer.firstOrderDate) {
        customer.firstOrderDate = orderDate;
      }
      if (!customer.lastOrderDate || orderDate > customer.lastOrderDate) {
        customer.lastOrderDate = orderDate;
      }
      
      return acc;
    }, {} as Record<string, any>);

    // Calculate LTV metrics
    const customers = Object.values(customerData);
    const totalRevenue = customers.reduce((sum: number, customer: any) => {
      return sum + Number(customer.totalSpent);
    }, 0);
    const avgLTV = customers.length > 0 ? Number(totalRevenue) / Number(customers.length) : 0;
    
    // Calculate customer lifecycle length in days
    customers.forEach((customer: any) => {
      if (customer.firstOrderDate && customer.lastOrderDate) {
        customer.lifecycleDays = Math.max(1, 
          Math.ceil((customer.lastOrderDate.getTime() - customer.firstOrderDate.getTime()) / (1000 * 60 * 60 * 24))
        );
      } else {
        customer.lifecycleDays = 1;
      }
      customer.avgOrderValue = customer.orderCount > 0 ? customer.totalSpent / customer.orderCount : 0;
    });

    // Group customers by LTV ranges
    const ltvRanges = [
      { range: '$0-$100', min: 0, max: 100, count: 0, totalValue: 0 },
      { range: '$100-$250', min: 100, max: 250, count: 0, totalValue: 0 },
      { range: '$250-$500', min: 250, max: 500, count: 0, totalValue: 0 },
      { range: '$500-$1000', min: 500, max: 1000, count: 0, totalValue: 0 },
      { range: '$1000+', min: 1000, max: Infinity, count: 0, totalValue: 0 }
    ];

    customers.forEach((customer: any) => {
      const ltv = Number(customer.totalSpent);
      const range = ltvRanges.find(r => ltv >= r.min && ltv < r.max);
      if (range) {
        range.count += 1;
        range.totalValue += ltv;
      }
    });

    // Top customers for scatter plot
    const topCustomers = customers
      .sort((a: any, b: any) => Number(b.totalSpent) - Number(a.totalSpent))
      .slice(0, 50)
      .map((customer: any) => ({
        orderCount: customer.orderCount,
        totalSpent: customer.totalSpent,
        avgOrderValue: customer.avgOrderValue,
        lifecycleDays: customer.lifecycleDays
      }));

    return {
      avgLTV,
      totalRevenue,
      customerCount: customers.length,
      ltvRanges,
      topCustomers,
      customers
    };
  }, [orders]);

  const avgOrderValue = ltvData.customerCount > 0 && orders.length > 0 ? 
    Number(ltvData.totalRevenue) / orders.length : 0;

  const highValueCustomers = ltvData.customers.filter((c: any) => Number(c.totalSpent) > avgOrderValue * 3).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average LTV</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${ltvData.avgLTV.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Across {ltvData.customerCount} customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Customer Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${ltvData.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total lifetime revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High-Value Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highValueCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Above 3x avg order value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Per transaction
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer LTV Distribution</CardTitle>
            <CardDescription>Number of customers by lifetime value range</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ltvData.ltvRanges}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    value,
                    name === 'count' ? 'Customers' : 'Total Value'
                  ]}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" name="count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Value vs Order Frequency</CardTitle>
            <CardDescription>Relationship between order count and total spending</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart data={ltvData.topCustomers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="orderCount" 
                  name="Order Count"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  dataKey="totalSpent" 
                  name="Total Spent"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    name === 'totalSpent' ? `$${value.toFixed(2)}` : value,
                    name === 'totalSpent' ? 'Total Spent' : 'Order Count'
                  ]}
                />
                <Scatter fill="hsl(var(--primary))" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}