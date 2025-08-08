import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, Download, Calendar, DollarSign } from "lucide-react";
import { PaymentOrder } from "@/hooks/usePaymentData";
import { format } from "date-fns";

interface PaymentHistoryProps {
  orders: PaymentOrder[];
  loading: boolean;
}

export const PaymentHistory = ({ orders, loading }: PaymentHistoryProps) => {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            Loading payment history...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Payment History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>No payment history found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">
                      {order.cleaning_type?.replace(/_/g, ' ') || 'Cleaning Service'}
                    </h4>
                    <Badge variant={getStatusVariant(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(order.created_at), 'MMM dd, yyyy')}
                    </div>
                    {order.scheduled_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Service: {format(new Date(order.scheduled_date), 'MMM dd, yyyy')}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-1 font-semibold">
                      <DollarSign className="h-4 w-4" />
                      {formatCurrency(order.amount)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {order.currency.toUpperCase()}
                    </div>
                  </div>
                  {order.status === 'paid' && (
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Receipt
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};