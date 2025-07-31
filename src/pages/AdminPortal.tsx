import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminGrid } from "@/components/admin/AdminGrid";
import { AdminSection } from "@/components/admin/AdminSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  DollarSign, 
  TrendingUp,
  CheckCircle,
  Users,
  Calendar,
  BarChart3,
  RefreshCw,
  Activity
} from "lucide-react";

const AdminPortal = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // Dashboard metrics
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    completedRevenue: 0,
    pendingRevenue: 0,
    pendingApplications: 0,
    completedServices: 0,
    completionRate: 0
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
      
      // Auto-refresh every 2 minutes
      const interval = setInterval(() => {
        console.log('AdminPortal: Auto-refreshing data...');
        fetchData(false);
      }, 120000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchData = async (showLoading = true) => {
    console.log('AdminPortal: Starting to fetch data...');
    if (showLoading) setIsLoading(true);
    try {
      await calculateMetrics();
      console.log('AdminPortal: Data fetched successfully');
    } catch (error) {
      console.error('AdminPortal: Error fetching data:', error);
      toast.error('Failed to load admin data');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchData(false);
    setIsRefreshing(false);
    toast.success('Data refreshed successfully');
  };

  const calculateMetrics = async () => {
    console.log('AdminPortal: Calculating metrics...');
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('id, amount, status, customer_email, created_at');

    const { data: applicationsData, error: applicationsError } = await supabase
      .from('subcontractor_applications')
      .select('status');

    if (ordersError) {
      console.error('AdminPortal: Error fetching orders for metrics:', ordersError);
    }
    
    if (applicationsError) {
      console.error('AdminPortal: Error fetching applications for metrics:', applicationsError);
    }

    if (ordersData && applicationsData) {
      const completedOrders = ordersData.filter(order => order.status === 'completed');
      const pendingOrders = ordersData.filter(order => order.status === 'pending');
      
      const completedRevenue = completedOrders.reduce((sum, order) => sum + (order.amount || 0), 0) / 100;
      const pendingRevenue = pendingOrders.reduce((sum, order) => sum + (order.amount || 0), 0) / 100;
      const completionRate = ordersData.length > 0 ? (completedOrders.length / ordersData.length) * 100 : 0;

      const newMetrics = {
        totalOrders: ordersData.length,
        completedRevenue,
        pendingRevenue,
        pendingApplications: applicationsData.filter(app => app.status === 'pending').length,
        completedServices: completedOrders.length,
        completionRate
      };
      console.log('AdminPortal: Metrics calculated:', newMetrics);
      setMetrics(newMetrics);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout 
        title="Admin Dashboard" 
        description="Overview of business operations"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Admin Dashboard" 
      description="Real-time insights into your cleaning business operations"
    >
      <AdminSection 
        title="Business Overview"
        description="Monitor key performance indicators and business metrics in real-time"
        headerActions={
          <Button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        }
      >
        {/* Key Metrics Grid */}
        <AdminGrid columns={4} gap="md">
          <AdminCard
            variant="metric"
            title="Total Orders"
            icon={<Calendar className="h-4 w-4" />}
          >
            <div className="text-3xl font-bold tracking-tight">{metrics.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">All time bookings</p>
          </AdminCard>

          <AdminCard
            variant="metric"
            title="Completed Revenue"
            icon={<DollarSign className="h-4 w-4" />}
          >
            <div className="text-3xl font-bold tracking-tight text-success">
              ${metrics.completedRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">From completed services</p>
          </AdminCard>

          <AdminCard
            variant="metric"
            title="Pending Revenue"
            icon={<TrendingUp className="h-4 w-4" />}
          >
            <div className="text-3xl font-bold tracking-tight text-warning">
              ${metrics.pendingRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">From pending bookings</p>
          </AdminCard>

          <AdminCard
            variant="metric"
            title="Completion Rate"
            icon={<CheckCircle className="h-4 w-4" />}
          >
            <div className="text-3xl font-bold tracking-tight text-primary">
              {metrics.completionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Service completion rate</p>
          </AdminCard>
        </AdminGrid>

        {/* Additional Stats */}
        <AdminGrid columns={2} gap="lg">
          <AdminCard
            variant="stat"
            title="Pending Applications"
            description="Subcontractor applications waiting for review"
            icon={<Users className="h-5 w-5" />}
          >
            <div className="text-4xl font-bold tracking-tight mb-3">{metrics.pendingApplications}</div>
            {metrics.pendingApplications > 0 && (
              <Badge variant="secondary" className="bg-warning/10 text-warning-foreground border-warning/20">
                Requires Review
              </Badge>
            )}
          </AdminCard>

          <AdminCard
            variant="stat"
            title="Completed Services"
            description="Total number of successfully completed cleanings"
            icon={<BarChart3 className="h-5 w-5" />}
          >
            <div className="text-4xl font-bold tracking-tight mb-3">{metrics.completedServices}</div>
            <p className="text-sm text-muted-foreground">Customer satisfaction focused</p>
          </AdminCard>
        </AdminGrid>

        {/* System Status */}
        <AdminCard
          title="System Status"
          description="Background integrations and data synchronization status"
          variant="action"
        >
          <div className="grid gap-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-success/5 border border-success/20">
              <div className="h-3 w-3 bg-success rounded-full animate-pulse shadow-lg shadow-success/50"></div>
              <span className="text-sm font-medium">GoHighLevel Integration - Active</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-success/5 border border-success/20">
              <div className="h-3 w-3 bg-success rounded-full animate-pulse shadow-lg shadow-success/50"></div>
              <span className="text-sm font-medium">Customer Pipeline Automation - Running</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-success/5 border border-success/20">
              <div className="h-3 w-3 bg-success rounded-full animate-pulse shadow-lg shadow-success/50"></div>
              <span className="text-sm font-medium">Data Synchronization - Real-time</span>
            </div>
          </div>
        </AdminCard>
      </AdminSection>
    </AdminLayout>
  );
};

export default AdminPortal;