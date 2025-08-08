import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAnalytics } from '@/hooks/useAnalytics';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, Calendar, Star, 
  Target, Clock, Award, Filter, Download, RefreshCw 
} from 'lucide-react';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function BusinessAnalytics() {
  const { analytics, loading, refreshAnalytics } = useAnalytics();

  if (loading) {
    return (
      <AdminLayout title="Business Analytics" description="Loading comprehensive business insights...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!analytics) {
    return (
      <AdminLayout title="Business Analytics" description="Error loading analytics">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Failed to load analytics data</p>
          <Button onClick={refreshAnalytics} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const revenueGrowth = analytics.revenueByMonth.length >= 2 
    ? ((analytics.revenueByMonth[analytics.revenueByMonth.length - 1].revenue - analytics.revenueByMonth[analytics.revenueByMonth.length - 2].revenue) / analytics.revenueByMonth[analytics.revenueByMonth.length - 2].revenue) * 100 
    : 0;

  return (
    <AdminLayout 
      title="Business Analytics" 
      description="Comprehensive insights and performance metrics for data-driven decisions"
    >
      <div className="space-y-6">
        {/* Controls */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <select className="px-3 py-1 border rounded-lg bg-background text-sm">
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                  <option>Last 12 months</option>
                  <option>Custom range</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={refreshAnalytics} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Executive Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analytics.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {revenueGrowth >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-success" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-destructive" />
                )}
                {Math.abs(revenueGrowth).toFixed(1)}% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.newCustomers} new this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Service Completion</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.completionRate}%</div>
              <p className="text-xs text-muted-foreground">
                {analytics.totalBookings} total bookings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customer Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.averageRating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                Based on customer feedback
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics Tabs */}
        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>Monthly revenue over the past 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics.revenueByMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']} />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Service Type</CardTitle>
                  <CardDescription>Breakdown of revenue sources</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.revenueByServiceType}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="revenue"
                        label={({ service_type, revenue }) => `${service_type}: $${revenue.toLocaleString()}`}
                      >
                        {analytics.revenueByServiceType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Key Revenue Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">${analytics.monthlyRevenue.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground">This Month</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-success">
                      ${(analytics.totalRevenue / Math.max(analytics.totalCustomers, 1)).toFixed(0)}
                    </div>
                    <p className="text-sm text-muted-foreground">Avg Revenue Per Customer</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-accent">
                      ${(analytics.totalRevenue / Math.max(analytics.totalBookings, 1)).toFixed(0)}
                    </div>
                    <p className="text-sm text-muted-foreground">Avg Order Value</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Bookings Over Time</CardTitle>
                  <CardDescription>Monthly booking volume</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.revenueByMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="bookings" stroke="hsl(var(--primary))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Key operational indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Completion Rate</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${analytics.completionRate}%` }}
                          ></div>
                        </div>
                        <span className="font-medium">{analytics.completionRate}%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Customer Retention</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-secondary rounded-full h-2">
                          <div 
                            className="bg-success h-2 rounded-full" 
                            style={{ width: `${analytics.customerRetention}%` }}
                          ></div>
                        </div>
                        <span className="font-medium">{analytics.customerRetention}%</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Response Time</span>
                      </div>
                      <div className="text-2xl font-bold">{analytics.responseTime} hrs</div>
                      <p className="text-xs text-muted-foreground">Average customer response time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="customers" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Satisfaction</CardTitle>
                  <CardDescription>Rating distribution from customer feedback</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.satisfactionBreakdown.map((item) => (
                      <div key={item.rating} className="flex items-center gap-4">
                        <div className="flex items-center gap-1 w-16">
                          <Star className="h-3 w-3 fill-current text-yellow-500" />
                          <span className="text-sm">{item.rating}</span>
                        </div>
                        <div className="flex-1 bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-12">{item.percentage.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Customer Insights</CardTitle>
                  <CardDescription>Key customer metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Customers</span>
                      <span className="font-medium">{analytics.totalCustomers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>New This Month</span>
                      <span className="font-medium">{analytics.newCustomers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Repeat Customers</span>
                      <span className="font-medium">{analytics.repeatCustomers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Churn Rate</span>
                      <span className="font-medium">{analytics.churnRate}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Team Distribution</CardTitle>
                  <CardDescription>Subcontractors by tier level</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.tierDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="tier_name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tier Performance</CardTitle>
                  <CardDescription>Performance metrics by tier</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.tierPerformance.map((tier) => (
                      <div key={tier.tier_level} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant={tier.tier_level === 3 ? 'default' : tier.tier_level === 2 ? 'secondary' : 'outline'}>
                            {tier.tier_name}
                          </Badge>
                          <Award className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <div className="font-medium">{tier.avg_rating.toFixed(1)}</div>
                            <div className="text-xs text-muted-foreground">Rating</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium">{tier.completion_rate}%</div>
                            <div className="text-xs text-muted-foreground">Completion</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Team Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{analytics.activeSubcontractors}</div>
                    <p className="text-sm text-muted-foreground">Active Subcontractors</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-success">
                      ${analytics.tierDistribution.reduce((sum, tier) => sum + tier.revenue, 0).toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">Monthly Subscription Revenue</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-accent">
                      {analytics.tierDistribution.find(t => t.tier_name === 'Elite')?.count || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Elite Tier Members</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}