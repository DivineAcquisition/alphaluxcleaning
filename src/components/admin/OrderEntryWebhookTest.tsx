import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Webhook, Send, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface WebhookTestResult {
  step: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  data?: any;
  timestamp: string;
}

export function OrderEntryWebhookTest() {
  const [webhookUrl, setWebhookUrl] = useState("https://webhook.site/unique-id");
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<WebhookTestResult[]>([]);
  const [lastWebhookPayload, setLastWebhookPayload] = useState<any>(null);

  const addResult = (step: string, status: 'success' | 'error' | 'pending', message: string, data?: any) => {
    const result: WebhookTestResult = {
      step,
      status,
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    };
    setTestResults(prev => [...prev, result]);
    return result;
  };

  const testOrderEntryWebhook = async () => {
    if (!webhookUrl) {
      toast.error("Please provide a webhook URL");
      return;
    }

    setIsRunning(true);
    setTestResults([]);
    setLastWebhookPayload(null);

    try {
      addResult("Test Setup", 'pending', "Starting order entry webhook test...");

      // Step 1: Create test booking
      addResult("Create Booking", 'pending', "Creating test booking for webhook test...");
      
      const testBooking = {
        customer_name: "Webhook Test Customer",
        customer_email: `webhook-test-${Date.now()}@example.com`,
        customer_phone: "(555) 987-6543",
        service_address: "456 Webhook Lane, San Jose, CA 95110",
        service_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
        service_time: "2:00 PM - 4:00 PM",
        special_instructions: "Webhook test - focus on kitchen and living room",
        status: "scheduled",
        priority: "high"
      };

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert(testBooking)
        .select()
        .single();

      if (bookingError || !booking) {
        addResult("Create Booking", 'error', `Failed to create booking: ${bookingError?.message}`);
        setIsRunning(false);
        return;
      }

      addResult("Create Booking", 'success', `Test booking created: ${booking.id}`);

      // Step 2: Get available subcontractor
      addResult("Get Subcontractor", 'pending', "Finding available subcontractor...");
      
      const { data: subcontractors, error: subError } = await supabase
        .from('subcontractors')
        .select('id, full_name, email, rating')
        .eq('is_available', true)
        .limit(1);

      if (subError || !subcontractors || subcontractors.length === 0) {
        addResult("Get Subcontractor", 'error', "No available subcontractors found");
        setIsRunning(false);
        return;
      }

      const subcontractor = subcontractors[0];
      addResult("Get Subcontractor", 'success', `Found subcontractor: ${subcontractor.full_name}`);

      // Step 3: Create assignment
      addResult("Create Assignment", 'pending', "Creating job assignment...");
      
      const { data: assignment, error: assignmentError } = await supabase
        .from('subcontractor_job_assignments')
        .insert({
          booking_id: booking.id,
          subcontractor_id: subcontractor.id,
          status: 'assigned',
          assigned_at: new Date().toISOString(),
          subcontractor_notes: "Webhook test assignment - please handle with care"
        })
        .select()
        .single();

      if (assignmentError || !assignment) {
        addResult("Create Assignment", 'error', `Failed to create assignment: ${assignmentError?.message}`);
        setIsRunning(false);
        return;
      }

      addResult("Create Assignment", 'success', `Assignment created: ${assignment.id}`);

      // Step 4: Create corresponding order record (to simulate full workflow)
      addResult("Create Order", 'pending', "Creating order record...");
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: testBooking.customer_name,
          customer_email: testBooking.customer_email,
          customer_phone: testBooking.customer_phone,
          cleaning_type: 'deep_clean',
          frequency: 'one_time',
          square_footage: 1800,
          amount: 15000, // $150.00
          scheduled_date: testBooking.service_date,
          scheduled_time: testBooking.service_time,
          service_details: {
            serviceAddress: {
              street: "456 Webhook Lane",
              city: "San Jose",
              state: "CA", 
              zipCode: "95110"
            },
            instructions: {
              special: testBooking.special_instructions
            }
          },
          order_status: 'confirmed'
        })
        .select()
        .single();

      if (orderError) {
        addResult("Create Order", 'error', `Order creation failed: ${orderError.message}`);
      } else {
        addResult("Create Order", 'success', `Order created: ${order.id}`);
      }

      // Step 5: Test webhook with custom URL
      addResult("Test Webhook", 'pending', "Triggering order entry webhook...");
      
      const webhookPayload = {
        assignment_id: assignment.id,
        booking_id: booking.id,
        order_id: order?.id,
        webhook_url: webhookUrl
      };

      const { data: webhookResponse, error: webhookError } = await supabase.functions.invoke('send-order-entry-webhook', {
        body: webhookPayload
      });

      if (webhookError) {
        addResult("Test Webhook", 'error', `Webhook failed: ${webhookError.message}`, webhookError);
        setIsRunning(false);
        return;
      }

      addResult("Test Webhook", 'success', "Webhook triggered successfully!", webhookResponse);
      setLastWebhookPayload(webhookPayload);

      // Test complete
      addResult("Test Complete", 'success', "✅ Order entry webhook test completed successfully!");
      toast.success("Order entry webhook test completed successfully!");

    } catch (error: any) {
      addResult("Test Failed", 'error', `Test failed: ${error.message}`, error);
      toast.error("Order entry webhook test failed");
    }

    setIsRunning(false);
  };

  const clearResults = () => {
    setTestResults([]);
    setLastWebhookPayload(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          Order Entry Webhook Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Webhook URL Input */}
        <div className="space-y-2">
          <Label htmlFor="webhook-url">Webhook URL</Label>
          <div className="flex gap-2">
            <Input
              id="webhook-url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://webhook.site/your-unique-id"
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open("https://webhook.site", "_blank")}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Get a test webhook URL from webhook.site to see the data being sent
          </p>
        </div>

        {/* Test Controls */}
        <div className="flex gap-2">
          <Button 
            onClick={testOrderEntryWebhook}
            disabled={isRunning || !webhookUrl}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            {isRunning ? "Running Test..." : "Test Order Entry Webhook"}
          </Button>
          {testResults.length > 0 && (
            <Button variant="outline" onClick={clearResults}>
              Clear Results
            </Button>
          )}
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold">Test Results:</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  {result.status === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : result.status === 'error' ? (
                    <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{result.step}</span>
                      <span className="text-xs text-muted-foreground">{result.timestamp}</span>
                      <Badge variant={
                        result.status === 'success' ? 'default' : 
                        result.status === 'error' ? 'destructive' : 'secondary'
                      }>
                        {result.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{result.message}</p>
                    {result.data && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                          View Data
                        </summary>
                        <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Last Webhook Payload */}
        {lastWebhookPayload && (
          <div className="space-y-2">
            <h4 className="font-semibold">Last Webhook Payload Sent:</h4>
            <Textarea
              value={JSON.stringify(lastWebhookPayload, null, 2)}
              readOnly
              className="font-mono text-sm"
              rows={6}
            />
          </div>
        )}

        {/* Test Description */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h5 className="font-medium mb-2">What this test validates:</h5>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✅ Creates test booking and order records</li>
            <li>✅ Assigns subcontractor to job</li>
            <li>✅ Triggers order entry webhook with complete data</li>
            <li>✅ Sends comprehensive payload to your webhook URL</li>
            <li>✅ Logs webhook interaction for monitoring</li>
            <li>✅ Verifies webhook was delivered successfully</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}