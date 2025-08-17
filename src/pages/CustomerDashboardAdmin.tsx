import { useState, useEffect } from "react";
import { CustomerManagementLayout } from "@/components/admin/CustomerManagementLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminGrid } from "@/components/admin/AdminGrid";
import { AdminSection } from "@/components/admin/AdminSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Search, 
  Eye, 
  Edit, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  Star,
  DollarSign
} from "lucide-react";

interface Customer {
  id: string;
  customer_email: string;
  customer_phone?: string;
  customer_name?: string;
  address?: string;
  city?: string;
  state?: string;
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
  average_rating?: number;
}

export default function CustomerDashboardAdmin() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      
      // Fetch orders and aggregate customer data
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process orders into customer data
      const customerMap = new Map<string, Customer>();
      
      orders?.forEach(order => {
        const email = order.customer_email;
        if (!email) return;

        if (customerMap.has(email)) {
          const customer = customerMap.get(email)!;
          customer.total_orders += 1;
          customer.total_spent += (order.amount || 0) / 100;
          if (order.created_at > (customer.last_order_date || '')) {
            customer.last_order_date = order.created_at;
          }
        } else {
          customerMap.set(email, {
            id: order.id,
            customer_email: email,
            customer_phone: order.customer_phone,
            customer_name: order.customer_name,
            address: ((order as any).service_address as string) || '',
            city: ((((order as any).service_address as string) || '').split(',')[1]?.trim()) || '',
            state: ((((order as any).service_address as string) || '').split(',')[2]?.trim()) || '',
            total_orders: 1,
            total_spent: (order.amount || 0) / 100,
            last_order_date: order.created_at,
            average_rating: 5.0 // Default rating since we don't have ratings in orders
          });
        }
      });

      setCustomers(Array.from(customerMap.values()));
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customer data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customer_phone?.includes(searchTerm)
  );

  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum, customer) => sum + customer.total_spent, 0);
  const avgOrderValue = totalRevenue / customers.reduce((sum, customer) => sum + customer.total_orders, 0) || 0;

  return (
    <CustomerManagementLayout 
      title="Customer Database" 
      description="Manage customer profiles and service history"
    >
      <div className="space-y-6">
        {/* Customer Metrics */}
        <AdminSection title="Customer Overview" description="Key customer metrics">
          <AdminGrid columns={4} gap="md">
            <AdminCard variant="metric" title="Total Customers" icon={<Users className="h-4 w-4" />}>
              <div className="text-3xl font-bold">{totalCustomers}</div>
              <p className="text-xs text-muted-foreground">Active customers</p>
            </AdminCard>

            <AdminCard variant="metric" title="Total Revenue" icon={<DollarSign className="h-4 w-4" />}>
              <div className="text-3xl font-bold text-success">${totalRevenue.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground">All time revenue</p>
            </AdminCard>

            <AdminCard variant="metric" title="Avg Order Value" icon={<Star className="h-4 w-4" />}>
              <div className="text-3xl font-bold text-primary">${avgOrderValue.toFixed(0)}</div>
              <p className="text-xs text-muted-foregrade">Per order average</p>
            </AdminCard>

            <AdminCard variant="metric" title="Total Orders" icon={<Calendar className="h-4 w-4" />}>
              <div className="text-3xl font-bold">{customers.reduce((sum, c) => sum + c.total_orders, 0)}</div>
              <p className="text-xs text-muted-foreground">Service bookings</p>
            </AdminCard>
          </AdminGrid>
        </AdminSection>

        {/* Customer Search and Filters */}
        <AdminSection title="Customer Database" description="Search and manage customer records">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers by email, name, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>

            {/* Customer Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Customer Records ({filteredCustomers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <Users className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                      <p className="text-muted-foreground">Loading customers...</p>
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Orders</TableHead>
                        <TableHead>Total Spent</TableHead>
                        <TableHead>Last Order</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{customer.customer_name || 'N/A'}</p>
                              <p className="text-sm text-muted-foreground">{customer.customer_email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {customer.customer_phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  <span className="text-sm">{customer.customer_phone}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span className="text-sm">{customer.city}, {customer.state}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{customer.total_orders}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-success">${customer.total_spent.toFixed(2)}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {customer.last_order_date ? new Date(customer.last_order_date).toLocaleDateString() : 'N/A'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => setSelectedCustomer(customer)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Customer Details</DialogTitle>
                                  </DialogHeader>
                                  {selectedCustomer && (
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <label className="text-sm font-medium">Name</label>
                                          <p className="text-sm text-muted-foreground">{selectedCustomer.customer_name || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Email</label>
                                          <p className="text-sm text-muted-foreground">{selectedCustomer.customer_email}</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Phone</label>
                                          <p className="text-sm text-muted-foreground">{selectedCustomer.customer_phone || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Total Orders</label>
                                          <p className="text-sm text-muted-foreground">{selectedCustomer.total_orders}</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Total Spent</label>
                                          <p className="text-sm text-muted-foreground">${selectedCustomer.total_spent.toFixed(2)}</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Last Order</label>
                                          <p className="text-sm text-muted-foreground">
                                            {selectedCustomer.last_order_date ? new Date(selectedCustomer.last_order_date).toLocaleDateString() : 'N/A'}
                                          </p>
                                        </div>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">Address</label>
                                        <p className="text-sm text-muted-foreground">
                                          {selectedCustomer.address ? `${selectedCustomer.address}, ${selectedCustomer.city}, ${selectedCustomer.state}` : 'N/A'}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                              <Button variant="ghost" size="sm">
                                <Mail className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </AdminSection>
      </div>
    </CustomerManagementLayout>
  );
}