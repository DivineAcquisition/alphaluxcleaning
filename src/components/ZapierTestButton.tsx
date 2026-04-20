import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export function ZapierTestButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<any>(null);
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
        customer_phone: "(857) 754-4557",
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
          sample_data: sampleData
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

  const sendRealBookingTransaction = async () => {
    setIsLoading(true);
    try {
      // Get the current session ID from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      
      if (!sessionId) {
        throw new Error('No session ID found in URL');
      }

      console.log("Sending real booking transaction to Zapier...");
      
      const { data, error } = await supabase.functions.invoke('send-booking-transaction-to-zapier', {
        body: { 
          session_id: sessionId,
          send_sample_data: false
        }
      });

      if (error) {
        throw error;
      }

      console.log("Zapier response:", data);
      setLastTestResult(data);
      
      toast({
        title: "Success!",
        description: "Real booking transaction sent to Zapier webhook successfully",
      });
    } catch (error) {
      console.error("Error sending to Zapier:", error);
      setLastTestResult({ error: error.message, success: false });
      
      toast({
        title: "Error",
        description: "Failed to send real booking transaction to Zapier",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Zapier Integration Test
        </CardTitle>
        <CardDescription>
          Send complete booking transaction data to your Zapier webhook
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={sendSampleBookingTransaction}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Send Sample Data
          </Button>
          
          <Button
            onClick={sendRealBookingTransaction}
            disabled={isLoading}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Send Current Booking
          </Button>
        </div>
        
        {lastTestResult && (
          <div className="space-y-3">
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
              <div className="text-sm space-y-2">
                <p><strong>Transaction ID:</strong> {lastTestResult.transaction_id}</p>
                <p><strong>Webhook Status:</strong> {lastTestResult.webhook_status}</p>
                <p><strong>Message:</strong> {lastTestResult.message}</p>
              </div>
            )}
            
            {lastTestResult.error && (
              <div className="text-sm text-red-600">
                <p><strong>Error:</strong> {lastTestResult.error}</p>
              </div>
            )}
            
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                View Full Response
              </summary>
              <pre className="mt-2 p-3 bg-muted rounded-md overflow-auto max-h-40">
                {JSON.stringify(lastTestResult, null, 2)}
              </pre>
            </details>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          <p><strong>Webhook URL:</strong> https://hooks.zapier.com/hooks/catch/5011258/u4jui7k/</p>
          <p>This sends comprehensive booking data including membership benefits, addon discounts, new client specials, pricing breakdowns, and complete transaction analytics.</p>
        </div>
      </CardContent>
    </Card>
  );
}