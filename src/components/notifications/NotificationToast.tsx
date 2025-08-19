import React, { useEffect, useState } from 'react';
import { X, Bell, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  action?: {
    label: string;
    url: string;
  };
  duration?: number;
}

const NotificationToast: React.FC = () => {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  useEffect(() => {
    // Set up real-time subscription for new notifications
    const channel = supabase
      .channel('toast-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'customer_notifications'
        },
        (payload) => {
          const notification = payload.new as any;
          
          // Only show toast for high priority notifications
          if (notification.importance === 'high' || notification.importance === 'urgent') {
            showToast({
              id: notification.id,
              title: notification.title,
              message: notification.message,
              type: notification.importance === 'urgent' ? 'error' : 'warning',
              action: notification.action_url ? {
                label: notification.action_label || 'View',
                url: notification.action_url
              } : undefined,
              duration: notification.importance === 'urgent' ? 0 : 8000, // Urgent notifications don't auto-dismiss
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const showToast = (notification: ToastNotification) => {
    setNotifications(prev => [...prev, notification]);

    // Auto-dismiss after duration (if specified)
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        dismissToast(notification.id);
      }, notification.duration);
    }
  };

  const dismissToast = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={`animate-in slide-in-from-right-full duration-300 ${getBackgroundColor(notification.type)}`}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground mb-1">
                  {notification.title}
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {notification.message}
                </p>
                
                {notification.action && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => {
                      window.open(notification.action!.url, '_blank');
                      dismissToast(notification.id);
                    }}
                  >
                    {notification.action.label}
                  </Button>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 flex-shrink-0"
                onClick={() => dismissToast(notification.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default NotificationToast;