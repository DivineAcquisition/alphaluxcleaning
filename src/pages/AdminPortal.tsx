import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminGrid } from "@/components/admin/AdminGrid";
import { AdminSection } from "@/components/admin/AdminSection";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { 
  Users,
  Settings,
  ArrowRight,
  Activity,
  RefreshCw,
  UserCheck,
  Database
} from "lucide-react";

const AdminPortal = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Essential metrics for the overview
  const [metrics, setMetrics] = useState({
    totalCustomers: 0,
    totalSubcontractors: 0,
    pendingApplications: 0,
    systemHealth: 'Operational'
  });

  useEffect(() => {
    if (user) {
      fetchEssentialData();
    }
  }, [user]);

  const fetchEssentialData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      // Get essential counts only
      const [ordersResponse, applicationsResponse] = await Promise.all([
        supabase.from('orders').select('customer_email', { count: 'exact' }),
        supabase.from('subcontractor_applications').select('status', { count: 'exact' })
      ]);

      if (ordersResponse.data && applicationsResponse.data) {
        const uniqueCustomers = new Set(ordersResponse.data.map(order => order.customer_email)).size;
        const pendingApps = applicationsResponse.data.filter(app => app.status === 'pending').length;
        const approvedApps = applicationsResponse.data.filter(app => app.status === 'approved').length;

        setMetrics({
          totalCustomers: uniqueCustomers,
          totalSubcontractors: approvedApps,
          pendingApplications: pendingApps,
          systemHealth: 'Operational'
        });
      }
    } catch (error) {
      console.error('Error fetching essential data:', error);
      toast.error('Failed to load admin overview');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchEssentialData(false);
    setIsRefreshing(false);
    toast.success('Data refreshed');
  };

  if (isLoading) {
    return (
      <AdminLayout 
        title="Admin Hub" 
        description="Centralized management dashboard"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading admin hub...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Admin Hub" 
      description="Centralized management dashboard for Bay Area Cleaning Pros"
    >
      <div className="space-y-8">
        {/* Quick Overview */}
        <AdminSection 
          title="System Overview"
          description="Essential business metrics at a glance"
          headerActions={
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          }
        >
          <AdminGrid columns={4} gap="md">
            <AdminCard
              variant="metric"
              title="Total Customers"
              icon={<Users className="h-4 w-4" />}
            >
              <div className="text-3xl font-bold tracking-tight">{metrics.totalCustomers}</div>
              <p className="text-xs text-muted-foreground mt-1">Active customer base</p>
            </AdminCard>

            <AdminCard
              variant="metric"
              title="Team Members"
              icon={<UserCheck className="h-4 w-4" />}
            >
              <div className="text-3xl font-bold tracking-tight">{metrics.totalSubcontractors}</div>
              <p className="text-xs text-muted-foreground mt-1">Active subcontractors</p>
            </AdminCard>

            <AdminCard
              variant="metric"
              title="Pending Applications"
              icon={<Users className="h-4 w-4" />}
            >
              <div className="text-3xl font-bold tracking-tight text-warning">{metrics.pendingApplications}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
            </AdminCard>

            <AdminCard
              variant="metric"
              title="System Status"
              icon={<Activity className="h-4 w-4" />}
            >
              <div className="text-xl font-bold tracking-tight text-success">{metrics.systemHealth}</div>
              <p className="text-xs text-muted-foreground mt-1">All systems operational</p>
            </AdminCard>
          </AdminGrid>
        </AdminSection>

        {/* Management Hubs */}
        <AdminSection 
          title="Management Hubs"
          description="Access centralized management areas for different aspects of your business"
        >
          <AdminGrid columns={3} gap="lg">
            <AdminCard
              title="Customer Management"
              description="Manage customers, orders, payments, billing, feedback, and support tickets. Complete customer lifecycle management."
              variant="action"
              className="border-primary/20 hover:border-primary/40 transition-colors"
            >
              <div className="space-y-4 mt-4">
                <div className="text-sm text-muted-foreground">
                  • Customer profiles & history<br />
                  • Order tracking & management<br />
                  • Payment processing & billing<br />
                  • Feedback & support center
                </div>
                <Button 
                  onClick={() => navigate('/admin/customers')}
                  className="w-full justify-between group"
                  size="lg"
                >
                  <span>Manage Customers</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </AdminCard>

            <AdminCard
              title="Subcontractor Management"
              description="Complete team management including applications, assignments, performance tracking, and tier progression."
              variant="action"
              className="border-accent/20 hover:border-accent/40 transition-colors"
            >
              <div className="space-y-4 mt-4">
                <div className="text-sm text-muted-foreground">
                  • Team directory & profiles<br />
                  • Application processing<br />
                  • Job assignments & tracking<br />
                  • Performance & tier management
                </div>
                <Button 
                  onClick={() => navigate('/admin/subcontractors')}
                  className="w-full justify-between group"
                  size="lg"
                  variant="secondary"
                >
                  <span>Manage Team</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </AdminCard>

            <AdminCard
              title="Systems Management"
              description="Technical administration including database tools, API keys, integrations, email settings, and system monitoring."
              variant="action"
              className="border-warning/20 hover:border-warning/40 transition-colors"
            >
              <div className="space-y-4 mt-4">
                <div className="text-sm text-muted-foreground">
                  • Database administration<br />
                  • API keys & integrations<br />
                  • Email & automation settings<br />
                  • Security & monitoring
                </div>
                <Button 
                  onClick={() => navigate('/admin/systems')}
                  className="w-full justify-between group"
                  size="lg"
                  variant="outline"
                >
                  <span>System Settings</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </AdminCard>
          </AdminGrid>
        </AdminSection>
      </div>
    </AdminLayout>
  );
};

export default AdminPortal;