import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Loader2, AlertCircle, Truck, Percent } from "lucide-react";

export function ServiceCompletionTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<any>(null);
  const [discountScenario, setDiscountScenario] = useState("new_customer");
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
        discountScenario: discountScenario,
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

  const getDiscountScenarioData = (scenario: string) => {
    const baseData = {
      base_rate: 85.00,
      add_ons: [
        { name: "Inside Oven", price: 25.00 },
        { name: "Inside Refrigerator", price: 20.00 },
        { name: "Cabinet Interiors", price: 30.00 }
      ],
      subtotal: 160.00,
      tax_rate: 0.0875
    };

    const scenarios = {
      new_customer: { type: "percentage", name: "New Customer Discount", percentage: 10.0, fixed_amount: null },
      membership: { type: "percentage", name: "CleanCovered Membership", percentage: 15.0, fixed_amount: null },
      seasonal: { type: "percentage", name: "Spring Cleaning Special", percentage: 5.0, fixed_amount: null },
      referral: { type: "fixed", name: "Referral Bonus", percentage: null, fixed_amount: 25.00 },
      loyalty: { type: "percentage", name: "Loyal Customer Reward", percentage: 12.0, fixed_amount: null },
      none: { type: "none", name: "No Discount", percentage: 0, fixed_amount: null }
    };

    const discount = scenarios[scenario] || scenarios.none;
    let discountAmount = 0;
    
    if (discount.type === "percentage" && discount.percentage) {
      discountAmount = Math.round(baseData.subtotal * (discount.percentage / 100) * 100) / 100;
    } else if (discount.type === "fixed" && discount.fixed_amount) {
      discountAmount = discount.fixed_amount;
    }

    const discountedSubtotal = Math.max(0, baseData.subtotal - discountAmount);
    const discountedTax = Math.round(discountedSubtotal * baseData.tax_rate * 100) / 100;
    const discountedTotal = discountedSubtotal + discountedTax;
    const originalTax = Math.round(baseData.subtotal * baseData.tax_rate * 100) / 100;
    const originalTotal = baseData.subtotal + originalTax;

    return {
      original: {
        subtotal: baseData.subtotal,
        tax_amount: originalTax,
        total_amount: originalTotal
      },
      discount_applied: discount.type !== "none" ? {
        type: discount.type,
        name: discount.name,
        percentage: discount.percentage,
        fixed_amount: discount.fixed_amount,
        discount_amount: discountAmount
      } : null,
      discounted: {
        subtotal: discountedSubtotal,
        tax_amount: discountedTax,
        total_amount: discountedTotal,
        total_savings: Math.round((originalTotal - discountedTotal) * 100) / 100
      }
    };
  };

  const pricingData = getDiscountScenarioData(discountScenario);

  const sampleData = {
    order_details: {
      id: "test_order_123",
      customer_name: "Sarah Johnson",
      customer_email: "sarah.johnson@example.com",
      customer_phone: "(281) 809-9901",
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
      pricing: pricingData
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
        <div className="space-y-2">
          <label className="text-sm font-medium">Discount Scenario</label>
          <Select value={discountScenario} onValueChange={setDiscountScenario}>
            <SelectTrigger>
              <SelectValue placeholder="Select discount scenario" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new_customer">New Customer (10% off)</SelectItem>
              <SelectItem value="membership">CleanCovered Membership (15% off)</SelectItem>
              <SelectItem value="seasonal">Spring Cleaning Special (5% off)</SelectItem>
              <SelectItem value="referral">Referral Bonus ($25 off)</SelectItem>
              <SelectItem value="loyalty">Loyal Customer (12% off)</SelectItem>
              <SelectItem value="none">No Discount</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
            <li>Comprehensive discount pricing (original, discounted, savings)</li>
            <li>Multiple discount scenarios (percentage & fixed amounts)</li>
            <li>Hourly rate payment calculations based on check-in/out times</li>
            <li>Tier-based subcontractor compensation</li>
            <li>Completion notes, ratings, and performance data</li>
            <li>Travel time compensation and work hour tracking</li>
          </ul>
        </div>

        {pricingData.discount_applied && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Current Discount Preview</span>
            </div>
            <div className="text-xs space-y-1 text-green-700">
              <p><strong>Discount:</strong> {pricingData.discount_applied.name}</p>
              <p><strong>Original Total:</strong> ${pricingData.original.total_amount.toFixed(2)}</p>
              <p><strong>Discount Amount:</strong> -${pricingData.discount_applied.discount_amount.toFixed(2)}</p>
              <p><strong>Final Total:</strong> ${pricingData.discounted.total_amount.toFixed(2)}</p>
              <p><strong>Total Savings:</strong> ${pricingData.discounted.total_savings.toFixed(2)}</p>
            </div>
          </div>
        )}

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