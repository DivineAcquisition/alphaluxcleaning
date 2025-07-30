import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navigation } from "@/components/Navigation";
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
  EyeOff
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

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    console.log('AdminPortal: Starting to fetch data...');
    setIsLoading(true);
    try {
      await Promise.all([
        fetchOrders(),
        fetchApplications(),
        calculateMetrics()
      ]);
      console.log('AdminPortal: Data fetched successfully');
    } catch (error) {
      console.error('AdminPortal: Error fetching data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
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
      .select('amount, status, customer_email, created_at');

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Admin Portal</h1>
            <p className="text-muted-foreground">
              Manage orders, applications, and monitor business performance
            </p>
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Overview
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

            {/* Orders Tab */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Order Management</CardTitle>
                  <CardDescription>Manage all customer orders and bookings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id}>
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
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
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
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;