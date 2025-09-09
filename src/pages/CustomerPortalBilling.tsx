import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
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

// Use the existing Stripe configuration from our lib
import { getStripePromise } from '@/lib/stripe';

interface PaymentFormProps {
  amount: number;
  tipAmount: number;
  bookingId: string;
  customerId: string;
  onSuccess: () => void;
}

function PaymentForm({ amount, tipAmount, bookingId, customerId, onSuccess }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    try {
      // Create payment intent
      const { data, error } = await supabase.functions.invoke('customer-payment-intent', {
        body: {
          customerId,
          bookingId,
          amount,
          tipAmount
        }
      });

      if (error) throw error;

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      // Confirm payment
      const { error: paymentError } = await stripe.confirmCardPayment(
        data.clientSecret,
        {
          payment_method: {
            card: cardElement,
          }
        }
      );

      if (paymentError) {
        toast({
          title: "Payment Failed",
          description: paymentError.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful!",
          description: "Your payment has been processed successfully.",
        });
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border rounded-lg bg-muted/5">
        <Label className="text-sm font-medium mb-2 block">Card Information</Label>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Service Balance:</span>
          <span>${amount.toFixed(2)}</span>
        </div>
        {tipAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span>Tip:</span>
            <span>${tipAmount.toFixed(2)}</span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between font-medium">
          <span>Total:</span>
          <span>${(amount + tipAmount).toFixed(2)}</span>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pay ${(amount + tipAmount).toFixed(2)}
          </>
        )}
      </Button>
    </form>
  );
}

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

              <Elements stripe={getStripePromise()}>
                <PaymentForm
                  amount={balance}
                  tipAmount={tipAmount}
                  bookingId={bookingId}
                  customerId={customerId}
                  onSuccess={handlePaymentSuccess}
                />
              </Elements>
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