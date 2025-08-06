import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle, Star, TrendingUp, DollarSign } from 'lucide-react';

interface MobileNotificationCenterProps {
  subcontractorId: string;
}

interface Notification {
  id: string;
  type: 'tier_upgrade' | 'payment_processed' | 'performance_milestone' | 'system';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: any;
}

export function MobileNotificationCenter({ subcontractorId }: MobileNotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch recent tier changes as notifications
  const { data: tierChanges = [] } = useQuery({
    queryKey: ['notification-tier-changes', subcontractorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tier_change_history')
        .select('*')
        .eq('subcontractor_id', subcontractorId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch recent payments as notifications
  const { data: payments = [] } = useQuery({
    queryKey: ['notification-payments', subcontractorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subcontractor_payments')
        .select('*')
        .eq('subcontractor_id', subcontractorId)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    const notificationList: Notification[] = [
      // Tier change notifications
      ...tierChanges.map(change => ({
        id: `tier-${change.id}`,
        type: 'tier_upgrade' as const,
        title: 'Tier Upgrade!',
        message: `Congratulations! You've been upgraded from Tier ${change.old_tier} to Tier ${change.new_tier}`,
        read: false,
        created_at: change.created_at,
        data: change
      })),
      
      // Payment notifications
      ...payments.map(payment => ({
        id: `payment-${payment.id}`,
        type: 'payment_processed' as const,
        title: 'Payment Processed',
        message: `Monthly fee of $${payment.monthly_fee} has been processed`,
        read: false,
        created_at: payment.created_at,
        data: payment
      }))
    ];

    // Sort by date and add performance milestones
    notificationList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    setNotifications(notificationList);
  }, [tierChanges, payments]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'tier_upgrade':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'payment_processed':
        return <DollarSign className="h-5 w-5 text-blue-600" />;
      case 'performance_milestone':
        return <Star className="h-5 w-5 text-yellow-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'tier_upgrade':
        return 'border-l-green-500 bg-green-50';
      case 'payment_processed':
        return 'border-l-blue-500 bg-blue-50';
      case 'performance_milestone':
        return 'border-l-yellow-500 bg-yellow-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-4 max-w-md mx-auto">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Notifications
            </CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="px-2 py-1 text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No notifications yet</p>
              <p className="text-sm">You'll see updates about your tier progress here</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border-l-4 transition-all ${getNotificationColor(notification.type)} ${
                    notification.read ? 'opacity-70' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm mb-1">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2 break-words">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(notification.created_at)}
                          </span>
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsRead(notification.id)}
                              className="h-auto p-1 text-xs"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Mark read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}