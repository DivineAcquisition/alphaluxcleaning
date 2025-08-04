import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navigation } from "@/components/Navigation";
import { CreditCard, Receipt, Search, DollarSign, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PaymentPortal = () => {
  const [invoiceId, setInvoiceId] = useState("");
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tipAmount, setTipAmount] = useState("");

  const lookupInvoice = async () => {
    if (!invoiceId.trim()) {
      toast.error("Please enter an invoice or order ID");
      return;
    }

    setLoading(true);
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
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          
          {/* Header */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary to-accent text-white text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <CreditCard className="h-6 w-6" />
                Payment Portal
              </CardTitle>
              <p className="text-primary-foreground/80">
                Pay invoices, add tips, and manage your payments
              </p>
            </CardHeader>
          </Card>

          <Tabs defaultValue="lookup" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="lookup">Invoice Lookup</TabsTrigger>
              <TabsTrigger value="tip">Add Tip</TabsTrigger>
            </TabsList>
            
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
                      <Button onClick={lookupInvoice} disabled={loading}>
                        {loading ? "Searching..." : "Search"}
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
            </TabsContent>

            <TabsContent value="tip" className="space-y-6">
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

              {/* Recent Tips */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-8">
                    <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No tips yet. Be the first to show appreciation!</p>
                  </div>
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