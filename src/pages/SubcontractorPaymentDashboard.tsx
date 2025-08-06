import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, DollarSign, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface SubcontractorPayment {
  id: string;
  subcontractor_id: string;
  total_amount: number;
  subcontractor_amount: number;
  company_amount: number;
  split_percentage: number;
  payment_status: string;
  paid_at: string;
  tier_level?: number;
  monthly_fee?: number;
  hourly_rate?: number;
  created_at: string;
  updated_at: string;
  subcontractor: {
    full_name: string;
    email: string;
  };
}

interface PaymentSummary {
  total_revenue: number;
  pending_payments: number;
  failed_payments: number;
  successful_payments: number;
}

export default function SubcontractorPaymentDashboard() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch payments data
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['subcontractor-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subcontractor_payments')
        .select(`
          *,
          subcontractor:subcontractors!inner(full_name, email)
        `)
        .order('paid_at', { ascending: false });
      
      if (error) throw error;
      return data as SubcontractorPayment[];
    }
  });

  // Calculate payment summary
  const paymentSummary: PaymentSummary = payments.reduce(
    (acc, payment) => {
      acc.total_revenue += payment.total_amount;
      
      switch (payment.payment_status) {
        case 'completed':
          acc.successful_payments++;
          break;
        case 'pending':
          acc.pending_payments++;
          break;
        case 'failed':
          acc.failed_payments++;
          break;
      }
      
      return acc;
    },
    { total_revenue: 0, pending_payments: 0, failed_payments: 0, successful_payments: 0 }
  );

  // Process payment retry mutation
  const retryPaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      // Call edge function to retry payment processing
      const { data, error } = await supabase.functions.invoke('process-subcontractor-payment', {
        body: { paymentId, action: 'retry' }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Payment Retry Initiated",
        description: "Payment processing has been retried successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['subcontractor-payments'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to retry payment: " + error.message,
        variant: "destructive"
      });
    }
  });

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.subcontractor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.subcontractor.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Payment Dashboard" description="Loading...">
        <div>Loading payment data...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Subcontractor Payment Dashboard" 
      description="Monitor and manage subcontractor subscription payments"
    >
      <div className="space-y-6">
        {/* Payment Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${paymentSummary.total_revenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful Payments</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{paymentSummary.successful_payments}</div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{paymentSummary.pending_payments}</div>
              <p className="text-xs text-muted-foreground">Processing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{paymentSummary.failed_payments}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search subcontractors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Payments List */}
        <div className="grid gap-4">
          {filteredPayments.map((payment) => (
            <Card key={payment.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(payment.payment_status)}
                    <div>
                      <h3 className="font-semibold">{payment.subcontractor.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{payment.subcontractor.email}</p>
                    </div>
                  </div>
                  <Badge variant={getStatusBadgeVariant(payment.payment_status)}>
                    {payment.payment_status}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <div className="font-medium">${payment.total_amount}</div>
                    <div className="text-muted-foreground">Amount</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">Tier {payment.tier_level || 1}</div>
                    <div className="text-muted-foreground">${payment.hourly_rate || 16}/hr</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">
                      {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : 'Pending'}
                    </div>
                    <div className="text-muted-foreground">Payment Date</div>
                  </div>
                  
                  {payment.payment_status === 'failed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => retryPaymentMutation.mutate(payment.id)}
                      disabled={retryPaymentMutation.isPending}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      {retryPaymentMutation.isPending ? 'Retrying...' : 'Retry'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPayments.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Payments Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}