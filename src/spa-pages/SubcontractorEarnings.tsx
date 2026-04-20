import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useSubcontractorEarnings } from '@/hooks/useSubcontractorEarnings';
import { EarningsStatCard } from '@/components/earnings/EarningsStatCard';
import { EarningsChart } from '@/components/earnings/EarningsChart';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Award,
  ArrowRight,
  History,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

export default function SubcontractorEarnings() {
  const { overview, loading, refreshData } = useSubcontractorEarnings();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No earnings data available</h3>
            <p className="text-muted-foreground text-center">
              Complete some jobs to start tracking your earnings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Earnings Overview
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your performance and earnings
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* This Week Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <EarningsStatCard
          title="This Week Earnings"
          value={`$${(overview.weekEarnings + overview.weekTips).toFixed(2)}`}
          subtext={`${overview.weekJobs} jobs completed`}
          icon={DollarSign}
          gradient={true}
        />
        
        <EarningsStatCard
          title="Tips This Week"
          value={`$${overview.weekTips.toFixed(2)}`}
          subtext="From satisfied customers"
          icon={Award}
        />
        
        <EarningsStatCard
          title="Jobs Completed"
          value={overview.weekJobs.toString()}
          subtext="This week"
          icon={Calendar}
        />
        
        <EarningsStatCard
          title="Avg Per Job"
          value={`$${overview.avgJobPayout.toFixed(2)}`}
          subtext="Including tips"
          icon={TrendingUp}
        />
      </div>

      {/* Chart */}
      <EarningsChart data={overview.last8Weeks} />

      {/* Payout Status & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payout Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Payout Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-300">Pending</p>
                <p className="text-sm text-amber-600 dark:text-amber-400">Awaiting next payout</p>
              </div>
              <p className="text-2xl font-bold text-amber-800 dark:text-amber-300">
                ${overview.pendingAmount.toFixed(2)}
              </p>
            </div>

            <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
              <div>
                <p className="font-medium text-green-800 dark:text-green-300">Total Earned</p>
                <p className="text-sm text-green-600 dark:text-green-400">All time earnings</p>
              </div>
              <p className="text-2xl font-bold text-green-800 dark:text-green-300">
                ${overview.totalEarnings.toFixed(2)}
              </p>
            </div>

            <Button asChild className="w-full">
              <Link to="/payouts">
                View Payout History <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Earnings Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Base Payout</span>
                <span className="font-semibold">${overview.monthEarnings.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Tips</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  +${overview.monthTips.toFixed(2)}
                </span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <span className="font-medium">Total This Month</span>
                <span className="text-xl font-bold text-primary">
                  ${(overview.monthEarnings + overview.monthTips).toFixed(2)}
                </span>
              </div>
              
              <div className="text-sm text-muted-foreground text-center pt-2">
                {overview.monthJobs} jobs completed in {format(new Date(), 'MMMM')}
              </div>
            </div>

            <Button asChild variant="outline" className="w-full">
              <Link to="/earnings/history">
                <History className="mr-2 h-4 w-4" />
                View Earnings History
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}