import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';

interface CustomerProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  customer_since: string | null;
  created_at: string;
  updated_at: string;
}

interface CustomerOrder {
  id: string;
  amount: number;
  status: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  service_details: any;
  scheduled_date: string | null;
  scheduled_time: string | null;
  cleaning_type: string | null;
  frequency: string | null;
  add_ons: string[] | null;
  created_at: string;
  updated_at: string;
  is_recurring: boolean | null;
  recurring_frequency: string | null;
  next_service_date: string | null;
  service_status: string | null;
}

interface CustomerBooking {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  service_address: string;
  service_date: string;
  service_time: string;
  estimated_duration: number | null;
  status: string;
  priority: string | null;
  special_instructions: string | null;
  created_at: string;
  updated_at: string;
}

interface CustomerNotification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  read_at: string | null;
  action_url: string | null;
  action_label: string | null;
  importance: string | null;
  image_url: string | null;
  created_at: string;
}

interface CustomerStats {
  totalOrders: number;
  completedServices: number;
  upcomingServices: number;
  totalSpent: number;
  averageRating: number;
  memberSince: string;
}

export const useCustomerData = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { trackFeatureUsage, trackInteraction } = usePerformanceMonitoring();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const cache = useRef<Map<string, { data: any; timestamp: number }>>(new Map());
  const maxRetries = 3;
  const cacheTimeout = 5 * 60 * 1000; // 5 minutes

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error is ok
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
  };

  const fetchOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        return;
      }

      setOrders(data || []);
    } catch (error) {
      console.error('Error in fetchOrders:', error);
    }
  };

  // Simple caching without complex recursion
  const cacheData = useCallback((key: string, data: any) => {
    const cacheEntry = { data, timestamp: Date.now() };
    cache.current.set(key, cacheEntry);
    
    try {
      localStorage.setItem(`customer_data_${key}`, JSON.stringify(cacheEntry));
    } catch (e) {
      console.warn('Failed to cache to localStorage:', e);
    }
  }, []);

  const getCachedData = useCallback((key: string) => {
    const cached = cache.current.get(key);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < cacheTimeout) {
      return cached.data;
    }

    // Try localStorage
    try {
      const stored = localStorage.getItem(`customer_data_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.data && (now - parsed.timestamp) < cacheTimeout) {
          return parsed.data;
        }
      }
    } catch (e) {
      console.warn('Failed to load from localStorage:', e);
    }

    return null;
  }, [cacheTimeout]);

  const fetchBookings = async () => {
    if (!user) return;

    try {
      // Fix: Use consistent lookup - try both user_id and email
      let data = null;
      
      // First try user_id if available
      const { data: userIdData, error: userIdError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!userIdError && userIdData?.length > 0) {
        data = userIdData;
      } else if (user.email) {
        // Fallback to email lookup
        const { data: emailData, error: emailError } = await supabase
          .from('bookings')
          .select('*')
          .eq('customer_email', user.email)
          .order('created_at', { ascending: false });

        if (!emailError) {
          data = emailData;
        }
      }

      setBookings(data || []);
    } catch (error) {
      console.error('Error in fetchBookings:', error);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('customer_notifications')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      setNotifications(data || []);
    } catch (error) {
      console.error('Error in fetchNotifications:', error);
    }
  };

  const calculateStats = () => {
    if (!orders.length && !bookings.length) {
      setStats(null);
      return;
    }

    const completedOrders = orders.filter(order => 
      order.service_status === 'completed' || order.status === 'completed'
    );
    
    const upcomingBookings = bookings.filter(booking => 
      booking.status === 'confirmed' && new Date(booking.service_date) > new Date()
    );

    const totalSpent = orders.reduce((sum, order) => sum + (order.amount / 100), 0);
    
    const memberSince = profile?.created_at || orders[0]?.created_at || bookings[0]?.created_at || '';

    setStats({
      totalOrders: orders.length + bookings.length,
      completedServices: completedOrders.length,
      upcomingServices: upcomingBookings.length,
      totalSpent,
      averageRating: 4.8, // Default until we implement reviews
      memberSince
    });
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase.rpc('mark_notification_read', {
        p_notification_id: notificationId,
        p_customer_id: user?.id
      });

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
    } catch (error) {
      console.error('Error in markNotificationAsRead:', error);
    }
  };

  const updateProfile = async (updates: Partial<CustomerProfile>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...updates,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Error",
          description: "Failed to update profile. Please try again.",
          variant: "destructive"
        });
        return false;
      }

      await fetchProfile();
      toast({
        title: "Success",
        description: "Profile updated successfully!"
      });
      return true;
    } catch (error) {
      console.error('Error in updateProfile:', error);
      return false;
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchProfile(),
      fetchOrders(),
      fetchBookings(),
      fetchNotifications()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      refreshAll();
    } else {
      setProfile(null);
      setOrders([]);
      setBookings([]);
      setNotifications([]);
      setStats(null);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    calculateStats();
  }, [orders, bookings, profile]);

  // Enhanced real-time subscriptions with error handling
  useEffect(() => {
    if (!user) return;

    const setupRealtimeSubscriptions = () => {
      const notificationsSubscription = supabase
        .channel('customer-notifications')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'customer_notifications',
          filter: `customer_id=eq.${user.id}`
        }, (payload) => {
          console.log('Notification change:', payload);
          fetchNotifications();
          if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
            trackInteraction('notification_received', (payload.new as any).id);
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Notifications subscription active');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Notifications subscription error');
            setTimeout(setupRealtimeSubscriptions, 5000); // Retry after 5s
          }
        });

      const ordersSubscription = supabase
        .channel('customer-orders')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          console.log('Order change:', payload);
          fetchOrders();
          if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
            trackInteraction('order_updated', (payload.new as any).id);
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Orders subscription active');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Orders subscription error');
            setTimeout(setupRealtimeSubscriptions, 5000);
          }
        });

      // Add bookings subscription
      const bookingsSubscription = supabase
        .channel('customer-bookings')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: user.email ? `customer_email=eq.${user.email}` : `user_id=eq.${user.id}`
        }, (payload) => {
          console.log('Booking change:', payload);
          fetchBookings();
          if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
            trackInteraction('booking_updated', (payload.new as any).id);
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Bookings subscription active');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Bookings subscription error');
            setTimeout(setupRealtimeSubscriptions, 5000);
          }
        });

      return () => {
        supabase.removeChannel(notificationsSubscription);
        supabase.removeChannel(ordersSubscription);
        supabase.removeChannel(bookingsSubscription);
      };
    };

    const cleanup = setupRealtimeSubscriptions();
    return cleanup;
  }, [user, trackInteraction]);

  return {
    loading,
    profile,
    orders,
    bookings,
    notifications,
    stats,
    error,
    markNotificationAsRead,
    updateProfile,
    refreshAll,
    retryCount
  };
};