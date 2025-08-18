import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminGrid } from "@/components/admin/AdminGrid";
import { AdminSection } from "@/components/admin/AdminSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  DollarSign, 
  RefreshCw, 
  AlertTriangle,
  TrendingUp,
  Search,
  Eye,
  XCircle,
  CheckCircle
} from "lucide-react";

interface Payment {
  id: string;
  customer_email: string;
  customer_name?: string;
  amount: number;
  status: string;
  payment_method?: string;
  created_at: string;
  stripe_payment_intent_id?: string;
  order_id?: string;
}

export default function PaymentPortalAdmin() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      
      // Fetch payment data from orders table (since payments are tracked there)
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Transform orders into payment records
      const paymentData = orders?.map(order => ({
        id: order.id,
        customer_email: order.customer_email || '',
        customer_name: order.customer_name,
        amount: (order.amount || 0) / 100,
        status: order.service_status === 'completed' ? 'completed' : 'pending',
        payment_method: order.cleaning_type || 'Standard Cleaning',
        created_at: order.created_at,
        stripe_payment_intent_id: order.stripe_payment_intent_id,
        order_id: order.id
      })) || [];

      setPayments(paymentData);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: "Error",
        description: "Failed to load payment data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(payment =>
    payment.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.id.includes(searchTerm)
  );

  const totalRevenue = payments.reduce((sum, payment) => 
    payment.status === 'completed' ? sum + payment.amount : sum, 0
  );
  const pendingPayments = payments.filter(p => p.status === 'pending').length;
  const completedPayments = payments.filter(p => p.status === 'completed').length;
  const failedPayments = payments.filter(p => p.status === 'failed').length;

  const handleRefund = async (paymentId: string) => {
    try {
      // Call refund function
      const { error } = await supabase.functions.invoke('process-refund', {
        body: { payment_id: paymentId }
      });

      if (error) throw error;

      toast({
        title: "Refund Processed",
        description: "The refund has been processed successfully",
      });

      fetchPayments(); // Refresh data
    } catch (error) {
      toast({
        title: "Refund Failed",
        description: "Failed to process refund",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><RefreshCw className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <AdminLayout 
      title="Payment Portal" 
      description="Manage payments, refunds, and billing operations"
    >
      <div className="space-y-6">
        {/* Payment Metrics */}
        <AdminSection title="Payment Overview" description="Financial transaction metrics">
          <AdminGrid columns={4} gap="md">
            <AdminCard variant="metric" title="Total Revenue" icon={<DollarSign className="h-4 w-4" />}>
              <div className="text-3xl font-bold text-success">${totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Completed payments</p>
            </AdminCard>

            <AdminCard variant="metric" title="Completed" icon={<CheckCircle className="h-4 w-4" />}>
              <div className="text-3xl font-bold text-green-600">{completedPayments}</div>
              <p className="text-xs text-muted-foreground">Successful transactions</p>
            </AdminCard>

            <AdminCard variant="metric" title="Pending" icon={<RefreshCw className="h-4 w-4" />}>
              <div className="text-3xl font-bold text-yellow-600">{pendingPayments}</div>
              <p className="text-xs text-muted-foreground">Awaiting processing</p>
            </AdminCard>

            <AdminCard variant="metric" title="Failed" icon={<AlertTriangle className="h-4 w-4" />}>
              <div className="text-3xl font-bold text-red-600">{failedPayments}</div>
              <p className="text-xs text-muted-foreground">Failed transactions</p>
            </AdminCard>
          </AdminGrid>
        </AdminSection>

        {/* Payment Management */}
        <AdminSection title="Payment Management" description="View and manage payment transactions">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search payments by customer or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={fetchPayments}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {/* Payment Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Transactions ({filteredPayments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <CreditCard className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                      <p className="text-muted-foreground">Loading payments...</p>
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{payment.customer_name || 'N/A'}</p>
                              <p className="text-sm text-muted-foreground">{payment.customer_email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">${payment.amount.toFixed(2)}</span>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(payment.status)}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm capitalize">{payment.payment_method || 'N/A'}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {new Date(payment.created_at).toLocaleDateString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => setSelectedPayment(payment)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Payment Details</DialogTitle>
                                  </DialogHeader>
                                  {selectedPayment && (
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <label className="text-sm font-medium">Payment ID</label>
                                          <p className="text-sm text-muted-foreground">{selectedPayment.id}</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Customer</label>
                                          <p className="text-sm text-muted-foreground">{selectedPayment.customer_name}</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Amount</label>
                                          <p className="text-sm text-muted-foreground">${selectedPayment.amount.toFixed(2)}</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Status</label>
                                          <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Payment Method</label>
                                          <p className="text-sm text-muted-foreground">{selectedPayment.payment_method || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Date</label>
                                          <p className="text-sm text-muted-foreground">
                                            {new Date(selectedPayment.created_at).toLocaleString()}
                                          </p>
                                        </div>
                                      </div>
                                      {selectedPayment.stripe_payment_intent_id && (
                                        <div>
                                          <label className="text-sm font-medium">Stripe Payment Intent</label>
                                          <p className="text-sm text-muted-foreground font-mono">
                                            {selectedPayment.stripe_payment_intent_id}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                              {payment.status === 'completed' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleRefund(payment.id)}
                                >
                                  <RefreshCw className="h-4 w-4 mr-1" />
                                  Refund
                                </Button>
                              )}
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
    </AdminLayout>
  );
}