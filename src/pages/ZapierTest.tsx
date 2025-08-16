import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Loader2, CheckCircle, AlertCircle, Home } from "lucide-react";
import { Link } from "react-router-dom";

export default function ZapierTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<any>(null);
  const [webhookUrl, setWebhookUrl] = useState("https://hooks.zapier.com/hooks/catch/5011258/u4jui7k/");
  const { toast } = useToast();

  const sendSampleBookingTransaction = async () => {
    setIsLoading(true);
    try {
      console.log("Sending comprehensive sample booking transaction to Zapier...");
      
      // Enhanced sample data with membership and addon discounts
      const sampleData = {
        transaction_id: `test_${Date.now()}`,
        customer_name: "John Smith",
        customer_email: "john.smith@example.com",
        customer_phone: "(555) 123-4567",
        service_date: "2024-08-15",
        service_time: "10:00 AM",
        cleaning_type: "complete_clean",
        frequency: "bi_weekly",
        amount: 349, // New client special pricing
        currency: 'USD',
        payment_status: 'completed',
        stripe_session_id: `cs_test_${Date.now()}`,
        add_ons: ["fridge", "oven", "baseboards"],
        square_footage: 1500,
        next_day_booking: false,
        payment_type: "full",
        new_client_special: true,
        discount_applied: 71,
        membership_status: true,
        addon_member_discount: 13.5, // 10% off $135 in addons
        membership_benefits: {
          monthly_credit: 20,
          addon_discount_percent: 10,
          priority_scheduling: true,
          free_addon_every_third: true
        },
        service_details: {
          hours: 4,
          cleaners: 2,
          estimated_duration: "4 hours",
          special_instructions: "Focus on kitchen deep clean"
        },
        pricing_breakdown: {
          base_price: 420,
          addon_total: 121.5, // After 10% member discount
          new_client_discount: -71,
          total_savings: 84.5
        }
      };
      
      const { data, error } = await supabase.functions.invoke('send-booking-transaction-to-zapier', {
        body: { 
          send_sample_data: true,
          sample_data: sampleData,
          webhook_url: webhookUrl
        }
      });

      if (error) {
        throw error;
      }

      console.log("Zapier response:", data);
      setLastTestResult(data);
      
      toast({
        title: "Success!",
        description: "Enhanced sample booking data sent to Zapier webhook successfully",
      });
    } catch (error) {
      console.error("Error sending to Zapier:", error);
      setLastTestResult({ error: error.message, success: false });
      
      toast({
        title: "Error",
        description: "Failed to send booking transaction to Zapier",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4">
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-2">Zapier Integration Test</h1>
          <p className="text-muted-foreground">Test your Zapier webhook integration with comprehensive booking data</p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Send Test Data to Zapier
            </CardTitle>
            <CardDescription>
              Send comprehensive booking transaction data to your Zapier webhook for testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Zapier Webhook URL</Label>
              <Input
                id="webhook-url"
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                className="font-mono text-sm"
              />
              <p className="text-sm text-muted-foreground">
                This is the webhook URL where your test data will be sent.
              </p>
            </div>
            
            <div className="flex justify-center">
              <Button
                onClick={sendSampleBookingTransaction}
                disabled={isLoading || !webhookUrl}
                className="flex items-center gap-2 px-8 py-3"
                size="lg"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLoading ? "Sending..." : "Send Sample Booking Data"}
              </Button>
            </div>
            
            {lastTestResult && (
              <div className="space-y-4 border-t pt-6">
                <div className="flex items-center gap-2">
                  {lastTestResult.success ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                        Success
                      </Badge>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <Badge variant="destructive">
                        Failed
                      </Badge>
                    </>
                  )}
                </div>
                
                {lastTestResult.success && (
                  <div className="text-sm space-y-2 bg-green-50 p-4 rounded-md">
                    <p><strong>Transaction ID:</strong> {lastTestResult.transaction_id}</p>
                    <p><strong>Webhook Status:</strong> {lastTestResult.webhook_status}</p>
                    <p><strong>Message:</strong> {lastTestResult.message}</p>
                  </div>
                )}
                
                {lastTestResult.error && (
                  <div className="text-sm text-red-600 bg-red-50 p-4 rounded-md">
                    <p><strong>Error:</strong> {lastTestResult.error}</p>
                  </div>
                )}
                
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-medium">
                    View Full Response
                  </summary>
                  <pre className="mt-2 p-3 bg-muted rounded-md overflow-auto max-h-40 text-xs">
                    {JSON.stringify(lastTestResult, null, 2)}
                  </pre>
                </details>
              </div>
            )}
            
            <div className="text-xs text-muted-foreground bg-muted/50 p-4 rounded-md">
              <p><strong>Target Webhook URL:</strong> {webhookUrl}</p>
              <p className="mt-2">This sends comprehensive booking data including:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Customer information and contact details</li>
                <li>Service selection and scheduling details</li>
                <li>Pricing breakdown with discounts</li>
                <li>Membership benefits and addon discounts</li>
                <li>Payment information and transaction data</li>
                <li>Complete booking analytics</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}