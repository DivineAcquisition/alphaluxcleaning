import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  Users,
  Calendar,
  BarChart3
} from 'lucide-react';

interface HubOverviewProps {
  data: any;
}

export function HubOverview({ data }: HubOverviewProps) {
  const recentActivity = data?.recentActivity || [];
  const smartAlerts = data?.notifications || [];
  const performance = data?.analytics?.performance || {};

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Smart Alerts */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Smart Alerts & Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {smartAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>No alerts - everything looks good!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {smartAlerts.slice(0, 5).map((alert: any, index: number) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    alert.priority === 'high' ? 'border-red-500 bg-red-50' :
                    alert.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                    'border-blue-500 bg-blue-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{alert.title}</h4>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    </div>
                    <Badge variant={alert.priority === 'high' ? 'destructive' : 'secondary'}>
                      {alert.priority}
                    </Badge>
                  </div>
                </div>
              ))}
              {smartAlerts.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  +{smartAlerts.length - 5} more alerts
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full justify-start" variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Add New Subcontractor
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Assign Jobs
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Analytics
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <Clock className="h-4 w-4 mr-2" />
            Process Applications
          </Button>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.slice(0, 8).map((activity: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Average Rating</span>
              <span className="font-medium">{performance.avgRating || '4.8'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>On-Time Rate</span>
              <span className="font-medium">{performance.onTimeRate || '96%'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Job Completion</span>
              <span className="font-medium">{performance.completionRate || '98%'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Customer Satisfaction</span>
              <span className="font-medium">{performance.satisfaction || '4.9'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}