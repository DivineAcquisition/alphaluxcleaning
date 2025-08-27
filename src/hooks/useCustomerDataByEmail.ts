import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  payment_status: string | null;
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

export const useCustomerDataByEmail = (email: string | null, orderId: string | null = null) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);

  const fetchCustomerData = async (searchValue: string, searchType: 'email' | 'order_id' = 'email') => {
    if (!searchValue) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('get-customer-data-by-email', {
        body: { 
          email: searchType === 'email' ? searchValue : null,
          order_id: searchType === 'order_id' ? searchValue : null,
          search_type: searchType
        }
      });

      if (error) {
        setError('Failed to fetch customer data. Please check your email and try again.');
        setHasData(false);
        return;
      }

      if (data.error) {
        setError(data.error);
        setHasData(false);
        return;
      }

      // Set the fetched data
      setProfile(data.profile || null);
      setOrders(data.orders || []);
      setBookings(data.bookings || []);
      setNotifications(data.notifications || []);
      setStats(data.stats || null);
      setHasData(data.hasData || false);

      if (!data.hasData) {
        setError('No service records found for this email address.');
      }

    } catch (error) {
      console.error('Error fetching customer data:', error);
      setError('An error occurred while fetching your data. Please try again.');
      setHasData(false);
    } finally {
      setLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    if (!email) return;

    try {
      await supabase.rpc('mark_notification_read_by_email', {
        p_notification_id: notificationId,
        p_customer_email: email
      });

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const updateProfile = async (updates: Partial<CustomerProfile>) => {
    if (!email) return false;
    
    toast({
      title: "Info",
      description: "Profile updates are not available in email-based access. Please contact support for profile changes.",
      variant: "default"
    });
    return false;
  };

  const refreshAll = async () => {
    if (email) {
      await fetchCustomerData(email, 'email');
    } else if (orderId) {
      await fetchCustomerData(orderId, 'order_id');
    }
  };

  // Auto-fetch when email or orderId changes
  useEffect(() => {
    if (email) {
      fetchCustomerData(email, 'email');
    } else if (orderId) {
      fetchCustomerData(orderId, 'order_id');
    } else {
      // Reset state when no search criteria
      setProfile(null);
      setOrders([]);
      setBookings([]);
      setNotifications([]);
      setStats(null);
      setError(null);
      setHasData(false);
      setLoading(false);
    }
  }, [email, orderId]);

  return {
    loading, 
    profile, 
    orders, 
    bookings, 
    notifications, 
    stats, 
    error, 
    hasData,
    markNotificationAsRead, 
    updateProfile, 
    refreshAll,
    fetchCustomerData
  };
};