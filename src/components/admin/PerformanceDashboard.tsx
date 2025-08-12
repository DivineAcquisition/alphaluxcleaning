import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Activity, Zap, Users, TrendingUp, Clock, Smartphone, Monitor, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PerformanceInsights {
  period_days: number;
  average_load_time_ms: number;
  average_fcp_ms: number;
  average_lcp_ms: number;
  slow_pages_count: number;
  total_page_views: number;
  slow_pages_percentage: number;
  performance_score: number;
}

interface FeatureUsage {
  feature_name: string;
  usage_count: number;
  total_time_spent_ms: number;
  last_used: string;
  user_role: string;
  device_type: string;
}

interface UserSatisfaction {
  id: string;
  page_url: string;
  satisfaction_score: number;
  feedback_text: string;
  category: string;
  timestamp: string;
  resolved: boolean;
}

export const PerformanceDashboard: React.FC = () => {
  const [insights, setInsights] = useState<PerformanceInsights | null>(null);
  const [featureUsage, setFeatureUsage] = useState<FeatureUsage[]>([]);
  const [satisfaction, setSatisfaction] = useState<UserSatisfaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(7);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch performance insights
      const { data: insightsData, error: insightsError } = await supabase
        .rpc('get_performance_insights', { p_days: selectedPeriod });

      if (insightsError) throw insightsError;

      // Fetch feature usage analytics
      const { data: usageData, error: usageError } = await supabase
        .from('feature_usage')
        .select('*')
        .order('usage_count', { ascending: false })
        .limit(10);

      if (usageError) throw usageError;

      // Fetch user satisfaction feedback
      const { data: satisfactionData, error: satisfactionError } = await supabase
        .from('user_satisfaction')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(20);

      if (satisfactionError) throw satisfactionError;

      setInsights(insightsData as unknown as PerformanceInsights);
      setFeatureUsage(usageData || []);
      setSatisfaction(satisfactionData || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Needs Improvement';
    return 'Poor';
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTimeSpent = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const satisfactionColors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          <p className="text-muted-foreground">Monitor app performance and user experience</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((days) => (
            <Button
              key={days}
              variant={selectedPeriod === days ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(days)}
            >
              {days}d
            </Button>
          ))}
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceScoreColor(insights?.performance_score || 0)}`}>
              {insights?.performance_score || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {getPerformanceScoreLabel(insights?.performance_score || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Load Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(insights?.average_load_time_ms || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {insights?.slow_pages_percentage || 0}% slow pages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights?.total_page_views || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last {selectedPeriod} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Features Used</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{featureUsage.length}</div>
            <p className="text-xs text-muted-foreground">
              Active features
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
          <TabsTrigger value="features">Feature Usage</TabsTrigger>
          <TabsTrigger value="satisfaction">User Satisfaction</TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Web Vitals Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>First Contentful Paint</span>
                    <span>{formatDuration(insights?.average_fcp_ms || 0)}</span>
                  </div>
                  <Progress 
                    value={Math.min(100, Math.max(0, 100 - (insights?.average_fcp_ms || 0) / 40))} 
                    className="h-2"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Largest Contentful Paint</span>
                    <span>{formatDuration(insights?.average_lcp_ms || 0)}</span>
                  </div>
                  <Progress 
                    value={Math.min(100, Math.max(0, 100 - (insights?.average_lcp_ms || 0) / 40))} 
                    className="h-2"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Load Time</span>
                    <span>{formatDuration(insights?.average_load_time_ms || 0)}</span>
                  </div>
                  <Progress 
                    value={Math.min(100, Math.max(0, 100 - (insights?.average_load_time_ms || 0) / 50))} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(insights?.performance_score || 0) < 70 && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Improve Load Times</p>
                      <p className="text-xs text-yellow-700">
                        Consider optimizing images and reducing bundle size
                      </p>
                    </div>
                  </div>
                )}
                
                {(insights?.slow_pages_percentage || 0) > 20 && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">High Percentage of Slow Pages</p>
                      <p className="text-xs text-red-700">
                        {insights?.slow_pages_percentage}% of pages load slowly (&gt;3s)
                      </p>
                    </div>
                  </div>
                )}

                {(insights?.performance_score || 0) >= 90 && (
                  <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Excellent Performance</p>
                      <p className="text-xs text-green-700">
                        Your app is performing very well!
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Most Used Features</CardTitle>
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
                        <p className="font-medium">{feature.feature_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatTimeSpent(feature.total_time_spent_ms)} total usage
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{feature.usage_count} uses</Badge>
                      <div className="flex items-center gap-1">
                        {feature.device_type === 'mobile' ? (
                          <Smartphone className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="satisfaction">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Satisfaction Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[1, 2, 3, 4, 5].map(score => ({
                        name: `${score} Star${score > 1 ? 's' : ''}`,
                        value: satisfaction.filter(s => s.satisfaction_score === score).length,
                        score
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {[1, 2, 3, 4, 5].map((_, index) => (
                        <Cell key={index} fill={satisfactionColors[index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {satisfaction.slice(0, 5).map((feedback) => (
                    <div key={feedback.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-sm ${
                                i < feedback.satisfaction_score ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <Badge variant={feedback.resolved ? 'default' : 'secondary'}>
                          {feedback.resolved ? 'Resolved' : 'Open'}
                        </Badge>
                      </div>
                      {feedback.feedback_text && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {feedback.feedback_text}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(feedback.timestamp).toLocaleDateString()} • {feedback.category}
                      </p>
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
};