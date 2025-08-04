import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminGrid } from "@/components/admin/AdminGrid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard
} from "lucide-react";

interface Customer {
  id: string;
  customer_name: string;
  customer_email: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string;
  churn_risk: 'low' | 'medium' | 'high';
  status: 'active' | 'inactive' | 'churned';
}

export default function ClientOverview() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    churnRisk: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    retentionRate: 0
  });

  useEffect(() => {
    if (user) {
      fetchCustomers();
      calculateStats();
    }
  }, [user]);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          customer_name,
          customer_email,
          amount,
          created_at,
          status
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process customer data
      const customerMap = new Map();
      
      data?.forEach(order => {
        const email = order.customer_email;
        if (!customerMap.has(email)) {
          customerMap.set(email, {
            id: email,
            customer_name: order.customer_name,
            customer_email: email,
            total_orders: 0,
            total_spent: 0,
            last_order_date: order.created_at,
            orders: []
          });
        }
        
        const customer = customerMap.get(email);
        customer.total_orders++;
        customer.total_spent += (order.amount || 0) / 100;
        customer.orders.push(order);
        
        if (new Date(order.created_at) > new Date(customer.last_order_date)) {
          customer.last_order_date = order.created_at;
        }
      });

      // Calculate churn risk and status
      const processedCustomers = Array.from(customerMap.values()).map(customer => {
        const daysSinceLastOrder = Math.floor(
          (Date.now() - new Date(customer.last_order_date).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        let churn_risk: 'low' | 'medium' | 'high' = 'low';
        let status: 'active' | 'inactive' | 'churned' = 'active';
        
        if (daysSinceLastOrder > 90) {
          churn_risk = 'high';
          status = 'churned';
        } else if (daysSinceLastOrder > 60) {
          churn_risk = 'high';
          status = 'inactive';
        } else if (daysSinceLastOrder > 30) {
          churn_risk = 'medium';
          status = 'inactive';
        }

        return {
          ...customer,
          churn_risk,
          status
        };
      });

      setCustomers(processedCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('amount, created_at, customer_email')
        .not('amount', 'is', null);

      if (error) throw error;

      const totalCustomers = new Set(data?.map(order => order.customer_email)).size;
      const totalRevenue = data?.reduce((sum, order) => sum + (order.amount || 0), 0) / 100 || 0;
      const avgOrderValue = data?.length ? totalRevenue / data.length : 0;
      
      // Calculate active customers (orders in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentCustomers = new Set(
        data?.filter(order => new Date(order.created_at) > thirtyDaysAgo)
          .map(order => order.customer_email)
      );
      
      const activeCustomers = recentCustomers.size;
      const retentionRate = totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0;

      setStats({
        totalCustomers,
        activeCustomers,
        churnRisk: customers.filter(c => c.churn_risk === 'high').length,
        totalRevenue,
        avgOrderValue,
        retentionRate
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  const getChurnRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'churned': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <AdminLayout 
      title="Client Overview" 
      description="Monitor customer lifecycle, retention, and churn risk"
    >
      <div className="space-y-6">
        {/* Key Metrics */}
        <AdminGrid columns={4} gap="md">
          <AdminCard
            variant="metric"
            title="Total Customers"
            icon={<Users className="h-4 w-4" />}
          >
            <div className="text-3xl font-bold tracking-tight">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </AdminCard>

          <AdminCard
            variant="metric"
            title="Active Customers"
            icon={<CheckCircle className="h-4 w-4" />}
          >
            <div className="text-3xl font-bold tracking-tight text-success">{stats.activeCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
          </AdminCard>

          <AdminCard
            variant="metric"
            title="Churn Risk"
            icon={<TrendingDown className="h-4 w-4" />}
          >
            <div className="text-3xl font-bold tracking-tight text-destructive">{stats.churnRisk}</div>
            <p className="text-xs text-muted-foreground mt-1">High risk customers</p>
          </AdminCard>

          <AdminCard
            variant="metric"
            title="Retention Rate"
            icon={<Clock className="h-4 w-4" />}
          >
            <div className="text-3xl font-bold tracking-tight">{stats.retentionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">30-day retention</p>
          </AdminCard>
        </AdminGrid>

        {/* Revenue Metrics */}
        <AdminGrid columns={2} gap="lg">
          <AdminCard
            variant="stat"
            title="Total Revenue"
            description="Lifetime customer value"
            icon={<DollarSign className="h-5 w-5" />}
          >
            <div className="text-4xl font-bold tracking-tight mb-3">
              ${stats.totalRevenue.toLocaleString()}
            </div>
          </AdminCard>

          <AdminCard
            variant="stat"
            title="Average Order Value"
            description="Mean transaction amount"
            icon={<CreditCard className="h-5 w-5" />}
          >
            <div className="text-4xl font-bold tracking-tight mb-3">
              ${stats.avgOrderValue.toFixed(2)}
            </div>
          </AdminCard>
        </AdminGrid>

        {/* Customer Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Customer Details</CardTitle>
              <Button variant="outline" size="sm">
                Export List
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading customers...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Last Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Churn Risk</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.slice(0, 20).map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">
                        {customer.customer_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {customer.customer_email}
                      </TableCell>
                      <TableCell>{customer.total_orders}</TableCell>
                      <TableCell>${customer.total_spent.toFixed(2)}</TableCell>
                      <TableCell>
                        {new Date(customer.last_order_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(customer.status) as any}>
                          {customer.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getChurnRiskColor(customer.churn_risk) as any}>
                          {customer.churn_risk}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}