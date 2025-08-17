import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const OrderEntryTest = () => {
  const [isLoading, setIsLoading] = useState(false);
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

      toast({
        title: "Order Entry Test Successful",
        description: "Test order data has been sent to Zapier webhook successfully!",
      });

      console.log('Order entry test response:', data);

    } catch (error) {
      console.error('Order entry test failed:', error);
      toast({
        title: "Order Entry Test Failed",
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          Test Order Entry Data
        </CardTitle>
        <CardDescription>
          Customize the test order data and send it to the webhook
        </CardDescription>
      </CardHeader>
      <CardContent>
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
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Test Order...
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Send Test Order Entry
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default OrderEntryTest;