import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, 
  AlertTriangle, 
  Info, 
  AlertCircle,
  ExternalLink,
  Clock,
  TrendingUp
} from 'lucide-react';
import { DashboardPayouts, DashboardAlert } from '@/hooks/useDashboardData';

interface PayoutsAlertsSectionProps {
  payouts: DashboardPayouts;
  alerts: DashboardAlert[];
  onRefresh: () => void;
}

export function PayoutsAlertsSection({ payouts, alerts, onRefresh }: PayoutsAlertsSectionProps) {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return AlertCircle;
      case 'warning':
        return AlertTriangle;
      case 'info':
        return Info;
      default:
        return Info;
    }
  };

  const getAlertVariant = (type: string) => {
    switch (type) {
      case 'error':
        return 'destructive' as const;
      case 'warning':
        return 'default' as const;
      case 'info':
        return 'default' as const;
      default:
        return 'default' as const;
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Payouts Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Payouts This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div>
                <p className="text-2xl font-bold text-green-800">
                  ${payouts.thisWeekTotal.toFixed(2)}
                </p>
                <p className="text-sm text-green-600">
                  {payouts.thisWeekCount} completed jobs
                </p>
              </div>
              <div className="text-right">
                <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
                <p className="text-xs text-green-600">Ready to pay</p>
              </div>
            </div>

            {payouts.pendingJobs.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Recent Completed Jobs:</h4>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {payouts.pendingJobs.slice(0, 3).map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                      <div>
                        <p className="font-medium">{job.subcontractor_name}</p>
                        <p className="text-muted-foreground">{job.customer_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${job.subcontractor_payout_amount?.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{job.service_date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button className="w-full" disabled={payouts.thisWeekTotal === 0}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Review & Pay ({payouts.thisWeekCount} jobs)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Alerts & Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
              <p className="text-muted-foreground">
                No urgent items requiring attention right now.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const AlertIcon = getAlertIcon(alert.type);
                return (
                  <Alert key={alert.id} variant={getAlertVariant(alert.type)}>
                    <AlertIcon className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{alert.title}</p>
                        <p className="text-sm">{alert.message}</p>
                      </div>
                      {alert.action && (
                        <Button size="sm" variant="outline">
                          {alert.action}
                        </Button>
                      )}
                    </AlertDescription>
                  </Alert>
                );
              })}
            </div>
          )}

          {/* Quick Stats */}
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">
                  {alerts.filter(a => a.type === 'warning' || a.type === 'error').length}
                </p>
                <p className="text-sm text-muted-foreground">Action Items</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {alerts.filter(a => a.type === 'info').length}
                </p>
                <p className="text-sm text-muted-foreground">FYI Items</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}