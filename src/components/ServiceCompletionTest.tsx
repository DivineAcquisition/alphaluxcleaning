import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Loader2, AlertCircle, Truck } from "lucide-react";

export function ServiceCompletionTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<any>(null);
  const { toast } = useToast();

  const sendServiceCompletionTest = async () => {
    setIsLoading(true);
    try {
      console.log("Sending service completion test to webhook...");
      
      // Create comprehensive test data for service completion
      const testData = {
        order_id: `test_order_${Date.now()}`,
        assignment_id: `test_assignment_${Date.now()}`,
        completion_notes: "Service completed successfully. All areas cleaned thoroughly. Customer was very satisfied with the results.",
        customer_rating: 5
      };
      
      const { data, error } = await supabase.functions.invoke('complete-order-notification', {
        body: testData
      });

      if (error) {
        throw error;
      }

      console.log("Service completion webhook response:", data);
      setLastTestResult(data);
      
      toast({
        title: "Success!",
        description: "Service completion webhook triggered successfully",
      });
    } catch (error) {
      console.error("Error sending service completion:", error);
      setLastTestResult({ error: error.message, success: false });
      
      toast({
        title: "Error",
        description: "Failed to send service completion webhook",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sampleData = {
    order_details: {
      id: "test_order_123",
      customer_name: "Sarah Johnson",
      customer_email: "sarah.johnson@example.com",
      service_address: "123 Oak Street, San Francisco, CA 94102",
      service_type: "complete_clean",
      total_amount: 299.00
    },
    subcontractor_details: {
      name: "Maria Garcia",
      email: "maria@cleaningpro.com",
      tier_level: 2,
      rating: 4.8
    },
    completion_data: {
      completed_at: new Date().toISOString(),
      duration_hours: 3.5,
      customer_rating: 5,
      completion_notes: "Excellent service, customer very happy",
      photos_count: 6
    },
    payment_info: {
      subcontractor_payment: 179.40,
      company_fee: 119.60,
      split_percentage: 60
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          Service Completion Webhook Test
        </CardTitle>
        <CardDescription>
          Test service completion notification webhook (u6v0pgk)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={sendServiceCompletionTest}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          <Truck className="h-4 w-4" />
          Test Service Completion
        </Button>
        
        {lastTestResult && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {lastTestResult.success !== false ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
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
            
            {lastTestResult.success !== false && (
              <div className="text-sm space-y-2">
                <p><strong>Status:</strong> Service completion processed</p>
                {lastTestResult.webhook_status && (
                  <p><strong>Webhook Status:</strong> {lastTestResult.webhook_status}</p>
                )}
                {lastTestResult.message && (
                  <p><strong>Message:</strong> {lastTestResult.message}</p>
                )}
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

        <div className="text-xs text-muted-foreground space-y-2">
          <p><strong>Webhook URL:</strong> https://hooks.zapier.com/hooks/catch/5011258/u6v0pgk/</p>
          <p>This webhook sends comprehensive service completion data including:</p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Order and customer details</li>
            <li>Subcontractor performance data</li>
            <li>Completion notes and ratings</li>
            <li>Payment breakdown and processing</li>
            <li>Completion timestamps and photos</li>
          </ul>
        </div>

        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            View Sample Data Structure
          </summary>
          <pre className="mt-2 p-3 bg-muted rounded-md overflow-auto max-h-60">
            {JSON.stringify(sampleData, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
}