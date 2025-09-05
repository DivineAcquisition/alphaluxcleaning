import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  Target,
  Award,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Star
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PerformanceMetrics {
  subcontractor_id: string;
  subcontractor_name: string;
  assignments_received: number;
  assignments_accepted: number;
  assignments_completed: number;
  avg_response_time_minutes: number;
  customer_rating_avg: number;
  on_time_percentage: number;
  tier_level: number;
  acceptance_rate: number;
  completion_rate: number;
}

interface SystemStats {
  total_subcontractors: number;
  active_assignments: number;
  avg_system_response_time: number;
  avg_system_completion_rate: number;
  top_performers_count: number;
  improvement_needed_count: number;
}

export function PerformanceMetricsDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    total_subcontractors: 0,
    active_assignments: 0,
    avg_system_response_time: 0,
    avg_system_completion_rate: 0,
    top_performers_count: 0,
    improvement_needed_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [sortBy, setSortBy] = useState('acceptance_rate');

  useEffect(() => {
    fetchPerformanceData();
  }, [timeRange, sortBy]);

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));

      // Fetch subcontractor performance metrics
      const { data: metricsData, error: metricsError } = await supabase
        .from('subcontractor_performance_metrics')
        .select(`
          subcontractor_id,
          metric_date,
          assignments_received,
          assignments_accepted,
          assignments_completed,
          avg_response_time_minutes,
          customer_rating_avg,
          on_time_percentage
        `)
        .gte('metric_date', startDate.toISOString().split('T')[0])
        .lte('metric_date', endDate.toISOString().split('T')[0]);

      if (metricsError) throw metricsError;

      // Fetch subcontractor data separately
      const { data: subcontractorData, error: subError } = await supabase
        .from('subcontractors')
        .select('id, full_name, tier_level');

      if (subError) throw subError;

      // Group and calculate averages by subcontractor
      const groupedMetrics = new Map<string, any>();
      const subMap = new Map(subcontractorData?.map(sub => [sub.id, sub]) || []);
      
      metricsData?.forEach(metric => {
        const subId = metric.subcontractor_id;
        const subInfo = subMap.get(subId);
        
        if (!groupedMetrics.has(subId)) {
          groupedMetrics.set(subId, {
            subcontractor_id: subId,
            subcontractor_name: subInfo?.full_name || 'Unknown',
            tier_level: subInfo?.tier_level || 1,
            total_received: 0,
            total_accepted: 0,
            total_completed: 0,
            response_times: [],
            ratings: [],
            on_time_percentages: [],
            days_count: 0
          });
        }
        
        const sub = groupedMetrics.get(subId);
        sub.total_received += metric.assignments_received || 0;
        sub.total_accepted += metric.assignments_accepted || 0;
        sub.total_completed += metric.assignments_completed || 0;
        
        if (metric.avg_response_time_minutes) {
          sub.response_times.push(metric.avg_response_time_minutes);
        }
        if (metric.customer_rating_avg) {
          sub.ratings.push(metric.customer_rating_avg);
        }
        if (metric.on_time_percentage) {
          sub.on_time_percentages.push(metric.on_time_percentage);
        }
        sub.days_count++;
      });

      // Calculate final metrics
      const processedMetrics: PerformanceMetrics[] = Array.from(groupedMetrics.values()).map(sub => ({
        subcontractor_id: sub.subcontractor_id,
        subcontractor_name: sub.subcontractor_name || 'Unknown',
        assignments_received: sub.total_received,
        assignments_accepted: sub.total_accepted,
        assignments_completed: sub.total_completed,
        avg_response_time_minutes: sub.response_times.length > 0 
          ? sub.response_times.reduce((a: number, b: number) => a + b, 0) / sub.response_times.length 
          : 0,
        customer_rating_avg: sub.ratings.length > 0 
          ? sub.ratings.reduce((a: number, b: number) => a + b, 0) / sub.ratings.length 
          : 0,
        on_time_percentage: sub.on_time_percentages.length > 0 
          ? sub.on_time_percentages.reduce((a: number, b: number) => a + b, 0) / sub.on_time_percentages.length 
          : 0,
        tier_level: sub.tier_level || 1,
        acceptance_rate: sub.total_received > 0 ? (sub.total_accepted / sub.total_received) * 100 : 0,
        completion_rate: sub.total_accepted > 0 ? (sub.total_completed / sub.total_accepted) * 100 : 0
      }));

      // Sort metrics
      processedMetrics.sort((a, b) => {
        switch (sortBy) {
          case 'acceptance_rate':
            return b.acceptance_rate - a.acceptance_rate;
          case 'completion_rate':
            return b.completion_rate - a.completion_rate;
          case 'response_time':
            return a.avg_response_time_minutes - b.avg_response_time_minutes;
          case 'rating':
            return b.customer_rating_avg - a.customer_rating_avg;
          default:
            return b.acceptance_rate - a.acceptance_rate;
        }
      });

      setMetrics(processedMetrics);

      // Calculate system stats
      const systemStats: SystemStats = {
        total_subcontractors: processedMetrics.length,
        active_assignments: processedMetrics.reduce((sum, m) => sum + m.assignments_received, 0),
        avg_system_response_time: processedMetrics.length > 0 
          ? processedMetrics.reduce((sum, m) => sum + m.avg_response_time_minutes, 0) / processedMetrics.length 
          : 0,
        avg_system_completion_rate: processedMetrics.length > 0 
          ? processedMetrics.reduce((sum, m) => sum + m.completion_rate, 0) / processedMetrics.length 
          : 0,
        top_performers_count: processedMetrics.filter(m => 
          m.acceptance_rate >= 80 && m.completion_rate >= 95 && m.customer_rating_avg >= 4.5
        ).length,
        improvement_needed_count: processedMetrics.filter(m => 
          m.acceptance_rate < 60 || m.completion_rate < 80 || m.customer_rating_avg < 4.0
        ).length
      };

      setStats(systemStats);

    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceStatus = (metric: PerformanceMetrics) => {
    const score = (metric.acceptance_rate + metric.completion_rate + (metric.customer_rating_avg * 20)) / 3;
    
    if (score >= 85) return { status: 'excellent', color: 'bg-green-500', label: 'Excellent' };
    if (score >= 70) return { status: 'good', color: 'bg-blue-500', label: 'Good' };
    if (score >= 60) return { status: 'average', color: 'bg-yellow-500', label: 'Average' };
    return { status: 'needs-improvement', color: 'bg-red-500', label: 'Needs Improvement' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Performance Analytics</h1>
          <p className="text-muted-foreground">
            Monitor subcontractor performance and system efficiency
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={fetchPerformanceData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Subcontractors</p>
                <p className="text-2xl font-bold">{stats.total_subcontractors}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">{Math.round(stats.avg_system_response_time)}m</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Top Performers</p>
                <p className="text-2xl font-bold text-green-600">{stats.top_performers_count}</p>
              </div>
              <Award className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Need Improvement</p>
                <p className="text-2xl font-bold text-red-600">{stats.improvement_needed_count}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Table Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Subcontractor Performance</h2>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="acceptance_rate">Sort by Acceptance Rate</SelectItem>
            <SelectItem value="completion_rate">Sort by Completion Rate</SelectItem>
            <SelectItem value="response_time">Sort by Response Time</SelectItem>
            <SelectItem value="rating">Sort by Rating</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Performance Cards */}
      <div className="grid gap-4">
        {metrics.map((metric) => {
          const performance = getPerformanceStatus(metric);
          
          return (
            <Card key={metric.subcontractor_id} className="relative overflow-hidden">
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${performance.color}`} />
              
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <CardTitle className="text-lg">{metric.subcontractor_name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">Tier {metric.tier_level}</Badge>
                        <Badge variant={performance.status === 'excellent' ? 'default' : 'secondary'}>
                          {performance.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-current text-yellow-500" />
                      <span className="font-medium">
                        {metric.customer_rating_avg.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.round(metric.acceptance_rate)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Acceptance Rate</p>
                    <p className="text-xs text-muted-foreground">
                      {metric.assignments_accepted}/{metric.assignments_received} jobs
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {Math.round(metric.completion_rate)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Completion Rate</p>
                    <p className="text-xs text-muted-foreground">
                      {metric.assignments_completed} completed
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {Math.round(metric.avg_response_time_minutes)}m
                    </p>
                    <p className="text-sm text-muted-foreground">Avg Response</p>
                    <div className="flex items-center justify-center text-xs text-muted-foreground">
                      {metric.avg_response_time_minutes < 15 ? (
                        <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                      )}
                      {metric.avg_response_time_minutes < 15 ? 'Fast' : 'Slow'}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {Math.round(metric.on_time_percentage)}%
                    </p>
                    <p className="text-sm text-muted-foreground">On-Time Rate</p>
                    <p className="text-xs text-muted-foreground">
                      Punctuality score
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {metrics.length === 0 && (
          <Card>
            <CardContent className="text-center p-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No Performance Data</h3>
              <p className="text-muted-foreground">
                No performance metrics available for the selected time range.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}