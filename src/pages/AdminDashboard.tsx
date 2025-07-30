import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, DollarSign, Users, TrendingUp, CheckCircle, XCircle, Clock, Lightbulb, AlertTriangle, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  amount: number;
  cleaning_type: string;
  status: string;
  scheduled_date?: string;
  scheduled_time?: string;
  created_at: string;
}

interface BusinessInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'info';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  actionable: boolean;
  implemented?: boolean;
  dismissed?: boolean;
}

interface Metrics {
  totalOrders: number;
  totalRevenue: number;
  completionRate: number;
  pendingOrders: number;
  activeServices: number;
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    totalOrders: 0,
    totalRevenue: 0,
    completionRate: 0,
    pendingOrders: 0,
    activeServices: 0
  });
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [insightStates, setInsightStates] = useState<{[key: string]: { implemented?: boolean, dismissed?: boolean }}>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (ordersError) throw ordersError;

      const formattedOrders = ordersData.map(order => ({
        id: order.id,
        customer_name: order.customer_name || 'Unknown',
        customer_email: order.customer_email || '',
        customer_phone: order.customer_phone,
        amount: order.amount || 0,
        cleaning_type: order.cleaning_type || 'Unknown',
        status: order.status || 'pending',
        scheduled_date: order.scheduled_date,
        scheduled_time: order.scheduled_time,
        created_at: order.created_at
      }));

      setOrders(formattedOrders);

      // Calculate metrics
      const totalRevenue = formattedOrders.reduce((sum, order) => sum + (order.amount / 100), 0);
      const completedOrders = formattedOrders.filter(order => order.status === 'completed').length;
      const completionRate = formattedOrders.length > 0 ? (completedOrders / formattedOrders.length) * 100 : 0;
      const pendingOrders = formattedOrders.filter(order => order.status === 'pending').length;
      const activeServices = formattedOrders.filter(order => order.status === 'active').length;

      setMetrics({
        totalOrders: formattedOrders.length,
        totalRevenue,
        completionRate,
        pendingOrders,
        activeServices
      });

      // Generate real insights
      const realInsights = await generateRealBusinessInsights(formattedOrders);
      setInsights(realInsights);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const generateRealBusinessInsights = async (orders: Order[]): Promise<BusinessInsight[]> => {
    const insights: BusinessInsight[] = [];

    if (orders.length === 0) {
      return [{
        id: 'no-data',
        type: 'info',
        title: 'No Data Available',
        description: 'Not enough order data to generate meaningful insights. Start collecting orders to see AI-powered analysis.',
        impact: 'low',
        confidence: 100,
        actionable: false
      }];
    }

    // Revenue analysis
    const totalRevenue = orders.reduce((sum, order) => sum + (order.amount / 100), 0);
    const avgOrderValue = totalRevenue / orders.length;
    
    if (avgOrderValue < 150) {
      insights.push({
        id: 'low-aov',
        type: 'opportunity',
        title: 'Low Average Order Value',
        description: `Current average order value is $${avgOrderValue.toFixed(2)}. Consider upselling add-on services or premium packages to increase revenue per customer.`,
        impact: 'high',
        confidence: 85,
        actionable: true
      });
    }

    // Service type analysis
    const serviceTypes = orders.reduce((acc, order) => {
      acc[order.cleaning_type] = (acc[order.cleaning_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostPopular = Object.entries(serviceTypes).sort(([,a], [,b]) => b - a)[0];
    if (mostPopular && mostPopular[1] > orders.length * 0.4) {
      insights.push({
        id: 'popular-service',
        type: 'opportunity',
        title: 'High Demand Service Identified',
        description: `${mostPopular[0]} represents ${Math.round((mostPopular[1] / orders.length) * 100)}% of bookings. Consider expanding capacity or creating specialized packages for this service.`,
        impact: 'medium',
        confidence: 90,
        actionable: true
      });
    }

    // Status analysis
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const pendingRate = (pendingOrders / orders.length) * 100;
    
    if (pendingRate > 30) {
      insights.push({
        id: 'high-pending',
        type: 'warning',
        title: 'High Pending Order Rate',
        description: `${pendingRate.toFixed(1)}% of orders are still pending. This may indicate capacity issues or scheduling bottlenecks.`,
        impact: 'high',
        confidence: 95,
        actionable: true
      });
    }

    // Recent booking trend
    const recentOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return orderDate > weekAgo;
    });

    if (recentOrders.length > orders.length * 0.3) {
      insights.push({
        id: 'growth-trend',
        type: 'opportunity',
        title: 'Strong Recent Growth',
        description: `${Math.round((recentOrders.length / orders.length) * 100)}% of orders came in the last week. Consider scaling operations to meet growing demand.`,
        impact: 'high',
        confidence: 80,
        actionable: true
      });
    }

    return insights;
  };

  const handleImplementInsight = (insightId: string) => {
    setInsightStates(prev => ({
      ...prev,
      [insightId]: { ...prev[insightId], implemented: true }
    }));
    toast.success('Insight marked as implemented');
  };

  const handleDismissInsight = (insightId: string) => {
    setInsightStates(prev => ({
      ...prev,
      [insightId]: { ...prev[insightId], dismissed: true }
    }));
    toast.info('Insight dismissed');
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'text-green-600';
      case 'warning': return 'text-orange-600';
      default: return 'text-blue-600';
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Booking Dashboard" description="Overview of all bookings and business metrics">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Booking Dashboard" description="Overview of all bookings and business metrics">
      <div className="space-y-6">
        {/* Metrics Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalOrders}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.completionRate.toFixed(1)}%</div>
              <Progress value={metrics.completionRate} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.pendingOrders}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Services</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeServices}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="insights" className="w-full">
          <TabsList>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
            <TabsTrigger value="recent-orders">Recent Orders</TabsTrigger>
          </TabsList>
          
          <TabsContent value="insights">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  AI-Powered Business Insights
                </CardTitle>
                <CardDescription>
                  Real-time analysis of your business data with actionable recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insights.map((insight) => {
                    const state = insightStates[insight.id];
                    const isImplemented = state?.implemented;
                    const isDismissed = state?.dismissed;
                    
                    if (isDismissed) return null;
                    
                    return (
                      <div key={insight.id} className={`p-4 border rounded-lg ${isImplemented ? 'bg-green-50 border-green-200' : ''}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={getInsightColor(insight.type)}>
                                {getInsightIcon(insight.type)}
                              </span>
                              <h4 className="font-semibold">{insight.title}</h4>
                              <Badge variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'default' : 'secondary'}>
                                {insight.impact} impact
                              </Badge>
                              <Badge variant="outline">{insight.confidence}% confidence</Badge>
                              {isImplemented && <Badge variant="default" className="bg-green-600">Implemented</Badge>}
                            </div>
                            <p className="text-muted-foreground">{insight.description}</p>
                          </div>
                          {!isImplemented && insight.actionable && (
                            <div className="flex gap-2 ml-4">
                              <Button size="sm" onClick={() => handleImplementInsight(insight.id)}>
                                Implement
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDismissInsight(insight.id)}>
                                Dismiss
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="recent-orders">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest booking activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.slice(0, 10).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{order.customer_name}</p>
                        <p className="text-sm text-muted-foreground">{order.cleaning_type}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${(order.amount / 100).toFixed(2)}</p>
                        <Badge variant={order.status === 'completed' ? 'default' : order.status === 'pending' ? 'secondary' : 'outline'}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}