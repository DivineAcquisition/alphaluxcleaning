import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { Settings, Save, RefreshCw } from 'lucide-react';

interface TierConfig {
  id: string;
  tier_level: number;
  tier_name: string;
  hourly_rate: number;
  monthly_fee: number;
  reviews_required: number;
  jobs_required: number;
  is_active: boolean;
}

export default function TierSystemConfig() {
  const [editingTier, setEditingTier] = useState<TierConfig | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tier configurations
  const { data: tierConfigs = [], isLoading } = useQuery({
    queryKey: ['tier-system-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tier_system_config')
        .select('*')
        .order('tier_level');
      
      if (error) throw error;
      return data as TierConfig[];
    }
  });

  // Update tier configuration mutation
  const updateTierMutation = useMutation({
    mutationFn: async (tierConfig: TierConfig) => {
      const { error } = await supabase
        .from('tier_system_config')
        .update({
          tier_name: tierConfig.tier_name,
          hourly_rate: tierConfig.hourly_rate,
          monthly_fee: tierConfig.monthly_fee,
          reviews_required: tierConfig.reviews_required,
          jobs_required: tierConfig.jobs_required
        })
        .eq('id', tierConfig.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Configuration Updated",
        description: "Tier system configuration has been successfully updated."
      });
      queryClient.invalidateQueries({ queryKey: ['tier-system-configs'] });
      setEditingTier(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update configuration: " + error.message,
        variant: "destructive"
      });
    }
  });

  // Recalculate all tiers mutation
  const recalculateAllTiersMutation = useMutation({
    mutationFn: async () => {
      // Get all subcontractors
      const { data: subcontractors, error: fetchError } = await supabase
        .from('subcontractors')
        .select('id, review_count, completed_jobs_count');

      if (fetchError) throw fetchError;

      // Recalculate each subcontractor's tier
      for (const subcontractor of subcontractors) {
        const { error: rpcError } = await supabase
          .rpc('update_subcontractor_tier', {
            p_subcontractor_id: subcontractor.id
          });

        if (rpcError) throw rpcError;
      }
    },
    onSuccess: () => {
      toast({
        title: "Tiers Recalculated",
        description: "All subcontractor tiers have been recalculated based on current configuration."
      });
      queryClient.invalidateQueries({ queryKey: ['subcontractors-with-tiers'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to recalculate tiers: " + error.message,
        variant: "destructive"
      });
    }
  });

  const handleEditTier = (tier: TierConfig) => {
    setEditingTier({ ...tier });
  };

  const handleSaveTier = () => {
    if (editingTier) {
      updateTierMutation.mutate(editingTier);
    }
  };

  const handleInputChange = (field: keyof TierConfig, value: string | number) => {
    if (editingTier) {
      setEditingTier({
        ...editingTier,
        [field]: value
      });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Tier System Configuration" description="Loading...">
        <div>Loading configuration...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Tier System Configuration" 
      description="Configure tier requirements, rates, and system-wide settings"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Tier Configuration</h2>
          </div>
          <Button 
            onClick={() => recalculateAllTiersMutation.mutate()}
            disabled={recalculateAllTiersMutation.isPending}
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {recalculateAllTiersMutation.isPending ? 'Recalculating...' : 'Recalculate All Tiers'}
          </Button>
        </div>

        {/* Tier Configurations */}
        <div className="grid gap-6">
          {tierConfigs.map((tier) => (
            <Card key={tier.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Tier {tier.tier_level}: {tier.tier_name}</span>
                  {editingTier?.id === tier.id ? (
                    <div className="space-x-2">
                      <Button 
                        size="sm" 
                        onClick={handleSaveTier}
                        disabled={updateTierMutation.isPending}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setEditingTier(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleEditTier(tier)}
                    >
                      Edit
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingTier?.id === tier.id ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="tier_name">Tier Name</Label>
                      <Input
                        id="tier_name"
                        value={editingTier.tier_name}
                        onChange={(e) => handleInputChange('tier_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                      <Input
                        id="hourly_rate"
                        type="number"
                        step="0.01"
                        value={editingTier.hourly_rate}
                        onChange={(e) => handleInputChange('hourly_rate', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="monthly_fee">Monthly Fee ($)</Label>
                      <Input
                        id="monthly_fee"
                        type="number"
                        step="0.01"
                        value={editingTier.monthly_fee}
                        onChange={(e) => handleInputChange('monthly_fee', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="reviews_required">Reviews Required</Label>
                      <Input
                        id="reviews_required"
                        type="number"
                        value={editingTier.reviews_required}
                        onChange={(e) => handleInputChange('reviews_required', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="jobs_required">Jobs Required</Label>
                      <Input
                        id="jobs_required"
                        type="number"
                        value={editingTier.jobs_required}
                        onChange={(e) => handleInputChange('jobs_required', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Hourly Rate</Label>
                      <p className="text-lg font-semibold">${tier.hourly_rate}/hr</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Monthly Fee</Label>
                      <p className="text-lg font-semibold">${tier.monthly_fee}/month</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Reviews Required</Label>
                      <p className="text-lg font-semibold">{tier.reviews_required}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Jobs Required</Label>
                      <p className="text-lg font-semibold">{tier.jobs_required}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Status</Label>
                      <p className="text-lg font-semibold text-green-600">Active</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Tier Calculation</Label>
                <p className="text-sm">Automatic tier updates are triggered when review count or completed jobs change.</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Payment Processing</Label>
                <p className="text-sm">Monthly fees are automatically charged based on tier level on the subscription date.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}