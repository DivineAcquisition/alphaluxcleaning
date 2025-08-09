import React, { useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { usePaymentData } from "@/hooks/usePaymentData";
import { PaymentMethods } from "@/components/payment/PaymentMethods";
import { SubscriptionManagement } from "@/components/payment/SubscriptionManagement";
import { InvoicesList } from "@/components/payment/InvoicesList";

const setMeta = (title: string, description: string, canonicalPath: string) => {
  document.title = title;
  const d = document;
  const metaDesc = d.querySelector('meta[name="description"]') || d.createElement('meta');
  metaDesc.setAttribute('name', 'description');
  metaDesc.setAttribute('content', description);
  if (!metaDesc.parentNode) d.head.appendChild(metaDesc);

  const canonical = d.querySelector('link[rel="canonical"]') || d.createElement('link');
  canonical.setAttribute('rel', 'canonical');
  const origin = window.location.origin;
  canonical.setAttribute('href', `${origin}${canonicalPath}`);
  if (!canonical.parentNode) d.head.appendChild(canonical);
};

const Billing: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { paymentMethods, subscriptions, refreshAll, loading } = usePaymentData();

  useEffect(() => {
    setMeta(
      "Billing Center – Manage invoices, payment methods",
      "Customer billing center: view invoices, manage payment methods and subscriptions.",
      "/billing"
    );
  }, []);

  useEffect(() => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to access your billing center.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  const stats = useMemo(() => ({
    methods: paymentMethods?.length || 0,
    subs: subscriptions?.length || 0,
  }), [paymentMethods, subscriptions]);

  return (
    <div>
      <header className="w-full border-b bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-semibold tracking-tight">Billing Center</h1>
          <p className="text-muted-foreground mt-1">View invoices and receipts, manage payment methods, and control your subscription.</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <section aria-label="Billing navigation">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="invoices">Invoices & Receipts</TabsTrigger>
              <TabsTrigger value="methods">Payment Methods</TabsTrigger>
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Payment Methods</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats.methods}</div>
                    <p className="text-sm text-muted-foreground">Saved cards you can use at checkout</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Active Subscriptions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats.subs}</div>
                    <p className="text-sm text-muted-foreground">Your current memberships</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Need to update billing?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Use the tabs above to update cards or manage your plan.</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="invoices" className="mt-6">
              <InvoicesList />
            </TabsContent>

            <TabsContent value="methods" className="mt-6">
              <PaymentMethods paymentMethods={paymentMethods} onRefresh={refreshAll} />
            </TabsContent>

            <TabsContent value="subscriptions" className="mt-6">
              <SubscriptionManagement subscriptions={subscriptions} onRefresh={refreshAll} />
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
};

export default Billing;
