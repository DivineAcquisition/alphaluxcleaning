import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Gift, Sparkles } from 'lucide-react';

interface ReferralCreditsDisplayProps {
  customerEmail: string;
  onCreditsChange: (credits: number, autoApply: boolean) => void;
}

interface ReferralCredit {
  id: string;
  amount_cents: number;
  type: string;
  status: string;
  created_at: string;
}

export const ReferralCreditsDisplay: React.FC<ReferralCreditsDisplayProps> = ({
  customerEmail,
  onCreditsChange,
}) => {
  const [credits, setCredits] = useState<ReferralCredit[]>([]);
  const [totalCredits, setTotalCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [autoApply, setAutoApply] = useState(true);

  useEffect(() => {
    const fetchCredits = async () => {
      if (!customerEmail) {
        setLoading(false);
        return;
      }

      try {
        // First, find customer by email
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('id')
          .eq('email', customerEmail)
          .maybeSingle();

        if (customerError || !customer) {
          console.log('Customer not found or error:', customerError);
          setLoading(false);
          return;
        }

        // Fetch EARNED credits
        const { data: creditsData, error: creditsError } = await supabase
          .from('referral_rewards')
          .select('id, amount_cents, type, status, created_at')
          .eq('customer_id', customer.id)
          .eq('status', 'EARNED')
          .order('created_at', { ascending: false });

        if (creditsError) {
          console.error('Error fetching credits:', creditsError);
          setLoading(false);
          return;
        }

        setCredits(creditsData || []);
        const total = (creditsData || []).reduce((sum, credit) => sum + credit.amount_cents, 0);
        setTotalCredits(total);
        
        // Notify parent of credits availability
        onCreditsChange(total / 100, autoApply);
      } catch (error) {
        console.error('Error in fetchCredits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, [customerEmail]);

  useEffect(() => {
    // Update parent when autoApply changes
    onCreditsChange(totalCredits / 100, autoApply);
  }, [autoApply, totalCredits]);

  if (loading) {
    return null;
  }

  if (totalCredits === 0) {
    return null;
  }

  const totalDollars = totalCredits / 100;
  const creditCount = credits.length;

  return (
    <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 bg-green-100 rounded-full">
            <Gift className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-green-900">Referral Credits Available</h4>
              <Badge variant="secondary" className="bg-green-600 text-white">
                ${totalDollars.toFixed(2)}
              </Badge>
            </div>
            <p className="text-sm text-green-700 mb-3">
              You have {creditCount} referral {creditCount === 1 ? 'credit' : 'credits'} ready to use
            </p>
            
            <div className="flex items-center gap-3">
              <Switch
                id="auto-apply-credits"
                checked={autoApply}
                onCheckedChange={setAutoApply}
              />
              <Label 
                htmlFor="auto-apply-credits" 
                className="text-sm font-medium text-green-800 cursor-pointer"
              >
                Apply credits to this booking
              </Label>
            </div>

            {autoApply && (
              <div className="flex items-center gap-2 mt-3 p-2 bg-green-100 rounded-md">
                <Sparkles className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  ${totalDollars.toFixed(2)} will be deducted from your total
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
