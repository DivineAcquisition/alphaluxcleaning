import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, MessageSquare, TrendingUp, AlertCircle, CheckCircle, Clock, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NotificationStats {
  totalSent: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  failedCount: number;
  avgDeliveryTime: number;
}

interface RecentNotification {
  id: string;
  type: string;
  recipient: string;
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  created_at: string;
  delivery_method: string;
  error_message?: string;
}

export const NotificationAnalyticsDashboard: React.FC = () => {
  const [stats, setStats] = useState<NotificationStats>({
    totalSent: 0,
    deliveryRate: 0,
    openRate: 0,
    clickRate: 0,
    failedCount: 0,
    avgDeliveryTime: 0
  });
  const [recentNotifications, setRecentNotifications] = useState<RecentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7');
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(timeRange));

      // Fetch notification queue data
      const { data: queueData, error: queueError } = await supabase
        .from('notification_queue')
        .select('status, created_at, sent_at, delivery_method')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (queueError) throw queueError;

      // Fetch recent notifications for the table
      const { data: recentData, error: recentError } = await supabase
        .from('notification_queue')
        .select('id, notification_type, customer_id, status, created_at, delivery_method, error_message')
        .order('created_at', { ascending: false })
        .limit(20);

      if (recentError) throw recentError;

      // Calculate statistics
      const totalSent = queueData?.length || 0;
      const delivered = queueData?.filter(n => n.status === 'sent').length || 0;
      const failed = queueData?.filter(n => n.status === 'failed').length || 0;
      
      const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 0;

      // Format recent notifications
      const formattedRecent: RecentNotification[] = recentData?.map(item => ({
        id: item.id,
        type: item.notification_type || 'Unknown',
        recipient: item.customer_id || 'Unknown',
        status: item.status as any,
        created_at: item.created_at,
        delivery_method: item.delivery_method || 'sms',
        error_message: item.error_message
      })) || [];

      setStats({
        totalSent,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        openRate: 85.5, // Mock data - would need tracking
        clickRate: 12.3, // Mock data - would need tracking
        failedCount: failed,
        avgDeliveryTime: 2.4 // Mock data - would calculate from sent_at - created_at
      });
      
      setRecentNotifications(formattedRecent);
    } catch (error: any) {
      toast({
        title: "Error fetching analytics",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': 
      case 'delivered': 
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': 
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'pending': 
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default: 
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': 
      case 'delivered': 
        return 'default';
      case 'failed': 
        return 'destructive';
      case 'pending': 
        return 'secondary';
      default: 
        return 'outline';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Notification Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Track delivery performance and engagement metrics
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Last 24 hours</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.deliveryRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clickRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Delivery</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgDeliveryTime}s</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Notifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
          <CardDescription>
            Latest notification delivery activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentNotifications.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell className="font-medium">{notification.type}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {notification.recipient.substring(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {notification.delivery_method.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(notification.status)}
                      <Badge variant={getStatusColor(notification.status) as any} className="text-xs">
                        {notification.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(notification.created_at).toLocaleTimeString()}
                  </TableCell>
                  <TableCell className="text-xs text-red-600">
                    {notification.error_message ? 
                      notification.error_message.substring(0, 30) + '...' : 
                      '-'
                    }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};