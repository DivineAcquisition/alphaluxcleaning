import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AssignmentUpdate {
  id: string;
  booking_id: string;
  subcontractor_id: string;
  status: string; // Will be 'pending' | 'accepted' | 'declined' | 'expired' after migration
  priority: 'normal' | 'high' | 'urgent';
  assigned_at: string;
  expires_at: string;
  response_received_at?: string;
}

interface AssignmentStats {
  total_pending: number;
  total_accepted: number;
  total_declined: number;
  avg_response_time: number;
}

export function useRealtimeAssignments() {
  const [assignments, setAssignments] = useState<AssignmentUpdate[]>([]);
  const [stats, setStats] = useState<AssignmentStats>({
    total_pending: 0,
    total_accepted: 0,
    total_declined: 0,
    avg_response_time: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
    
    // Set up real-time subscription for assignment updates
    const assignmentChannel = supabase
      .channel('assignment-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subcontractor_job_assignments'
        },
        (payload) => {
          console.log('Assignment update received:', payload);
          handleAssignmentUpdate(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subcontractor_responses'
        },
        () => {
          console.log('Response update received');
          fetchAssignments(); // Refresh all data when response is received
        }
      )
      .subscribe();

    // Set up subscription for assignment analytics
    const analyticsChannel = supabase
      .channel('analytics-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'assignment_analytics'
        },
        () => {
          calculateStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(assignmentChannel);
      supabase.removeChannel(analyticsChannel);
    };
  }, []);

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('subcontractor_job_assignments')
        .select(`
          id,
          booking_id,
          subcontractor_id,
          status,
          assigned_at
        `)
        .gte('assigned_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .order('assigned_at', { ascending: false });

      if (error) throw error;

      const mappedData = (data || []).map(assignment => ({
        ...assignment,
        priority: 'normal' as const,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        response_received_at: undefined
      }));
      setAssignments(mappedData);
      await calculateStats();
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentUpdate = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    setAssignments(prev => {
      switch (eventType) {
        case 'INSERT':
          return [newRecord, ...prev];
        
        case 'UPDATE':
          return prev.map(assignment => 
            assignment.id === newRecord.id ? newRecord : assignment
          );
        
        case 'DELETE':
          return prev.filter(assignment => assignment.id !== oldRecord.id);
        
        default:
          return prev;
      }
    });

    // Recalculate stats after update
    calculateStats();
  };

  const calculateStats = async () => {
    try {
      // Get current assignments
      const currentAssignments = assignments.length > 0 ? assignments : 
        (await supabase
          .from('subcontractor_job_assignments')
          .select('*')
          .gte('assigned_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        ).data || [];

      const pending = currentAssignments.filter(a => a.status === 'pending').length;
      const accepted = currentAssignments.filter(a => a.status === 'accepted').length;
      const declined = currentAssignments.filter(a => a.status === 'declined').length;

      // Calculate average response time from analytics
      const { data: analyticsData } = await supabase
        .from('assignment_analytics')
        .select('response_time_minutes')
        .not('response_time_minutes', 'is', null)
        .gte('assignment_sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const responseTimes = analyticsData?.map(a => a.response_time_minutes) || [];
      const avgResponseTime = responseTimes.length > 0 
        ? Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
        : 0;

      setStats({
        total_pending: pending,
        total_accepted: accepted,
        total_declined: declined,
        avg_response_time: avgResponseTime
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  const markAssignmentAsExpired = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('subcontractor_job_assignments')
        .update({ 
          status: 'expired',
          response_received_at: new Date().toISOString()
        })
        .eq('id', assignmentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking assignment as expired:', error);
    }
  };

  const triggerRedistribution = async (bookingId: string, declinedAssignmentId: string, reason?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('automated-job-redistribution', {
        body: {
          booking_id: bookingId,
          declined_assignment_id: declinedAssignmentId,
          reason
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error triggering redistribution:', error);
      throw error;
    }
  };

  const getAssignmentsByStatus = (status: string) => {
    return assignments.filter(a => a.status === status);
  };

  const getExpiringSoonAssignments = (minutesThreshold = 15) => {
    const now = new Date();
    return assignments.filter(a => {
      if (a.status !== 'pending') return false;
      const expiresAt = new Date(a.expires_at);
      const minutesLeft = (expiresAt.getTime() - now.getTime()) / (1000 * 60);
      return minutesLeft <= minutesThreshold && minutesLeft > 0;
    });
  };

  return {
    assignments,
    stats,
    loading,
    refreshAssignments: fetchAssignments,
    markAssignmentAsExpired,
    triggerRedistribution,
    getAssignmentsByStatus,
    getExpiringSoonAssignments
  };
}