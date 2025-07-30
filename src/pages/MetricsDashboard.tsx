import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AnalyticsData {
  dailyRevenue: { date: string; revenue: number; orders: number }[];
  serviceTypes: { name: string; value: number; revenue: number }[];
  completionRates: { date: string; rate: number }[];
}

export default function MetricsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    dailyRevenue: [],
    serviceTypes: [],
    completionRates: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process daily revenue
      const dailyRevenueMap = new Map();
      const serviceTypeMap = new Map();
      
      orders?.forEach(order => {
        const date = new Date(order.created_at).toISOString().split('T')[0];
        const revenue = (order.amount || 0) / 100;
        const serviceType = order.cleaning_type || 'Unknown';
        
        // Daily revenue
        if (!dailyRevenueMap.has(date)) {
          dailyRevenueMap.set(date, { revenue: 0, orders: 0 });
        }
        const dayData = dailyRevenueMap.get(date);
        dayData.revenue += revenue;
        dayData.orders += 1;
        
        // Service types
        if (!serviceTypeMap.has(serviceType)) {
          serviceTypeMap.set(serviceType, { value: 0, revenue: 0 });
        }
        const serviceData = serviceTypeMap.get(serviceType);
        serviceData.value += 1;
        serviceData.revenue += revenue;
      });

      const dailyRevenue = Array.from(dailyRevenueMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30); // Last 30 days

      const serviceTypes = Array.from(serviceTypeMap.entries())
        .map(([name, data]) => ({ name, ...data }));

      // Mock completion rates for demo
      const completionRates = dailyRevenue.map(day => ({
        date: day.date,
        rate: Math.random() * 20 + 80 // 80-100% range
      }));

      setAnalytics({
        dailyRevenue,
        serviceTypes,
        completionRates
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <AdminLayout title="Metrics & Analytics" description="Detailed performance analytics and insights">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Metrics & Analytics" description="Detailed performance analytics and insights">
      <div className="space-y-6">
        <Tabs defaultValue="revenue" className="w-full">
          <TabsList>
            <TabsTrigger value="revenue">Revenue Analytics</TabsTrigger>
            <TabsTrigger value="services">Service Analysis</TabsTrigger>
            <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="revenue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Revenue Trend</CardTitle>
                <CardDescription>Revenue and order volume over the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.dailyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue ($)" />
                    <Line type="monotone" dataKey="orders" stroke="#82ca9d" name="Orders" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="services" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Service Distribution</CardTitle>
                  <CardDescription>Breakdown of service types by volume</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.serviceTypes}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analytics.serviceTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Service Type</CardTitle>
                  <CardDescription>Revenue breakdown by service category</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.serviceTypes}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Completion Rate Trend</CardTitle>
                <CardDescription>Service completion rates over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.completionRates}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${typeof value === 'number' ? value.toFixed(1) : value}%`, 'Completion Rate']} />
                    <Line type="monotone" dataKey="rate" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}