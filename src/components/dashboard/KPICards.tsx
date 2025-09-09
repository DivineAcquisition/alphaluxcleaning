import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Calendar, 
  Users, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp 
} from 'lucide-react';
import { DashboardKPIs } from '@/hooks/useDashboardData';

interface KPICardsProps {
  kpis: DashboardKPIs;
}

export function KPICards({ kpis }: KPICardsProps) {
  const kpiData = [
    {
      title: "Today's Jobs",
      value: kpis.todaysJobs,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Unassigned',
      value: kpis.unassigned,
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      title: 'In Progress',
      value: kpis.inProgress,
      icon: Clock,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Late/No Show',
      value: kpis.lateNoShow,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      title: 'Payouts Pending',
      value: `$${kpis.payoutsPending.toFixed(0)}`,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      title: 'Avg Reliability',
      value: `${kpis.avgReliability.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {kpiData.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card key={kpi.title} className={`${kpi.borderColor} ${kpi.bgColor}/30`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-sm text-muted-foreground">{kpi.title}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}