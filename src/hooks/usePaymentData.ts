import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PaymentOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
  customer_name: string;
  customer_email: string;
  cleaning_type: string;
  scheduled_date: string;
  created_at: string;
  stripe_session_id: string;
}

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

export interface Subscription {
  id: string;
  status: string;
  current_period_end: number;
  plan_name: string;
  amount: number;
  interval: string;
}

export const usePaymentData = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('get-payment-methods');
      if (error) throw error;
      setPaymentMethods(data.payment_methods || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast.error('Failed to load payment methods');
    }
  };

  const fetchSubscriptions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      
      if (data.subscribed) {
        setSubscriptions([{
          id: 'current',
          status: 'active',
          current_period_end: Date.now() + (30 * 24 * 60 * 60 * 1000), // Temp
          plan_name: data.subscription_tier || 'BACP Club™',
          amount: 3900,
          interval: 'month'
        }]);
      } else {
        setSubscriptions([]);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Failed to load subscription info');
    }
  };

  const refreshAll = async () => {
    await Promise.all([
      fetchOrders(),
      fetchPaymentMethods(),
      fetchSubscriptions()
    ]);
  };

  useEffect(() => {
    if (user) {
      refreshAll();
    }
  }, [user]);

  return {
    orders,
    paymentMethods,
    subscriptions,
    loading,
    refreshAll,
    fetchOrders,
    fetchPaymentMethods,
    fetchSubscriptions
  };
};