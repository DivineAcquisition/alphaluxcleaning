import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Users, 
  Calendar, 
  DollarSign, 
  FileText, 
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  AlertTriangle,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Filter,
  Download,
  BarChart3,
  PieChart,
  Bell,
  Settings,
  Shield,
  Activity,
  Zap,
  Brain,
  Target
} from "lucide-react";

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_details: any;
  scheduled_date: string;
  created_at: string;
  amount: number;
  status: string;
  cleaning_type: string;
  frequency: string;
}

interface Application {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  why_join_us: string;
  previous_cleaning_experience: string;
  availability: string;
  preferred_work_areas: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  has_drivers_license: boolean;
  has_own_vehicle: boolean;
  can_lift_heavy_items: boolean;
  comfortable_with_chemicals: boolean;
  reliable_transportation: boolean;
  background_check_consent: boolean;
  brand_shirt_consent: boolean;
  subcontractor_agreement_consent: boolean;
  status: string;
  created_at: string;
  admin_notes?: string;
}

interface Metrics {
  totalOrders: number;
  totalRevenue: number;
  completionRate: number;
  pendingApplications: number;
  duplicateOrders: number;
}

interface AnalyticsData {
  dailyRevenue: Array<{ date: string; revenue: number }>;
  serviceTypeBreakdown: Array<{ type: string; count: number }>;
  customerSegments: Array<{ segment: string; count: number }>;
  completionRates: Array<{ date: string; rate: number }>;
}

interface BusinessInsight {
  type: string;
  title: string;
  message: string;
  confidence: number;
  impact: string;
  action: string;
}

const AdminPortal = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [orderFilter, setOrderFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [metrics, setMetrics] = useState<Metrics>({
    totalOrders: 0,
    totalRevenue: 0,
    completionRate: 0,
    pendingApplications: 0,
    duplicateOrders: 0
  });
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    dailyRevenue: [],
    serviceTypeBreakdown: [],
    customerSegments: [],
    completionRates: []
  });
  const [businessInsights, setBusinessInsights] = useState<BusinessInsight[]>([]);

  // Load data when component mounts or user changes
  useEffect(() => {
    if (user) {
      loadAllData();
      
      // Set up periodic refresh
      const interval = setInterval(loadAllData, 60000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchOrders(),
        fetchApplications()
      ]);
      calculateMetrics();
      calculateAnalytics();
      await generateRealInsights();
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    }
  };

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('subcontractor_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    }
  };

  const calculateMetrics = () => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.amount || 0), 0) / 100;
    const completedOrders = orders.filter(order => order.status === 'completed').length;
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
    const pendingApplications = applications.filter(app => app.status === 'pending').length;
    
    // Find duplicates
    const duplicates = orders.filter((order, index, arr) => 
      arr.findIndex(o => o.customer_email === order.customer_email && 
                         o.scheduled_date === order.scheduled_date) !== index
    );

    setMetrics({
      totalOrders,
      totalRevenue,
      completionRate,
      pendingApplications,
      duplicateOrders: duplicates.length
    });
  };

  const calculateAnalytics = () => {
    // Daily revenue calculation
    const dailyData: Record<string, number> = {};
    orders.forEach(order => {
      if (order.created_at && order.amount) {
        const date = new Date(order.created_at).toISOString().split('T')[0];
        dailyData[date] = (dailyData[date] || 0) + (order.amount / 100);
      }
    });
    const dailyRevenue = Object.entries(dailyData).map(([date, revenue]) => ({ date, revenue }));

    // Service type breakdown
    const breakdown: Record<string, number> = {};
    orders.forEach(order => {
      const type = order.cleaning_type || 'standard';
      breakdown[type] = (breakdown[type] || 0) + 1;
    });
    const serviceTypeBreakdown = Object.entries(breakdown).map(([type, count]) => ({ type, count }));

    // Customer segments (simplified)
    const segments: Record<string, number> = {
      'One-time': 0,
      'Weekly': 0,
      'Bi-weekly': 0,
      'Monthly': 0
    };
    orders.forEach(order => {
      const freq = order.frequency || 'One-time';
      if (segments[freq] !== undefined) {
        segments[freq]++;
      } else {
        segments['One-time']++;
      }
    });
    const customerSegments = Object.entries(segments).map(([segment, count]) => ({ segment, count }));

    // Completion rates over time
    const daily: Record<string, { completed: number; total: number }> = {};
    orders.forEach(order => {
      if (order.created_at) {
        const date = new Date(order.created_at).toISOString().split('T')[0];
        if (!daily[date]) daily[date] = { completed: 0, total: 0 };
        daily[date].total++;
        if (order.status === 'completed') daily[date].completed++;
      }
    });
    const completionRates = Object.entries(daily).map(([date, data]) => ({
      date,
      rate: data.total > 0 ? (data.completed / data.total) * 100 : 0
    }));

    setAnalyticsData({
      dailyRevenue,
      serviceTypeBreakdown,
      customerSegments,
      completionRates
    });
  };

  const generateRealInsights = async () => {
    try {
      const insights: BusinessInsight[] = [];
      
      // Revenue Growth Analysis
      if (orders.length > 0) {
        const last30Days = orders.filter(order => {
          const orderDate = new Date(order.created_at);
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          return orderDate >= thirtyDaysAgo;
        });

        const last60Days = orders.filter(order => {
          const orderDate = new Date(order.created_at);
          const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          return orderDate >= sixtyDaysAgo && orderDate < thirtyDaysAgo;
        });

        const revenue30 = last30Days.reduce((sum, order) => sum + (order.amount || 0), 0);
        const revenue60 = last60Days.reduce((sum, order) => sum + (order.amount || 0), 0);

        if (revenue60 > 0) {
          const growthRate = ((revenue30 - revenue60) / revenue60) * 100;
          if (growthRate > 20) {
            insights.push({
              type: 'opportunity',
              title: 'Strong Revenue Growth',
              message: `Revenue increased by ${Math.round(growthRate)}% in the last 30 days. Consider scaling operations.`,
              confidence: 0.9,
              impact: 'high',
              action: 'Expand marketing and hiring efforts'
            });
          } else if (growthRate < -10) {
            insights.push({
              type: 'risk',
              title: 'Revenue Decline Alert',
              message: `Revenue decreased by ${Math.round(Math.abs(growthRate))}% in the last 30 days.`,
              confidence: 0.85,
              impact: 'high',
              action: 'Review pricing and customer satisfaction'
            });
          }
        }
      }

      // Customer Retention Analysis
      const uniqueCustomers = new Set(orders.map(order => order.customer_email)).size;
      const repeatCustomers = orders.reduce((acc, order) => {
        const customerOrders = orders.filter(o => o.customer_email === order.customer_email);
        if (customerOrders.length > 1) acc.add(order.customer_email);
        return acc;
      }, new Set()).size;

      if (uniqueCustomers > 0) {
        const retentionRate = (repeatCustomers / uniqueCustomers) * 100;
        if (retentionRate < 30) {
          insights.push({
            type: 'risk',
            title: 'Low Customer Retention',
            message: `Only ${Math.round(retentionRate)}% of customers return. Implement loyalty programs.`,
            confidence: 0.88,
            impact: 'high',
            action: 'Launch customer retention campaign'
          });
        } else if (retentionRate > 60) {
          insights.push({
            type: 'opportunity',
            title: 'Excellent Customer Loyalty',
            message: `${Math.round(retentionRate)}% customer retention rate. Leverage for referrals.`,
            confidence: 0.92,
            impact: 'medium',
            action: 'Launch referral incentive program'
          });
        }
      }

      // Application Pipeline Analysis
      if (applications.length > 0) {
        const approvalRate = (applications.filter(app => app.status === 'approved').length / applications.length) * 100;
        if (approvalRate < 50) {
          insights.push({
            type: 'efficiency',
            title: 'Low Application Approval Rate',
            message: `Only ${Math.round(approvalRate)}% of applications are approved. Review requirements.`,
            confidence: 0.85,
            impact: 'medium',
            action: 'Optimize recruitment criteria'
          });
        }
      }

      setBusinessInsights(insights);
    } catch (error) {
      console.error('Error generating insights:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;
      toast.success('Order status updated');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('subcontractor_applications')
        .update({ 
          status, 
          admin_notes: notes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id 
        })
        .eq('id', applicationId);

      if (error) throw error;
      toast.success('Application status updated');
      fetchApplications();
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error('Failed to update application');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <Target className="h-5 w-5 text-green-600" />;
      case 'risk': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'efficiency': return <Zap className="h-5 w-5 text-blue-600" />;
      default: return <Brain className="h-5 w-5 text-purple-600" />;
    }
  };

  // Filter orders based on current filters
  useEffect(() => {
    let filtered = orders;

    if (orderFilter !== 'all') {
      filtered = filtered.filter(order => order.status === orderFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_phone?.includes(searchTerm)
      );
    }

    setFilteredOrders(filtered);
  }, [orders, orderFilter, searchTerm]);

  if (isLoading) {
    return (
      <AdminLayout title="Admin Portal" description="Comprehensive business management and analytics">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p>Loading admin portal...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Admin Portal" description="Comprehensive business management and analytics">
      <div className="space-y-8">
        {/* Quick Actions */}
        <div className="flex gap-4">
          <Button onClick={loadAllData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalOrders}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${metrics.totalRevenue.toFixed(2)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.completionRate.toFixed(1)}%</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.pendingApplications}</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{order.customer_name || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {applications.slice(0, 5).map((app) => (
                      <div key={app.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{app.full_name}</p>
                          <p className="text-sm text-muted-foreground">{app.email}</p>
                        </div>
                        <Badge className={getStatusColor(app.status)}>
                          {app.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Management</CardTitle>
                <CardDescription>Manage all customer orders</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex gap-4 mb-6">
                  <Input
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                  <Select value={orderFilter} onValueChange={setOrderFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Orders Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No orders found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{order.customer_name || 'N/A'}</p>
                                <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                              </div>
                            </TableCell>
                            <TableCell>${((order.amount || 0) / 100).toFixed(2)}</TableCell>
                            <TableCell>{order.cleaning_type || 'Standard'}</TableCell>
                            <TableCell>{order.scheduled_date || 'Not scheduled'}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(order.status)}>
                                {order.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Select onValueChange={(value) => updateOrderStatus(order.id, value)}>
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="Update" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subcontractor Applications</CardTitle>
                <CardDescription>Review and manage applications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Applicant</TableHead>
                        <TableHead>Experience</TableHead>
                        <TableHead>Availability</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No applications found
                          </TableCell>
                        </TableRow>
                      ) : (
                        applications.map((app) => (
                          <TableRow key={app.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{app.full_name}</p>
                                <p className="text-sm text-muted-foreground">{app.email}</p>
                                <p className="text-sm text-muted-foreground">{app.phone}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">{app.previous_cleaning_experience || 'No experience listed'}</p>
                            </TableCell>
                            <TableCell>{app.availability}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(app.status)}>
                                {app.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => updateApplicationStatus(app.id, 'approved')}
                                  disabled={app.status === 'approved'}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateApplicationStatus(app.id, 'rejected')}
                                  disabled={app.status === 'rejected'}
                                >
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Service Type Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analyticsData.serviceTypeBreakdown.map((item) => (
                      <div key={item.type} className="flex justify-between">
                        <span className="capitalize">{item.type}</span>
                        <span className="font-bold">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Customer Segments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analyticsData.customerSegments.map((item) => (
                      <div key={item.segment} className="flex justify-between">
                        <span>{item.segment}</span>
                        <span className="font-bold">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI-Powered Business Insights
                </CardTitle>
                <CardDescription>
                  Real-time analysis of your business data with actionable recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {businessInsights.length > 0 ? (
                    businessInsights.map((insight, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {getInsightIcon(insight.type)}
                            <div className="space-y-1">
                              <h4 className="font-medium">{insight.title}</h4>
                              <p className="text-sm text-muted-foreground">{insight.message}</p>
                              <p className="text-xs font-medium text-primary">{insight.action}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={insight.impact === 'high' ? 'destructive' : 'secondary'}>
                              {insight.impact} impact
                            </Badge>
                            <Badge variant="outline">
                              {Math.round(insight.confidence * 100)}% confidence
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Analyzing data to generate insights...</p>
                      <p className="text-sm">Check back as your data grows for more detailed insights.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminPortal;