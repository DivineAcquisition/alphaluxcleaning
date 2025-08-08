import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { CreditCard, RefreshCw, DollarSign, Users, TrendingUp, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminPaymentCenter = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleRefund = async (orderId: string, amount: number, reason: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('process-refund', {
        body: { order_id: orderId, amount, reason }
      });
      
      if (error) throw error;
      toast.success('Refund processed successfully');
    } catch (error) {
      console.error('Refund error:', error);
      toast.error('Failed to process refund');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary to-accent text-white">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <CreditCard className="h-6 w-6" />
                Admin Payment Control Center
              </CardTitle>
              <p className="text-primary-foreground/80">
                Advanced payment management, refunds, and financial reporting
              </p>
            </CardHeader>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-semibold">$12,450</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Users className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Customers</p>
                    <p className="text-2xl font-semibold">234</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-semibold">98.5%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Issues</p>
                    <p className="text-2xl font-semibold">3</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="payments" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="payments">Payment Management</TabsTrigger>
              <TabsTrigger value="refunds">Refunds & Disputes</TabsTrigger>
              <TabsTrigger value="subscriptions">Subscription Admin</TabsTrigger>
              <TabsTrigger value="analytics">Financial Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="payments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>Payment management interface ready for implementation</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="refunds" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Refund Processing</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <RefreshCw className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>Refund management system ready for implementation</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscriptions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Administration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>Subscription admin tools ready for implementation</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>Advanced analytics dashboard ready for implementation</p>
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

export default AdminPaymentCenter;