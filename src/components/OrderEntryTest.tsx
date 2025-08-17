import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Loader2, AlertCircle, ClipboardList } from "lucide-react";

export function OrderEntryTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<any>(null);
  const [orderScenario, setOrderScenario] = useState("standard_clean");
  const { toast } = useToast();

  const sendOrderEntryTest = async () => {
    setIsLoading(true);
    const correlationId = crypto.randomUUID();
    
    try {
      console.log("Sending order entry test to webhook...");
      
      const testData = getOrderScenarioData(orderScenario);
      
      console.log("Sending test data:", testData);
      
      const response = await fetch("https://hooks.zapier.com/hooks/catch/5011258/u4jui7k/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify({
          ...testData,
          correlationId,
          timestamp: new Date().toISOString(),
          test_mode: true
        }),
      });

      // Since we use no-cors, we can't read the response
      const result = {
        success: true,
        message: "Order entry data sent successfully",
        webhook_status: "Request sent to Zapier",
        correlationId,
        test_mode: true
      };

      console.log("Order entry webhook response:", result);
      setLastTestResult(result);
      
      toast({
        title: "Success!",
        description: "Order entry webhook triggered successfully",
      });
    } catch (error) {
      console.error("Error sending order entry:", error);
      const errorResult = { 
        error: error.message, 
        success: false,
        correlationId,
        timestamp: new Date().toISOString()
      };
      setLastTestResult(errorResult);
      
      toast({
        title: "Error",
        description: `Failed to send order entry webhook: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getOrderScenarioData = (scenario: string) => {
    const baseCustomer = {
      name: "Sarah Johnson",
      email: "sarah.johnson@example.com",
      phone: "(415) 555-0123"
    };

    const baseAddress = {
      street: "123 Oak Street",
      city: "San Francisco",
      state: "CA",
      zip_code: "94102",
      country: "USA"
    };

    const scenarios = {
      standard_clean: {
        service_type: "Standard Cleaning",
        cleaning_type: "standard_clean",
        frequency: "one_time",
        amount: 129.99,
        square_footage: 1800,
        estimated_duration: "2-3 hours",
        add_ons: []
      },
      deep_clean: {
        service_type: "Deep Cleaning",
        cleaning_type: "deep_clean", 
        frequency: "one_time",
        amount: 249.99,
        square_footage: 2200,
        estimated_duration: "4-5 hours",
        add_ons: [
          { name: "Inside Oven", price: 25.00 },
          { name: "Inside Refrigerator", price: 20.00 }
        ]
      },
      recurring_weekly: {
        service_type: "Standard Cleaning",
        cleaning_type: "standard_clean",
        frequency: "weekly",
        amount: 99.99,
        square_footage: 1500,
        estimated_duration: "2 hours",
        add_ons: []
      },
      move_in_out: {
        service_type: "Move In/Out Cleaning",
        cleaning_type: "move_in_out",
        frequency: "one_time", 
        amount: 349.99,
        square_footage: 2500,
        estimated_duration: "6-7 hours",
        add_ons: [
          { name: "Inside Oven", price: 25.00 },
          { name: "Inside Refrigerator", price: 20.00 },
          { name: "Cabinet Interiors", price: 30.00 }
        ]
      }
    };

    const scenarioData = scenarios[scenario] || scenarios.standard_clean;

    return {
      order: {
        id: `test-order-${Date.now()}`,
        stripe_session_id: `test-session-${Date.now()}`,
        amount: scenarioData.amount,
        currency: "usd",
        status: "completed",
        customer_name: baseCustomer.name,
        customer_email: baseCustomer.email,
        customer_phone: baseCustomer.phone,
        cleaning_type: scenarioData.cleaning_type,
        frequency: scenarioData.frequency,
        square_footage: scenarioData.square_footage,
        service_details: {
          service_type: scenarioData.service_type,
          estimated_duration: scenarioData.estimated_duration
        },
        scheduled_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        scheduled_time: "10:00 AM",
        created_at: new Date().toISOString(),
        is_recurring: scenarioData.frequency !== "one_time",
        add_ons: scenarioData.add_ons
      },
      payment: {
        amount_paid: scenarioData.amount,
        payment_method: "card",
        transaction_id: `test-transaction-${Date.now()}`,
        payment_status: "succeeded"
      },
      service: {
        service_type: scenarioData.service_type,
        frequency: scenarioData.frequency === "one_time" ? "One-time" : scenarioData.frequency.charAt(0).toUpperCase() + scenarioData.frequency.slice(1),
        estimated_duration: scenarioData.estimated_duration,
        special_requirements: [],
        access_instructions: "Key under doormat",
        pets_present: false,
        parking_instructions: "Driveway available"
      },
      address: baseAddress,
      analytics: {
        booking_source: "website",
        marketing_channel: "organic_search",
        customer_ltv_estimate: scenarioData.amount * 12,
        booking_completion_time: "00:02:15",
        device_type: "desktop",
        total_customer_orders: 1
      },
      timestamps: {
        order_created: new Date().toISOString(),
        payment_completed: new Date().toISOString(),
        booking_scheduled: new Date().toISOString(),
        webhook_sent: new Date().toISOString()
      }
    };
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
      service_type: orderScenario.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      amount: getOrderScenarioData(orderScenario).order.amount,
      square_footage: getOrderScenarioData(orderScenario).order.square_footage,
      scheduled_date: "2024-01-16",
      scheduled_time: "10:00 AM",
      frequency: getOrderScenarioData(orderScenario).order.frequency,
      add_ons: getOrderScenarioData(orderScenario).order.add_ons
    },
    payment_data: {
      payment_method: "card",
      transaction_id: "test_transaction_123",
      payment_status: "succeeded",
      amount_paid: getOrderScenarioData(orderScenario).order.amount
    },
    analytics: {
      booking_source: "website",
      marketing_channel: "organic_search",
      device_type: "desktop",
      booking_completion_time: "00:02:15"
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-blue-500" />
          Order Entry Webhook Test
        </CardTitle>
        <CardDescription>
          Test order entry notification webhook (u4jui7k)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Order Scenario</label>
          <Select value={orderScenario} onValueChange={setOrderScenario}>
            <SelectTrigger>
              <SelectValue placeholder="Select order scenario" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard_clean">Standard Clean ($129.99)</SelectItem>
              <SelectItem value="deep_clean">Deep Clean ($249.99)</SelectItem>
              <SelectItem value="recurring_weekly">Weekly Recurring ($99.99)</SelectItem>
              <SelectItem value="move_in_out">Move In/Out ($349.99)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={sendOrderEntryTest}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          <ClipboardList className="h-4 w-4" />
          Test Order Entry
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
                <p><strong>Status:</strong> Order entry processed</p>
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
          <p><strong>Webhook URL:</strong> https://hooks.zapier.com/hooks/catch/5011258/u4jui7k/</p>
          <p>This webhook sends comprehensive order entry data including:</p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Complete customer and order details</li>
            <li>Service type, frequency, and scheduling information</li>
            <li>Payment processing details and transaction data</li>
            <li>Address information and service requirements</li>
            <li>Analytics data for tracking and insights</li>
            <li>Multiple order scenarios for testing different workflows</li>
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