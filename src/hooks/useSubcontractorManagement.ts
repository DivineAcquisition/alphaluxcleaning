import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SubcontractorProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  active: boolean;
  reliability_score: number;
  avg_duration_minutes: number;
  completed_jobs_count: number;
  rating: number;
  company_id: string;
  created_at: string;
  user_id?: string;
}

export interface TimeOffRequest {
  id: string;
  subcontractor_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string; // Can be 'pending' | 'approved' | 'denied' but comes as string from DB
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface ServiceArea {
  id: string;
  subcontractor_id: string;
  zip: string;
  created_at: string;
}

export interface PerformanceMetrics {
  id: string;
  subcontractor_id: string;
  period_start: string;
  period_end: string;
  acceptance_rate: number;
  on_time_rate: number;
  jobs_completed: number;
  avg_duration_minutes: number;
  avg_rating: number;
}

export function useSubcontractorManagement() {
  const [subcontractors, setSubcontractors] = useState<SubcontractorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([]);
  const { toast } = useToast();

  // Fetch all subcontractors
  const fetchSubcontractors = async () => {
    try {
      const { data, error } = await supabase
        .from('subcontractors')
        .select('*')
        .order('full_name');

      if (error) throw error;
      setSubcontractors(data || []);
    } catch (error: any) {
      console.error('Error fetching subcontractors:', error);
      toast({
        title: "Error",
        description: "Failed to load subcontractors",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch time-off requests
  const fetchTimeOffRequests = async (subcontractorId?: string) => {
    try {
      let query = supabase
        .from('subcontractor_timeoff')
        .select(`
          *,
          subcontractors(full_name)
        `)
        .order('created_at', { ascending: false });

      if (subcontractorId) {
        query = query.eq('subcontractor_id', subcontractorId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTimeOffRequests(data || []);
    } catch (error: any) {
      console.error('Error fetching time-off requests:', error);
      toast({
        title: "Error",
        description: "Failed to load time-off requests",
        variant: "destructive",
      });
    }
  };

  // Update subcontractor active status
  const updateSubcontractorStatus = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('subcontractors')
        .update({ active })
        .eq('id', id);

      if (error) throw error;

      setSubcontractors(prev => 
        prev.map(sub => 
          sub.id === id ? { ...sub, active } : sub
        )
      );

      toast({
        title: "Success",
        description: `Subcontractor ${active ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error: any) {
      console.error('Error updating subcontractor status:', error);
      toast({
        title: "Error",
        description: "Failed to update subcontractor status",
        variant: "destructive",
      });
    }
  };

  // Approve/deny time-off request
  const updateTimeOffStatus = async (id: string, status: 'approved' | 'denied', userId: string) => {
    try {
      const { error } = await supabase
        .from('subcontractor_timeoff')
        .update({ 
          status, 
          reviewed_by: userId, 
          reviewed_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;

      setTimeOffRequests(prev => 
        prev.map(req => 
          req.id === id 
            ? { ...req, status, reviewed_by: userId, reviewed_at: new Date().toISOString() } 
            : req
        )
      );

      toast({
        title: "Success",
        description: `Time-off request ${status} successfully`,
      });
    } catch (error: any) {
      console.error('Error updating time-off status:', error);
      toast({
        title: "Error",
        description: "Failed to update time-off request",
        variant: "destructive",
      });
    }
  };

  // Send assignment invite
  const sendAssignmentInvite = async (bookingId: string, subcontractorId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-assignment-invite', {
        body: {
          booking_id: bookingId,
          subcontractor_id: subcontractorId
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assignment invite sent successfully",
      });

      return data;
    } catch (error: any) {
      console.error('Error sending assignment invite:', error);
      toast({
        title: "Error",
        description: "Failed to send assignment invite",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Get eligible subcontractors for a job
  const getEligibleSubcontractors = async (
    bookingId: string,
    serviceDate: string,
    startTime: string,
    endTime: string,
    zipCode: string
  ) => {
    try {
      const { data, error } = await supabase.rpc('get_eligible_subcontractors', {
        p_company_id: '550e8400-e29b-41d4-a716-446655440000', // Default company
        p_booking_id: bookingId,
        p_service_date: serviceDate,
        p_start_time: startTime,
        p_end_time: endTime,
        p_zip: zipCode
      });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error getting eligible subcontractors:', error);
      toast({
        title: "Error",
        description: "Failed to get eligible subcontractors",
        variant: "destructive",
      });
      return [];
    }
  };

  // Add service area to subcontractor
  const addServiceArea = async (subcontractorId: string, zipCode: string) => {
    try {
      const { error } = await supabase
        .from('subcontractor_service_areas')
        .insert({
          subcontractor_id: subcontractorId,
          zip: zipCode
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Service area added successfully",
      });
    } catch (error: any) {
      console.error('Error adding service area:', error);
      toast({
        title: "Error",
        description: "Failed to add service area",
        variant: "destructive",
      });
    }
  };

  // Remove service area
  const removeServiceArea = async (serviceAreaId: string) => {
    try {
      const { error } = await supabase
        .from('subcontractor_service_areas')
        .delete()
        .eq('id', serviceAreaId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Service area removed successfully",
      });
    } catch (error: any) {
      console.error('Error removing service area:', error);
      toast({
        title: "Error",
        description: "Failed to remove service area",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSubcontractors();
    fetchTimeOffRequests();
  }, []);

  return {
    subcontractors,
    loading,
    timeOffRequests,
    fetchSubcontractors,
    fetchTimeOffRequests,
    updateSubcontractorStatus,
    updateTimeOffStatus,
    sendAssignmentInvite,
    getEligibleSubcontractors,
    addServiceArea,
    removeServiceArea,
  };
}