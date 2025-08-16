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
    const correlationId = crypto.randomUUID();
    
    try {
      console.log("Sending service completion test to webhook...");
      
      // Create comprehensive test data for service completion with realistic pricing
      const checkInTime = new Date(Date.now() - 4.5 * 60 * 60 * 1000); // 4.5 hours ago
      const checkOutTime = new Date(); // Now
      
      const testData = {
        mode: 'test',
        orderId: `test_order_${Date.now()}`,
        assignmentId: `test_assignment_${Date.now()}`,
        completionNotes: "Deep clean service completed successfully. All areas thoroughly cleaned including inside oven, refrigerator, and cabinet interiors. Customer extremely satisfied with attention to detail and quality of work.",
        customerRating: 5,
        checkInTime: checkInTime.toISOString(),
        checkOutTime: checkOutTime.toISOString(),
        correlationId
      };
      
      console.log("Sending test data:", testData);
      
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
        description: data?.message || "Service completion webhook triggered successfully",
      });
    } catch (error) {
      console.error("Error sending service completion:", error);
      const errorResult = { 
        error: error.message, 
        success: false,
        correlationId,
        timestamp: new Date().toISOString()
      };
      setLastTestResult(errorResult);
      
      toast({
        title: "Error",
        description: `Failed to send service completion webhook: ${error.message}`,
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
      customer_phone: "(415) 555-0123",
      street_address: "123 Oak Street",
      city: "San Francisco",
      state: "CA",
      zip_code: "94102",
      country: "USA",
      service_type: "deep_clean",
      service_date: "2024-01-16",
      scheduled_duration_hours: 4,
      base_rate: 85.00,
      add_ons: [
        { name: "Inside Oven", price: 25.00 },
        { name: "Inside Refrigerator", price: 20.00 },
        { name: "Cabinet Interiors", price: 30.00 }
      ],
      subtotal: 160.00,
      tax_rate: 0.0875,
      tax_amount: 14.00,
      total_amount: 174.00
    },
    subcontractor_details: {
      name: "Maria Garcia",
      email: "maria@cleaningpro.com",
      phone: "(415) 555-0156",
      tier_level: 2,
      tier_name: "Professional",
      hourly_rate: 18.00,
      rating: 4.8,
      check_in_time: "2024-01-16T10:00:00Z",
      check_out_time: "2024-01-16T14:30:00Z",
      actual_work_hours: 4.5,
      travel_time_minutes: 30
    },
    completion_data: {
      completed_at: "2024-01-16T14:30:00Z",
      customer_rating: 5,
      completion_notes: "Excellent deep clean service. All areas thoroughly cleaned including inside oven and refrigerator. Customer very satisfied with attention to detail.",
      photos_count: 8,
      areas_cleaned: ["Kitchen", "Living Room", "2 Bedrooms", "2 Bathrooms", "Dining Room"]
    },
    payment_calculation: {
      work_hours: 4.5,
      hourly_rate: 18.00,
      work_payment: 81.00,
      travel_compensation: 9.00, // 30 min * $18/hour
      total_subcontractor_payment: 90.00,
      company_administrative_fee: 84.00,
      payment_model: "hourly_rate"
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
                {lastTestResult.correlationId && (
                  <p><strong>Correlation ID:</strong> {lastTestResult.correlationId}</p>
                )}
                {lastTestResult.test_mode && (
                  <p><strong>Test Mode:</strong> Yes</p>
                )}
              </div>
            )}
            
            {lastTestResult.error && (
              <div className="text-sm text-red-600 space-y-2">
                <p><strong>Error:</strong> {lastTestResult.error}</p>
                {lastTestResult.correlationId && (
                  <p><strong>Correlation ID:</strong> {lastTestResult.correlationId}</p>
                )}
                {lastTestResult.timestamp && (
                  <p><strong>Timestamp:</strong> {new Date(lastTestResult.timestamp).toLocaleString()}</p>
                )}
                {lastTestResult.details && (
                  <p><strong>Details:</strong> {lastTestResult.details}</p>
                )}
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
            <li>Order and customer details with split addresses</li>
            <li>Realistic pricing breakdown with add-ons and taxes</li>
            <li>Hourly rate payment calculations based on check-in/out times</li>
            <li>Tier-based subcontractor compensation</li>
            <li>Completion notes, ratings, and performance data</li>
            <li>Travel time compensation and work hour tracking</li>
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