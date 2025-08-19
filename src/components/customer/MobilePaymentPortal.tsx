import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  DollarSign, 
  Receipt, 
  Star,
  Plus,
  Smartphone,
  Shield,
  Zap
} from 'lucide-react';
import { usePaymentData } from '@/hooks/usePaymentData';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function MobilePaymentPortal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { orders, paymentMethods, subscriptions, refreshAll } = usePaymentData();
  const isNative = false; // TODO: Implement native detection
  const [loading, setLoading] = useState(false);

  const handleQuickPayment = async (method: 'apple-pay' | 'google-pay' | 'card') => {
    setLoading(true);
    try {
      // TODO: Implement actual payment processing
      toast({
        title: "Payment Method Selected",
        description: `${method} payment method ready for use.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set up payment method.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      // Call customer-portal edge function
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      // Open customer portal in new tab
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open customer portal. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Payment Overview */}
      <Card className="bg-gradient-to-r from-primary to-accent text-white border-none">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1">Payment Center</h2>
              <p className="text-white/80">Manage payments & billing</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">${orders?.reduce((sum, order) => sum + (order.amount / 100), 0).toFixed(0) || '0'}</div>
              <div className="text-white/80 text-sm">Total Spent</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Quick Pay Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3">
            {/* Apple Pay */}
            <Button
              variant="outline"
              className="h-16 justify-start p-4 border-2 hover:border-primary/50"
              onClick={() => handleQuickPayment('apple-pay')}
              disabled={!isNative}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center">
                  📱
                </div>
                <div className="text-left">
                  <div className="font-semibold">Apple Pay</div>
                  <div className="text-xs text-muted-foreground">Touch ID or Face ID</div>
                </div>
              </div>
              <div className="ml-auto">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Fast
                </Badge>
              </div>
            </Button>

            {/* Google Pay */}
            <Button
              variant="outline"
              className="h-16 justify-start p-4 border-2 hover:border-primary/50"
              onClick={() => handleQuickPayment('google-pay')}
              disabled={!isNative}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center">
                  G
                </div>
                <div className="text-left">
                  <div className="font-semibold">Google Pay</div>
                  <div className="text-xs text-muted-foreground">Fingerprint or PIN</div>
                </div>
              </div>
              <div className="ml-auto">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Fast
                </Badge>
              </div>
            </Button>

            {/* Traditional Card */}
            <Button
              variant="outline"
              className="h-16 justify-start p-4 border-2 hover:border-primary/50"
              onClick={() => handleQuickPayment('card')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Credit/Debit Card</div>
                  <div className="text-xs text-muted-foreground">Visa, Mastercard, Amex</div>
                </div>
              </div>
            </Button>
          </div>

          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>All payments are secured with 256-bit SSL encryption</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Saved Payment Methods
            </span>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paymentMethods?.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No payment methods yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add a payment method for faster checkout
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods?.map((method: any, index: number) => (
                <div key={method.id || index} className="p-4 border border-border rounded-lg bg-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">**** {method.last4 || '****'}</div>
                        <div className="text-sm text-muted-foreground">{method.brand || 'Card'}</div>
                      </div>
                    </div>
                    {method.is_default && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Recent Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders?.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No payments yet</h3>
              <p className="text-sm text-muted-foreground">
                Your payment history will appear here after your first service
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders?.slice(0, 5).map((order: any) => (
                <div key={order.id} className="p-4 border border-border rounded-lg bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium text-foreground">House Cleaning Service</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-foreground">
                        ${(order.amount / 100).toFixed(2)}
                      </div>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {order.status || 'Completed'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Management */}
      {subscriptions && subscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Clean & Covered Membership
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border border-primary/20">
              <div>
                <div className="font-semibold text-foreground">Premium Member</div>
                <div className="text-sm text-muted-foreground">$30/month • Active</div>
              </div>
              <Button variant="outline" size="sm" onClick={handleManageSubscription}>
                Manage
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}