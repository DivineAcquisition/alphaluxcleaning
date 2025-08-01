import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Heart, DollarSign } from "lucide-react";

interface TipComponentProps {
  orderId: string;
  orderAmount: number;
}

export const TipComponent = ({ orderId, orderAmount }: TipComponentProps) => {
  const [tipAmount, setTipAmount] = useState<string>('');
  const [customerMessage, setCustomerMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [subcontractorId, setSubcontractorId] = useState<string>('');
  const [existingTip, setExistingTip] = useState<any>(null);

  useEffect(() => {
    fetchSubcontractorForOrder();
    fetchExistingTip();
  }, [orderId]);

  const fetchSubcontractorForOrder = async () => {
    try {
      // Get the booking associated with this order
      const { data: booking } = await supabase
        .from('bookings')
        .select('assigned_employee_id')
        .eq('order_id', orderId)
        .single();

      if (booking?.assigned_employee_id) {
        setSubcontractorId(booking.assigned_employee_id);
      }
    } catch (error) {
      console.error('Error fetching subcontractor:', error);
    }
  };

  const fetchExistingTip = async () => {
    try {
      const { data } = await supabase
        .from('order_tips')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (data) {
        setExistingTip(data);
        setTipAmount(data.amount.toString());
        setCustomerMessage(data.customer_message || '');
      }
    } catch (error) {
      // No existing tip, which is fine
    }
  };

  const handleTipSubmit = async () => {
    const amount = parseFloat(tipAmount);
    
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid tip amount');
      return;
    }

    if (amount > orderAmountInDollars) {
      toast.error('Tip amount cannot exceed the order total');
      return;
    }

    setIsLoading(true);
    try {
      if (existingTip) {
        // Update existing tip
        const { error } = await supabase
          .from('order_tips')
          .update({
            amount: amount,
            customer_message: customerMessage,
          })
          .eq('id', existingTip.id);

        if (error) throw error;
        toast.success('Tip updated successfully!');
      } else {
        // Create new tip
        const { error } = await supabase
          .from('order_tips')
          .insert({
            order_id: orderId,
            subcontractor_id: subcontractorId || null,
            amount: amount,
            customer_message: customerMessage,
          });

        if (error) throw error;
        toast.success('Thank you for the tip! Your cleaner will be notified.');
      }

      fetchExistingTip();
    } catch (error) {
      console.error('Error submitting tip:', error);
      toast.error('Failed to submit tip. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const orderAmountInDollars = orderAmount / 100;
  const suggestedTips = [
    { percentage: 15, amount: Math.round(orderAmountInDollars * 0.15) },
    { percentage: 18, amount: Math.round(orderAmountInDollars * 0.18) },
    { percentage: 20, amount: Math.round(orderAmountInDollars * 0.20) },
    { percentage: 25, amount: Math.round(orderAmountInDollars * 0.25) },
  ];

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Heart className="h-5 w-5" />
          {existingTip ? 'Update Tip' : 'Add a Tip'}
        </CardTitle>
        <CardDescription className="text-pink-50">
          {existingTip ? 'Modify your tip for exceptional service' : 'Show appreciation for exceptional service'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {existingTip && (
          <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
            <div className="text-sm font-medium text-green-800">
              Current tip: ${existingTip.amount}
            </div>
            {existingTip.customer_message && (
              <div className="text-sm text-green-600 mt-1">
                Message: "{existingTip.customer_message}"
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <Label>Quick Tip Options</Label>
          <div className="grid grid-cols-2 gap-2">
            {suggestedTips.map((tip) => (
              <Button
                key={tip.percentage}
                variant="outline"
                size="sm"
                onClick={() => setTipAmount(tip.amount.toString())}
                className="flex items-center justify-between"
              >
                <span>{tip.percentage}%</span>
                <span>${tip.amount}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="tip-amount">Custom Tip Amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="tip-amount"
                type="number"
                min="0"
                max={orderAmountInDollars}
                step="0.01"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                placeholder="0.00"
                className="pl-10"
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Order total: ${(orderAmount / 100).toFixed(2)}
            </div>
          </div>

          <div>
            <Label htmlFor="customer-message">Message for Cleaner (Optional)</Label>
            <Textarea
              id="customer-message"
              value={customerMessage}
              onChange={(e) => setCustomerMessage(e.target.value)}
              placeholder="Thank you for the excellent service!"
              maxLength={500}
              rows={3}
            />
          </div>

          <Button 
            onClick={handleTipSubmit}
            disabled={isLoading || !tipAmount || parseFloat(tipAmount) <= 0}
            className="w-full"
          >
            <Heart className="h-4 w-4 mr-2" />
            {isLoading ? 'Processing...' : existingTip ? 'Update Tip' : 'Add Tip'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};