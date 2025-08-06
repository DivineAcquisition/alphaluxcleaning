import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useSubcontractorTiers } from '@/hooks/useSubcontractorTiers';
import { Trophy, Star, TrendingUp, DollarSign } from 'lucide-react';

interface TierProgressMobileProps {
  subcontractorId: string;
}

export function TierProgressMobile({ subcontractorId }: TierProgressMobileProps) {
  const { getTierInfo, getNextTier } = useSubcontractorTiers();

  // Fetch subcontractor data
  const { data: subcontractor, isLoading } = useQuery({
    queryKey: ['subcontractor-tier-progress', subcontractorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subcontractors')
        .select('*')
        .eq('id', subcontractorId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch recent tier changes
  const { data: recentChanges = [] } = useQuery({
    queryKey: ['tier-change-history', subcontractorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tier_change_history')
        .select('*')
        .eq('subcontractor_id', subcontractorId)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!subcontractor) {
    return (
      <div className="p-4 text-center text-gray-500">
        Subcontractor data not found
      </div>
    );
  }

  const currentTier = getTierInfo(subcontractor.tier_level);
  const nextTier = getNextTier(subcontractor.tier_level);
  
  const reviewProgress = nextTier 
    ? Math.min((subcontractor.review_count / nextTier.requirements.reviews) * 100, 100)
    : 100;
  
  const jobProgress = nextTier 
    ? Math.min((subcontractor.completed_jobs_count / nextTier.requirements.jobs) * 100, 100)
    : 100;

  const getTierColor = (tierLevel: number) => {
    switch (tierLevel) {
      case 3: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 2: return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      {/* Current Tier Status */}
      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center mb-2">
            <Trophy className="h-8 w-8 text-primary mr-2" />
            <CardTitle className="text-2xl">Your Tier Status</CardTitle>
          </div>
          <Badge className={`text-lg px-4 py-2 ${getTierColor(currentTier.tier_level)}`}>
            Tier {currentTier.tier_level}: {currentTier.tier_name}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-sm text-muted-foreground">Hourly Rate</span>
              </div>
              <p className="text-xl font-bold text-green-600">${currentTier.hourly_rate}/hr</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <DollarSign className="h-4 w-4 text-blue-600 mr-1" />
                <span className="text-sm text-muted-foreground">Monthly Fee</span>
              </div>
              <p className="text-xl font-bold text-blue-600">${currentTier.monthly_fee}/mo</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress to Next Tier */}
      {nextTier && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Progress to {nextTier.tier_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium flex items-center">
                  <Star className="h-4 w-4 mr-1" />
                  Reviews
                </span>
                <span className="text-sm text-muted-foreground">
                  {subcontractor.review_count} / {nextTier.requirements.reviews}
                </span>
              </div>
              <Progress value={reviewProgress} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium flex items-center">
                  <Trophy className="h-4 w-4 mr-1" />
                  Jobs Completed
                </span>
                <span className="text-sm text-muted-foreground">
                  {subcontractor.completed_jobs_count} / {nextTier.requirements.jobs}
                </span>
              </div>
              <Progress value={jobProgress} className="h-2" />
            </div>

            {reviewProgress === 100 && jobProgress === 100 && (
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-green-800 font-medium">🎉 Congratulations!</p>
                <p className="text-sm text-green-600">You're eligible for tier upgrade!</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Tier Changes */}
      {recentChanges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentChanges.map((change) => (
                <div key={change.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">
                      Tier {change.old_tier} → Tier {change.new_tier}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(change.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={change.automatic ? 'default' : 'secondary'}>
                    {change.automatic ? 'Auto' : 'Manual'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-primary">{subcontractor.review_count}</p>
              <p className="text-sm text-muted-foreground">Total Reviews</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-primary">{subcontractor.completed_jobs_count}</p>
              <p className="text-sm text-muted-foreground">Jobs Completed</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">
                {subcontractor.rating ? subcontractor.rating.toFixed(1) : 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground">Average Rating</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {subcontractor.subscription_status === 'active' ? 'Active' : 'Inactive'}
              </p>
              <p className="text-sm text-muted-foreground">Status</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}