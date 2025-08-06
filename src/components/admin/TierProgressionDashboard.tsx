import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAutomatedTierProgression } from '@/hooks/useAutomatedTierProgression';
import { TrendingUp, Users, Clock, Play, RefreshCw } from 'lucide-react';

export function TierProgressionDashboard() {
  const { processAllSubcontractors, triggerPaymentProcessing, isProcessing } = useAutomatedTierProgression();

  // Fetch recent tier changes
  const { data: recentChanges = [] } = useQuery({
    queryKey: ['recent-tier-changes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tier_change_history')
        .select(`
          *,
          subcontractors (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch pending progression candidates
  const { data: progressionCandidates = [] } = useQuery({
    queryKey: ['progression-candidates'],
    queryFn: async () => {
      const { data: subcontractors, error } = await supabase
        .from('subcontractors')
        .select('*')
        .eq('subscription_status', 'active')
        .eq('is_available', true);
      
      if (error) throw error;

      const { data: tierConfigs, error: configError } = await supabase
        .from('tier_system_config')
        .select('*')
        .eq('is_active', true)
        .order('tier_level', { ascending: false });
      
      if (configError) throw configError;

      // Find subcontractors eligible for tier upgrades
      const candidates = subcontractors.filter(sub => {
        const nextTier = tierConfigs.find(config => 
          config.tier_level > sub.tier_level &&
          sub.review_count >= config.reviews_required &&
          sub.completed_jobs_count >= config.jobs_required
        );
        return nextTier !== undefined;
      });

      return candidates;
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTierBadgeColor = (tierLevel: number) => {
    switch (tierLevel) {
      case 3: return 'bg-yellow-100 text-yellow-800';
      case 2: return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex space-x-4">
        <Button 
          onClick={() => processAllSubcontractors(true)}
          disabled={isProcessing}
          size="lg"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {isProcessing ? 'Processing...' : 'Process All Tiers'}
        </Button>
        <Button 
          variant="outline"
          onClick={() => triggerPaymentProcessing()}
          disabled={isProcessing}
          size="lg"
        >
          <Play className="h-4 w-4 mr-2" />
          Process Payments
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progression Candidates</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressionCandidates.length}</div>
            <p className="text-xs text-muted-foreground">
              Subcontractors eligible for tier upgrade
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Changes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentChanges.length}</div>
            <p className="text-xs text-muted-foreground">
              Tier changes in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subcontractors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Currently active in system
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progression Candidates */}
      <Card>
        <CardHeader>
          <CardTitle>Tier Progression Candidates</CardTitle>
        </CardHeader>
        <CardContent>
          {progressionCandidates.length === 0 ? (
            <p className="text-muted-foreground">No subcontractors currently eligible for tier upgrades.</p>
          ) : (
            <div className="space-y-4">
              {progressionCandidates.map((candidate) => (
                <div key={candidate.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{candidate.full_name}</h4>
                    <p className="text-sm text-muted-foreground">{candidate.email}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className={getTierBadgeColor(candidate.tier_level)}>
                        Tier {candidate.tier_level}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {candidate.review_count} reviews, {candidate.completed_jobs_count} jobs
                      </span>
                    </div>
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => processAllSubcontractors(true)}
                    disabled={isProcessing}
                  >
                    Process
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Tier Changes */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tier Changes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentChanges.length === 0 ? (
            <p className="text-muted-foreground">No recent tier changes.</p>
          ) : (
            <div className="space-y-4">
              {recentChanges.map((change) => (
                <div key={change.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{change.subcontractors?.full_name || 'Unknown'}</h4>
                    <p className="text-sm text-muted-foreground">{change.subcontractors?.email}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className={getTierBadgeColor(change.old_tier)}>
                        Tier {change.old_tier}
                      </Badge>
                      <span className="text-sm">→</span>
                      <Badge className={getTierBadgeColor(change.new_tier)}>
                        Tier {change.new_tier}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(change.created_at)}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {change.automatic ? 'Auto' : 'Manual'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}