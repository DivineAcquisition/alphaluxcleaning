
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, DollarSign, Users, TrendingUp, BarChart3, PieChart } from "lucide-react";
import { MetricsOverview } from "@/components/dashboard/MetricsOverview";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { BookingsChart } from "@/components/dashboard/BookingsChart";
import { RetentionMetrics } from "@/components/dashboard/RetentionMetrics";
import { LTVMetrics } from "@/components/dashboard/LTVMetrics";
import { RecentBookings } from "@/components/dashboard/RecentBookings";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function MetricsDashboard() {
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['dashboard-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['dashboard-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: subcontractorsData, isLoading: subcontractorsLoading } = useQuery({
    queryKey: ['dashboard-subcontractors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subcontractors')
        .select('*');
      
      if (error) throw error;
      return data;
    },
  });

  if (bookingsLoading || ordersLoading || subcontractorsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AdminLayout 
      title="Metrics & Analytics Dashboard"
      description="Track performance, revenue, and business insights"
    >
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="retention">Retention</TabsTrigger>
          <TabsTrigger value="ltv">LTV Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <MetricsOverview 
            bookings={bookingsData || []}
            orders={ordersData || []}
            subcontractors={subcontractorsData || []}
          />
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-4">
              <RevenueChart orders={ordersData || []} />
            </div>
            <div className="col-span-3">
              <RecentBookings bookings={bookingsData || []} />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="revenue" className="space-y-4">
          <RevenueChart orders={ordersData || []} detailed={true} />
        </TabsContent>
        
        <TabsContent value="bookings" className="space-y-4">
          <BookingsChart bookings={bookingsData || []} />
        </TabsContent>
        
        <TabsContent value="retention" className="space-y-4">
          <RetentionMetrics orders={ordersData || []} />
        </TabsContent>
        
        <TabsContent value="ltv" className="space-y-4">
          <LTVMetrics orders={ordersData || []} />
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
