import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminGrid } from "@/components/admin/AdminGrid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DollarSign, 
  CreditCard, 
  Users,
  TrendingUp,
  Calendar,
  Download,
  Search,
  Filter
} from "lucide-react";

interface Payment {
  id: string;
  subcontractor_name: string;
  amount: number;
  period: string;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  payment_date: string;
  payment_method: string;
  jobs_completed: number;
}

export default function SubcontractorPayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    totalPaid: 0,
    pendingAmount: 0,
    activeSubcontractors: 0,
    averagePayout: 0
  });

  useEffect(() => {
    if (user) {
      fetchPayments();
      calculateStats();
    }
  }, [user]);

  const fetchPayments = async () => {
    try {
      // Simulate payment data - in real app, this would come from Stripe/payment processor
      const mockPayments: Payment[] = [
        {
          id: '1',
          subcontractor_name: 'Sarah Johnson',
          amount: 1250.00,
          period: 'Dec 2024',
          status: 'paid',
          payment_date: '2024-12-01',
          payment_method: 'Direct Deposit',
          jobs_completed: 8
        },
        {
          id: '2',
          subcontractor_name: 'Mike Chen',
          amount: 980.50,
          period: 'Dec 2024',
          status: 'pending',
          payment_date: '2024-12-15',
          payment_method: 'Direct Deposit',
          jobs_completed: 6
        },
        {
          id: '3',
          subcontractor_name: 'Lisa Rodriguez',
          amount: 1450.75,
          period: 'Dec 2024',
          status: 'processing',
          payment_date: '2024-12-10',
          payment_method: 'Direct Deposit',
          jobs_completed: 9
        },
        {
          id: '4',
          subcontractor_name: 'David Park',
          amount: 875.25,
          period: 'Nov 2024',
          status: 'paid',
          payment_date: '2024-11-30',
          payment_method: 'Direct Deposit',
          jobs_completed: 5
        },
        {
          id: '5',
          subcontractor_name: 'Emma Wilson',
          amount: 1125.00,
          period: 'Nov 2024',
          status: 'failed',
          payment_date: '2024-11-28',
          payment_method: 'Direct Deposit',
          jobs_completed: 7
        }
      ];

      setPayments(mockPayments);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalPaid = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const pendingAmount = payments
      .filter(p => p.status === 'pending' || p.status === 'processing')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const activeSubcontractors = new Set(payments.map(p => p.subcontractor_name)).size;
    const averagePayout = payments.length > 0 ? totalPaid / payments.filter(p => p.status === 'paid').length : 0;

    setStats({
      totalPaid,
      pendingAmount,
      activeSubcontractors,
      averagePayout
    });
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.subcontractor_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'processing': return 'secondary';
      case 'pending': return 'outline';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  const processPayment = async (paymentId: string) => {
    // In real app, this would integrate with Stripe or payment processor
    console.log('Processing payment:', paymentId);
    
    setPayments(prev => prev.map(p => 
      p.id === paymentId 
        ? { ...p, status: 'processing' as const }
        : p
    ));
  };

  return (
    <AdminLayout 
      title="Subcontractor Payments" 
      description="Manage payouts, view payment history, and track earnings"
    >
      <div className="space-y-6">
        {/* Payment Stats */}
        <AdminGrid columns={4} gap="md">
          <AdminCard
            variant="metric"
            title="Total Paid"
            icon={<DollarSign className="h-4 w-4" />}
          >
            <div className="text-3xl font-bold tracking-tight text-success">
              ${stats.totalPaid.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </AdminCard>

          <AdminCard
            variant="metric"
            title="Pending Payments"
            icon={<CreditCard className="h-4 w-4" />}
          >
            <div className="text-3xl font-bold tracking-tight text-warning">
              ${stats.pendingAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting processing</p>
          </AdminCard>

          <AdminCard
            variant="metric"
            title="Active Cleaners"
            icon={<Users className="h-4 w-4" />}
          >
            <div className="text-3xl font-bold tracking-tight">{stats.activeSubcontractors}</div>
            <p className="text-xs text-muted-foreground mt-1">Receiving payments</p>
          </AdminCard>

          <AdminCard
            variant="metric"
            title="Average Payout"
            icon={<TrendingUp className="h-4 w-4" />}
          >
            <div className="text-3xl font-bold tracking-tight">
              ${stats.averagePayout.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per payment</p>
          </AdminCard>
        </AdminGrid>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Payment History</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button size="sm">
                  Process Pending
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search subcontractors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading payments...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subcontractor</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Jobs</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {payment.subcontractor_name}
                      </TableCell>
                      <TableCell>{payment.period}</TableCell>
                      <TableCell>{payment.jobs_completed}</TableCell>
                      <TableCell className="font-mono">
                        ${payment.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {payment.payment_method}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(payment.status) as any}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payment.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => processPayment(payment.id)}
                          >
                            Process
                          </Button>
                        )}
                        {payment.status === 'failed' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => processPayment(payment.id)}
                          >
                            Retry
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}