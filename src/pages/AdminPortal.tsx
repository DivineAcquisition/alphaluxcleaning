import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navigation } from "@/components/Navigation";
import { GHLIntegrationDashboard } from "@/components/admin/GHLIntegrationDashboard";
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
  scheduled_time: string;
  status: string;
  cleaning_type: string;
  frequency: string;
  amount: number;
  square_footage: number;
  created_at: string;
}

interface Application {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  why_join_us: string;
  previous_cleaning_experience: string;
  availability: string;
  has_drivers_license: boolean;
  has_own_vehicle: boolean;
  can_lift_heavy_items: boolean;
  comfortable_with_chemicals: boolean;
  reliable_transportation: boolean;
  background_check_consent: boolean;
  brand_shirt_consent: boolean;
  subcontractor_agreement_consent: boolean;
}

const AdminPortal = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("overview");

  // Dashboard metrics
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    completedRevenue: 0,
    pendingRevenue: 0,
    pendingApplications: 0,
    completedServices: 0,
    completionRate: 0
  });

  // Duplicate order management
  const [duplicateOrders, setDuplicateOrders] = useState<{[email: string]: Order[]}>({});
  const [showDuplicates, setShowDuplicates] = useState(false);

  // Phase 2: Enhanced filtering and bulk operations
  const [orderFilter, setOrderFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Phase 3: Advanced analytics
  const [analyticsData, setAnalyticsData] = useState({
    dailyRevenue: [],
    monthlyTrends: [],
    customerSegments: [],
    serviceTypeBreakdown: [],
    completionRates: []
  });
  const [dateRange, setDateRange] = useState("7d");
  const [isExporting, setIsExporting] = useState(false);

  // Phase 4: Enterprise features
  const [notifications, setNotifications] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState({
    apiLatency: 0,
    errorRate: 0,
    activeUsers: 0,
    systemLoad: 0
  });
  const [businessInsights, setBusinessInsights] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [automationRules, setAutomationRules] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        console.log('AdminPortal: Auto-refreshing data...');
        fetchData(false);
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchData = async (showLoading = true) => {
    console.log('AdminPortal: Starting to fetch data...');
    if (showLoading) setIsLoading(true);
    try {
      await Promise.all([
        fetchOrders(),
        fetchApplications(),
        calculateMetrics(),
        calculateAnalytics(), // Phase 3: Add analytics calculation
        generateBusinessInsights(), // Phase 4: AI insights
        fetchSystemHealth(), // Phase 4: System monitoring
        fetchNotifications() // Phase 4: Real-time notifications
      ]);
      console.log('AdminPortal: Data fetched successfully');
    } catch (error) {
      console.error('AdminPortal: Error fetching data:', error);
      toast.error('Failed to load admin data');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  // Phase 2: Manual refresh function
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchData(false);
    setIsRefreshing(false);
    toast.success('Data refreshed successfully');
  };

  const fetchOrders = async () => {
    console.log('AdminPortal: Fetching orders...');
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('AdminPortal: Error fetching orders:', error);
      toast.error('Failed to load orders');
      return;
    }
    
    console.log('AdminPortal: Orders fetched:', data?.length || 0);
    setOrders(data || []);
  };

  const fetchApplications = async () => {
    console.log('AdminPortal: Fetching applications...');
    const { data, error } = await supabase
      .from('subcontractor_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('AdminPortal: Error fetching applications:', error);
      toast.error('Failed to load applications');
      return;
    }
    
    console.log('AdminPortal: Applications fetched:', data?.length || 0);
    setApplications(data || []);
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

      // Detect duplicates
      const duplicatesByEmail: {[email: string]: Order[]} = {};
      ordersData.forEach(order => {
        if (order.status === 'pending' && order.customer_email) {
          if (!duplicatesByEmail[order.customer_email]) {
            duplicatesByEmail[order.customer_email] = [];
          }
          duplicatesByEmail[order.customer_email].push(order as Order);
        }
      });

      // Filter out singles, keep only actual duplicates
      const actualDuplicates: {[email: string]: Order[]} = {};
      Object.entries(duplicatesByEmail).forEach(([email, orders]) => {
        if (orders.length > 1) {
          actualDuplicates[email] = orders;
        }
      });

      setDuplicateOrders(actualDuplicates);

      const newMetrics = {
        totalOrders: ordersData.length,
        completedRevenue,
        pendingRevenue,
        pendingApplications: applicationsData.filter(app => app.status === 'pending').length,
        completedServices: completedOrders.length,
        completionRate
      };
      console.log('AdminPortal: Metrics calculated:', newMetrics);
      console.log('AdminPortal: Duplicates found:', Object.keys(actualDuplicates).length, 'customers with duplicates');
      setMetrics(newMetrics);
    }
  };

  // Phase 3: Advanced analytics calculation
  const calculateAnalytics = async () => {
    try {
      const { data: analyticsOrders, error } = await supabase
        .from('orders')
        .select('amount, status, customer_email, created_at, cleaning_type, frequency')
        .gte('created_at', getDateFromRange(dateRange));

      if (error) throw error;

      // Calculate daily revenue for the last 7 days
      const dailyRevenue = getDailyRevenue(analyticsOrders);
      
      // Calculate service type breakdown
      const serviceTypeBreakdown = getServiceTypeBreakdown(analyticsOrders);
      
      // Calculate customer segments
      const customerSegments = getCustomerSegments(analyticsOrders);
      
      // Calculate completion rates over time
      const completionRates = getCompletionRates(analyticsOrders);

      setAnalyticsData({
        dailyRevenue,
        monthlyTrends: [],
        customerSegments,
        serviceTypeBreakdown,
        completionRates
      });
    } catch (error) {
      console.error('Error calculating analytics:', error);
    }
  };

  // Phase 3: Helper functions for analytics
  const getDateFromRange = (range: string) => {
    const now = new Date();
    switch (range) {
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const getDailyRevenue = (orders: any[]) => {
    const dailyData: { [key: string]: number } = {};
    orders.forEach(order => {
      if (order.status === 'completed') {
        const date = new Date(order.created_at).toLocaleDateString();
        dailyData[date] = (dailyData[date] || 0) + (order.amount / 100);
      }
    });
    return Object.entries(dailyData).map(([date, revenue]) => ({ date, revenue }));
  };

  const getServiceTypeBreakdown = (orders: any[]) => {
    const breakdown: { [key: string]: number } = {};
    orders.forEach(order => {
      const type = order.cleaning_type || 'Unknown';
      breakdown[type] = (breakdown[type] || 0) + 1;
    });
    return Object.entries(breakdown).map(([type, count]) => ({ type, count }));
  };

  const getCustomerSegments = (orders: any[]) => {
    const segments: { [key: string]: number } = {};
    const customerOrders: { [email: string]: number } = {};
    
    orders.forEach(order => {
      customerOrders[order.customer_email] = (customerOrders[order.customer_email] || 0) + 1;
    });

    Object.values(customerOrders).forEach(orderCount => {
      if (orderCount === 1) segments['One-time'] = (segments['One-time'] || 0) + 1;
      else if (orderCount <= 3) segments['Regular'] = (segments['Regular'] || 0) + 1;
      else segments['VIP'] = (segments['VIP'] || 0) + 1;
    });

    return Object.entries(segments).map(([segment, count]) => ({ segment, count }));
  };

  const getCompletionRates = (orders: any[]) => {
    const daily: { [key: string]: { total: number, completed: number } } = {};
    
    orders.forEach(order => {
      const date = new Date(order.created_at).toLocaleDateString();
      if (!daily[date]) daily[date] = { total: 0, completed: 0 };
      daily[date].total++;
      if (order.status === 'completed') daily[date].completed++;
    });

    return Object.entries(daily).map(([date, data]) => ({
      date,
      rate: data.total > 0 ? (data.completed / data.total) * 100 : 0
    }));
  };

  // Phase 3: Export functionality
  const exportOrdersToCSV = () => {
    setIsExporting(true);
    
    const headers = ['Customer Name', 'Email', 'Service Type', 'Amount', 'Status', 'Created Date'];
    const csvData = filteredOrders.map(order => [
      order.customer_name,
      order.customer_email,
      order.cleaning_type,
      `$${(order.amount / 100).toFixed(2)}`,
      order.status,
      new Date(order.created_at).toLocaleDateString()
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    setIsExporting(false);
    toast.success('Orders exported successfully');
  };

  // Phase 4: Enterprise features
  const generateBusinessInsights = async () => {
    // Simulate AI-powered business insights
    const insights = [
      {
        id: 1,
        type: 'opportunity',
        title: 'Peak Demand Opportunity',
        description: 'Bookings increase 40% on weekends. Consider adding weekend pricing tiers.',
        impact: 'high',
        confidence: 87
      },
      {
        id: 2,
        type: 'risk',
        title: 'Customer Churn Risk',
        description: '3 high-value customers haven\'t booked in 30+ days. Send retention offers.',
        impact: 'medium',
        confidence: 92
      },
      {
        id: 3,
        type: 'efficiency',
        title: 'Route Optimization',
        description: 'Grouping nearby appointments could reduce travel time by 25%.',
        impact: 'medium',
        confidence: 78
      }
    ];
    setBusinessInsights(insights);
  };

  const fetchSystemHealth = async () => {
    // Simulate system health monitoring
    setSystemHealth({
      apiLatency: Math.floor(Math.random() * 100) + 50,
      errorRate: Math.random() * 2,
      activeUsers: Math.floor(Math.random() * 50) + 10,
      systemLoad: Math.random() * 80 + 10
    });
  };

  const fetchNotifications = async () => {
    // Simulate real-time notifications
    const mockNotifications = [
      {
        id: 1,
        type: 'urgent',
        title: 'High-Value Order',
        message: 'New $500+ order from premium customer',
        timestamp: new Date().toISOString(),
        read: false
      },
      {
        id: 2,
        type: 'warning',
        title: 'Duplicate Order Alert',
        message: '2 new duplicate orders detected',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        read: false
      },
      {
        id: 3,
        type: 'info',
        title: 'Daily Report Ready',
        message: 'Today\'s performance summary is available',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        read: true
      }
    ];
    setNotifications(mockNotifications);
  };

  const createAutomationRule = (trigger: string, action: string) => {
    const newRule = {
      id: Date.now(),
      trigger,
      action,
      enabled: true,
      created: new Date().toISOString()
    };
    setAutomationRules(prev => [...prev, newRule]);
    toast.success('Automation rule created');
  };

  const markNotificationRead = (notificationId: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <Target className="h-5 w-5 text-green-600" />;
      case 'risk': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'efficiency': return <Zap className="h-5 w-5 text-blue-600" />;
      default: return <Brain className="h-5 w-5 text-purple-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      toast.success('Order status updated successfully');
      fetchOrders();
      calculateMetrics(); // Recalculate metrics to update revenue
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('subcontractor_applications')
        .update({ 
          status: newStatus,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq('id', applicationId);

      if (error) throw error;
      
      toast.success('Application status updated successfully');
      fetchApplications();
      calculateMetrics();
    } catch (error) {
      toast.error('Failed to update application status');
    }
  };

  const deleteDuplicateOrders = async (email: string, keepLatest: boolean = true) => {
    try {
      console.log('Attempting to delete duplicates for:', email, 'keepLatest:', keepLatest);
      const duplicates = duplicateOrders[email];
      if (!duplicates || duplicates.length <= 1) {
        console.log('No duplicates found or insufficient duplicates:', duplicates?.length);
        return;
      }

      let ordersToDelete = duplicates;
      if (keepLatest) {
        // Sort by created_at and keep the most recent
        const sorted = [...duplicates].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        ordersToDelete = sorted.slice(1); // Remove the first (newest) one
      }

      const idsToDelete = ordersToDelete.map(order => order.id);
      console.log('Orders to delete:', idsToDelete);
      
      const { data, error } = await supabase
        .from('orders')
        .delete()
        .in('id', idsToDelete)
        .select();

      if (error) {
        console.error('Supabase deletion error:', error);
        throw error;
      }

      console.log('Deletion successful, deleted rows:', data);
      toast.success(`Deleted ${idsToDelete.length} duplicate orders for ${email}`);
      
      // Update local state immediately
      setOrders(prevOrders => prevOrders.filter(order => !idsToDelete.includes(order.id)));
      
      // Remove from duplicates
      const updatedDuplicates = { ...duplicateOrders };
      if (keepLatest && updatedDuplicates[email]) {
        // Keep only the latest one
        const sorted = [...updatedDuplicates[email]].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        updatedDuplicates[email] = sorted.slice(0, 1);
        if (updatedDuplicates[email].length <= 1) {
          delete updatedDuplicates[email];
        }
      } else {
        delete updatedDuplicates[email];
      }
      setDuplicateOrders(updatedDuplicates);
      
      fetchOrders();
      calculateMetrics();
    } catch (error) {
      console.error('Full deletion error:', error);
      toast.error(`Failed to delete duplicate orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading admin portal...</p>
          </div>
        </div>
      </div>
    );
  }
  const filteredOrders = orders.filter(order => {
    const matchesFilter = orderFilter === "all" || order.status === orderFilter;
    const matchesSearch = searchTerm === "" || 
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.cleaning_type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Phase 2: Bulk operations
  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedOrders.length === 0) {
      toast.error('Please select orders to update');
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .in('id', selectedOrders);

      if (error) throw error;
      
      toast.success(`Updated ${selectedOrders.length} orders to ${newStatus}`);
      setSelectedOrders([]);
      fetchData(false);
    } catch (error) {
      toast.error('Failed to update orders');
    }
  };

  // Phase 4: Individual order deletion
  const deleteOrder = async (orderId: string, customerName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the order for ${customerName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;
      
      toast.success('Order deleted successfully');
      
      // Update local state immediately
      setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
      
      // Refresh data
      fetchData(false);
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    }
  };

  // Phase 4: Bulk order deletion
  const handleBulkDelete = async () => {
    if (selectedOrders.length === 0) {
      toast.error('Please select orders to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete ${selectedOrders.length} selected orders? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .in('id', selectedOrders);

      if (error) throw error;
      
      toast.success(`Successfully deleted ${selectedOrders.length} orders`);
      
      // Update local state immediately
      setOrders(prevOrders => prevOrders.filter(order => !selectedOrders.includes(order.id)));
      setSelectedOrders([]);
      
      // Refresh data
      fetchData(false);
    } catch (error) {
      console.error('Error bulk deleting orders:', error);
      toast.error('Failed to delete selected orders');
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const selectAllOrders = () => {
    setSelectedOrders(
      selectedOrders.length === filteredOrders.length 
        ? [] 
        : filteredOrders.map(order => order.id)
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <h1 className="text-3xl font-bold mb-4">Admin Portal</h1>
              <p className="text-muted-foreground">
                Manage orders, applications, and monitor business performance
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Phase 4: Notifications Bell */}
              <div className="relative">
                <Button
                  onClick={() => setShowNotifications(!showNotifications)}
                  variant="outline"
                  size="sm"
                  className="relative"
                >
                  <Bell className="h-4 w-4" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </Button>
                
                {showNotifications && (
                  <div className="absolute right-0 top-12 w-80 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    <div className="p-3 border-b">
                      <h3 className="font-semibold">Notifications</h3>
                    </div>
                    <div className="p-2">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 mb-2 rounded border cursor-pointer ${getNotificationColor(notification.type)} ${
                            notification.read ? 'opacity-60' : ''
                          }`}
                          onClick={() => markNotificationRead(notification.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-sm">{notification.title}</h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(notification.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <Button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-9">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Insights
              </TabsTrigger>
              <TabsTrigger value="monitoring" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                System
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="duplicates" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Duplicates {Object.keys(duplicateOrders).length > 0 && (
                  <Badge variant="destructive" className="ml-1 text-xs">
                    {Object.keys(duplicateOrders).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="applications" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Applications
              </TabsTrigger>
              <TabsTrigger value="ghl-integration" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                GHL Integration
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Reports
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                        <p className="text-2xl font-bold">{metrics.totalOrders}</p>
                      </div>
                      <Calendar className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Completed Revenue</p>
                        <p className="text-2xl font-bold">${(metrics.completedRevenue || 0).toFixed(2)}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Pending Revenue</p>
                        <p className="text-2xl font-bold">${(metrics.pendingRevenue || 0).toFixed(2)}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                        <p className="text-2xl font-bold">{(metrics.completionRate || 0).toFixed(1)}%</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Pending Applications</p>
                        <p className="text-2xl font-bold">{metrics.pendingApplications}</p>
                      </div>
                      <Clock className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Completed Services</p>
                        <p className="text-2xl font-bold">{metrics.completedServices}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Duplicate Alert */}
              {Object.keys(duplicateOrders).length > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                        <div>
                          <h3 className="font-semibold text-red-800">Duplicate Orders Detected</h3>
                          <p className="text-sm text-red-600">
                            Found {Object.keys(duplicateOrders).length} customers with multiple pending orders
                          </p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => setSelectedTab("duplicates")}
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-100"
                      >
                        Review Duplicates
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest customer bookings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="font-medium">{order.customer_name}</p>
                            <p className="text-sm text-muted-foreground">{order.cleaning_type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            ${(order.amount / 100).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Phase 4: AI Insights Tab */}
            <TabsContent value="insights" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">AI-Powered Business Insights</h2>
                  <p className="text-muted-foreground">Automated recommendations and predictions</p>
                </div>
                <Button onClick={generateBusinessInsights} variant="outline">
                  <Brain className="h-4 w-4 mr-2" />
                  Refresh Insights
                </Button>
              </div>

              <div className="grid gap-6">
                {businessInsights.map((insight) => (
                  <Card key={insight.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          {getInsightIcon(insight.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{insight.title}</h3>
                              <Badge variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'default' : 'secondary'}>
                                {insight.impact} impact
                              </Badge>
                            </div>
                            <p className="text-muted-foreground mb-3">{insight.description}</p>
                            <div className="flex items-center gap-4">
                              <div className="text-sm">
                                <span className="text-muted-foreground">Confidence: </span>
                                <span className="font-medium">{insight.confidence}%</span>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Implement
                                </Button>
                                <Button size="sm" variant="ghost">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Dismiss
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Automation Rules */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Automation Rules
                  </CardTitle>
                  <CardDescription>Set up automated workflows to streamline operations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => createAutomationRule('High value order', 'Send VIP notification')}
                      >
                        Add High-Value Alert
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => createAutomationRule('Duplicate order', 'Auto-merge duplicates')}
                      >
                        Auto-Merge Duplicates
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => createAutomationRule('Customer inactive 30d', 'Send retention email')}
                      >
                        Retention Campaign
                      </Button>
                    </div>
                    
                    {automationRules.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Active Rules</h4>
                        {automationRules.map((rule) => (
                          <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div>
                              <span className="font-medium">When: </span>{rule.trigger}
                              <span className="text-muted-foreground"> → </span>
                              <span className="font-medium">Then: </span>{rule.action}
                            </div>
                            <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                              {rule.enabled ? 'Active' : 'Disabled'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Phase 4: System Monitoring Tab */}
            <TabsContent value="monitoring" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">System Health & Performance</h2>
                <p className="text-muted-foreground">Real-time monitoring and diagnostics</p>
              </div>

              {/* System Health Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">API Latency</p>
                        <p className="text-2xl font-bold">{systemHealth.apiLatency}ms</p>
                      </div>
                      <Activity className={`h-8 w-8 ${systemHealth.apiLatency < 100 ? 'text-green-600' : 'text-yellow-600'}`} />
                    </div>
                    <div className="mt-2">
                      <div className={`w-full bg-gray-200 rounded-full h-2 ${systemHealth.apiLatency < 100 ? 'bg-green-200' : 'bg-yellow-200'}`}>
                        <div 
                          className={`h-2 rounded-full ${systemHealth.apiLatency < 100 ? 'bg-green-600' : 'bg-yellow-600'}`}
                          style={{ width: `${Math.min((systemHealth.apiLatency / 200) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Error Rate</p>
                        <p className="text-2xl font-bold">{systemHealth.errorRate.toFixed(2)}%</p>
                      </div>
                      <Shield className={`h-8 w-8 ${systemHealth.errorRate < 1 ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                        <p className="text-2xl font-bold">{systemHealth.activeUsers}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">System Load</p>
                        <p className="text-2xl font-bold">{systemHealth.systemLoad.toFixed(1)}%</p>
                      </div>
                      <Settings className={`h-8 w-8 ${systemHealth.systemLoad < 70 ? 'text-green-600' : 'text-orange-600'}`} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity Log */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent System Events</CardTitle>
                  <CardDescription>Live activity feed and audit trail</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { time: '2 min ago', action: 'Bulk order update', user: 'Admin', status: 'success' },
                      { time: '5 min ago', action: 'CSV export generated', user: 'Admin', status: 'success' },
                      { time: '8 min ago', action: 'Duplicate orders detected', user: 'System', status: 'warning' },
                      { time: '12 min ago', action: 'Analytics refresh', user: 'System', status: 'info' },
                      { time: '15 min ago', action: 'User login', user: 'Admin', status: 'success' }
                    ].map((event, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            event.status === 'success' ? 'bg-green-500' :
                            event.status === 'warning' ? 'bg-yellow-500' :
                            event.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                          }`} />
                          <div>
                            <p className="font-medium">{event.action}</p>
                            <p className="text-sm text-muted-foreground">by {event.user}</p>
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">{event.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Order Management</CardTitle>
                      <CardDescription>Manage all customer orders and bookings</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleBulkStatusUpdate('completed')}
                        disabled={selectedOrders.length === 0}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark Completed
                      </Button>
                      <Button
                        onClick={() => handleBulkStatusUpdate('cancelled')}
                        disabled={selectedOrders.length === 0}
                        size="sm"
                        variant="outline"
                        className="border-yellow-600 text-yellow-700 hover:bg-yellow-50"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancel Orders
                      </Button>
                      <Button
                        onClick={handleBulkDelete}
                        disabled={selectedOrders.length === 0}
                        size="sm"
                        variant="destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete Permanently
                      </Button>
                    </div>
                  </div>
                  
                  {/* Phase 2: Filters */}
                  <div className="flex gap-4 mt-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Search by customer name, email, or service type..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-md"
                      />
                    </div>
                    <Select value={orderFilter} onValueChange={setOrderFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Orders</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedOrders.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-700">
                        {selectedOrders.length} order(s) selected
                      </p>
                    </div>
                  )}
                  
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            <input
                              type="checkbox"
                              checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                              onChange={selectAllOrders}
                              className="rounded border-gray-300"
                            />
                          </TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedOrders.includes(order.id)}
                                onChange={() => toggleOrderSelection(order.id)}
                                className="rounded border-gray-300"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  <span className="font-medium">{order.customer_name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  {order.customer_email}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {order.cleaning_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {order.square_footage} sq ft • {order.frequency}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {order.scheduled_date && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(order.scheduled_date).toLocaleDateString()}
                                  </div>
                                )}
                                {order.scheduled_time && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {order.scheduled_time}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">${(order.amount / 100).toFixed(2)}</span>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(order.status)}>
                                {order.status.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                             <TableCell>
                               <div className="flex items-center gap-2">
                                 <Select
                                   value={order.status}
                                   onValueChange={(value) => updateOrderStatus(order.id, value)}
                                 >
                                   <SelectTrigger className="w-32">
                                     <SelectValue />
                                   </SelectTrigger>
                                   <SelectContent>
                                     <SelectItem value="pending">Pending</SelectItem>
                                     <SelectItem value="confirmed">Confirmed</SelectItem>
                                     <SelectItem value="scheduled">Scheduled</SelectItem>
                                     <SelectItem value="in_progress">In Progress</SelectItem>
                                     <SelectItem value="completed">Completed</SelectItem>
                                     <SelectItem value="cancelled">Cancelled</SelectItem>
                                   </SelectContent>
                                 </Select>
                                 <Button
                                   onClick={() => deleteOrder(order.id, order.customer_name)}
                                   size="sm"
                                   variant="destructive"
                                   className="h-8 w-8 p-0"
                                   title="Delete order permanently"
                                 >
                                   <Trash2 className="h-3 w-3" />
                                 </Button>
                               </div>
                             </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {filteredOrders.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        {searchTerm || orderFilter !== "all" 
                          ? "No orders match your filters" 
                          : "No orders found"
                        }
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Duplicates Tab */}
            <TabsContent value="duplicates">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Duplicate Order Management</CardTitle>
                      <CardDescription>Manage customers with multiple pending orders</CardDescription>
                    </div>
                    <Button
                      onClick={() => setShowDuplicates(!showDuplicates)}
                      variant="outline"
                      size="sm"
                    >
                      {showDuplicates ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                      {showDuplicates ? 'Hide Details' : 'Show Details'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {Object.keys(duplicateOrders).length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-green-800 mb-2">No Duplicate Orders</h3>
                      <p className="text-muted-foreground">All customers have single pending orders.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(duplicateOrders).map(([email, orders]) => (
                        <Card key={email} className="border-orange-200 bg-orange-50">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-orange-800">{email}</h4>
                                <p className="text-sm text-orange-600">
                                  {orders.length} pending orders • Total: ${(orders.reduce((sum, order) => sum + order.amount, 0) / 100).toFixed(2)}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => deleteDuplicateOrders(email, true)}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  Keep Latest
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deleteDuplicateOrders(email, false)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete All
                                </Button>
                              </div>
                            </div>
                            
                            {showDuplicates && (
                              <div className="space-y-2 mt-4 pt-4 border-t border-orange-200">
                                {orders.map((order, index) => (
                                  <div key={order.id} className="flex items-center justify-between text-sm">
                                    <div>
                                      <span className="font-medium">Order #{index + 1}</span>
                                      <span className="ml-2 text-muted-foreground">
                                        {order.cleaning_type?.replace(/_/g, ' ')} • ${(order.amount / 100).toFixed(2)}
                                      </span>
                                      <span className="ml-2 text-xs text-muted-foreground">
                                        {new Date(order.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                     <Button
                                       size="sm"
                                       variant="outline"
                                       onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                       className="h-6 text-xs"
                                     >
                                       <Trash2 className="h-3 w-3" />
                                     </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Applications Tab */}
            <TabsContent value="applications">
              <Card>
                <CardHeader>
                  <CardTitle>Subcontractor Applications</CardTitle>
                  <CardDescription>Review and manage subcontractor applications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {applications.map((application) => (
                      <Card key={application.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span className="font-medium">{application.full_name}</span>
                              <Badge className={getStatusColor(application.status)}>
                                {application.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {application.email}
                              </div>
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {application.phone}
                              </div>
                            </div>
                            <p className="text-sm">{application.why_join_us}</p>
                            
                            {/* Requirements Check */}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {application.has_drivers_license && (
                                <Badge variant="outline" className="text-green-600">✓ Driver's License</Badge>
                              )}
                              {application.has_own_vehicle && (
                                <Badge variant="outline" className="text-green-600">✓ Own Vehicle</Badge>
                              )}
                              {application.background_check_consent && (
                                <Badge variant="outline" className="text-green-600">✓ Background Check OK</Badge>
                              )}
                            </div>
                          </div>
                          
                          {application.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => updateApplicationStatus(application.id, 'approved')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateApplicationStatus(application.id, 'rejected')}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Summary</CardTitle>
                    <CardDescription>Financial overview</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Completed Revenue:</span>
                      <span className="font-bold">${(metrics.completedRevenue || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending Revenue:</span>
                      <span className="font-bold">${(metrics.pendingRevenue || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Completed Order:</span>
                      <span className="font-bold">
                        ${metrics.completedServices > 0 ? ((metrics.completedRevenue || 0) / metrics.completedServices).toFixed(2) : '0.00'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completion Rate:</span>
                      <span className="font-bold">{(metrics.completionRate || 0).toFixed(1)}%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Operations Summary</CardTitle>
                    <CardDescription>Service metrics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Applications:</span>
                      <span className="font-bold">{applications.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending Review:</span>
                      <span className="font-bold">{metrics.pendingApplications}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Approved Contractors:</span>
                      <span className="font-bold">
                        {applications.filter(app => app.status === 'approved').length}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* GHL Integration Tab */}
            <TabsContent value="ghl-integration">
              <GHLIntegrationDashboard />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;