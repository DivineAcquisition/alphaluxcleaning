import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminGrid } from "@/components/admin/AdminGrid";
import { AdminSection } from "@/components/admin/AdminSection";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { 
  Users,
  CreditCard,
  MessageSquare,
  TrendingUp,
  ArrowLeft,
  Calendar,
  DollarSign,
  Star,
  Phone
} from "lucide-react";

const CustomerManagementHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    completedRevenue: 0,
    pendingRevenue: 0,
    averageRating: 4.8,
    supportTickets: 0
  });

  useEffect(() => {
    if (user) {
      fetchCustomerData();
    }
  }, [user]);

  const fetchCustomerData = async () => {
    try {
        const ordersResponse = await supabase.from('orders').select('*');

      if (ordersResponse.data) {
        const uniqueCustomers = new Set(ordersResponse.data.map(order => order.customer_email)).size;
        const completedOrders = ordersResponse.data.filter(order => order.status === 'completed');
        const pendingOrders = ordersResponse.data.filter(order => order.status === 'pending');
        
        const completedRevenue = completedOrders.reduce((sum, order) => sum + (order.amount || 0), 0) / 100;
        const pendingRevenue = pendingOrders.reduce((sum, order) => sum + (order.amount || 0), 0) / 100;

        // Default rating - would need to be calculated from actual feedback data
        const averageRating = 4.8;

        setMetrics({
          totalCustomers: uniqueCustomers,
          totalOrders: ordersResponse.data.length,
          completedRevenue,
          pendingRevenue,
          averageRating,
          supportTickets: 0 // This would come from a support tickets table
        });
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
      toast.error('Failed to load customer data');
    } finally {
      setIsLoading(false);
    }
  };

  const customerTools = [
    {
      title: "Customer Database",
      description: "View and manage customer profiles, contact information, and service history",
      icon: <Users className="h-5 w-5" />,
      path: "/customer-dashboard-admin",
      action: "Manage Customers"
    },
    {
      title: "Order Management",
      description: "Track and manage all customer orders, bookings, and service requests",
      icon: <Calendar className="h-5 w-5" />,
      path: "/admin-booking-preview",
      action: "View Orders"
    },
    {
      title: "Payment Center",
      description: "Process payments, manage billing, refunds, and financial transactions",
      icon: <CreditCard className="h-5 w-5" />,
      path: "/payment-portal-admin",
      action: "Payment Portal"
    },
    {
      title: "Tips Management",
      description: "Monitor customer tips and appreciation distribution to team members",
      icon: <DollarSign className="h-5 w-5" />,
      path: "/tips-management",
      action: "Manage Tips"
    },
    {
      title: "Feedback Center",
      description: "Review customer feedback, ratings, and manage response workflows",
      icon: <Star className="h-5 w-5" />,
      path: "/feedback-center",
      action: "View Feedback"
    },
    {
      title: "Support Center",
      description: "Handle customer support tickets, inquiries, and communication",
      icon: <Phone className="h-5 w-5" />,
      path: "/communication-hub",
      action: "Support Hub"
    }
  ];

  if (isLoading) {
    return (
      <AdminLayout title="Customer Management" description="Loading customer data...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Users className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading customer management...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Customer Management Hub" 
      description="Complete customer lifecycle management and support"
    >
      <div className="space-y-6">
        {/* Header Navigation */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Hub
          </Button>
        </div>

        {/* Customer Metrics */}
        <AdminSection 
          title="Customer Overview"
          description="Key customer metrics and business insights"
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
              title="Total Orders"
              icon={<Calendar className="h-4 w-4" />}
            >
              <div className="text-3xl font-bold tracking-tight">{metrics.totalOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">All time bookings</p>
            </AdminCard>

            <AdminCard
              variant="metric"
              title="Revenue"
              icon={<DollarSign className="h-4 w-4" />}
            >
              <div className="text-3xl font-bold tracking-tight text-success">
                ${metrics.completedRevenue.toFixed(0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Completed services</p>
            </AdminCard>

            <AdminCard
              variant="metric"
              title="Avg Rating"
              icon={<Star className="h-4 w-4" />}
            >
              <div className="text-3xl font-bold tracking-tight text-warning">
                {metrics.averageRating.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Customer satisfaction</p>
            </AdminCard>
          </AdminGrid>
        </AdminSection>

        {/* Customer Management Tools */}
        <AdminSection 
          title="Customer Management Tools"
          description="Access all customer-related management functions"
        >
          <AdminGrid columns={3} gap="lg">
            {customerTools.map((tool) => (
              <AdminCard
                key={tool.title}
                title={tool.title}
                description={tool.description}
                variant="action"
                icon={tool.icon}
              >
                <div className="mt-4">
                  <Button 
                    onClick={() => navigate(tool.path)}
                    className="w-full justify-between group"
                    variant="outline"
                  >
                    <span>{tool.action}</span>
                    <MessageSquare className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </AdminCard>
            ))}
          </AdminGrid>
        </AdminSection>
      </div>
    </AdminLayout>
  );
};

export default CustomerManagementHub;