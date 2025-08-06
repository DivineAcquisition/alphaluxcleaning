import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Users, DollarSign, Star, Crown } from 'lucide-react';

interface AnalyticsData {
  tierDistribution: Array<{ tier_name: string; count: number; revenue: number; tier_level: number }>;
  tierProgression: Array<{ month: string; tier_1: number; tier_2: number; tier_3: number }>;
  revenueByTier: Array<{ tier_name: string; revenue: number; avg_per_subcontractor: number }>;
  performanceMetrics: Array<{ 
    tier_level: number; 
    tier_name: string; 
    avg_rating: number; 
    completion_rate: number; 
    retention_rate: number;
    count: number;
  }>;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];

export default function TierPerformanceAnalytics() {
  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['tier-analytics'],
    queryFn: async (): Promise<AnalyticsData> => {
      // Get tier distribution
      const { data: subcontractors, error: subError } = await supabase
        .from('subcontractors')
        .select(`
          tier_level, 
          monthly_fee,
          tier_system_config!inner(tier_name)
        `);

      if (subError) throw subError;

      // Calculate tier distribution and revenue
      const tierStats = subcontractors.reduce((acc, sub) => {
        const tierName = (sub.tier_system_config as any)?.tier_name || `Tier ${sub.tier_level}`;
        const key = `${sub.tier_level}-${tierName}`;
        
        if (!acc[key]) {
          acc[key] = {
            tier_level: sub.tier_level,
            tier_name: tierName,
            count: 0,
            revenue: 0
          };
        }
        
        acc[key].count++;
        acc[key].revenue += sub.monthly_fee || 0;
        return acc;
      }, {} as Record<string, any>);

      const tierDistribution = Object.values(tierStats);

      // Get performance metrics by tier
      const { data: performanceData, error: perfError } = await supabase
        .from('subcontractors')
        .select(`
          tier_level,
          rating,
          tier_system_config!inner(tier_name)
        `);

      if (perfError) throw perfError;

      const performanceByTier = performanceData.reduce((acc, sub) => {
        const tierName = (sub.tier_system_config as any)?.tier_name || `Tier ${sub.tier_level}`;
        const key = sub.tier_level;
        
        if (!acc[key]) {
          acc[key] = {
            tier_level: sub.tier_level,
            tier_name: tierName,
            ratings: [],
            count: 0
          };
        }
        
        acc[key].count++;
        if (sub.rating) {
          acc[key].ratings.push(sub.rating);
        }
        return acc;
      }, {} as Record<number, any>);

      const performanceMetrics = Object.values(performanceByTier).map((tier: any) => ({
        tier_level: tier.tier_level,
        tier_name: tier.tier_name,
        avg_rating: tier.ratings.length > 0 ? 
          tier.ratings.reduce((sum: number, rating: number) => sum + rating, 0) / tier.ratings.length : 0,
        completion_rate: 95 + (tier.tier_level * 2), // Mock data
        retention_rate: 85 + (tier.tier_level * 5), // Mock data
        count: tier.count
      }));

      // Mock tier progression data (would be calculated from historical data)
      const tierProgression = [
        { month: 'Jan', tier_1: 45, tier_2: 25, tier_3: 8 },
        { month: 'Feb', tier_1: 42, tier_2: 28, tier_3: 10 },
        { month: 'Mar', tier_1: 40, tier_2: 30, tier_3: 12 },
        { month: 'Apr', tier_1: 38, tier_2: 32, tier_3: 15 },
        { month: 'May', tier_1: 35, tier_2: 35, tier_3: 18 },
        { month: 'Jun', tier_1: 33, tier_2: 37, tier_3: 20 }
      ];

      const revenueByTier = tierDistribution.map(tier => ({
        tier_name: tier.tier_name,
        revenue: tier.revenue,
        avg_per_subcontractor: tier.count > 0 ? tier.revenue / tier.count : 0
      }));

      return {
        tierDistribution,
        tierProgression,
        revenueByTier,
        performanceMetrics
      };
    }
  });

  if (isLoading) {
    return (
      <AdminLayout title="Tier Performance Analytics" description="Loading...">
        <div>Loading analytics data...</div>
      </AdminLayout>
    );
  }

  if (!analytics) {
    return (
      <AdminLayout title="Tier Performance Analytics" description="Error loading data">
        <div>Error loading analytics data</div>
      </AdminLayout>
    );
  }

  const totalSubcontractors = analytics.tierDistribution.reduce((sum, tier) => sum + tier.count, 0);
  const totalRevenue = analytics.revenueByTier.reduce((sum, tier) => sum + tier.revenue, 0);
  const avgRating = analytics.performanceMetrics.reduce((sum, tier) => sum + (tier.avg_rating * tier.count), 0) / totalSubcontractors;

  return (
    <AdminLayout 
      title="Tier Performance Analytics" 
      description="Comprehensive analytics for the tier system performance and impact"
    >
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subcontractors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSubcontractors}</div>
              <p className="text-xs text-muted-foreground">Active in tier system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">From tier subscriptions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgRating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Across all tiers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Elite Tier</CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.tierDistribution.find(t => t.tier_level === 3)?.count || 0}
              </div>
              <p className="text-xs text-muted-foreground">Elite subcontractors</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tier Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Tier Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.tierDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ tier_name, count }) => `${tier_name}: ${count}`}
                  >
                    {analytics.tierDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue by Tier */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Tier</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.revenueByTier}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tier_name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'revenue' ? `$${value.toLocaleString()}` : `$${value.toFixed(2)}`,
                      name === 'revenue' ? 'Total Revenue' : 'Avg per Subcontractor'
                    ]}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--chart-1))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tier Progression Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tier Progression Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={analytics.tierProgression}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="tier_1" stroke="hsl(var(--chart-1))" name="Standard" />
                <Line type="monotone" dataKey="tier_2" stroke="hsl(var(--chart-2))" name="Professional" />
                <Line type="monotone" dataKey="tier_3" stroke="hsl(var(--chart-3))" name="Elite" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Metrics by Tier */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics by Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.performanceMetrics.map((tier) => (
                <div key={tier.tier_level} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Badge variant={tier.tier_level === 3 ? 'default' : tier.tier_level === 2 ? 'secondary' : 'outline'}>
                      {tier.tier_name}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{tier.count} subcontractors</span>
                  </div>
                  
                  <div className="flex items-center space-x-8 text-sm">
                    <div className="text-center">
                      <div className="font-medium">{tier.avg_rating.toFixed(1)}</div>
                      <div className="text-muted-foreground">Avg Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{tier.completion_rate}%</div>
                      <div className="text-muted-foreground">Completion</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{tier.retention_rate}%</div>
                      <div className="text-muted-foreground">Retention</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}