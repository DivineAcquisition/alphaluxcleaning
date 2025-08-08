import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navigation } from "@/components/Navigation";
import { CreditCard, Receipt, Search, DollarSign, Heart, User, History, Settings, LogIn } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { usePaymentData } from "@/hooks/usePaymentData";
import { PaymentHistory } from "@/components/payment/PaymentHistory";
import { PaymentMethods } from "@/components/payment/PaymentMethods";
import { SubscriptionManagement } from "@/components/payment/SubscriptionManagement";
import { useNavigate } from "react-router-dom";

const PaymentPortal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { orders, paymentMethods, subscriptions, loading, refreshAll } = usePaymentData();
  const [invoiceId, setInvoiceId] = useState("");
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [tipAmount, setTipAmount] = useState("");

  const lookupInvoice = async () => {
    if (!invoiceId.trim()) {
      toast.error("Please enter an invoice or order ID");
      return;
    }

    setLookupLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .or(`id.eq.${invoiceId},stripe_session_id.eq.${invoiceId}`)
        .single();

      if (error || !data) {
        toast.error("Invoice not found");
        return;
      }

      setOrderDetails(data);
      toast.success("Invoice found!");
    } catch (error) {
      console.error("Error looking up invoice:", error);
      toast.error("Failed to lookup invoice");
    } finally {
      setLookupLoading(false);
    }
  };

  const handlePayment = async (type: 'invoice' | 'tip') => {
    try {
      const amount = type === 'tip' ? parseFloat(tipAmount) * 100 : orderDetails.amount;
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          amount,
          currency: 'usd',
          order_id: orderDetails.id,
          payment_type: type,
          customer_email: orderDetails.customer_email
        }
      });

      if (error) throw error;

      // Redirect to Stripe Checkout
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment');
    }
  };

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
        <Navigation />
        
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary to-accent text-white text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                  <CreditCard className="h-6 w-6" />
                  Payment Portal
                </CardTitle>
                <p className="text-primary-foreground/80">
                  Please sign in to access your payment information
                </p>
              </CardHeader>
              <CardContent className="text-center py-8">
                <LogIn className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-6">
                  You need to be signed in to view your payment history, manage payment methods, and access subscription settings.
                </p>
                <Button onClick={() => navigate('/auth')} size="lg">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary to-accent text-white text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <CreditCard className="h-6 w-6" />
                Payment Portal
              </CardTitle>
              <p className="text-primary-foreground/80">
                Manage your payments, subscriptions, and billing information
              </p>
            </CardHeader>
          </Card>

          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="methods">Payment Methods</TabsTrigger>
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
              <TabsTrigger value="lookup">Invoice Lookup</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Receipt className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Orders</p>
                        <p className="text-2xl font-semibold">{orders.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-accent/10 rounded-lg">
                        <CreditCard className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Payment Methods</p>
                        <p className="text-2xl font-semibold">{paymentMethods.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-secondary/10 rounded-lg">
                        <Settings className="h-6 w-6 text-secondary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                        <p className="text-2xl font-semibold">{subscriptions.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {orders.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div>
                        <p className="font-medium">{order.cleaning_type?.replace(/_/g, ' ') || 'Cleaning Service'}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">${(order.amount / 100).toFixed(2)}</span>
                        <Badge variant={order.status === 'paid' ? 'default' : 'secondary'}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No recent activity</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <PaymentHistory orders={orders} loading={loading} />
            </TabsContent>

            <TabsContent value="methods" className="space-y-6">
              <PaymentMethods paymentMethods={paymentMethods} onRefresh={refreshAll} />
            </TabsContent>

            <TabsContent value="subscriptions" className="space-y-6">
              <SubscriptionManagement subscriptions={subscriptions} onRefresh={refreshAll} />
            </TabsContent>

            <TabsContent value="lookup" className="space-y-6">
              {/* Invoice Lookup */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Find Your Invoice
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoiceId">Invoice or Order ID</Label>
                    <div className="flex gap-2">
                      <Input
                        id="invoiceId"
                        placeholder="Enter your invoice ID or session ID"
                        value={invoiceId}
                        onChange={(e) => setInvoiceId(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && lookupInvoice()}
                      />
                      <Button onClick={lookupInvoice} disabled={lookupLoading}>
                        {lookupLoading ? "Searching..." : "Search"}
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    You can find your invoice ID in your email confirmation or booking details.
                  </p>
                </CardContent>
              </Card>

              {/* Order Details */}
              {orderDetails && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="h-5 w-5" />
                      Invoice Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Order ID:</strong> {orderDetails.id}
                      </div>
                      <div>
                        <strong>Amount:</strong> ${(orderDetails.amount / 100).toFixed(2)}
                      </div>
                      <div>
                        <strong>Customer:</strong> {orderDetails.customer_name}
                      </div>
                      <div>
                        <strong>Status:</strong> 
                        <Badge variant={orderDetails.status === 'paid' ? 'default' : 'secondary'} className="ml-2">
                          {orderDetails.status}
                        </Badge>
                      </div>
                      <div className="col-span-2">
                        <strong>Service:</strong> {orderDetails.cleaning_type?.replace(/_/g, ' ')}
                      </div>
                    </div>

                    {orderDetails.status !== 'paid' && (
                      <Button onClick={() => handlePayment('invoice')} className="w-full" size="lg">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay ${(orderDetails.amount / 100).toFixed(2)}
                      </Button>
                    )}

                    {orderDetails.status === 'paid' && (
                      <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-green-800 font-semibold">✓ Invoice Paid</div>
                        <div className="text-green-600 text-sm">This invoice has been paid in full.</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Tip Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    Show Your Appreciation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Love the service? Add a tip to show your appreciation for our cleaning team.
                  </p>

                  {/* Quick Tip Amounts */}
                  <div className="grid grid-cols-4 gap-2">
                    {['10', '15', '20', '25'].map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        onClick={() => setTipAmount(amount)}
                        className={tipAmount === amount ? 'bg-primary text-white' : ''}
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customTip">Custom Amount</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="customTip"
                        type="number"
                        placeholder="0.00"
                        value={tipAmount}
                        onChange={(e) => setTipAmount(e.target.value)}
                        className="pl-10"
                        min="1"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={() => handlePayment('tip')} 
                    disabled={!tipAmount || parseFloat(tipAmount) < 1}
                    className="w-full" 
                    size="lg"
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    Send Tip ${tipAmount || '0.00'}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Tips go directly to your cleaning team. Thank you for your generosity!
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PaymentPortal;