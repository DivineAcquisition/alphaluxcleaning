import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus, Trash2, Star } from "lucide-react";
import { PaymentMethod } from "@/hooks/usePaymentData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PaymentMethodsProps {
  paymentMethods: PaymentMethod[];
  onRefresh: () => void;
}

export const PaymentMethods = ({ paymentMethods, onRefresh }: PaymentMethodsProps) => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAddPaymentMethod = async () => {
    try {
      setLoading('add');
      const { data, error } = await supabase.functions.invoke('setup-payment-method');
      
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast.error('Failed to add payment method');
    } finally {
      setLoading(null);
    }
  };

  const handleRemovePaymentMethod = async (paymentMethodId: string) => {
    try {
      setLoading(paymentMethodId);
      const { error } = await supabase.functions.invoke('remove-payment-method', {
        body: { payment_method_id: paymentMethodId }
      });
      
      if (error) throw error;
      
      toast.success('Payment method removed successfully');
      onRefresh();
    } catch (error) {
      console.error('Error removing payment method:', error);
      toast.error('Failed to remove payment method');
    } finally {
      setLoading(null);
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      setLoading(paymentMethodId);
      const { error } = await supabase.functions.invoke('set-default-payment-method', {
        body: { payment_method_id: paymentMethodId }
      });
      
      if (error) throw error;
      
      toast.success('Default payment method updated');
      onRefresh();
    } catch (error) {
      console.error('Error setting default payment method:', error);
      toast.error('Failed to update default payment method');
    } finally {
      setLoading(null);
    }
  };

  const getCardBrand = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      default:
        return '💳';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Methods
          </div>
          <Button onClick={handleAddPaymentMethod} disabled={loading === 'add'}>
            <Plus className="h-4 w-4 mr-2" />
            Add Card
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {paymentMethods.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="mb-4">No payment methods saved</p>
            <Button onClick={handleAddPaymentMethod} disabled={loading === 'add'}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Card
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{getCardBrand(method.brand)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">
                        {method.brand} •••• {method.last4}
                      </span>
                      {method.is_default && (
                        <Badge variant="default" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Expires {method.exp_month.toString().padStart(2, '0')}/{method.exp_year}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!method.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(method.id)}
                      disabled={loading === method.id}
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Set Default
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemovePaymentMethod(method.id)}
                    disabled={loading === method.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};