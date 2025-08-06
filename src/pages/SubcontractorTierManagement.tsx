import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Crown, TrendingUp, TrendingDown, Users, DollarSign } from 'lucide-react';

interface SubcontractorWithTier {
  id: string;
  full_name: string;
  email: string;
  tier_level: number;
  review_count: number;
  completed_jobs_count: number;
  hourly_rate: number;
  monthly_fee: number;
}

interface TierConfig {
  tier_level: number;
  tier_name: string;
  hourly_rate: number;
  monthly_fee: number;
  reviews_required: number;
  jobs_required: number;
}

export default function SubcontractorTierManagement() {
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<SubcontractorWithTier | null>(null);
  const [tierChangeReason, setTierChangeReason] = useState('');
  const [newTierLevel, setNewTierLevel] = useState<number>(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch subcontractors with tier information
  const { data: subcontractors = [], isLoading } = useQuery({
    queryKey: ['subcontractors-with-tiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subcontractors')
        .select('id, full_name, email, tier_level, review_count, completed_jobs_count, hourly_rate, monthly_fee')
        .order('tier_level', { ascending: false });
      
      if (error) throw error;
      return data as SubcontractorWithTier[];
    }
  });

  // Fetch tier configurations
  const { data: tierConfigs = [] } = useQuery({
    queryKey: ['tier-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tier_system_config')
        .select('*')
        .order('tier_level');
      
      if (error) throw error;
      return data as TierConfig[];
    }
  });

  // Manual tier change mutation
  const tierChangeMutation = useMutation({
    mutationFn: async ({ subcontractorId, newTier, reason }: { subcontractorId: string; newTier: number; reason: string }) => {
      const tierConfig = tierConfigs.find(t => t.tier_level === newTier);
      if (!tierConfig) throw new Error('Invalid tier level');

      // Update subcontractor tier
      const { error: updateError } = await supabase
        .from('subcontractors')
        .update({
          tier_level: newTier,
          hourly_rate: tierConfig.hourly_rate,
          monthly_fee: tierConfig.monthly_fee
        })
        .eq('id', subcontractorId);

      if (updateError) throw updateError;

      // Log the tier change
      const { error: logError } = await supabase
        .from('tier_change_history')
        .insert({
          subcontractor_id: subcontractorId,
          old_tier: selectedSubcontractor?.tier_level,
          new_tier: newTier,
          change_reason: reason,
          automatic: false
        });

      if (logError) throw logError;
    },
    onSuccess: () => {
      toast({
        title: "Tier Updated",
        description: "Subcontractor tier has been successfully updated."
      });
      queryClient.invalidateQueries({ queryKey: ['subcontractors-with-tiers'] });
      setSelectedSubcontractor(null);
      setTierChangeReason('');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update tier: " + error.message,
        variant: "destructive"
      });
    }
  });

  const filteredSubcontractors = subcontractors.filter(sub => {
    const matchesSearch = sub.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = selectedTier === 'all' || sub.tier_level.toString() === selectedTier;
    return matchesSearch && matchesTier;
  });

  const getTierBadgeVariant = (tier: number) => {
    switch (tier) {
      case 3: return "default"; // Elite
      case 2: return "secondary"; // Professional  
      default: return "outline"; // Standard
    }
  };

  const getTierName = (tier: number) => {
    const config = tierConfigs.find(t => t.tier_level === tier);
    return config?.tier_name || `Tier ${tier}`;
  };

  const tierStats = tierConfigs.map(config => ({
    ...config,
    count: subcontractors.filter(s => s.tier_level === config.tier_level).length
  }));

  if (isLoading) {
    return (
      <AdminLayout title="Tier Management" description="Loading...">
        <div>Loading tier management data...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Subcontractor Tier Management" 
      description="Manage subcontractor tiers, track progression, and handle tier adjustments"
    >
      <div className="space-y-6">
        {/* Tier Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tierStats.map((tier) => (
            <Card key={tier.tier_level}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{tier.tier_name}</CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tier.count}</div>
                <p className="text-xs text-muted-foreground">
                  ${tier.hourly_rate}/hr • ${tier.monthly_fee}/month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search subcontractors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={selectedTier} onValueChange={setSelectedTier}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              {tierConfigs.map((tier) => (
                <SelectItem key={tier.tier_level} value={tier.tier_level.toString()}>
                  {tier.tier_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Subcontractors List */}
        <div className="grid gap-4">
          {filteredSubcontractors.map((subcontractor) => (
            <Card key={subcontractor.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="font-semibold">{subcontractor.full_name}</h3>
                    <p className="text-sm text-muted-foreground">{subcontractor.email}</p>
                  </div>
                  <Badge variant={getTierBadgeVariant(subcontractor.tier_level)}>
                    {getTierName(subcontractor.tier_level)}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <div className="font-medium">{subcontractor.review_count}</div>
                    <div className="text-muted-foreground">Reviews</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{subcontractor.completed_jobs_count}</div>
                    <div className="text-muted-foreground">Jobs</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">${subcontractor.hourly_rate}</div>
                    <div className="text-muted-foreground">Per Hour</div>
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedSubcontractor(subcontractor)}
                      >
                        Adjust Tier
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adjust Tier for {subcontractor.full_name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Current Tier</label>
                          <p className="text-sm text-muted-foreground">
                            {getTierName(subcontractor.tier_level)} - ${subcontractor.hourly_rate}/hr
                          </p>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">New Tier</label>
                          <Select value={newTierLevel.toString()} onValueChange={(value) => setNewTierLevel(parseInt(value))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {tierConfigs.map((tier) => (
                                <SelectItem key={tier.tier_level} value={tier.tier_level.toString()}>
                                  {tier.tier_name} - ${tier.hourly_rate}/hr
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Reason for Change</label>
                          <Textarea
                            value={tierChangeReason}
                            onChange={(e) => setTierChangeReason(e.target.value)}
                            placeholder="Enter reason for tier adjustment..."
                          />
                        </div>
                        
                        <Button
                          onClick={() => tierChangeMutation.mutate({
                            subcontractorId: subcontractor.id,
                            newTier: newTierLevel,
                            reason: tierChangeReason
                          })}
                          disabled={!tierChangeReason.trim() || tierChangeMutation.isPending}
                          className="w-full"
                        >
                          {tierChangeMutation.isPending ? 'Updating...' : 'Update Tier'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSubcontractors.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Subcontractors Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}