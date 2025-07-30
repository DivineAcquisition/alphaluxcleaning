import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  BarChart3,
  PieChart,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Download,
  RefreshCw,
  Brain,
  Target,
  AlertTriangle,
  Zap
} from "lucide-react";

interface BusinessInsight {
  type: string;
  title: string;
  message: string;
  confidence: number;
  impact: string;
  action: string;
}

interface AnalyticsData {
  dailyRevenue: Array<{ date: string; revenue: number }>;
  serviceTypeBreakdown: Array<{ type: string; count: number }>;
  customerSegments: Array<{ segment: string; count: number }>;
  completionRates: Array<{ date: string; rate: number }>;
}

const MetricsDashboard = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    dailyRevenue: [],
    serviceTypeBreakdown: [],
    customerSegments: [],
    completionRates: []
  });
  const [businessInsights, setBusinessInsights] = useState<BusinessInsight[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadAnalyticsData();
      
      // Set up periodic refresh
      const interval = setInterval(loadAnalyticsData, 60000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchOrders(),
        fetchApplications()
      ]);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
      calculateAnalytics(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('subcontractor_applications')
        .select('*');

      if (error) throw error;
      setApplications(data || []);
      generateInsights(orders, data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const calculateAnalytics = (ordersData: any[]) => {
    // Daily revenue calculation
    const dailyData: Record<string, number> = {};
    ordersData.forEach(order => {
      if (order.created_at && order.amount) {
        const date = new Date(order.created_at).toISOString().split('T')[0];
        dailyData[date] = (dailyData[date] || 0) + (order.amount / 100);
      }
    });
    const dailyRevenue = Object.entries(dailyData).map(([date, revenue]) => ({ date, revenue }));

    // Service type breakdown
    const breakdown: Record<string, number> = {};
    ordersData.forEach(order => {
      const type = order.cleaning_type || 'standard';
      breakdown[type] = (breakdown[type] || 0) + 1;
    });
    const serviceTypeBreakdown = Object.entries(breakdown).map(([type, count]) => ({ type, count }));

    // Customer segments
    const segments: Record<string, number> = {
      'One-time': 0,
      'Weekly': 0,
      'Bi-weekly': 0,
      'Monthly': 0
    };
    ordersData.forEach(order => {
      const freq = order.frequency || 'One-time';
      if (segments[freq] !== undefined) {
        segments[freq]++;
      } else {
        segments['One-time']++;
      }
    });
    const customerSegments = Object.entries(segments).map(([segment, count]) => ({ segment, count }));

    // Completion rates over time
    const daily: Record<string, { completed: number; total: number }> = {};
    ordersData.forEach(order => {
      if (order.created_at) {
        const date = new Date(order.created_at).toISOString().split('T')[0];
        if (!daily[date]) daily[date] = { completed: 0, total: 0 };
        daily[date].total++;
        if (order.status === 'completed') daily[date].completed++;
      }
    });
    const completionRates = Object.entries(daily).map(([date, data]) => ({
      date,
      rate: data.total > 0 ? (data.completed / data.total) * 100 : 0
    }));

    setAnalyticsData({
      dailyRevenue,
      serviceTypeBreakdown,
      customerSegments,
      completionRates
    });
  };

  const generateInsights = (ordersData: any[], applicationsData: any[]) => {
    const insights: BusinessInsight[] = [];
    
    // Revenue Growth Analysis
    if (ordersData.length > 0) {
      const last30Days = ordersData.filter(order => {
        const orderDate = new Date(order.created_at);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return orderDate >= thirtyDaysAgo;
      });

      const last60Days = ordersData.filter(order => {
        const orderDate = new Date(order.created_at);
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return orderDate >= sixtyDaysAgo && orderDate < thirtyDaysAgo;
      });

      const revenue30 = last30Days.reduce((sum, order) => sum + (order.amount || 0), 0);
      const revenue60 = last60Days.reduce((sum, order) => sum + (order.amount || 0), 0);

      if (revenue60 > 0) {
        const growthRate = ((revenue30 - revenue60) / revenue60) * 100;
        if (growthRate > 20) {
          insights.push({
            type: 'opportunity',
            title: 'Strong Revenue Growth',
            message: `Revenue increased by ${Math.round(growthRate)}% in the last 30 days. Consider scaling operations.`,
            confidence: 0.9,
            impact: 'high',
            action: 'Expand marketing and hiring efforts'
          });
        } else if (growthRate < -10) {
          insights.push({
            type: 'risk',
            title: 'Revenue Decline Alert',
            message: `Revenue decreased by ${Math.round(Math.abs(growthRate))}% in the last 30 days.`,
            confidence: 0.85,
            impact: 'high',
            action: 'Review pricing and customer satisfaction'
          });
        }
      }
    }

    // Customer Retention Analysis
    const uniqueCustomers = new Set(ordersData.map(order => order.customer_email)).size;
    const repeatCustomers = ordersData.reduce((acc, order) => {
      const customerOrders = ordersData.filter(o => o.customer_email === order.customer_email);
      if (customerOrders.length > 1) acc.add(order.customer_email);
      return acc;
    }, new Set()).size;

    if (uniqueCustomers > 0) {
      const retentionRate = (repeatCustomers / uniqueCustomers) * 100;
      if (retentionRate < 30) {
        insights.push({
          type: 'risk',
          title: 'Low Customer Retention',
          message: `Only ${Math.round(retentionRate)}% of customers return. Implement loyalty programs.`,
          confidence: 0.88,
          impact: 'high',
          action: 'Launch customer retention campaign'
        });
      } else if (retentionRate > 60) {
        insights.push({
          type: 'opportunity',
          title: 'Excellent Customer Loyalty',
          message: `${Math.round(retentionRate)}% customer retention rate. Leverage for referrals.`,
          confidence: 0.92,
          impact: 'medium',
          action: 'Launch referral incentive program'
        });
      }
    }

    setBusinessInsights(insights);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <Target className="h-5 w-5 text-green-600" />;
      case 'risk': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'efficiency': return <Zap className="h-5 w-5 text-blue-600" />;
      default: return <Brain className="h-5 w-5 text-purple-600" />;
    }
  };

  const exportData = () => {
    const dataToExport = {
      analytics: analyticsData,
      insights: businessInsights,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Analytics data exported');
  };

  if (isLoading) {
    return (
      <AdminLayout title="Metrics & Analytics" description="Advanced business analytics and insights">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p>Loading analytics...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Metrics & Analytics" description="Advanced business analytics and insights">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <Button onClick={loadAnalyticsData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
            <Button onClick={exportData} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${analyticsData.dailyRevenue.reduce((sum, day) => sum + day.revenue, 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData.completionRates.length > 0 
                  ? Math.round(analyticsData.completionRates.reduce((sum, day) => sum + day.rate, 0) / analyticsData.completionRates.length)
                  : 0}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Service Types</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData.serviceTypeBreakdown.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Customer Segments</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData.customerSegments.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Business Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Business Insights
            </CardTitle>
            <CardDescription>Real-time analysis of your business performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {businessInsights.length > 0 ? (
              businessInsights.map((insight, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{insight.title}</h4>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {Math.round(insight.confidence * 100)}% confidence
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{insight.message}</p>
                      <div className="text-xs bg-gray-50 p-2 rounded">
                        <strong>Recommended Action:</strong> {insight.action}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No insights available yet. Check back after collecting more data.</p>
            )}
          </CardContent>
        </Card>

        {/* Analytics Summary */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Service Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analyticsData.serviceTypeBreakdown.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{item.type}</span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Segments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analyticsData.customerSegments.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{item.segment}</span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default MetricsDashboard;