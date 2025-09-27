import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Zap,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface WebhookStats {
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  success_rate: number;
  last_24h_deliveries: number;
  last_success: string | null;
  last_failure: string | null;
}

export function WebhookHealthMonitor() {
  const [stats, setStats] = useState<WebhookStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Get delivery stats from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: logs, error } = await supabase
        .from('webhook_delivery_logs')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const totalDeliveries = logs?.length || 0;
      const successfulDeliveries = logs?.filter(log => log.delivered_at !== null).length || 0;
      const failedDeliveries = totalDeliveries - successfulDeliveries;
      const successRate = totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0;

      // Last 24 hours
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
      const last24hDeliveries = logs?.filter(log => 
        new Date(log.created_at) >= twentyFourHoursAgo
      ).length || 0;

      // Last success and failure
      const lastSuccess = logs?.find(log => log.delivered_at !== null)?.delivered_at || null;
      const lastFailure = logs?.find(log => log.delivered_at === null && log.error_message)?.created_at || null;

      setStats({
        total_deliveries: totalDeliveries,
        successful_deliveries: successfulDeliveries,
        failed_deliveries: failedDeliveries,
        success_rate: successRate,
        last_24h_deliveries: last24hDeliveries,
        last_success: lastSuccess,
        last_failure: lastFailure
      });
    } catch (error) {
      console.error('Error loading webhook stats:', error);
      toast.error('Failed to load webhook statistics');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const refreshStats = async () => {
    setIsRefreshing(true);
    await loadStats();
  };

  const testWebhookHealth = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('webhook-delivery-test');
      
      if (error) throw error;
      
      if (data.success) {
        toast.success('Webhook health test completed! Check delivery logs for results.');
        setTimeout(() => refreshStats(), 2000);
      } else {
        toast.error('Webhook health test failed');
      }
    } catch (error) {
      console.error('Error testing webhook health:', error);
      toast.error('Failed to run webhook health test');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading webhook health statistics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getHealthStatus = () => {
    if (!stats || stats.total_deliveries === 0) return { status: 'unknown', color: 'secondary' };
    if (stats.success_rate >= 95) return { status: 'healthy', color: 'default' };
    if (stats.success_rate >= 80) return { status: 'warning', color: 'secondary' };
    return { status: 'critical', color: 'destructive' };
  };

  const healthStatus = getHealthStatus();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Webhook Health Monitor
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              onClick={refreshStats} 
              variant="outline" 
              size="sm"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={testWebhookHealth} size="sm">
              <Zap className="h-4 w-4 mr-2" />
              Test Health
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {stats ? (
          <div className="space-y-4">
            {/* Overall Health Status */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {healthStatus.status === 'healthy' && <CheckCircle className="h-5 w-5 text-green-500" />}
                {healthStatus.status === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                {healthStatus.status === 'critical' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                {healthStatus.status === 'unknown' && <Activity className="h-5 w-5 text-gray-500" />}
                <span className="font-medium">
                  Status: {healthStatus.status.charAt(0).toUpperCase() + healthStatus.status.slice(1)}
                </span>
              </div>
              <Badge variant={healthStatus.color as any}>
                {stats.success_rate.toFixed(1)}% Success Rate
              </Badge>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{stats.total_deliveries}</div>
                <div className="text-sm text-muted-foreground">Total Deliveries</div>
                <div className="text-xs text-muted-foreground">(Last 30 days)</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.successful_deliveries}</div>
                <div className="text-sm text-muted-foreground">Successful</div>
                <div className="flex items-center justify-center text-xs text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {((stats.successful_deliveries / Math.max(stats.total_deliveries, 1)) * 100).toFixed(1)}%
                </div>
              </div>
              
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats.failed_deliveries}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
                <div className="flex items-center justify-center text-xs text-red-600">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  {((stats.failed_deliveries / Math.max(stats.total_deliveries, 1)) * 100).toFixed(1)}%
                </div>
              </div>
              
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.last_24h_deliveries}</div>
                <div className="text-sm text-muted-foreground">Last 24h</div>
                <div className="text-xs text-muted-foreground">Deliveries</div>
              </div>
            </div>

            {/* Last Activity */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Recent Activity</h4>
              <div className="space-y-1 text-sm">
                {stats.last_success && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Last successful delivery: {new Date(stats.last_success).toLocaleString()}</span>
                  </div>
                )}
                {stats.last_failure && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Last failure: {new Date(stats.last_failure).toLocaleString()}</span>
                  </div>
                )}
                {!stats.last_success && !stats.last_failure && (
                  <div className="text-muted-foreground">No recent webhook activity</div>
                )}
              </div>
            </div>

            {/* Recommendations */}
            {healthStatus.status !== 'healthy' && stats.total_deliveries > 0 && (
              <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Recommendations</span>
                </div>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {stats.success_rate < 80 && (
                    <li>• Check webhook URL validity - many recent failures detected</li>
                  )}
                  {stats.failed_deliveries > stats.successful_deliveries && (
                    <li>• Update webhook endpoint - more failures than successes</li>
                  )}
                  <li>• Verify webhook endpoint is accessible and returns proper responses</li>
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No webhook delivery data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}