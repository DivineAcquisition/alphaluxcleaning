import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      description="Overview of business operations and key metrics"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Business Overview</h2>
            <p className="text-muted-foreground">
              Real-time insights into your cleaning business operations
            </p>
          </div>
          <Button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                All time bookings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics.completedRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                From completed services
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics.pendingRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                From pending bookings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.completionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Service completion rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Pending Applications
              </CardTitle>
              <CardDescription>
                Subcontractor applications waiting for review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.pendingApplications}</div>
              {metrics.pendingApplications > 0 && (
                <Badge variant="secondary" className="mt-2">
                  Requires Review
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Completed Services
              </CardTitle>
              <CardDescription>
                Total number of successfully completed cleanings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.completedServices}</div>
              <p className="text-sm text-muted-foreground mt-2">
                Customer satisfaction focused
              </p>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Background integrations and data sync are operating automatically
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm">GoHighLevel Integration - Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm">Customer Pipeline Automation - Running</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm">Data Synchronization - Real-time</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminPortal;