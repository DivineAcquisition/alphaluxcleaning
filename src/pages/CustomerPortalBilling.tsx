import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  CreditCard, 
  DollarSign, 
  Download,
  Loader2,
  Heart
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EmbeddedSquarePaymentForm } from '@/components/booking/EmbeddedSquarePaymentForm';

export default function CustomerPortalBilling() {
  const [balance, setBalance] = useState(60);
  const [tipAmount, setTipAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Mock data
  const customerId = 'customer-123';
  const bookingId = 'booking-123';
  const customerEmail = 'customer@example.com';
  const customerName = 'John Doe';

  useEffect(() => {
    const checkAuth = () => {
      const portalToken = localStorage.getItem('customer_portal_token');
      if (!portalToken) {
        navigate('/portal/login');
        return false;
      }
      return true;
    };

    if (checkAuth()) {
      // Mock data loading
      setTimeout(() => {
        setPaymentHistory([
          {
            id: '1',
            date: '2023-12-28',
            amount: 120,
            method: 'Credit Card',
            status: 'Completed',
            description: 'Deep cleaning service'
          }
        ]);
        setLoading(false);
      }, 1000);
    }
  }, [navigate]);

  const handlePaymentSuccess = () => {
    setBalance(0);
    toast({
      title: "Payment Successful!",
      description: "Thank you for your payment. A receipt has been sent to your email.",
    });
    navigate('/portal');
  };

  const addTip = (amount: number) => {
    setTipAmount(prev => Math.max(0, prev + amount));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/portal')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Billing & Payments</h1>
            <p className="text-muted-foreground">Manage your payment information</p>
          </div>
        </div>

        {/* Current Balance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Current Balance
            </CardTitle>
            <CardDescription>
              Amount due for completed services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary mb-4">
              ${balance.toFixed(2)}
            </div>
            {balance > 0 ? (
              <Badge variant="secondary">Payment Due</Badge>
            ) : (
              <Badge className="bg-green-500 text-white">Paid in Full</Badge>
            )}
          </CardContent>
        </Card>

        {/* Payment Form */}
        {balance > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Make a Payment</CardTitle>
              <CardDescription>
                Pay your balance securely with a credit or debit card
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tip Section */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Add a tip (optional)
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addTip(5)}
                  >
                    +$5
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addTip(10)}
                  >
                    +$10
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addTip(15)}
                  >
                    +$15
                  </Button>
                  <div className="flex items-center gap-2 ml-4">
                    <Label htmlFor="custom-tip" className="text-sm">Custom:</Label>
                    <Input
                      id="custom-tip"
                      type="number"
                      placeholder="0"
                      className="w-20 h-8"
                      value={tipAmount || ''}
                      onChange={(e) => setTipAmount(Number(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                {tipAmount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Tip amount: ${tipAmount.toFixed(2)}
                  </p>
                )}
              </div>

              <EmbeddedSquarePaymentForm
                paymentAmount={balance + tipAmount}
                fullAmount={balance + tipAmount}
                paymentType="full"
                customerEmail={customerEmail}
                customerName={customerName}
                bookingId={bookingId}
                onSuccess={(paymentId) => {
                  handlePaymentSuccess();
                }}
                onCancel={() => {
                  toast({
                    title: "Payment Cancelled",
                    description: "Your payment was cancelled.",
                  });
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>Your recent payments and receipts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentHistory.map((payment: any) => (
                <div key={payment.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{payment.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(payment.date).toLocaleDateString()} • {payment.method}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">${payment.amount.toFixed(2)}</span>
                    <Badge className="bg-green-500 text-white">{payment.status}</Badge>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {paymentHistory.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No payment history available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}