import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminGrid } from "@/components/admin/AdminGrid";
import { AdminSection } from "@/components/admin/AdminSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { 
  DollarSign, 
  TrendingUp,
  CheckCircle,
  Users,
  Calendar,
  BarChart3,
  RefreshCw,
  Activity,
  Briefcase,
  Settings,
  ArrowRight,
  Target,
  Award
} from "lucide-react";
import { JobManagementDashboard } from "@/components/admin/JobManagementDashboard";
import { SubcontractorJobTracker } from "@/components/admin/SubcontractorJobTracker";

const AdminPortal = () => {
  const navigate = useNavigate();
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
      
      // Auto-refresh every 5 minutes to avoid excessive API calls
      const interval = setInterval(() => {
        fetchData(false);
      }, 300000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      await calculateMetrics();
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

  const coreAdminSections = [
    {
      title: "Subcontractor Management",
      description: "Manage your team of subcontractors, performance, and assignments",
      action: "Manage Team",
      path: "/subcontractor-management"
    },
    {
      title: "Tips Management",
      description: "Monitor customer tips and appreciation distribution",
      action: "View Tips",
      path: "/tips-management"
    },
    {
      title: "Feedback Center",
      description: "Manage customer reviews and feedback responses",
      action: "View Feedback",
      path: "/feedback-center"
    },
    {
      title: "Communication Hub",
      description: "Manage customer-subcontractor communications",
      action: "Message Center",
      path: "/communication-hub"
    },
    {
      title: "Application Manager",
      description: "Review and process new subcontractor applications",
      action: "View Applications",
      path: "/application-manager"
    },
    {
      title: "Payment Portal",
      description: "Manage payments, billing, and financial transactions",
      action: "Payment Center",
      path: "/payment-portal"
    },
    {
      title: "Onboard Cleaners",
      description: "Add existing cleaners from spreadsheet to subcontractor network",
      action: "Add Cleaners",
      path: "/add-spreadsheet-cleaners"
    },
    {
      title: "Database Tools",
      description: "Manage database operations, backups, and performance monitoring",
      action: "Database Admin",
      path: "/database-tools"
    },
    {
      title: "Email Settings",
      description: "Configure email delivery, templates, and notification preferences",
      action: "Email Config",
      path: "/email-settings"
    },
    {
      title: "API Keys",
      description: "Manage API keys, authentication tokens, and integrations",
      action: "API Management",
      path: "/api-keys"
    }
  ];

  return (
    <AdminLayout 
      title="Admin Dashboard" 
      description="Comprehensive management hub for Bay Area Cleaning Pros"
    >
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Business Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Job Management
          </TabsTrigger>
          <TabsTrigger value="subcontractors" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Subcontractors
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Admin Tools
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AdminSection 
            title="Business Metrics"
            description="Real-time insights into your cleaning business operations"
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
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Analytics Dashboard</h3>
              <p className="text-sm text-muted-foreground">
                Comprehensive business intelligence and performance insights
              </p>
            </div>
            <Button asChild>
              <Link to="/business-analytics">
                View Full Analytics
              </Link>
            </Button>
          </div>
          
          {/* Quick Analytics Preview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <AdminCard
              variant="metric"
              title="Revenue Growth"
              icon={<TrendingUp className="h-4 w-4" />}
            >
              <div className="text-2xl font-bold text-success">+24.5%</div>
              <p className="text-xs text-muted-foreground">vs last month</p>
            </AdminCard>
            
            <AdminCard
              variant="metric"
              title="Customer LTV"
              icon={<Target className="h-4 w-4" />}
            >
              <div className="text-2xl font-bold text-primary">$2,847</div>
              <p className="text-xs text-muted-foreground">Average lifetime value</p>
            </AdminCard>
            
            <AdminCard
              variant="metric"
              title="Retention Rate"
              icon={<Users className="h-4 w-4" />}
            >
              <div className="text-2xl font-bold text-accent">91.8%</div>
              <p className="text-xs text-muted-foreground">Customer retention</p>
            </AdminCard>
            
            <AdminCard
              variant="metric"
              title="Performance Score"
              icon={<Award className="h-4 w-4" />}
            >
              <div className="text-2xl font-bold text-warning">4.8/5</div>
              <p className="text-xs text-muted-foreground">Overall rating</p>
            </AdminCard>
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <JobManagementDashboard />
        </TabsContent>

        <TabsContent value="subcontractors" className="space-y-4">
          <AdminSection 
            title="Subcontractor Performance Tracker"
            description="Monitor and manage subcontractor performance, availability, and job completion rates"
          >
            <SubcontractorJobTracker />
          </AdminSection>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <AdminSection 
            title="Core Admin Tools"
            description="Essential administrative functions and customer-subcontractor synchronization"
          >
            <AdminGrid columns={3} gap="lg">
              {coreAdminSections.map((section) => (
                <AdminCard
                  key={section.title}
                  title={section.title}
                  description={section.description}
                  variant="action"
                >
                  <div className="mt-4">
                    <Button 
                      onClick={() => navigate(section.path)}
                      className="w-full justify-between group"
                      variant="outline"
                    >
                      <span>{section.action}</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </AdminCard>
              ))}
            </AdminGrid>
          </AdminSection>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminPortal;