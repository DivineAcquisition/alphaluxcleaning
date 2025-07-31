import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, TrendingUp, Star, CheckCircle } from "lucide-react";

interface SubcontractorSubscriptionSettingsProps {
  subcontractor: {
    id: string;
    split_tier: string;
    subscription_status: string;
    user_id: string;
    full_name: string;
  };
  onUpdate: () => void;
}

const SPLIT_TIERS = [
  {
    id: '60_40',
    name: 'Starter',
    split: '60/40',
    yourShare: '40%',
    price: 'Free',
    features: ['Basic job assignments', 'No guaranteed jobs', 'Standard support', 'Weekly payments'],
    isPopular: false,
  },
  {
    id: '50_50',
    name: 'Professional',
    split: '50/50',
    yourShare: '50%',
    price: '$25/month',
    features: ['Priority job assignments', '8 guaranteed jobs/month', 'Priority support', 'Bi-weekly payments'],
    isPopular: true,
  },
  {
    id: '35_65',
    name: 'Premium',
    split: '35/65',
    yourShare: '65%',
    price: '$75/month',
    features: ['First priority on all jobs', '12 guaranteed jobs/month', 'Premium support', 'Weekly payments', 'Performance bonuses'],
    isPopular: false,
  },
  {
    id: '25_75',
    name: 'Elite',
    split: '25/75',
    yourShare: '75%',
    price: '$150/month',
    features: ['Exclusive priority access', '20 guaranteed jobs/month', 'Dedicated support', 'Daily payments', 'Maximum bonuses', 'Territory protection'],
    isPopular: false,
  },
];

export const SubcontractorSubscriptionSettings = ({ subcontractor, onUpdate }: SubcontractorSubscriptionSettingsProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleUpgrade = async (newTier: string) => {
    if (newTier === '60_40') {
      toast({
        variant: "destructive",
        title: "Downgrade Not Available",
        description: "Contact support to downgrade your subscription.",
      });
      return;
    }

    setLoading(newTier);

    try {
      const { data, error } = await supabase.functions.invoke('create-subcontractor-subscription', {
        body: {
          splitTier: newTier,
          subcontractorData: {
            fullName: subcontractor.full_name,
            currentTier: subcontractor.split_tier
          }
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
        
        toast({
          title: "Redirecting to Payment",
          description: "Complete your payment to upgrade your subscription.",
        });
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        variant: "destructive",
        title: "Upgrade Failed",
        description: "Failed to start subscription upgrade. Please try again.",
      });
    } finally {
      setLoading(null);
    }
  };

  const currentTier = SPLIT_TIERS.find(tier => tier.id === subcontractor.split_tier);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Subscription & Split Tier
        </CardTitle>
        <CardDescription>
          Upgrade your split tier to earn more per job and get priority access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Plan */}
        <div className="p-4 border rounded-lg bg-muted/50">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Current Plan</h3>
            <Badge variant={subcontractor.subscription_status === 'active' ? 'default' : 'secondary'}>
              {subcontractor.subscription_status}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-2xl font-bold">{currentTier?.yourShare}</p>
              <p className="text-sm text-muted-foreground">Your earnings share</p>
            </div>
            <div>
              <p className="font-medium">{currentTier?.name}</p>
              <p className="text-sm text-muted-foreground">{currentTier?.price}</p>
            </div>
          </div>
        </div>

        {/* Available Plans */}
        <div className="grid gap-4">
          <h3 className="font-semibold">Available Plans</h3>
          {SPLIT_TIERS.map((tier) => (
            <Card 
              key={tier.id} 
              className={`relative ${tier.isPopular ? 'border-primary' : ''} ${tier.id === subcontractor.split_tier ? 'bg-muted/30' : ''}`}
            >
              {tier.isPopular && (
                <div className="absolute -top-2 left-4">
                  <Badge variant="default" className="bg-primary">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold flex items-center gap-2">
                      {tier.name}
                      {tier.id === subcontractor.split_tier && (
                        <Badge variant="outline" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Current
                        </Badge>
                      )}
                    </h4>
                    <p className="text-2xl font-bold text-primary">{tier.yourShare}</p>
                    <p className="text-sm text-muted-foreground">earnings per job</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{tier.price}</p>
                    <p className="text-xs text-muted-foreground">Split: {tier.split}</p>
                  </div>
                </div>

                <ul className="space-y-1 mb-4">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="text-sm flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {tier.id !== subcontractor.split_tier && (
                  <Button
                    onClick={() => handleUpgrade(tier.id)}
                    disabled={loading === tier.id}
                    variant={tier.isPopular ? "default" : "outline"}
                    className="w-full"
                  >
                    {loading === tier.id ? (
                      "Processing..."
                    ) : tier.id === '60_40' ? (
                      "Contact Support"
                    ) : (
                      <>
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Upgrade to {tier.name}
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded">
          <p><strong>Note:</strong> Subscription changes take effect immediately upon successful payment. 
          Guaranteed job minimums are calculated monthly. Contact support for downgrades or cancellations.</p>
        </div>
      </CardContent>
    </Card>
  );
};