import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Settings, Calendar, DollarSign, ExternalLink } from "lucide-react";
import { Subscription } from "@/hooks/usePaymentData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface SubscriptionManagementProps {
  subscriptions: Subscription[];
  onRefresh: () => void;
}

export const SubscriptionManagement = ({ subscriptions, onRefresh }: SubscriptionManagementProps) => {
  const [loading, setLoading] = useState(false);

  const handleManageSubscription = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Failed to open subscription management');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'canceled':
        return 'secondary';
      case 'past_due':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Subscriptions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {subscriptions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Crown className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="mb-4">No active subscriptions</p>
            <p className="text-sm mb-4">Join BACP Club™ for exclusive benefits and monthly credits!</p>
            <Button onClick={() => window.location.href = '/membership'}>
              <Crown className="h-4 w-4 mr-2" />
              Explore Membership
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((subscription) => (
              <div
                key={subscription.id}
                className="p-6 border rounded-lg bg-gradient-to-r from-primary/5 to-accent/5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Crown className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{subscription.plan_name}</h3>
                      <Badge variant={getStatusVariant(subscription.status)} className="mt-1">
                        {subscription.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 font-semibold text-lg">
                      <DollarSign className="h-5 w-5" />
                      {formatCurrency(subscription.amount)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      per {subscription.interval}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Next billing: {format(new Date(subscription.current_period_end), 'MMM dd, yyyy')}
                  </div>
                </div>

                <div className="bg-white/50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium mb-2">Membership Benefits:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• $20 monthly cleaning credit</li>
                    <li>• Priority booking and scheduling</li>
                    <li>• 10% discount on add-on services</li>
                    <li>• Dedicated member support</li>
                    <li>• Exclusive perks and rewards</li>
                  </ul>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleManageSubscription} disabled={loading}>
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Subscription
                    <ExternalLink className="h-3 w-3 ml-1" />
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