import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  CheckCircle, 
  Calendar, 
  CreditCard, 
  Star,
  AlertCircle,
  Info,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { useCustomerPortal } from '@/contexts/CustomerPortalContext';

export function CustomerNotificationCenter() {
  const { notifications, markNotificationAsRead } = useCustomerPortal();

  const getNotificationIcon = (type: string, importance: string) => {
    if (importance === 'high') {
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    }
    
    switch (type) {
      case 'booking_confirmation':
        return <Calendar className="h-5 w-5 text-green-600" />;
      case 'payment_confirmation':
        return <CreditCard className="h-5 w-5 text-blue-600" />;
      case 'service_reminder':
        return <Bell className="h-5 w-5 text-yellow-600" />;
      case 'service_completed':
        return <Star className="h-5 w-5 text-purple-600" />;
      case 'membership_update':
        return <TrendingUp className="h-5 w-5 text-indigo-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string, importance: string) => {
    if (importance === 'high') {
      return 'border-l-red-500 bg-red-50';
    }
    
    switch (type) {
      case 'booking_confirmation':
        return 'border-l-green-500 bg-green-50';
      case 'payment_confirmation':
        return 'border-l-blue-500 bg-blue-50';
      case 'service_reminder':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'service_completed':
        return 'border-l-purple-500 bg-purple-50';
      case 'membership_update':
        return 'border-l-indigo-500 bg-indigo-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatNotificationDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-4">
      {/* Notification Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Notifications
            </CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="px-2 py-1 text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-semibold text-foreground mb-2">All caught up!</h3>
            <p className="text-muted-foreground">
              You have no notifications at this time. We'll notify you about service updates, 
              payments, and important account information.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`transition-all ${!notification.is_read ? 'ring-2 ring-primary/20' : 'hover:shadow-md'}`}
            >
              <CardContent className="p-4">
                <div 
                  className={`border-l-4 pl-4 pr-2 py-2 rounded-r ${getNotificationColor(notification.notification_type, notification.importance || 'normal')}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.notification_type, notification.importance || 'normal')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm text-foreground">
                            {notification.title}
                          </h4>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          )}
                          {notification.importance === 'high' && (
                            <Badge variant="destructive" className="text-xs px-1 py-0">
                              Urgent
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 break-words">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatNotificationDate(notification.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-3">
                    {notification.action_url && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild
                        className="text-xs"
                      >
                        <a href={notification.action_url}>
                          {notification.action_label || 'View Details'}
                        </a>
                      </Button>
                    )}
                    {!notification.is_read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markNotificationAsRead(notification.id)}
                        className="text-xs"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Mark as read
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}