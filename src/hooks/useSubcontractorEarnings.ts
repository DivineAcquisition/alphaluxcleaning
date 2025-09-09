import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EarningsOverview {
  weekEarnings: number;
  weekTips: number;
  weekJobs: number;
  monthEarnings: number;
  monthTips: number;
  monthJobs: number;
  totalEarnings: number;
  pendingAmount: number;
  avgJobPayout: number;
  last8Weeks: Array<{
    week: string;
    earnings: number;
    tips: number;
  }>;
}

export interface JobHistoryItem {
  id: string;
  service_date: string;
  service_time: string;
  service_address: string;
  customer_name: string;
  subcontractor_payout_amount: number;
  gratuity_amount: number;
  total_amount: number;
  rating: number | null;
  rating_note: string | null;
  payout_status: 'pending' | 'processing' | 'paid' | 'on_hold';
  completed_at: string | null;
  special_instructions: string | null;
  estimated_duration: number | null;
}

export interface PayoutBatch {
  id: string;
  period_start: string;
  period_end: string;
  status: 'open' | 'processing' | 'paid' | 'failed';
  total_amount: number;
  created_at: string;
  items?: PayoutBatchItem[];
}

export interface PayoutBatchItem {
  id: string;
  booking_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  paid_at: string | null;
  job_details?: {
    service_date: string;
    customer_name: string;
    service_address: string;
  };
}

export function useSubcontractorEarnings() {
  const [overview, setOverview] = useState<EarningsOverview | null>(null);
  const [jobHistory, setJobHistory] = useState<JobHistoryItem[]>([]);
  const [payoutBatches, setPayoutBatches] = useState<PayoutBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [subcontractorId, setSubcontractorId] = useState<string | null>(null);
  const { toast } = useToast();

  const getCurrentSubcontractor = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('subcontractors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error getting subcontractor:', error);
      throw error;
    }
  };

  const fetchEarningsOverview = async (subId: string) => {
    try {
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      startOfWeek.setHours(0, 0, 0, 0);
      
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Calculate last 8 weeks
      const weeks = [];
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(startOfWeek);
        weekStart.setDate(weekStart.getDate() - (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        weeks.push({
          start: weekStart.toISOString(),
          end: weekEnd.toISOString(),
          label: `Week ${weekStart.getMonth() + 1}/${weekStart.getDate()}`
        });
      }

      // Fetch completed bookings with fallback to existing fields
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('assigned_employee_id', subId)
        .eq('status', 'completed');

      if (error) throw error;

      // Type the bookings with our expected fields
      const typedBookings = bookings as any[];

      // Calculate stats with fallbacks
      const thisWeekJobs = typedBookings?.filter(job => {
        const completedDate = job.completed_at ? new Date(job.completed_at) : new Date(job.updated_at);
        return completedDate >= startOfWeek;
      }) || [];
      
      const thisMonthJobs = typedBookings?.filter(job => {
        const completedDate = job.completed_at ? new Date(job.completed_at) : new Date(job.updated_at);
        return completedDate >= startOfMonth;
      }) || [];

      const weekEarnings = thisWeekJobs.reduce((sum, job) => 
        sum + (job.subcontractor_payout_amount || 0), 0
      );
      
      const weekTips = thisWeekJobs.reduce((sum, job) => 
        sum + (job.gratuity_amount || 0), 0
      );

      const monthEarnings = thisMonthJobs.reduce((sum, job) => 
        sum + (job.subcontractor_payout_amount || 0), 0
      );
      
      const monthTips = thisMonthJobs.reduce((sum, job) => 
        sum + (job.gratuity_amount || 0), 0
      );

      const totalEarnings = typedBookings?.reduce((sum, job) => 
        sum + (job.subcontractor_payout_amount || 0) + (job.gratuity_amount || 0), 0
      ) || 0;

      const pendingAmount = typedBookings?.filter(job => 
        (job.payout_status || 'pending') === 'pending'
      ).reduce((sum, job) => 
        sum + (job.subcontractor_payout_amount || 0) + (job.gratuity_amount || 0), 0
      ) || 0;

      // Calculate weekly earnings for chart
      const weeklyData = weeks.map(week => {
        const weekJobs = typedBookings?.filter(job => {
          const completedAt = job.completed_at ? new Date(job.completed_at) : new Date(job.updated_at);
          return completedAt >= new Date(week.start) && completedAt <= new Date(week.end);
        }) || [];

        return {
          week: week.label,
          earnings: weekJobs.reduce((sum, job) => sum + (job.subcontractor_payout_amount || 0), 0),
          tips: weekJobs.reduce((sum, job) => sum + (job.gratuity_amount || 0), 0)
        };
      });

      setOverview({
        weekEarnings,
        weekTips,
        weekJobs: thisWeekJobs.length,
        monthEarnings,
        monthTips,
        monthJobs: thisMonthJobs.length,
        totalEarnings,
        pendingAmount,
        avgJobPayout: typedBookings?.length ? totalEarnings / typedBookings.length : 0,
        last8Weeks: weeklyData
      });

    } catch (error) {
      console.error('Error fetching earnings overview:', error);
      toast({
        title: "Error",
        description: "Failed to load earnings data",
        variant: "destructive",
      });
    }
  };

  const fetchJobHistory = async (subId: string, filters?: {
    startDate?: string;
    endDate?: string;
    minRating?: number;
    payoutStatus?: string;
  }) => {
    try {
      let query = supabase
        .from('bookings')
        .select('*')
        .eq('assigned_employee_id', subId)
        .eq('status', 'completed')
        .order('updated_at', { ascending: false });

      if (filters?.startDate) {
        query = query.gte('updated_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('updated_at', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedJobs = data?.map((job: any) => ({
        id: job.id,
        service_date: job.service_date,
        service_time: job.service_time,
        service_address: job.service_address,
        customer_name: job.customer_name,
        subcontractor_payout_amount: job.subcontractor_payout_amount || 0,
        gratuity_amount: job.gratuity_amount || 0,
        rating: job.rating || null,
        rating_note: job.rating_note || null,
        payout_status: job.payout_status || 'pending',
        completed_at: job.completed_at || job.updated_at,
        special_instructions: job.special_instructions,
        estimated_duration: job.estimated_duration,
        total_amount: (job.subcontractor_payout_amount || 0) + (job.gratuity_amount || 0)
      })).filter(job => {
        if (filters?.minRating && job.rating && job.rating < filters.minRating) return false;
        if (filters?.payoutStatus && job.payout_status !== filters.payoutStatus) return false;
        return true;
      }) || [];

      setJobHistory(formattedJobs);

    } catch (error) {
      console.error('Error fetching job history:', error);
      toast({
        title: "Error",
        description: "Failed to load job history",
        variant: "destructive",
      });
    }
  };

  const fetchPayoutBatches = async (subId: string) => {
    try {
      // For now, create mock payout data since the tables are new
      // This will be replaced once the Supabase types are regenerated
      const mockBatches: PayoutBatch[] = [
        {
          id: '1',
          period_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          period_end: new Date().toISOString(),
          status: 'processing',
          total_amount: 450.00,
          created_at: new Date().toISOString(),
          items: [
            {
              id: '1',
              booking_id: '1',
              amount: 150.00,
              status: 'pending',
              paid_at: null,
              job_details: {
                service_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                customer_name: 'John Doe',
                service_address: '123 Main St, San Francisco, CA'
              }
            }
          ]
        },
        {
          id: '2',
          period_start: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          period_end: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'paid',
          total_amount: 320.00,
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          items: []
        }
      ];

      setPayoutBatches(mockBatches);

    } catch (error) {
      console.error('Error fetching payout batches:', error);
      toast({
        title: "Error",
        description: "Failed to load payout data",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        const subId = await getCurrentSubcontractor();
        setSubcontractorId(subId);

        await Promise.all([
          fetchEarningsOverview(subId),
          fetchJobHistory(subId),
          fetchPayoutBatches(subId)
        ]);

      } catch (error) {
        console.error('Error initializing earnings data:', error);
        toast({
          title: "Error",
          description: "Failed to load earnings data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const refreshData = async () => {
    if (!subcontractorId) return;
    
    await Promise.all([
      fetchEarningsOverview(subcontractorId),
      fetchJobHistory(subcontractorId),
      fetchPayoutBatches(subcontractorId)
    ]);
  };

  return {
    overview,
    jobHistory,
    payoutBatches,
    loading,
    subcontractorId,
    fetchJobHistory,
    refreshData
  };
}