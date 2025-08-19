import React, { useEffect, useState } from 'react';
import { Bell, Check, ChevronRight, Clock, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatDistance } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  read_at?: string;
  importance: 'low' | 'normal' | 'high' | 'urgent';
  action_url?: string;
  action_label?: string;
  created_at: string;
  order_id?: string;
  booking_id?: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange: (count: number) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  onUnreadCountChange,
}) => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    // Set up real-time subscription for new notifications
    const channel = supabase
      .channel('notification-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'customer_notifications'
        },
        (payload) => {
          console.log('New notification:', payload);
          fetchNotifications();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'customer_notifications'
        },
        (payload) => {
          console.log('Notification updated:', payload);
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('customer_notifications')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      
      // Update unread count
      const unreadCount = (data || []).filter(n => !n.is_read).length;
      onUnreadCountChange(unreadCount);

    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.rpc('mark_notification_read', {
        p_notification_id: notificationId,
        p_customer_id: user.id
      });

      if (error) throw error;

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );

      // Update unread count
      const newUnreadCount = notifications.filter(n => 
        n.id !== notificationId && !n.is_read
      ).length;
      onUnreadCountChange(newUnreadCount);

    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      
      for (const id of unreadIds) {
        await supabase.rpc('mark_notification_read', {
          p_notification_id: id,
          p_customer_id: user.id
        });
      }

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );

      onUnreadCountChange(0);

      toast({
        title: "Success",
        description: "All notifications marked as read",
      });

    } catch (error: any) {
      console.error('Error marking all as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      });
    }
  };

  const getImportanceIcon = (importance: string) => {
    switch (importance) {
      case 'urgent':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'high':
        return <AlertCircle className="h-4 w-4 text-warning" />;
      case 'low':
        return <Info className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const getImportanceBadgeVariant = (importance: string) => {
    switch (importance) {
      case 'urgent':
        return 'destructive' as const;
      case 'high':
        return 'secondary' as const;
      case 'low':
        return 'outline' as const;
      default:
        return 'default' as const;
    }
  };

  const filteredNotifications = notifications.filter(n => 
    filter === 'all' || !n.is_read
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed right-4 top-4 bottom-4 w-96 bg-background border rounded-lg shadow-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Notifications</h2>
            {notifications.filter(n => !n.is_read).length > 0 && (
              <Badge variant="secondary">
                {notifications.filter(n => !n.is_read).length} new
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        <div className="flex items-center gap-2 p-4 border-b">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            Unread
          </Button>
          {notifications.some(n => !n.is_read) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="ml-auto"
            >
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="p-2">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNotifications.map((notification) => (
                  <Card 
                    key={notification.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      !notification.is_read ? 'ring-2 ring-primary/20' : ''
                    }`}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getImportanceIcon(notification.importance)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`text-sm font-medium truncate ${
                              !notification.is_read ? 'text-foreground' : 'text-muted-foreground'
                            }`}>
                              {notification.title}
                            </h4>
                            {notification.importance !== 'normal' && (
                              <Badge 
                                variant={getImportanceBadgeVariant(notification.importance)}
                                className="text-xs"
                              >
                                {notification.importance}
                              </Badge>
                            )}
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                            )}
                          </div>
                          
                          <p className={`text-xs mb-2 ${
                            !notification.is_read ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDistance(new Date(notification.created_at), new Date(), { addSuffix: true })}
                            </div>
                            
                            {notification.action_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (notification.action_url) {
                                    window.open(notification.action_url, '_blank');
                                  }
                                }}
                              >
                                {notification.action_label || 'View'}
                                <ChevronRight className="h-3 w-3 ml-1" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default NotificationCenter;