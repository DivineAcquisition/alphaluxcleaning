import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminCard } from '@/components/admin/AdminCard';
import { AdminGrid } from '@/components/admin/AdminGrid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Search, UserPlus, Mail, Phone, Calendar, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Customer {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  created_at: string;
  total_orders: number;
  total_spent: number;
  last_service: string;
  status: string;
}

export default function CustomerDashboardAdmin() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    newThisMonth: 0,
    totalRevenue: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      // Fetch orders and aggregate customer data
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process customer data
      const customerMap = new Map();
      let totalRevenue = 0;
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      let newThisMonth = 0;

      orders?.forEach(order => {
        const email = order.customer_email;
        if (!email) return;

        totalRevenue += order.amount / 100; // Convert from cents

        if (!customerMap.has(email)) {
          const orderDate = new Date(order.created_at);
          const isNewThisMonth = orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
          if (isNewThisMonth) newThisMonth++;

          customerMap.set(email, {
            id: order.id,
            customer_name: order.customer_name || 'Unknown',
            customer_email: email,
            customer_phone: order.customer_phone || '',
            created_at: order.created_at,
            total_orders: 1,
            total_spent: order.amount / 100,
            last_service: order.scheduled_date || order.created_at,
            status: order.status === 'completed' ? 'active' : 'inactive'
          });
        } else {
          const customer = customerMap.get(email);
          customer.total_orders += 1;
          customer.total_spent += order.amount / 100;
          customer.last_service = order.scheduled_date || order.created_at;
          if (order.status === 'completed') {
            customer.status = 'active';
          }
        }
      });

      const customerList = Array.from(customerMap.values());
      setCustomers(customerList);

      setStats({
        totalCustomers: customerList.length,
        activeCustomers: customerList.filter(c => c.status === 'active').length,
        newThisMonth,
        totalRevenue
      });
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customer data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customer_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout title="Customer Dashboard" description="Manage and overview customer data">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Customer Dashboard" 
      description="Manage and overview customer data"
    >
      {/* Stats Overview */}
      <AdminGrid columns={4} className="mb-6">
        <AdminCard 
          title="Total Customers" 
          variant="default"
          icon={<Users className="h-5 w-5" />}
        >
          {stats.totalCustomers.toString()}
        </AdminCard>
        <AdminCard 
          title="Active Customers" 
          variant="stat"
          icon={<Users className="h-5 w-5" />}
        >
          {stats.activeCustomers.toString()}
        </AdminCard>
        <AdminCard 
          title="New This Month" 
          variant="metric"
          icon={<UserPlus className="h-5 w-5" />}
        >
          {stats.newThisMonth.toString()}
        </AdminCard>
        <AdminCard 
          title="Total Revenue" 
          variant="stat"
          icon={<DollarSign className="h-5 w-5" />}
        >
          ${stats.totalRevenue.toLocaleString()}
        </AdminCard>
      </AdminGrid>

      {/* Customer Management */}
      <AdminCard title="Customer Directory" description="All customers and their service history">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Total Spent</TableHead>
              <TableHead>Last Service</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>
                  <div className="font-medium">{customer.customer_name}</div>
                  <div className="text-sm text-muted-foreground">
                    Customer since {new Date(customer.created_at).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm">
                      <Mail className="h-3 w-3" />
                      {customer.customer_email}
                    </div>
                    {customer.customer_phone && (
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3" />
                        {customer.customer_phone}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{customer.total_orders}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">${customer.total_spent.toFixed(2)}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3" />
                    {new Date(customer.last_service).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                    {customer.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No customers found matching your search
          </div>
        )}
      </AdminCard>
    </AdminLayout>
  );
}