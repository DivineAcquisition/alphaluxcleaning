import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { DeleteTestData } from '@/components/DeleteTestData';
import { 
  Database, 
  ArrowLeft,
  RefreshCw,
  Trash2,
  Eye,
  Calendar,
  DollarSign,
  User,
  AlertTriangle
} from 'lucide-react';

interface Booking {
  id: string;
  customer_id: string;
  service_type: string;
  frequency: string;
  sqft_or_bedrooms: string;
  est_price: number;
  status: string;
  service_date: string;
  zip_code: string;
  created_at: string;
  source_channel: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  created_at: string;
}

interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  status: string;
  stripe_payment_id: string;
  charge_type: string;
  deposit_amount: number;
  balance_due: number;
  created_at: string;
}

export function DevTestDatabase() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (bookingsError) throw bookingsError;
      setBookings(bookingsData || []);

      // Fetch customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (customersError) throw customersError;
      setCustomers(customersData || []);

      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch database data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const cleanupTestData = async () => {
    if (!confirm('Are you sure you want to delete all test data? This cannot be undone.')) {
      return;
    }

    try {
      // Delete test bookings (assuming test data has 'test' in customer email or specific patterns)
      const { error: paymentsError } = await supabase
        .from('payments')
        .delete()
        .in('booking_id', bookings.filter(b => b.source_channel === 'UI_DIRECT').map(b => b.id));

      const { error: bookingsError } = await supabase
        .from('bookings')
        .delete()
        .eq('source_channel', 'UI_DIRECT');

      const { error: customersError } = await supabase
        .from('customers')
        .delete()
        .like('email', '%test%');

      if (paymentsError || bookingsError || customersError) {
        throw new Error('Failed to cleanup some data');
      }

      toast.success('Test data cleaned up successfully');
      fetchData();
    } catch (error) {
      console.error('Error cleaning up data:', error);
      toast.error('Failed to cleanup test data');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'confirmed': 'default',
      'pending': 'secondary',
      'cancelled': 'destructive',
      'completed': 'default'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Helmet>
        <title>Database Inspector - Dev Dashboard</title>
        <meta name="description" content="View and manage test database records" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/dev-test')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Database className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-bold text-primary">Database Inspector</h1>
            </div>
            <p className="text-muted-foreground">
              View and manage bookings, customers, and payments
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchData} variant="outline" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={cleanupTestData} variant="destructive" size="sm">
              <Trash2 className="w-4 h-4 mr-2" />
              Cleanup Test Data
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-500 text-white rounded-lg">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{bookings.length}</p>
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-500 text-white rounded-lg">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{customers.length}</p>
                  <p className="text-sm text-muted-foreground">Total Customers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-purple-500 text-white rounded-lg">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{payments.length}</p>
                  <p className="text-sm text-muted-foreground">Total Payments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Test Data Cleanup */}
        <div className="mb-8">
          <DeleteTestData />
        </div>

        {/* Database Tables */}
        <Card>
          <CardHeader>
            <CardTitle>Database Records</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="bookings">Bookings ({bookings.length})</TabsTrigger>
                <TabsTrigger value="customers">Customers ({customers.length})</TabsTrigger>
                <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="bookings" className="mt-6">
                <div className="space-y-4">
                  {bookings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                      No bookings found
                    </div>
                  ) : (
                    bookings.map((booking) => (
                      <Card key={booking.id} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{booking.service_type}</Badge>
                            {getStatusBadge(booking.status)}
                            <span className="text-sm text-muted-foreground">
                              {booking.frequency}
                            </span>
                          </div>
                          <span className="font-medium">{formatCurrency(booking.est_price)}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Size</p>
                            <p>{booking.sqft_or_bedrooms}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Location</p>
                            <p>{booking.zip_code}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Service Date</p>
                            <p>{booking.service_date || 'Not scheduled'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Created</p>
                            <p>{formatDate(booking.created_at)}</p>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="customers" className="mt-6">
                <div className="space-y-4">
                  {customers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                      No customers found
                    </div>
                  ) : (
                    customers.map((customer) => (
                      <Card key={customer.id} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">{customer.name}</h4>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(customer.created_at)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Email</p>
                            <p>{customer.email}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Phone</p>
                            <p>{customer.phone}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Location</p>
                            <p>{customer.city}, {customer.state} {customer.postal_code}</p>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="payments" className="mt-6">
                <div className="space-y-4">
                  {payments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                      No payments found
                    </div>
                  ) : (
                    payments.map((payment) => (
                      <Card key={payment.id} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {getStatusBadge(payment.status)}
                            <Badge variant="outline">{payment.charge_type}</Badge>
                          </div>
                          <span className="font-medium">{formatCurrency(payment.amount)}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Stripe ID</p>
                            <p className="font-mono text-xs">{payment.stripe_payment_id}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Deposit</p>
                            <p>{formatCurrency(payment.deposit_amount || 0)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Balance Due</p>
                            <p>{formatCurrency(payment.balance_due || 0)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Created</p>
                            <p>{formatDate(payment.created_at)}</p>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}