import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Zap, Clock, TrendingUp, Users, Smartphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { toast } from 'sonner';

interface UserPerformanceData {
  load_time_ms: number;
  page_url: string;
  timestamp: string;
  device_type: string;
}

interface UserFeatureUsage {
  feature_name: string;
  usage_count: number;
  total_time_spent_ms: number;
  last_used: string;
}

export default function UserPerformanceInsights() {
  const [performanceData, setPerformanceData] = useState<UserPerformanceData[]>([]);
  const [featureUsage, setFeatureUsage] = useState<UserFeatureUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<any>(null);
  
  const { trackFeatureUsage } = usePerformanceMonitoring();

  useEffect(() => {
    fetchUserData();
    trackFeatureUsage('user_performance_insights');
  }, [trackFeatureUsage]);

  const fetchUserData = async () => {
    try {
      setLoading(true);

      // Fetch user's performance data
      const { data: perfData, error: perfError } = await supabase
        .from('performance_metrics_log')
        .select('load_time_ms, page_url, timestamp, device_type')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (perfError) throw perfError;

      // Fetch user's feature usage
      const { data: usageData, error: usageError } = await supabase
        .from('feature_usage')
        .select('*')
        .order('last_used', { ascending: false });

      if (usageError) throw usageError;

      // Get performance insights
      const { data: insightsData, error: insightsError } = await supabase
        .rpc('get_performance_insights', { p_days: 30 });

      if (insightsError) throw insightsError;

      setPerformanceData(perfData || []);
      setFeatureUsage(usageData || []);
      setInsights(insightsData);

    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceScore = () => {
    const avgLoadTime = performanceData.reduce((sum, d) => sum + (d.load_time_ms || 0), 0) / performanceData.length;
    if (avgLoadTime < 1000) return { score: 100, label: 'Excellent', color: 'text-green-600' };
    if (avgLoadTime < 2000) return { score: 90, label: 'Good', color: 'text-green-500' };
    if (avgLoadTime < 3000) return { score: 70, label: 'Fair', color: 'text-yellow-500' };
    return { score: 50, label: 'Poor', color: 'text-red-500' };
  };

  const chartData = performanceData
    .slice(0, 20)
    .reverse()
    .map((data, index) => ({
      index: index + 1,
      loadTime: data.load_time_ms || 0,
      timestamp: new Date(data.timestamp).toLocaleDateString()
    }));

  const deviceStats = performanceData.reduce((acc, data) => {
    acc[data.device_type] = (acc[data.device_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTimeSpent = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const performanceScore = getPerformanceScore();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Your Performance Insights</h1>
        <p className="text-muted-foreground">See how the app performs for you and track your usage</p>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Performance Score</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${performanceScore.color}`}>
              {performanceScore.score}
            </div>
            <p className="text-xs text-muted-foreground">{performanceScore.label}</p>
            <Progress value={performanceScore.score} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Load Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(
                performanceData.reduce((sum, d) => sum + (d.load_time_ms || 0), 0) / performanceData.length || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">Last 50 page loads</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Features Used</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{featureUsage.length}</div>
            <p className="text-xs text-muted-foreground">Different features</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Primary Device</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {Object.keys(deviceStats).reduce((a, b) => deviceStats[a] > deviceStats[b] ? a : b, 'desktop')}
            </div>
            <p className="text-xs text-muted-foreground">Most used device</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance History</TabsTrigger>
          <TabsTrigger value="usage">Feature Usage</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Load Time Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [formatDuration(value), 'Load Time']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="loadTime" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>Your Feature Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {featureUsage.map((feature, index) => (
                  <div key={feature.feature_name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium capitalize">
                          {feature.feature_name.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Used {feature.usage_count} times • {formatTimeSpent(feature.total_time_spent_ms)} total
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Last used
                      </p>
                      <p className="text-sm font-medium">
                        {new Date(feature.last_used).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                {featureUsage.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No feature usage data yet</p>
                    <p className="text-sm">Start using the app to see your usage patterns</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {performanceScore.score < 80 && (
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium text-yellow-800">Improve Your Experience</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Try using a faster internet connection or closing other browser tabs to improve load times.
                    </p>
                  </div>
                )}
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800">Mobile Performance</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    {deviceStats.mobile > deviceStats.desktop 
                      ? "You're primarily a mobile user. The app is optimized for mobile devices."
                      : "You're primarily a desktop user. Consider trying the mobile version for on-the-go access."
                    }
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800">Feature Discovery</h4>
                  <p className="text-sm text-green-700 mt-1">
                    You've used {featureUsage.length} features. Explore the app to discover more time-saving tools.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(deviceStats).map(([device, count]) => (
                    <div key={device} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {device === 'mobile' ? (
                          <Smartphone className="h-4 w-4" />
                        ) : (
                          <TrendingUp className="h-4 w-4" />
                        )}
                        <span className="capitalize">{device}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{count} sessions</Badge>
                        <div className="w-20">
                          <Progress 
                            value={(count / performanceData.length) * 100} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}