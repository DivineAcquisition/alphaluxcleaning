import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShoppingCart, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const OrderEntryTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    customerName: "John Doe",
    customerEmail: "john.doe@example.com",
    customerPhone: "+1234567890",
    serviceType: "standard_clean",
    amount: "129.99",
    address: "123 Main St, San Francisco, CA 94105",
    notes: "Test order entry from testing portal"
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create a test order entry payload
      const orderData = {
        customer_name: formData.customerName,
        customer_email: formData.customerEmail,
        customer_phone: formData.customerPhone,
        service_details: {
          service_type: formData.serviceType,
          address: formData.address,
          notes: formData.notes
        },
        amount: parseFloat(formData.amount),
        status: "confirmed",
        scheduled_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        id: crypto.randomUUID(),
        stripe_session_id: `test_session_${Date.now()}`,
        payment_status: "paid"
      };

      // Send to booking webhook (which sends to Zapier)
      const { data, error } = await supabase.functions.invoke('send-booking-transaction-to-zapier', {
        body: {
          transactionData: orderData,
          type: 'order_entry_test'
        }
      });

      if (error) {
        throw error;
      }

      console.log('Order entry test response:', data);
      setLastTestResult(data);

      toast({
        title: "Success!",
        description: "Test order data has been sent to Zapier webhook successfully!",
      });

    } catch (error) {
      console.error('Order entry test failed:', error);
      setLastTestResult({ error: error instanceof Error ? error.message : "Failed to send test order data", success: false });
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send test order data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const sampleDataStructure = {
    customer_name: "string",
    customer_email: "string", 
    customer_phone: "string",
    service_details: {
      service_type: "string",
      address: "string",
      notes: "string"
    },
    amount: "number",
    status: "confirmed",
    scheduled_date: "ISO string",
    created_at: "ISO string",
    id: "UUID",
    stripe_session_id: "string",
    payment_status: "paid"
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-blue-500" />
          Order Entry Test
        </CardTitle>
        <CardDescription>
          Test order entry webhook with customizable data (u4jui7k)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customerEmail">Customer Email</Label>
              <Input
                id="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Customer Phone</Label>
              <Input
                id="customerPhone"
                value={formData.customerPhone}
                onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="serviceType">Service Type</Label>
              <Select value={formData.serviceType} onValueChange={(value) => handleInputChange('serviceType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard_clean">Standard Clean</SelectItem>
                  <SelectItem value="deep_clean">Deep Clean</SelectItem>
                  <SelectItem value="move_in_out">Move In/Out</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Service Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
            />
          </div>
          
          <Button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <ShoppingCart className="h-4 w-4" />
            Send Test Order Entry
          </Button>
        </form>
        
        {lastTestResult && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {lastTestResult.success !== false ? (
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
            
            {lastTestResult.success !== false && (
              <div className="text-sm space-y-2">
                <p><strong>Status:</strong> Order entry processed successfully</p>
                {lastTestResult.webhook_status && (
                  <p><strong>Webhook Status:</strong> {lastTestResult.webhook_status}</p>
                )}
                {lastTestResult.message && (
                  <p><strong>Message:</strong> {lastTestResult.message}</p>
                )}
                {lastTestResult.transaction_id && (
                  <p><strong>Transaction ID:</strong> {lastTestResult.transaction_id}</p>
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
          <p><strong>Webhook URL:</strong> https://hooks.zapier.com/hooks/catch/5011258/u4jui7k/</p>
          <p>This webhook sends comprehensive order entry data including:</p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Complete customer information (name, email, phone)</li>
            <li>Service details and special instructions</li>
            <li>Payment amount and transaction status</li>
            <li>Order scheduling and creation timestamps</li>
            <li>Unique order ID and Stripe session tracking</li>
          </ul>
        </div>

        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            View Sample Data Structure
          </summary>
          <pre className="mt-2 p-3 bg-muted rounded-md overflow-auto max-h-60">
            {JSON.stringify(sampleDataStructure, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
};

export default OrderEntryTest;