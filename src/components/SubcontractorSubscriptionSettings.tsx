import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useSubcontractorTiers, type SubcontractorWithTier } from "@/hooks/useSubcontractorTiers";
import { CreditCard, TrendingUp, Star, CheckCircle, Clock, DollarSign, Target } from "lucide-react";

interface SubcontractorSubscriptionSettingsProps {
  subcontractor: SubcontractorWithTier;
  onUpdate: () => void;
}

export const SubcontractorSubscriptionSettings = ({ subcontractor, onUpdate }: SubcontractorSubscriptionSettingsProps) => {
  const [loading, setLoading] = useState<number | null>(null);
  const { toast } = useToast();
  const { getTierInfo, getAllTiers, getNextTier, canUpgradeToTier } = useSubcontractorTiers();

  const currentTierInfo = getTierInfo(subcontractor.tier_level);
  const nextTier = getNextTier(subcontractor.tier_level);
  const allTiers = getAllTiers();

  const getProgressToNextTier = () => {
    if (!nextTier) return { reviewProgress: 100, jobProgress: 100 };
    
    const reviewProgress = Math.min((subcontractor.review_count / nextTier.requirements.reviews) * 100, 100);
    const jobProgress = Math.min((subcontractor.completed_jobs_count / nextTier.requirements.jobs) * 100, 100);
    
    return { reviewProgress, jobProgress };
  };

  const { reviewProgress, jobProgress } = getProgressToNextTier();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Hourly Tier System
        </CardTitle>
        <CardDescription>
          Advance through tiers by completing jobs and collecting reviews to increase your hourly rate
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Tier Status */}
        <div className="p-4 border rounded-lg bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Current Tier</h3>
            <Badge variant={subcontractor.subscription_status === 'active' ? 'default' : 'secondary'}>
              {subcontractor.subscription_status}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{currentTierInfo.tier_name}</span>
              </div>
              <p className="text-sm text-muted-foreground">Tier {currentTierInfo.tier_level}</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold">${subcontractor.hourly_rate}</span>
              </div>
              <p className="text-sm text-muted-foreground">Per Hour</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold">${subcontractor.monthly_fee}</span>
              </div>
              <p className="text-sm text-muted-foreground">Monthly Fee</p>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">Reviews Collected</span>
              </div>
              <div className="text-2xl font-bold">{subcontractor.review_count}</div>
              <p className="text-sm text-muted-foreground">Total customer reviews</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="font-medium">Jobs Completed</span>
              </div>
              <div className="text-2xl font-bold">{subcontractor.completed_jobs_count}</div>
              <p className="text-sm text-muted-foreground">Successfully finished jobs</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress to Next Tier */}
        {nextTier && (
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Progress to {nextTier.tier_name}</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Reviews: {subcontractor.review_count} / {nextTier.requirements.reviews}</span>
                  <span>{reviewProgress.toFixed(0)}%</span>
                </div>
                <Progress value={reviewProgress} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Jobs: {subcontractor.completed_jobs_count} / {nextTier.requirements.jobs}</span>
                  <span>{jobProgress.toFixed(0)}%</span>
                </div>
                <Progress value={jobProgress} className="h-2" />
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t">
                <div>
                  <p className="font-medium">Next Tier Benefits:</p>
                  <p className="text-sm text-muted-foreground">
                    ${nextTier.hourly_rate}/hr (${nextTier.monthly_fee}/month)
                  </p>
                </div>
                <Badge variant={canUpgradeToTier(subcontractor, nextTier.tier_level) ? "default" : "secondary"}>
                  {canUpgradeToTier(subcontractor, nextTier.tier_level) ? "Ready to Upgrade!" : "Keep Working!"}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* All Tier Information */}
        <div className="space-y-4">
          <h3 className="font-semibold">Tier Structure</h3>
          <div className="grid gap-3">
            {allTiers.map((tier) => (
              <Card 
                key={tier.tier_level} 
                className={`relative ${tier.tier_level === 2 ? 'border-primary' : ''} ${tier.tier_level === subcontractor.tier_level ? 'bg-primary/5 border-primary' : ''}`}
              >
                {tier.tier_level === 2 && (
                  <div className="absolute -top-2 left-4">
                    <Badge variant="default" className="bg-primary">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{tier.tier_name}</h4>
                        {tier.tier_level === subcontractor.tier_level && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {tier.requirements.reviews > 0 
                          ? `${tier.requirements.reviews} reviews • ${tier.requirements.jobs} jobs`
                          : 'Starting tier'
                        }
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">${tier.hourly_rate}/hr</p>
                      <p className="text-sm text-muted-foreground">${tier.monthly_fee}/month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded">
          <p><strong>Note:</strong> Tier advancement is automatic based on performance metrics. 
          Monthly fees are charged automatically. Hourly rates can be manually adjusted by management when needed.</p>
        </div>
      </CardContent>
    </Card>
  );
};