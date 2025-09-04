import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Users, Mail, Phone, MapPin, Calendar, DollarSign, Star } from "lucide-react";

interface CustomerProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  customer_since: string;
  total_orders: number;
  total_spent_cents: number;
  average_rating?: number;
  last_service_date?: string;
  preferred_time?: string;
  special_instructions?: string;
}

interface Order {
  id: string;
  customer_email: string;
  amount: number;
  status: string;
  created_at: string;
  service_details: any;
}

function CustomerDatabaseAdmin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCustomers();
    }
  }, [user]);

  useEffect(() => {
    const filtered = customers.filter(customer => 
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${customer.first_name || ''} ${customer.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm) ||
      customer.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      
      // First try to get from customer_profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('customer_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profiles && profiles.length > 0) {
        setCustomers(profiles);
      } else {
        // Fallback to extracting from orders table
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('customer_email, customer_name, customer_phone, amount, created_at, status')
          .order('created_at', { ascending: false });

        if (orders) {
          // Group by customer email and create customer profiles
          const customerMap = new Map<string, CustomerProfile>();
          
          orders.forEach(order => {
            const existing = customerMap.get(order.customer_email);
            if (existing) {
              existing.total_orders += 1;
              existing.total_spent_cents += order.amount || 0;
            } else {
              const [firstName, ...lastNameParts] = (order.customer_name || '').split(' ');
              customerMap.set(order.customer_email, {
                id: crypto.randomUUID(),
                email: order.customer_email,
                first_name: firstName || '',
                last_name: lastNameParts.join(' ') || '',
                phone: order.customer_phone,
                customer_since: order.created_at,
                total_orders: 1,
                total_spent_cents: order.amount || 0,
                average_rating: 4.5
              });
            }
          });

          setCustomers(Array.from(customerMap.values()));
        }
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customer data');
    } finally {
      setIsLoading(false);
    }
  };

  const viewCustomerDetails = async (customer: CustomerProfile) => {
    setSelectedCustomer(customer);
    
    // Fetch customer orders
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_email', customer.email)
      .order('created_at', { ascending: false });
    
    setCustomerOrders(orders || []);
    setShowCustomerModal(true);
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      'completed': 'bg-success text-success-foreground',
      'pending': 'bg-warning text-warning-foreground',
      'cancelled': 'bg-destructive text-destructive-foreground',
      'in_progress': 'bg-primary text-primary-foreground'
    };
    
    return (
      <Badge className={statusStyles[status as keyof typeof statusStyles] || 'bg-muted'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <AdminLayout title="Customer Database" description="Loading customer data...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Users className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading customers...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Customer Database" 
      description="View and manage customer profiles, contact information, and service history"
    >
      <div className="space-y-6">
        {/* Header with navigation */}
        <div className="flex items-center justify-between gap-4">
          <Button variant="outline" onClick={() => navigate('/admin/customers')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Customer Hub
          </Button>
          
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers by email, name, phone, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-80"
            />
          </div>
        </div>

        {/* Customer Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <AdminCard title="Total Customers" icon={<Users className="h-4 w-4" />}>
            <div className="text-2xl font-bold">{customers.length}</div>
          </AdminCard>
          <AdminCard title="Active This Month" icon={<Calendar className="h-4 w-4" />}>
            <div className="text-2xl font-bold">
              {customers.filter(c => {
                const lastMonth = new Date();
                lastMonth.setMonth(lastMonth.getMonth() - 1);
                return new Date(c.customer_since) > lastMonth;
              }).length}
            </div>
          </AdminCard>
          <AdminCard title="Total Revenue" icon={<DollarSign className="h-4 w-4" />}>
            <div className="text-2xl font-bold text-success">
              ${(customers.reduce((sum, c) => sum + c.total_spent_cents, 0) / 100).toFixed(0)}
            </div>
          </AdminCard>
          <AdminCard title="Average Rating" icon={<Star className="h-4 w-4" />}>
            <div className="text-2xl font-bold text-warning">
              {(customers.reduce((sum, c) => sum + (c.average_rating || 0), 0) / customers.length || 0).toFixed(1)}
            </div>
          </AdminCard>
        </div>

        {/* Customer Table */}
        <AdminCard title="Customer Directory" description="Click on any customer to view detailed information">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {customer.first_name} {customer.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">{customer.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {customer.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3" />
                        {customer.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {customer.city && customer.state && (
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        {customer.city}, {customer.state}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-center font-medium">{customer.total_orders}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-success">
                      ${(customer.total_spent_cents / 100).toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-warning fill-current" />
                      {customer.average_rating?.toFixed(1) || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => viewCustomerDetails(customer)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AdminCard>

        {/* Customer Details Modal */}
        <Dialog open={showCustomerModal} onOpenChange={setShowCustomerModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Customer Details: {selectedCustomer?.first_name} {selectedCustomer?.last_name}
              </DialogTitle>
            </DialogHeader>
            
            {selectedCustomer && (
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Contact Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Email:</strong> {selectedCustomer.email}</p>
                      <p><strong>Phone:</strong> {selectedCustomer.phone || 'Not provided'}</p>
                      <p><strong>Address:</strong> {selectedCustomer.address || 'Not provided'}</p>
                      <p><strong>City, State:</strong> {selectedCustomer.city}, {selectedCustomer.state}</p>
                      <p><strong>ZIP Code:</strong> {selectedCustomer.zip_code || 'Not provided'}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Service Summary</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Customer Since:</strong> {new Date(selectedCustomer.customer_since).toLocaleDateString()}</p>
                      <p><strong>Total Orders:</strong> {selectedCustomer.total_orders}</p>
                      <p><strong>Total Spent:</strong> ${(selectedCustomer.total_spent_cents / 100).toFixed(2)}</p>
                      <p><strong>Average Rating:</strong> ⭐ {selectedCustomer.average_rating?.toFixed(1) || 'N/A'}</p>
                      <p><strong>Preferred Time:</strong> {selectedCustomer.preferred_time || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                {/* Special Instructions */}
                {selectedCustomer.special_instructions && (
                  <div>
                    <h3 className="font-medium mb-2">Special Instructions</h3>
                    <p className="text-sm bg-muted p-2 rounded">{selectedCustomer.special_instructions}</p>
                  </div>
                )}

                {/* Order History */}
                <div>
                  <h3 className="font-medium mb-3">Order History ({customerOrders.length} orders)</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Service Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            {new Date(order.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {order.service_details?.service_type || 'Standard Cleaning'}
                          </TableCell>
                          <TableCell>
                            ${(order.amount / 100).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(order.status)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

export default CustomerDatabaseAdmin;