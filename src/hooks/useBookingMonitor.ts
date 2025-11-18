import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface ActiveBooking {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  current_step: string;
  status: string;
  created_at: string;
  updated_at: string;
  est_price: number;
  service_type: string;
  frequency: string;
  zip_code: string | null;
  time_on_step: number; // milliseconds
  progress_percentage: number;
}

export function useBookingMonitor() {
  const [activeBookings, setActiveBookings] = useState<ActiveBooking[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial active bookings
  const fetchActiveBookings = async () => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    const { data: bookings } = await supabase
      .from('bookings')
      .select(`
        id,
        full_name,
        created_at,
        updated_at,
        status,
        est_price,
        service_type,
        frequency,
        zip_code,
        customer_id,
        customers (
          email,
          phone
        )
      `)
      .eq('status', 'pending')
      .gte('created_at', thirtyMinutesAgo)
      .order('created_at', { ascending: false });

    if (bookings) {
      const active: ActiveBooking[] = bookings.map((b: any) => {
        const createdAt = new Date(b.created_at).getTime();
        const updatedAt = new Date(b.updated_at || b.created_at).getTime();
        const timeOnStep = Date.now() - updatedAt;
        
        // Estimate current step based on what data is filled
        let currentStep = 'zip';
        let progress = 16;
        
        if (b.zip_code) {
          currentStep = 'sqft';
          progress = 33;
        }
        if (b.service_type) {
          currentStep = 'offer';
          progress = 50;
        }
        if (b.est_price > 0) {
          currentStep = 'checkout';
          progress = 66;
        }

        return {
          id: b.id,
          customer_name: b.full_name || 'Anonymous',
          customer_email: b.customers?.email || '',
          customer_phone: b.customers?.phone || null,
          current_step: currentStep,
          status: b.status,
          created_at: b.created_at,
          updated_at: b.updated_at || b.created_at,
          est_price: b.est_price,
          service_type: b.service_type || '',
          frequency: b.frequency || '',
          zip_code: b.zip_code,
          time_on_step: timeOnStep,
          progress_percentage: progress,
        };
      });

      setActiveBookings(active);
    }

    setIsLoading(false);
  };

  // Fetch recent booking events
  const fetchRecentEvents = async () => {
    const { data } = await supabase
      .from('booking_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      setRecentEvents(data);
    }
  };

  useEffect(() => {
    fetchActiveBookings();
    fetchRecentEvents();

    // Refresh every 5 seconds
    const interval = setInterval(() => {
      fetchActiveBookings();
      fetchRecentEvents();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('booking-monitor')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
        },
        () => {
          fetchActiveBookings();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'booking_events',
        },
        (payload) => {
          setRecentEvents((prev) => [payload.new, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    activeBookings,
    recentEvents,
    isLoading,
    refetch: fetchActiveBookings,
  };
}
