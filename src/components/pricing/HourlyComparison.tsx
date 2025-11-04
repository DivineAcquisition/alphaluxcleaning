import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown } from 'lucide-react';

interface HourlyComparisonProps {
  yourRate: number;
  estimatedHours: number;
  marketRate?: number;
}

export function HourlyComparison({ 
  yourRate, 
  estimatedHours,
  marketRate = 125 
}: HourlyComparisonProps) {
  const savingsPercentage = Math.round(((marketRate - yourRate) / marketRate) * 100);
  
  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">Hourly Rate Comparison</h3>
          <p className="text-sm text-muted-foreground">
            Based on ~{estimatedHours} hours of cleaning
          </p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <TrendingDown className="w-3 h-3 mr-1" />
          {savingsPercentage}% less
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-background rounded-lg border-2 border-primary">
          <div className="text-3xl font-bold text-primary mb-1">
            ${Math.round(yourRate)}
          </div>
          <div className="text-sm text-muted-foreground">Your Rate/Hour</div>
        </div>
        
        <div className="text-center p-4 bg-background rounded-lg border">
          <div className="text-3xl font-bold text-muted-foreground line-through mb-1">
            ${marketRate}
          </div>
          <div className="text-sm text-muted-foreground">Market Rate/Hour</div>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-background rounded-lg border">
        <p className="text-sm text-center font-medium">
          💰 You're saving <span className="text-primary font-bold">${Math.round((marketRate - yourRate) * estimatedHours)}</span> on this service
        </p>
      </div>
    </Card>
  );
}
