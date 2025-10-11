import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { TrendingDown, DollarSign, Award, Calendar } from 'lucide-react';

interface RecurringSavingsDashboardProps {
  customerId: string;
}

export const RecurringSavingsDashboard = ({ customerId }: RecurringSavingsDashboardProps) => {
  const [loading, setLoading] = useState(true);
  const [savings, setSavings] = useState<any>(null);

  useEffect(() => {
    fetchSavings();
  }, [customerId]);

  const fetchSavings = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('calculate-recurring-savings', {
        body: { customer_id: customerId }
      });

      if (error) throw error;
      setSavings(data);
    } catch (error) {
      console.error('Error fetching savings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !savings) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const loyaltyProgress = (savings.loyalty_progress.current / savings.loyalty_progress.target) * 100;

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-foreground">Your Savings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Saved</p>
              <p className="text-2xl font-bold text-green-500">
                {formatCurrency(savings.total_saved)}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            From {savings.services_completed} completed services
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Projected Annual</p>
              <p className="text-2xl font-bold text-blue-500">
                {formatCurrency(savings.projected_annual_savings)}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Based on current frequency
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Value</p>
              <p className="text-2xl font-bold text-purple-500">
                {formatCurrency(savings.monthly_recurring_value)}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {savings.active_services_count} active service{savings.active_services_count !== 1 ? 's' : ''}
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Award className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Loyalty Progress</p>
              <p className="text-2xl font-bold text-orange-500">
                {savings.loyalty_progress.current} / {savings.loyalty_progress.target}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Progress value={loyaltyProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {savings.loyalty_progress.free_cleans_earned} free clean{savings.loyalty_progress.free_cleans_earned !== 1 ? 's' : ''} earned
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};