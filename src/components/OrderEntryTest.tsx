import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ClipboardList, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export function OrderEntryTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<any>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    customer_name: "Test Customer",
    customer_email: "test@example.com",
    customer_phone: "(555) 123-4567",
    cleaning_type: "standard_clean",
    frequency: "one_time",
    square_footage: "2000",
    amount: "129.99",
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: "10:00 AM",
    street: "123 Test Street",
    city: "Test City",
    state: "CA",
    zip_code: "12345",
    special_instructions: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const sendOrderEntryData = async () => {
    setIsLoading(true);
    try {
      console.log("Sending order entry data to Zapier webhook...");
      
      // Build comprehensive transaction data
      const transactionData = {
        order: {
          id: `test-order-${Date.now()}`,
          stripe_session_id: `test-session-${Date.now()}`,
          amount: parseFloat(formData.amount),
          currency: "usd",
          status: "completed",
          customer_name: formData.customer_name,
          customer_email: formData.customer_email,
          customer_phone: formData.customer_phone,
          cleaning_type: formData.cleaning_type,
          frequency: formData.frequency,
          square_footage: parseInt(formData.square_footage),
          service_details: {},
          scheduled_date: formData.scheduled_date,
          scheduled_time: formData.scheduled_time,
          created_at: new Date().toISOString(),
          is_recurring: formData.frequency !== "one_time",
          add_ons: []
        },
        status_updates: [
          {
            id: "status-test-1",
            status_message: "Test order entry webhook triggered",
            created_at: new Date().toISOString(),
            subcontractor_name: "Test Subcontractor"
          }
        ],
        payment: {
          amount_paid: parseFloat(formData.amount),
          payment_method: "test",
          transaction_id: `test-transaction-${Date.now()}`,
          payment_status: "succeeded"
        },
        service: {
          service_type: formData.cleaning_type === "standard_clean" ? "Standard Cleaning" : "Deep Cleaning",
          frequency: formData.frequency === "one_time" ? "One-time" : "Recurring",
          estimated_duration: "2-3 hours",
          special_requirements: formData.special_instructions ? [formData.special_instructions] : [],
          access_instructions: "",
          pets_present: false,
          parking_instructions: ""
        },
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code,
          dwelling_type: "house",
          flooring_types: ["hardwood"]
        },
        analytics: {
          booking_source: "test_portal",
          marketing_channel: "test",
          customer_ltv_estimate: parseFloat(formData.amount) / 100,
          booking_completion_time: "00:01:00",
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

      const { data, error } = await supabase.functions.invoke('send-booking-transaction-to-zapier', {
        body: { 
          transactionData: transactionData,
          webhook_url: "https://hooks.zapier.com/hooks/catch/5011258/u4jui7k/"
        }
      });

      if (error) {
        throw error;
      }

      console.log("Zapier response:", data);
      setLastTestResult(data);
      
      toast({
        title: "Success!",
        description: "Order entry data sent to Zapier webhook successfully",
      });
    } catch (error) {
      console.error("Error sending to Zapier:", error);
      setLastTestResult({ error: error.message, success: false });
      
      toast({
        title: "Error",
        description: "Failed to send order entry data to Zapier",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-blue-500" />
          Order Entry Test
        </CardTitle>
        <CardDescription>
          Send custom order entry data to your Zapier webhook for testing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Customer Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customer_name">Customer Name</Label>
            <Input 
              id="customer_name"
              value={formData.customer_name}
              onChange={(e) => handleInputChange('customer_name', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer_email">Email</Label>
            <Input 
              id="customer_email"
              type="email"
              value={formData.customer_email}
              onChange={(e) => handleInputChange('customer_email', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer_phone">Phone</Label>
            <Input 
              id="customer_phone"
              value={formData.customer_phone}
              onChange={(e) => handleInputChange('customer_phone', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input 
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
            />
          </div>
        </div>

        {/* Service Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cleaning_type">Cleaning Type</Label>
            <Select value={formData.cleaning_type} onValueChange={(value) => handleInputChange('cleaning_type', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard_clean">Standard Clean</SelectItem>
                <SelectItem value="deep_clean">Deep Clean</SelectItem>
                <SelectItem value="move_in_out">Move In/Out</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency</Label>
            <Select value={formData.frequency} onValueChange={(value) => handleInputChange('frequency', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one_time">One Time</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="bi_weekly">Bi-Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="square_footage">Square Footage</Label>
            <Input 
              id="square_footage"
              type="number"
              value={formData.square_footage}
              onChange={(e) => handleInputChange('square_footage', e.target.value)}
            />
          </div>
        </div>

        {/* Schedule */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="scheduled_date">Scheduled Date</Label>
            <Input 
              id="scheduled_date"
              type="date"
              value={formData.scheduled_date}
              onChange={(e) => handleInputChange('scheduled_date', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scheduled_time">Scheduled Time</Label>
            <Input 
              id="scheduled_time"
              value={formData.scheduled_time}
              onChange={(e) => handleInputChange('scheduled_time', e.target.value)}
            />
          </div>
        </div>

        {/* Address */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="street">Street Address</Label>
            <Input 
              id="street"
              value={formData.street}
              onChange={(e) => handleInputChange('street', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input 
              id="city"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input 
              id="state"
              value={formData.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zip_code">ZIP Code</Label>
            <Input 
              id="zip_code"
              value={formData.zip_code}
              onChange={(e) => handleInputChange('zip_code', e.target.value)}
            />
          </div>
        </div>

        {/* Special Instructions */}
        <div className="space-y-2">
          <Label htmlFor="special_instructions">Special Instructions</Label>
          <Textarea 
            id="special_instructions"
            value={formData.special_instructions}
            onChange={(e) => handleInputChange('special_instructions', e.target.value)}
            placeholder="Any special cleaning requests or instructions..."
          />
        </div>

        {/* Action Button */}
        <Button
          onClick={sendOrderEntryData}
          disabled={isLoading}
          className="w-full flex items-center gap-2"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Send Order Entry Data
        </Button>
        
        {/* Results */}
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
                <p><strong>Message:</strong> {lastTestResult.message}</p>
                {lastTestResult.zapier_response && (
                  <p><strong>Zapier Response:</strong> {lastTestResult.zapier_response}</p>
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
        
        <div className="text-xs text-muted-foreground">
          <p><strong>Webhook URL:</strong> https://hooks.zapier.com/hooks/catch/5011258/u4jui7k/</p>
          <p>This sends comprehensive order entry data including customer information, service details, payment data, and analytics to your Zapier webhook.</p>
        </div>
      </CardContent>
    </Card>
  );
}