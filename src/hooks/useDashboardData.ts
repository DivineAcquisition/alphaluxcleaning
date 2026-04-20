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

      // Unassigned jobs (simplified - use status pending)
      const { count: unassignedCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .gte('service_date', today)
        .lte('service_date', nextWeekStr)
        .eq('status', 'pending');

      // In progress jobs (simplified - use confirmed status for today)
      const { count: inProgressCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('service_date', today)
        .eq('status', 'confirmed');

      // Late/No show jobs (simplified - overdue jobs with no completion)
      const now = new Date();
      const currentTime = now.getHours() * 100 + now.getMinutes();
      const { data: todaysJobs } = await supabase
        .from('bookings')
        .select('id, time_slot, status')
        .eq('service_date', today)
        .neq('status', 'completed');

      let lateNoShowCount = 0;
      if (todaysJobs) {
        todaysJobs.forEach(job => {
          if (job.time_slot) {
            const timeSlot = job.time_slot.replace(/[^\d]/g, '');
            const jobTime = parseInt(timeSlot);
            if (jobTime && currentTime > jobTime + 15) { // 15 minutes grace
              lateNoShowCount++;
            }
          }
        });
      }

      // Pending payouts (simplified - completed jobs without payouts processed)
      const { data: completedJobs } = await supabase
        .from('bookings')
        .select('est_price')
        .eq('status', 'completed')
        .gte('service_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      const payoutsPendingTotal = completedJobs?.reduce((sum, job) => 
        sum + ((job.est_price || 0) * 0.7), 0) || 0; // Assume 70% payout rate

      setKpis({
        todaysJobs: todaysJobsCount || 0,
        unassigned: unassignedCount || 0,
        inProgress: inProgressCount || 0,
        lateNoShow: lateNoShowCount,
        payoutsPending: payoutsPendingTotal,
        avgReliability: 85 // Simplified default
      });

    } catch (error) {
      console.error('Error fetching KPIs:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      // Get bookings with customer info
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          service_date,
          time_slot,
          est_price,
          status,
          special_instructions,
          service_type,
          customer_id,
          customers (
            name,
            address,
            city,
            state
          )
        `)
        .gte('service_date', today)
        .lte('service_date', nextWeekStr)
        .order('service_date')
        .order('time_slot');

      if (bookingsError) throw bookingsError;

      const formattedJobs: DashboardJob[] = bookingsData?.map(job => ({
        id: job.id,
        service_date: job.service_date,
        service_time: job.time_slot || '09:00 AM',
        customer_name: job.customers?.name || 'Unknown Customer',
        service_address: `${job.customers?.address || ''}, ${job.customers?.city || ''}, ${job.customers?.state || ''}`.trim().replace(/^,\s*|,\s*$/g, ''),
        service_type: job.service_type || 'Standard Clean',
        status: job.status,
        amount: job.est_price || 0,
        payment_status: 'pending',
        special_instructions: job.special_instructions
      })) || [];

      setJobs(formattedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchSubcontractors = async () => {
    try {
      // Simplified - create mock subcontractors since table doesn't exist yet
      const mockSubcontractors: DashboardSubcontractor[] = [
        {
          id: 'sub-1',
          full_name: 'John Smith',
          phone: '(857) 754-4557',
          email: 'john@example.com',
          is_available: true,
          reliability_score: 92,
          areas_count: 3,
          capacity_left: 2,
          status: 'available'
        },
        {
          id: 'sub-2',
          full_name: 'Sarah Johnson',
          phone: '(555) 987-6543',
          email: 'sarah@example.com',
          is_available: false,
          reliability_score: 88,
          areas_count: 2,
          capacity_left: 0,
          status: 'on_job'
        }
      ];

      setSubcontractors(mockSubcontractors);
    } catch (error) {
      console.error('Error fetching subcontractors:', error);
    }
  };

  const fetchPayouts = async () => {
    try {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      
      // Get completed jobs this week
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select(`
          id,
          service_date,
          time_slot,
          est_price,
          customer_id,
          customers (
            name,
            address,
            city,
            state
          )
        `)
        .eq('status', 'completed')
        .gte('service_date', startOfWeek.toISOString().split('T')[0]);

      if (error) throw error;

      const estimatedPayout = bookingsData?.reduce((sum, job) => 
        sum + ((job.est_price || 0) * 0.7), 0) || 0; // Assume 70% payout rate

      setPayouts({
        thisWeekCount: bookingsData?.length || 0,
        thisWeekTotal: estimatedPayout,
        pendingJobs: bookingsData?.map(job => ({
          id: job.id,
          service_date: job.service_date,
          service_time: job.time_slot || '09:00 AM',
          customer_name: job.customers?.name || 'Unknown Customer',
          service_address: `${job.customers?.address || ''}, ${job.customers?.city || ''}, ${job.customers?.state || ''}`.trim(),
          service_type: 'Cleaning',
          status: 'completed',
          amount: job.est_price || 0,
          payment_status: 'paid',
          subcontractor_payout_amount: (job.est_price || 0) * 0.7,
          subcontractor_name: 'Unassigned'
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
            fetchPayouts();
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