
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Calendar, Clock, MapPin, User, Phone, Mail, DollarSign, Filter, X } from "lucide-react";
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { AdminLayout } from "@/components/admin/AdminLayout";

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
  add_ons: string[];
  created_at: string;
  stripe_session_id: string;
}

const AdminDashboard = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cleaningTypeFilter, setCleaningTypeFilter] = useState<string>('all');
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');
  const [minAmountFilter, setMinAmountFilter] = useState<string>('');
  const [maxAmountFilter, setMaxAmountFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          navigate('/admin-auth');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate('/admin-auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchUserRole();
      fetchOrders();
      applyFilters();
    }
  }, [user]);

  const fetchUserRole = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      setUserRole(data.role);
    }
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
      setFilteredOrders(data || []);
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters whenever filter values change
  useEffect(() => {
    applyFilters();
  }, [statusFilter, cleaningTypeFilter, dateFromFilter, dateToFilter, minAmountFilter, maxAmountFilter, orders]);

  const applyFilters = () => {
    let filtered = [...orders];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Cleaning type filter
    if (cleaningTypeFilter !== 'all') {
      filtered = filtered.filter(order => order.cleaning_type === cleaningTypeFilter);
    }

    // Date range filter
    if (dateFromFilter) {
      filtered = filtered.filter(order => new Date(order.created_at) >= new Date(dateFromFilter));
    }
    if (dateToFilter) {
      filtered = filtered.filter(order => new Date(order.created_at) <= new Date(dateToFilter + 'T23:59:59'));
    }

    // Amount range filter
    if (minAmountFilter) {
      filtered = filtered.filter(order => order.amount >= parseInt(minAmountFilter) * 100);
    }
    if (maxAmountFilter) {
      filtered = filtered.filter(order => order.amount <= parseInt(maxAmountFilter) * 100);
    }

    setFilteredOrders(filtered);
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setCleaningTypeFilter('all');
    setDateFromFilter('');
    setDateToFilter('');
    setMinAmountFilter('');
    setMaxAmountFilter('');
  };

  const getUniqueCleaningTypes = () => {
    const types = orders.map(order => order.cleaning_type).filter(Boolean);
    return [...new Set(types)];
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      toast.success('Order status updated');
      fetchOrders();

      // If marked as completed, process auto-charge
      if (newStatus === 'completed') {
        await processAutoCharge(orderId);
      }
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const processAutoCharge = async (orderId: string) => {
    try {
      // Call edge function to process payment
      const { error } = await supabase.functions.invoke('process-auto-charge', {
        body: { orderId: orderId }
      });

      if (error) throw error;
      
      toast.success('Auto-charge processed and confirmation email sent');
    } catch (error) {
      toast.error('Failed to process auto-charge');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'normal': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <AdminLayout 
      title="Booking Management Dashboard"
      description={`Manage all customer bookings and update their status - Welcome, ${userRole}`}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Order Management</CardTitle>
              <CardDescription>
                Manage all customer orders and update their status
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>
        </CardHeader>
        
        {/* Filters Section */}
        {showFilters && (
          <div className="px-6 pb-6 border-b">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-md z-50">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Cleaning Type Filter */}
              <div className="space-y-2">
                <Label htmlFor="cleaning-type-filter">Cleaning Type</Label>
                <Select value={cleaningTypeFilter} onValueChange={setCleaningTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-md z-50">
                    <SelectItem value="all">All Types</SelectItem>
                    {getUniqueCleaningTypes().map((type) => (
                      <SelectItem key={type} value={type}>
                        {type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date From Filter */}
              <div className="space-y-2">
                <Label htmlFor="date-from">From Date</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                />
              </div>

              {/* Date To Filter */}
              <div className="space-y-2">
                <Label htmlFor="date-to">To Date</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                />
              </div>

              {/* Min Amount Filter */}
              <div className="space-y-2">
                <Label htmlFor="min-amount">Min Amount ($)</Label>
                <Input
                  id="min-amount"
                  type="number"
                  placeholder="0"
                  value={minAmountFilter}
                  onChange={(e) => setMinAmountFilter(e.target.value)}
                />
              </div>

              {/* Max Amount Filter */}
              <div className="space-y-2">
                <Label htmlFor="max-amount">Max Amount ($)</Label>
                <Input
                  id="max-amount"
                  type="number"
                  placeholder="1000"
                  value={maxAmountFilter}
                  onChange={(e) => setMaxAmountFilter(e.target.value)}
                />
              </div>
            </div>
            
            {/* Filter Actions */}
            <div className="flex items-center gap-2 mt-4">
              <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
              <div className="text-sm text-muted-foreground">
                Showing {filteredOrders.length} of {orders.length} orders
              </div>
            </div>
          </div>
        )}

        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {orders.length === 0 ? 'No orders found' : 'No orders match the current filters'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
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
                          {order.customer_phone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {order.customer_phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{order.scheduled_date || 'Not scheduled'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {order.scheduled_time || 'Time TBD'}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {order.service_details?.address?.street || 'Address pending'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {order.cleaning_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} • {order.square_footage} sq ft
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ${(order.amount / 100).toFixed(2)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-800">
                          normal
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) => updateOrderStatus(order.id, value)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-3 w-3" />
                                Completed (Auto-charge)
                              </div>
                            </SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminDashboard;
