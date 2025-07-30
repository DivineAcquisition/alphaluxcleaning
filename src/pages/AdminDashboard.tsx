import React, { useState, useEffect } from 'react';
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Calendar,
  RefreshCw,
  Brain,
  Lightbulb,
  TrendingUpIcon,
  AlertTriangle,
  Info,
  Target
} from "lucide-react";
import { RecentBookings } from "@/components/dashboard/RecentBookings";
import { MetricsOverview } from "@/components/dashboard/MetricsOverview";

interface Metrics {
  totalOrders: number;
  totalRevenue: number;
  completionRate: number;
  duplicateOrders: number;
}

interface BusinessInsight {
  type: string;
  title: string;
  message: string;
  confidence: number;
  impact: string;
  action: string;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [applications, setApplications] = useState([]);
  const [subcontractors, setSubcontractors] = useState([]);
  const [metrics, setMetrics] = useState<Metrics>({
    totalOrders: 0,
    totalRevenue: 0,
    completionRate: 0,
    duplicateOrders: 0
  });
  const [businessInsights, setBusinessInsights] = useState<BusinessInsight[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [ordersData, applicationsData, subcontractorsData] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('subcontractor_applications').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('subcontractors').select('*').limit(50)
      ]);

      if (ordersData.data) setOrders(ordersData.data);
      if (applicationsData.data) setApplications(applicationsData.data);
      if (subcontractorsData.data) setSubcontractors(subcontractorsData.data);

      calculateMetrics(ordersData.data || []);
      await generateRealInsights(ordersData.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (ordersData: any[]) => {
    const totalOrders = ordersData.length;
    const totalRevenue = ordersData.reduce((sum, order) => sum + (order.amount || 0), 0) / 100;
    const completedOrders = ordersData.filter(order => order.status === 'completed').length;
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
    
    // Find duplicates based on customer email and service date
    const duplicates = ordersData.filter((order, index, arr) => 
      arr.findIndex(o => o.customer_email === order.customer_email && 
                         o.scheduled_date === order.scheduled_date) !== index
    );

    setMetrics({
      totalOrders,
      totalRevenue,
      completionRate,
      duplicateOrders: duplicates.length
    });
  };

  const generateRealInsights = async (ordersData: any[]) => {
    try {
      const insights: BusinessInsight[] = [];
      
      // Revenue trend analysis
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
              message: `Revenue decreased by ${Math.round(Math.abs(growthRate))}% in the last 30 days. Investigate causes.`,
              confidence: 0.85,
              impact: 'high',
              action: 'Review pricing and customer satisfaction'
            });
          }
        }
      }

      // Customer retention analysis
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
            message: `${Math.round(retentionRate)}% customer retention rate. Leverage for referral program.`,
            confidence: 0.92,
            impact: 'medium',
            action: 'Launch referral incentive program'
          });
        }
      }

      setBusinessInsights(insights);
    } catch (error) {
      console.error('Error generating insights:', error);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUpIcon className="h-5 w-5 text-green-600" />;
      case 'risk': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'efficiency': return <Target className="h-5 w-5 text-blue-600" />;
      default: return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <AdminLayout title="Dashboard" description="Business overview and key metrics">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard" description="Business overview and key metrics">
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="flex gap-4">
          <Button onClick={fetchDashboardData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>

        {/* Metrics Overview */}
        <MetricsOverview 
          bookings={orders}
          orders={orders}
          subcontractors={subcontractors}
        />

        {/* AI Insights Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI-Powered Business Insights
            </CardTitle>
            <CardDescription>
              Real-time analysis of your business data with actionable recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {businessInsights.length > 0 ? (
                businessInsights.map((insight, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getInsightIcon(insight.type)}
                        <div className="space-y-1">
                          <h4 className="font-medium">{insight.title}</h4>
                          <p className="text-sm text-muted-foreground">{insight.message}</p>
                          <p className="text-xs font-medium text-primary">{insight.action}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'default' : 'secondary'}>
                          {insight.impact} impact
                        </Badge>
                        <Badge variant="outline">
                          {Math.round(insight.confidence * 100)}% confidence
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Analyzing data to generate insights...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid gap-6 md:grid-cols-2">
          <RecentBookings bookings={orders.slice(0, 5)} />
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Applications</CardTitle>
              <CardDescription>Latest subcontractor applications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {applications.slice(0, 5).map((app: any) => (
                  <div key={app.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{app.full_name}</p>
                      <p className="text-sm text-muted-foreground">{app.email}</p>
                    </div>
                    <Badge variant={
                      app.status === 'approved' ? 'default' : 
                      app.status === 'rejected' ? 'destructive' : 'secondary'
                    }>
                      {app.status}
                    </Badge>
                  </div>
                ))}
                {applications.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No recent applications</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}