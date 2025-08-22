import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminGrid } from "@/components/admin/AdminGrid";
import { AdminSection } from "@/components/admin/AdminSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Search, 
  Eye, 
  Mail, 
  Phone, 
  MapPin,
  DollarSign
} from "lucide-react";

interface Customer {
  id: string;
  customer_email: string;
  customer_phone?: string;
  customer_name?: string;
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
}

export default function SimpleCustomerList() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      
      const { data: orders, error } = await supabase
        .from('orders')
        .select('customer_email, customer_phone, customer_name, amount, created_at')
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
            id: crypto.randomUUID(),
            customer_email: email,
            customer_phone: order.customer_phone,
            customer_name: order.customer_name,
            total_orders: 1,
            total_spent: (order.amount || 0) / 100,
            last_order_date: order.created_at
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
    customer.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum, customer) => sum + customer.total_spent, 0);

  return (
    <AdminLayout 
      title="Customer List" 
      description="Simple customer overview and management"
    >
      <div className="space-y-6">
        {/* Simple Metrics */}
        <AdminSection title="Overview" description="Customer summary">
          <AdminGrid columns={3} gap="md">
            <AdminCard variant="metric" title="Total Customers" icon={<Users className="h-4 w-4" />}>
              <div className="text-3xl font-bold">{totalCustomers}</div>
              <p className="text-xs text-muted-foreground">Active customers</p>
            </AdminCard>

            <AdminCard variant="metric" title="Total Revenue" icon={<DollarSign className="h-4 w-4" />}>
              <div className="text-3xl font-bold text-success">${totalRevenue.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground">All time revenue</p>
            </AdminCard>

            <AdminCard variant="metric" title="Total Orders" icon={<Eye className="h-4 w-4" />}>
              <div className="text-3xl font-bold">{customers.reduce((sum, c) => sum + c.total_orders, 0)}</div>
              <p className="text-xs text-muted-foreground">Service bookings</p>
            </AdminCard>
          </AdminGrid>
        </AdminSection>

        {/* Customer List */}
        <AdminSection title="Customer Database" description="Search and view customer records">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Customers ({filteredCustomers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <Users className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Orders</TableHead>
                        <TableHead>Total Spent</TableHead>
                        <TableHead>Last Order</TableHead>
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
                            {customer.customer_phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span className="text-sm">{customer.customer_phone}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{customer.total_orders}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-success">${customer.total_spent.toFixed(2)}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {customer.last_order_date ? new Date(customer.last_order_date).toLocaleDateString() : 'N/A'}
                            </span>
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
    </AdminLayout>
  );
}