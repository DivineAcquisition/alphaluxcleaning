import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Calendar, Clock, MapPin, DollarSign, User, Filter } from "lucide-react";

interface Order {
  id: string;
  customer_email: string;
  customer_name?: string;
  customer_phone?: string;
  amount: number;
  status: string;
  created_at: string;
  scheduled_date?: string;
  service_details: any;
  booking_id?: string;
  subcontractor_assigned?: string;
}

interface Booking {
  id: string;
  order_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  service_date: string;
  service_time: string;
  service_address: string;
  status: string;
  priority: string;
  special_instructions?: string;
  estimated_duration?: number;
  created_at: string;
}

interface ServiceRequest {
  id: string;
  order_id?: string;
  request_type: string;
  status: string;
  requested_by_email: string;
  requested_by_name?: string;
  customer_notes?: string;
  admin_notes?: string;
  created_at: string;
}

const AdminBookingPreview = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'bookings' | 'requests'>('orders');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    const filtered = orders.filter(order => {
      const matchesSearch = order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    setFilteredOrders(filtered);
  }, [searchTerm, statusFilter, orders]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Fetch service requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('customer_service_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      setOrders(ordersData || []);
      setBookings(bookingsData || []);
      setServiceRequests(requestsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load order management data');
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      toast.success('Order status updated successfully');
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      'completed': 'bg-success text-success-foreground',
      'pending': 'bg-warning text-warning-foreground',
      'cancelled': 'bg-destructive text-destructive-foreground',
      'in_progress': 'bg-primary text-primary-foreground',
      'scheduled': 'bg-info text-info-foreground'
    };
    
    return (
      <Badge className={statusStyles[status as keyof typeof statusStyles] || 'bg-muted'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityStyles = {
      'high': 'bg-destructive text-destructive-foreground',
      'normal': 'bg-muted text-muted-foreground',
      'low': 'bg-secondary text-secondary-foreground'
    };
    
    return (
      <Badge className={priorityStyles[priority as keyof typeof priorityStyles] || 'bg-muted'}>
        {priority}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <AdminLayout title="Order Management" description="Loading order data...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Calendar className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading orders...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Order Management" 
      description="Track and manage all customer orders, bookings, and service requests"
    >
      <div className="space-y-6">
        {/* Header with navigation */}
        <div className="flex items-center justify-between gap-4">
          <Button variant="outline" onClick={() => navigate('/admin/customers')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Customer Hub
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders by customer or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-60"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <AdminCard title="Total Orders" icon={<Calendar className="h-4 w-4" />}>
            <div className="text-2xl font-bold">{orders.length}</div>
          </AdminCard>
          <AdminCard title="Pending Orders" icon={<Clock className="h-4 w-4" />}>
            <div className="text-2xl font-bold text-warning">
              {orders.filter(o => o.status === 'pending').length}
            </div>
          </AdminCard>
          <AdminCard title="Total Revenue" icon={<DollarSign className="h-4 w-4" />}>
            <div className="text-2xl font-bold text-success">
              ${(orders.reduce((sum, o) => sum + o.amount, 0) / 100).toFixed(0)}
            </div>
          </AdminCard>
          <AdminCard title="Service Requests" icon={<User className="h-4 w-4" />}>
            <div className="text-2xl font-bold text-info">
              {serviceRequests.filter(r => r.status === 'pending').length}
            </div>
          </AdminCard>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <Button 
            variant={activeTab === 'orders' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('orders')}
            className="rounded-b-none"
          >
            Orders ({orders.length})
          </Button>
          <Button 
            variant={activeTab === 'bookings' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('bookings')}
            className="rounded-b-none"
          >
            Bookings ({bookings.length})
          </Button>
          <Button 
            variant={activeTab === 'requests' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('requests')}
            className="rounded-b-none"
          >
            Service Requests ({serviceRequests.length})
          </Button>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <AdminCard title="Order Management" description="View and manage customer orders">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">
                      {order.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customer_name || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.service_details?.service_type || 'Standard Cleaning'}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${(order.amount / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell>
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderModal(true);
                          }}
                        >
                          View
                        </Button>
                        <Select 
                          value={order.status} 
                          onValueChange={(value) => updateOrderStatus(order.id, value)}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminCard>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <AdminCard title="Booking Management" description="View and manage customer bookings">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{booking.customer_name}</div>
                        <div className="text-sm text-muted-foreground">{booking.customer_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(booking.service_date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {booking.service_time}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {booking.service_address.substring(0, 30)}...
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPriorityBadge(booking.priority)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(booking.status)}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminCard>
        )}

        {/* Service Requests Tab */}
        {activeTab === 'requests' && (
          <AdminCard title="Service Requests" description="Handle customer service requests and issues">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request Type</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.request_type.replace('_', ' ')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.requested_by_name || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">{request.requested_by_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(request.status)}
                    </TableCell>
                    <TableCell>
                      {new Date(request.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-40 truncate">
                        {request.customer_notes || 'No notes'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminCard>
        )}

        {/* Order Details Modal */}
        <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
            </DialogHeader>
            
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Order Information</h3>
                    <div className="space-y-1 text-sm">
                      <p><strong>Order ID:</strong> {selectedOrder.id}</p>
                      <p><strong>Status:</strong> {getStatusBadge(selectedOrder.status)}</p>
                      <p><strong>Amount:</strong> ${(selectedOrder.amount / 100).toFixed(2)}</p>
                      <p><strong>Created:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</p>
                      {selectedOrder.scheduled_date && (
                        <p><strong>Scheduled:</strong> {new Date(selectedOrder.scheduled_date).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Customer Information</h3>
                    <div className="space-y-1 text-sm">
                      <p><strong>Name:</strong> {selectedOrder.customer_name || 'N/A'}</p>
                      <p><strong>Email:</strong> {selectedOrder.customer_email}</p>
                      <p><strong>Phone:</strong> {selectedOrder.customer_phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                
                {selectedOrder.service_details && (
                  <div>
                    <h3 className="font-medium mb-2">Service Details</h3>
                    <pre className="text-sm bg-muted p-2 rounded overflow-auto">
                      {JSON.stringify(selectedOrder.service_details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminBookingPreview;