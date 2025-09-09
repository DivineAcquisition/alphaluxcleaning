import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DashboardKPIs {
  todaysJobs: number;
  unassigned: number;
  inProgress: number;
  lateNoShow: number;
  payoutsPending: number;
  avgReliability: number;
}

export interface DashboardJob {
  id: string;
  service_date: string;
  service_time: string;
  customer_name: string;
  service_address: string;
  service_type: string;
  subcontractor_id?: string;
  subcontractor_name?: string;
  status: string;
  amount: number;
  payment_status: string;
  subcontractor_payout_amount?: number;
  special_instructions?: string;
}

export interface DashboardSubcontractor {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  is_available: boolean;
  reliability_score: number;
  next_job_time?: string;
  areas_count: number;
  capacity_left: number;
  status: 'available' | 'on_job' | 'unavailable' | 'time_off';
}

export interface DashboardPayouts {
  thisWeekCount: number;
  thisWeekTotal: number;
  pendingJobs: DashboardJob[];
}

export interface DashboardAlert {
  id: string;
  type: 'warning' | 'info' | 'error';
  title: string;
  message: string;
  action?: string;
}

export function useDashboardData() {
  const [kpis, setKpis] = useState<DashboardKPIs>({
    todaysJobs: 0,
    unassigned: 0,
    inProgress: 0,
    lateNoShow: 0,
    payoutsPending: 0,
    avgReliability: 0
  });
  
  const [jobs, setJobs] = useState<DashboardJob[]>([]);
  const [subcontractors, setSubcontractors] = useState<DashboardSubcontractor[]>([]);
  const [payouts, setPayouts] = useState<DashboardPayouts>({
    thisWeekCount: 0,
    thisWeekTotal: 0,
    pendingJobs: []
  });
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate date ranges
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];

  const fetchKPIs = async () => {
    try {
      // Today's jobs count
      const { count: todaysJobsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('service_date', today);

      // Unassigned jobs (today + next 7 days)
      const { count: unassignedCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .gte('service_date', today)
        .lte('service_date', nextWeekStr)
        .is('assigned_employee_id', null);

      // In progress (has check-in, no check-out today)
      const { data: inProgressJobs } = await supabase
        .from('checkpoints')
        .select('booking_id')
        .eq('type', 'check_in')
        .gte('created_at', today + 'T00:00:00')
        .lte('created_at', today + 'T23:59:59');

      const inProgressBookingIds = inProgressJobs?.map(cp => cp.booking_id) || [];
      
      let inProgressCount = 0;
      if (inProgressBookingIds.length > 0) {
        const { data: checkOuts } = await supabase
          .from('checkpoints')
          .select('booking_id')
          .eq('type', 'check_out')
          .in('booking_id', inProgressBookingIds);

        const checkedOutIds = checkOuts?.map(co => co.booking_id) || [];
        inProgressCount = inProgressBookingIds.filter(id => !checkedOutIds.includes(id)).length;
      }

      // Late/No show jobs (grace period = 15 minutes)
      const now = new Date();
      const { data: todaysJobs } = await supabase
        .from('bookings')
        .select('id, service_time')
        .eq('service_date', today);

      let lateNoShowCount = 0;
      if (todaysJobs) {
        for (const job of todaysJobs) {
          const jobDateTime = new Date(`${today}T${job.service_time}`);
          const graceTime = new Date(jobDateTime.getTime() + 15 * 60000); // 15 minutes grace
          
          if (now > graceTime) {
            // Check if they checked in
            const { count } = await supabase
              .from('checkpoints')
              .select('*', { count: 'exact', head: true })
              .eq('booking_id', job.id)
              .eq('type', 'check_in');
            
            if (!count) {
              lateNoShowCount++;
            }
          }
        }
      }

      // Payouts pending
      const { data: pendingPayouts } = await supabase
        .from('bookings')
        .select('subcontractor_payout_amount')
        .eq('status', 'completed')
        .neq('subcontractor_payout_amount', null);

      const payoutsPendingTotal = pendingPayouts?.reduce((sum, job) => 
        sum + (job.subcontractor_payout_amount || 0), 0) || 0;

      // Average reliability (simplified - would normally come from metrics table)
      const { data: metrics } = await supabase
        .from('performance_metrics')
        .select('on_time_percentage, jobs_completed')
        .gte('month_year', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      let avgReliability = 0;
      if (metrics && metrics.length > 0) {
        const totalScore = metrics.reduce((sum, m) => sum + (m.on_time_percentage || 0), 0);
        avgReliability = totalScore / metrics.length;
      }

      setKpis({
        todaysJobs: todaysJobsCount || 0,
        unassigned: unassignedCount || 0,
        inProgress: inProgressCount,
        lateNoShow: lateNoShowCount,
        payoutsPending: payoutsPendingTotal,
        avgReliability
      });

    } catch (error) {
      console.error('Error fetching KPIs:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      // First get bookings with basic info
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          service_date,
          service_time,
          customer_name,
          service_address,
          status,
          subcontractor_payout_amount,
          special_instructions,
          assigned_employee_id,
          order_id
        `)
        .gte('service_date', today)
        .lte('service_date', nextWeekStr)
        .order('service_date')
        .order('service_time');

      if (bookingsError) throw bookingsError;

      // Get subcontractor names separately
      const subcontractorIds = bookingsData
        ?.filter(job => job.assigned_employee_id)
        .map(job => job.assigned_employee_id) || [];

      let subcontractorMap = new Map();
      if (subcontractorIds.length > 0) {
        const { data: subData } = await supabase
          .from('subcontractors')
          .select('id, full_name')
          .in('id', subcontractorIds);

        subcontractorMap = new Map(subData?.map(sub => [sub.id, sub.full_name]) || []);
      }

      // Get order details separately
      const orderIds = bookingsData
        ?.filter(job => job.order_id)
        .map(job => job.order_id) || [];

      let orderMap = new Map();
      if (orderIds.length > 0) {
        const { data: orderData } = await supabase
          .from('orders')
          .select('id, amount, payment_status, service_details')
          .in('id', orderIds);

        orderMap = new Map(orderData?.map(order => [order.id, order]) || []);
      }

      const formattedJobs: DashboardJob[] = bookingsData?.map(job => {
        const order = orderMap.get(job.order_id);
        return {
          id: job.id,
          service_date: job.service_date,
          service_time: job.service_time,
          customer_name: job.customer_name,
          service_address: job.service_address,
          service_type: order?.service_details?.service_type || 'Standard Clean',
          subcontractor_id: job.assigned_employee_id,
          subcontractor_name: subcontractorMap.get(job.assigned_employee_id),
          status: job.status,
          amount: order?.amount || 0,
          payment_status: order?.payment_status || 'pending',
          subcontractor_payout_amount: job.subcontractor_payout_amount,
          special_instructions: job.special_instructions
        };
      }) || [];

      setJobs(formattedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchSubcontractors = async () => {
    try {
      const { data, error } = await supabase
        .from('subcontractors')
        .select(`
          id,
          full_name,
          phone,
          email,
          is_available,
          rating,
          city,
          state
        `)
        .eq('account_status', 'active');

      if (error) throw error;

      const formattedSubs: DashboardSubcontractor[] = data?.map(sub => ({
        id: sub.id,
        full_name: sub.full_name,
        phone: sub.phone,
        email: sub.email,
        is_available: sub.is_available,
        reliability_score: sub.rating || 0,
        areas_count: 1, // Simplified - would calculate from coverage areas
        capacity_left: 3, // Simplified - would calculate from max jobs per day
        status: sub.is_available ? 'available' : 'unavailable'
      })) || [];

      setSubcontractors(formattedSubs);
    } catch (error) {
      console.error('Error fetching subcontractors:', error);
    }
  };

  const fetchPayouts = async () => {
    try {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      
      // Get completed jobs this week with subcontractor info
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select(`
          id,
          service_date,
          customer_name,
          service_address,
          subcontractor_payout_amount,
          assigned_employee_id
        `)
        .eq('status', 'completed')
        .neq('subcontractor_payout_amount', null)
        .gte('service_date', startOfWeek.toISOString().split('T')[0]);

      if (error) throw error;

      // Get subcontractor names
      const subIds = bookingsData?.filter(job => job.assigned_employee_id).map(job => job.assigned_employee_id) || [];
      let subMap = new Map();
      if (subIds.length > 0) {
        const { data: subData } = await supabase
          .from('subcontractors')
          .select('id, full_name')
          .in('id', subIds);
        subMap = new Map(subData?.map(sub => [sub.id, sub.full_name]) || []);
      }

      const thisWeekTotal = bookingsData?.reduce((sum, job) => 
        sum + (job.subcontractor_payout_amount || 0), 0) || 0;

      setPayouts({
        thisWeekCount: bookingsData?.length || 0,
        thisWeekTotal,
        pendingJobs: bookingsData?.map(job => ({
          id: job.id,
          service_date: job.service_date,
          service_time: '00:00', // Would need to join with booking time
          customer_name: job.customer_name,
          service_address: job.service_address,
          service_type: 'Cleaning',
          status: 'completed',
          amount: 0,
          payment_status: 'paid',
          subcontractor_payout_amount: job.subcontractor_payout_amount,
          subcontractor_name: subMap.get(job.assigned_employee_id)
        })) || []
      });
    } catch (error) {
      console.error('Error fetching payouts:', error);
    }
  };

  const generateAlerts = useCallback(() => {
    const newAlerts: DashboardAlert[] = [];

    // Unassigned jobs alert
    if (kpis.unassigned > 0) {
      newAlerts.push({
        id: 'unassigned',
        type: 'warning',
        title: 'Unassigned Jobs',
        message: `${kpis.unassigned} jobs need subcontractor assignment`,
        action: 'Assign Now'
      });
    }

    // Late jobs alert
    if (kpis.lateNoShow > 0) {
      newAlerts.push({
        id: 'late',
        type: 'error',
        title: 'Late/No Show',
        message: `${kpis.lateNoShow} jobs are running late or no-show`,
        action: 'Review Jobs'
      });
    }

    // Payouts pending alert
    if (kpis.payoutsPending > 0) {
      newAlerts.push({
        id: 'payouts',
        type: 'info',
        title: 'Payouts Pending',
        message: `$${kpis.payoutsPending.toFixed(2)} in subcontractor payouts pending`,
        action: 'Process Payouts'
      });
    }

    setAlerts(newAlerts);
  }, [kpis]);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchKPIs(),
        fetchJobs(),
        fetchSubcontractors(),
        fetchPayouts()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const refetch = useCallback(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    generateAlerts();
  }, [generateAlerts]);

  // Set up realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        () => {
          // Debounce updates
          setTimeout(() => {
            fetchKPIs();
            fetchJobs();
          }, 250);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'checkpoints'
        },
        () => {
          setTimeout(() => {
            fetchKPIs();
          }, 250);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    kpis,
    jobs,
    subcontractors,
    payouts,
    alerts,
    loading,
    error,
    refetch
  };
}