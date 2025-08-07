import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminCard } from '@/components/admin/AdminCard';
import { AdminGrid } from '@/components/admin/AdminGrid';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CreditCard, DollarSign, TrendingUp, Calendar, Search, Eye, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Payment {
  id: string;
  amount: number;
  customer_name: string;
  customer_email: string;
  payment_method: string;
  status: string;
  created_at: string;
  stripe_session_id: string;
  service_type: string;
}

export default function PaymentPortalAdmin() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalTransactions: 0,
    averageOrder: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform orders to payment format
      const paymentData = orders?.map(order => ({
        id: order.id,
        amount: order.amount / 100, // Convert from cents
        customer_name: order.customer_name || 'Unknown',
        customer_email: order.customer_email || '',
        payment_method: 'Credit Card', // Default for now
        status: order.status === 'completed' ? 'successful' : 'pending',
        created_at: order.created_at,
        stripe_session_id: order.stripe_session_id || '',
        service_type: order.cleaning_type || 'Standard'
      })) || [];

      setPayments(paymentData);

      // Calculate stats
      const totalRevenue = paymentData.reduce((sum, payment) => sum + payment.amount, 0);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = paymentData
        .filter(payment => {
          const paymentDate = new Date(payment.created_at);
          return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
        })
        .reduce((sum, payment) => sum + payment.amount, 0);

      setStats({
        totalRevenue,
        monthlyRevenue,
        totalTransactions: paymentData.length,
        averageOrder: paymentData.length > 0 ? totalRevenue / paymentData.length : 0
      });
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: "Error",
        description: "Failed to load payment data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'successful': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'secondary';
    }
  };

  const filteredPayments = payments.filter(payment =>
    payment.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout title="Payment Portal" description="Manage payments and financial transactions">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Payment Portal" 
      description="Manage payments and financial transactions"
    >
      {/* Stats Overview */}
      <AdminGrid columns={4} className="mb-6">
        <AdminCard 
          title="Total Revenue" 
          variant="stat"
          icon={<DollarSign className="h-5 w-5" />}
        >
          ${stats.totalRevenue.toLocaleString()}
        </AdminCard>
        <AdminCard 
          title="Monthly Revenue" 
          variant="metric"
          icon={<TrendingUp className="h-5 w-5" />}
        >
          ${stats.monthlyRevenue.toLocaleString()}
        </AdminCard>
        <AdminCard 
          title="Total Transactions" 
          variant="default"
          icon={<CreditCard className="h-5 w-5" />}
        >
          {stats.totalTransactions.toString()}
        </AdminCard>
        <AdminCard 
          title="Average Order" 
          variant="stat"
          icon={<DollarSign className="h-5 w-5" />}
        >
          ${stats.averageOrder.toFixed(2)}
        </AdminCard>
      </AdminGrid>

      {/* Payments Management */}
      <AdminCard title="Payment Transactions" description="All payment transactions and their status">
        <div className="flex items-center justify-between mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>
                  <div className="font-mono text-sm">{payment.id.slice(0, 8)}...</div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{payment.customer_name}</div>
                    <div className="text-sm text-muted-foreground">{payment.customer_email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">${payment.amount.toFixed(2)}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{payment.service_type}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    {payment.payment_method}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(payment.status)}>
                    {payment.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3" />
                    {new Date(payment.created_at).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredPayments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No payments found matching your search
          </div>
        )}
      </AdminCard>
    </AdminLayout>
  );
}