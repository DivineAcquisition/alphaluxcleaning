import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminGrid } from "@/components/admin/AdminGrid";
import { AdminCard } from "@/components/admin/AdminCard";
import { BarChart, TrendingUp, Users, DollarSign, PieChart, Target, Clock, Star, Filter, Download, Calendar, Activity, Brain, Zap, AlertTriangle, CheckCircle, Eye } from "lucide-react";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { BookingsChart } from "@/components/dashboard/BookingsChart";
import { LTVMetrics } from "@/components/dashboard/LTVMetrics";
import { RetentionMetrics } from "@/components/dashboard/RetentionMetrics";
import { useAnalytics } from "@/hooks/useAnalytics";
import { usePerformanceMonitoring } from "@/hooks/usePerformanceMonitoring";

// Mock data for charts
const mockOrders = [
  { id: 1, amount: 15000, created_at: '2024-01-15', status: 'completed' },
  { id: 2, amount: 22000, created_at: '2024-02-10', status: 'completed' },
  { id: 3, amount: 18500, created_at: '2024-03-05', status: 'completed' },
];

const mockBookings = [
  { id: 1, service_date: '2024-01-15', cleaning_type: 'deep-clean', status: 'completed' },
  { id: 2, service_date: '2024-02-10', cleaning_type: 'regular', status: 'completed' },
  { id: 3, service_date: '2024-03-05', cleaning_type: 'move-out', status: 'completed' },
];

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const { analytics, loading, refreshAnalytics } = useAnalytics();
  const { trackFeatureUsage } = usePerformanceMonitoring();

  useEffect(() => {
    trackFeatureUsage("analytics_dashboard_view", 0, "admin");
  }, [trackFeatureUsage]);

  const realTimeMetrics = {
    activeUsers: 23,
    pendingBookings: 8,
    systemLoad: 68,
    responseTime: 245
  };

  const aiInsights = [
    { type: "opportunity", message: "Revenue could increase by 15% with optimal pricing strategy", confidence: 92 },
    { type: "warning", message: "Customer churn risk detected in North Bay area", confidence: 78 },
    { type: "insight", message: "Deep cleaning services show highest profit margins", confidence: 95 },
    { type: "prediction", message: "Demand will spike 25% next weekend", confidence: 88 }
  ];

  return (
    <AdminLayout 
      title="Business Intelligence Portal" 
      description="Real-time analytics and AI-powered insights for business optimization"
    >
      {/* Real-time Controls */}
      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Button 
                variant={isRealTimeEnabled ? "default" : "outline"} 
                size="sm"
                onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
              >
                <Activity className="h-4 w-4 mr-2" />
                Real-time {isRealTimeEnabled ? "ON" : "OFF"}
              </Button>
              <Button variant="outline" size="sm" onClick={refreshAnalytics}>
                <Zap className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Advanced Filters
              </Button>
              <select className="px-3 py-1 border rounded-lg bg-background text-sm">
                <option>Real-time</option>
                <option>Last 24 hours</option>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Custom range</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Badge variant={isRealTimeEnabled ? "default" : "secondary"} className="flex items-center gap-1">
                <div className={`h-2 w-2 rounded-full ${isRealTimeEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                {isRealTimeEnabled ? 'Live' : 'Static'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
          <TabsTrigger value="intelligence">AI Insights</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">

        {/* Executive KPIs */}
        <AdminGrid columns="auto" gap="lg">
          <AdminCard title="Total Revenue" icon={<DollarSign className="h-5 w-5" />} variant="metric">
            <div className="text-3xl font-bold text-primary">
              ${analytics?.totalRevenue?.toLocaleString() || '0'}
            </div>
            <p className="text-sm text-muted-foreground">+24.5% vs last quarter</p>
          </AdminCard>
          
          <AdminCard title="Active Customers" icon={<Users className="h-5 w-5" />} variant="metric">
            <div className="text-3xl font-bold text-success">{analytics?.totalCustomers || 0}</div>
            <p className="text-sm text-muted-foreground">Customer lifetime value: $2,847</p>
          </AdminCard>
          
          <AdminCard title="Monthly Bookings" icon={<Target className="h-5 w-5" />} variant="metric">
            <div className="text-3xl font-bold text-accent">{analytics?.totalBookings || 0}</div>
            <p className="text-sm text-muted-foreground">Conversion rate: 78%</p>
          </AdminCard>
          
          <AdminCard title="Performance Score" icon={<Star className="h-5 w-5" />} variant="metric">
            <div className="text-3xl font-bold text-warning">{analytics?.averageRating?.toFixed(1) || '0.0'}/5</div>
            <p className="text-sm text-muted-foreground">Customer satisfaction</p>
          </AdminCard>
        </AdminGrid>

        {/* Revenue & Booking Analytics */}
        <AdminGrid columns={2} gap="lg">
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Revenue Analytics
              </CardTitle>
              <CardDescription>
                Historical trends and AI-powered forecasting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueChart orders={analytics?.revenueByMonth || mockOrders} detailed />
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Service Distribution
              </CardTitle>
              <CardDescription>
                Booking patterns and service popularity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BookingsChart bookings={mockBookings} />
            </CardContent>
          </Card>
        </AdminGrid>

        {/* Customer Intelligence */}
        <AdminGrid columns={2} gap="lg">
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Customer Lifetime Value
              </CardTitle>
              <CardDescription>
                Segmentation and value prediction analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LTVMetrics orders={mockOrders} />
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Retention Analytics
              </CardTitle>
              <CardDescription>
                Customer retention patterns and churn prediction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RetentionMetrics orders={mockOrders} />
            </CardContent>
          </Card>
        </AdminGrid>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-6">
          {/* Real-time Dashboard */}
          <AdminGrid columns="auto" gap="lg">
            <AdminCard title="Active Users" icon={<Eye className="h-5 w-5" />} variant="metric">
              <div className="text-3xl font-bold text-primary">{realTimeMetrics.activeUsers}</div>
              <p className="text-sm text-muted-foreground">Currently online</p>
            </AdminCard>
            
            <AdminCard title="Pending Bookings" icon={<Clock className="h-5 w-5" />} variant="metric">
              <div className="text-3xl font-bold text-warning">{realTimeMetrics.pendingBookings}</div>
              <p className="text-sm text-muted-foreground">Awaiting confirmation</p>
            </AdminCard>
            
            <AdminCard title="System Load" icon={<Activity className="h-5 w-5" />} variant="metric">
              <div className="text-3xl font-bold text-success">{realTimeMetrics.systemLoad}%</div>
              <p className="text-sm text-muted-foreground">Server capacity</p>
            </AdminCard>
            
            <AdminCard title="Response Time" icon={<Zap className="h-5 w-5" />} variant="metric">
              <div className="text-3xl font-bold text-accent">{realTimeMetrics.responseTime}ms</div>
              <p className="text-sm text-muted-foreground">Average API response</p>
            </AdminCard>
          </AdminGrid>

          {/* Live Activity Feed */}
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Live Activity Feed
              </CardTitle>
              <CardDescription>Real-time business events and customer interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1,2,3,4,5].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <p className="font-medium">New booking confirmed</p>
                      <p className="text-sm text-muted-foreground">Deep cleaning service for tomorrow at 2:00 PM</p>
                    </div>
                    <Badge variant="outline">2 min ago</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-6">
          {/* AI Insights */}
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-Powered Business Intelligence
              </CardTitle>
              <CardDescription>Machine learning insights and predictive analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {aiInsights.map((insight, i) => (
                  <div key={i} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {insight.type === 'opportunity' && <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />}
                        {insight.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />}
                        {insight.type === 'insight' && <Brain className="h-5 w-5 text-blue-500 mt-0.5" />}
                        {insight.type === 'prediction' && <Target className="h-5 w-5 text-purple-500 mt-0.5" />}
                        <div>
                          <p className="font-medium">{insight.message}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Confidence: {insight.confidence}%
                          </p>
                        </div>
                      </div>
                      <Badge variant={insight.type === 'warning' ? 'destructive' : 'default'}>
                        {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance Analytics */}
          <AdminGrid columns={2} gap="lg">
            <Card className="bg-gradient-card border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Performance
                </CardTitle>
                <CardDescription>Application health and response metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>API Response Time</span>
                      <span>245ms</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Database Performance</span>
                      <span>98%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-success h-2 rounded-full" style={{ width: '98%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Service Quality
                </CardTitle>
                <CardDescription>Quality metrics and customer satisfaction</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Service Completion Rate</span>
                      <span>96.2%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-success h-2 rounded-full" style={{ width: '96%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Customer Satisfaction</span>
                      <span>4.8/5</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-accent h-2 rounded-full" style={{ width: '96%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AdminGrid>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">

          {/* Automated Reports */}
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Automated Report Generation
              </CardTitle>
              <CardDescription>Schedule and download comprehensive business reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {[
                  { name: "Monthly Revenue Report", last: "2024-01-01", next: "2024-02-01", format: "PDF" },
                  { name: "Customer Analytics", last: "2024-01-15", next: "2024-02-15", format: "Excel" },
                  { name: "Performance Summary", last: "2024-01-20", next: "2024-02-20", format: "PDF" }
                ].map((report, i) => (
                  <div key={i} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{report.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Last generated: {report.last} • Next: {report.next}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{report.format}</Badge>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Predictive Analytics */}
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Predictive Business Intelligence
              </CardTitle>
              <CardDescription>
                AI-powered forecasting and optimization recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminGrid columns={3} gap="md">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold text-sm text-muted-foreground">Revenue Forecast</h4>
                  <p className="text-2xl font-bold text-primary">+18%</p>
                  <p className="text-xs text-muted-foreground">Next month prediction</p>
                </div>
                
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold text-sm text-muted-foreground">Optimal Pricing</h4>
                  <p className="text-2xl font-bold text-success">$149</p>
                  <p className="text-xs text-muted-foreground">Recommended base rate</p>
                </div>
                
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold text-sm text-muted-foreground">Market Risk</h4>
                  <p className="text-2xl font-bold text-warning">Low</p>
                  <p className="text-xs text-muted-foreground">Business stability score</p>
                </div>
              </AdminGrid>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}