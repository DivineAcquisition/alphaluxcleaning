import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, TrendingUp, Award, CheckCircle2 } from 'lucide-react';

interface MembershipProgressTrackerProps {
  service: {
    id: string;
    commitment_months: number;
    total_services_completed: number;
    total_amount_saved: number;
    frequency: string;
    created_at: string;
    discount_percentage: number;
    price_per_service: number;
    commitment_progress?: {
      expected_visits: number;
      visits_completed: number;
      days_elapsed: number;
      days_total: number;
      status: 'active' | 'fulfilled' | 'none';
      commitment_end_date: string;
    };
  };
}

export const MembershipProgressTracker = ({ service }: MembershipProgressTrackerProps) => {
  const progress = service.commitment_progress;
  
  if (!progress || progress.status === 'none' || !service.commitment_months) {
    return null;
  }

  const progressPercentage = Math.min(100, Math.round((progress.visits_completed / progress.expected_visits) * 100));
  const timeProgressPercentage = Math.min(100, Math.round((progress.days_elapsed / progress.days_total) * 100));
  const remainingVisits = Math.max(0, progress.expected_visits - progress.visits_completed);
  const daysRemaining = Math.max(0, progress.days_total - progress.days_elapsed);

  const getMilestoneMessage = () => {
    if (progressPercentage >= 100) return { text: 'Commitment fulfilled! 🎊', color: 'text-green-600' };
    if (progressPercentage >= 75) return { text: 'Almost done! 💪', color: 'text-blue-600' };
    if (progressPercentage >= 50) return { text: 'Halfway there! 🌟', color: 'text-purple-600' };
    if (progressPercentage >= 25) return { text: 'Great start! 🎉', color: 'text-primary' };
    return { text: 'Your journey begins', color: 'text-muted-foreground' };
  };

  const milestone = getMilestoneMessage();

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground mb-1">
            {service.commitment_months}-Month Membership Progress
          </h3>
          <p className={`text-sm font-medium ${milestone.color}`}>
            {milestone.text}
          </p>
        </div>
        {progress.status === 'fulfilled' && (
          <Badge className="bg-green-500">
            <Award className="h-3 w-3 mr-1" />
            Complete
          </Badge>
        )}
      </div>

      {/* Visit Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Visits Completed</span>
          </div>
          <span className="text-sm font-bold text-foreground">
            {progress.visits_completed} of {progress.expected_visits}
          </span>
        </div>
        <Progress value={progressPercentage} className="h-3" />
        <p className="text-xs text-muted-foreground mt-1">
          {remainingVisits > 0 ? `${remainingVisits} visits remaining` : 'All visits completed!'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-background/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <p className="text-xs text-muted-foreground">Total Saved</p>
          </div>
          <p className="text-xl font-bold text-green-600">
            ${service.total_amount_saved.toFixed(0)}
          </p>
        </div>

        <div className="bg-background/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-primary" />
            <p className="text-xs text-muted-foreground">Days Left</p>
          </div>
          <p className="text-xl font-bold text-foreground">
            {daysRemaining}
          </p>
        </div>

        <div className="bg-background/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Per Visit Savings</p>
          <p className="text-xl font-bold text-green-600">
            ${(service.price_per_service * service.discount_percentage).toFixed(0)}
          </p>
        </div>

        <div className="bg-background/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Started</p>
          <p className="text-sm font-medium text-foreground">
            {new Date(service.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Time Progress */}
      {progress.status === 'active' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Commitment Period</span>
            <span className="text-xs text-muted-foreground">
              Ends {new Date(progress.commitment_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <Progress value={timeProgressPercentage} className="h-2" />
        </div>
      )}

      {progress.status === 'fulfilled' && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-700 dark:text-green-400">
            🎉 Congratulations! You've completed your {service.commitment_months}-month commitment and saved ${service.total_amount_saved.toFixed(0)}. 
            Continue enjoying flexible scheduling with your membership benefits!
          </p>
        </div>
      )}
    </Card>
  );
};
