import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseNotificationsReturn {
  unreadCount: number;
  notifications: any[];
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customer_notifications'
        },
        () => {
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
        .limit(20);

      if (error) throw error;

      setNotifications(data || []);
      
      // Count unread notifications
      const unread = (data || []).filter(n => !n.is_read).length;
      setUnreadCount(unread);

    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.rpc('mark_notification_read', {
        p_notification_id: notificationId,
        p_customer_id: user.id
      });

      // Update local state
      setNotifications(prev =>
        prev.map((n: any) =>
          n.id === notificationId
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );

      setUnreadCount(prev => Math.max(0, prev - 1));

    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const unreadIds = notifications.filter((n: any) => !n.is_read).map((n: any) => n.id);
      
      for (const id of unreadIds) {
        await supabase.rpc('mark_notification_read', {
          p_notification_id: id,
          p_customer_id: user.id
        });
      }

      // Update local state
      setNotifications(prev =>
        prev.map((n: any) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );

      setUnreadCount(0);

    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  };

  return {
    unreadCount,
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications,
  };
};