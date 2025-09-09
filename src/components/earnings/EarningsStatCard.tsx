import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface EarningsStatCardProps {
  title: string;
  value: string;
  subtext?: string;
  delta?: {
    value: number;
    isPositive: boolean;
    period: string;
  };
  icon: LucideIcon;
  gradient?: boolean;
}

export function EarningsStatCard({ 
  title, 
  value, 
  subtext, 
  delta, 
  icon: Icon,
  gradient = false 
}: EarningsStatCardProps) {
  return (
    <Card className={`${gradient ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20' : ''} hover:shadow-md transition-all duration-200`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`h-4 w-4 ${gradient ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-medium ${gradient ? 'text-primary' : 'text-muted-foreground'}`}>
                {title}
              </span>
            </div>
            
            <div className={`text-2xl font-bold ${gradient ? 'text-primary' : 'text-foreground'}`}>
              {value}
            </div>
            
            {subtext && (
              <p className="text-sm text-muted-foreground mt-1">
                {subtext}
              </p>
            )}
            
            {delta && (
              <div className="flex items-center gap-1 mt-2">
                <span 
                  className={`text-xs font-medium ${
                    delta.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {delta.isPositive ? '+' : ''}{delta.value.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">
                  vs {delta.period}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}