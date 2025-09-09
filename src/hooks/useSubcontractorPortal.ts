import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface JobAssignment {
  id: string; // This is the booking ID
  service_date: string;
  service_time: string;
  service_address: string;
  customer_name: string;
  customer_phone?: string;
  special_instructions?: string;
  estimated_duration: number;
  status: string;
  entered_sqft?: number;
  subcontractor_payout_amount?: number;
  services?: {
    name: string;
    description?: string;
  };
}

export interface Checkpoint {
  id: string;
  booking_id: string;
  type: 'check_in' | 'check_out' | 'assignment_accepted' | 'assignment_declined';
  lat?: number;
  lng?: number;
  notes?: string;
  photos: string[];
  created_at: string;
}

export interface AvailabilitySlot {
  id?: string;
  day_of_week: number;
  available?: boolean; // Made optional since DB uses is_available
  is_available?: boolean; // DB field name
  start_time?: string;
  end_time?: string;
}

export function useSubcontractorPortal() {
  const [todaysJobs, setTodaysJobs] = useState<JobAssignment[]>([]);
  const [upcomingJobs, setUpcomingJobs] = useState<JobAssignment[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [subcontractorId, setSubcontractorId] = useState<string | null>(null);
  const { toast } = useToast();

  // Get current subcontractor from auth
  const getCurrentSubcontractor = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('subcontractors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setSubcontractorId(data.id);
      return data.id;
    } catch (error: any) {
      console.error('Error getting current subcontractor:', error);
      return null;
    }
  };

  // Fetch today's jobs
  const fetchTodaysJobs = async (subId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services(name, description)
        `)
        .eq('assigned_employee_id', subId)
        .eq('service_date', today)
        .in('status', ['confirmed', 'in_progress'])
        .order('service_time');

      if (error) throw error;
      setTodaysJobs(data || []);
    } catch (error: any) {
      console.error('Error fetching today\'s jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load today's jobs",
        variant: "destructive",
      });
    }
  };

  // Fetch upcoming jobs (next 7 days)
  const fetchUpcomingJobs = async (subId: string) => {
    try {
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services(name, description)
        `)
        .eq('assigned_employee_id', subId)
        .gt('service_date', today.toISOString().split('T')[0])
        .lte('service_date', nextWeek.toISOString().split('T')[0])
        .in('status', ['confirmed', 'assigned'])
        .order('service_date', { ascending: true })
        .order('service_time', { ascending: true });

      if (error) throw error;
      setUpcomingJobs(data || []);
    } catch (error: any) {
      console.error('Error fetching upcoming jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load upcoming jobs",
        variant: "destructive",
      });
    }
  };

  // Fetch availability schedule
  const fetchAvailability = async (subId: string) => {
    try {
      const { data, error } = await supabase
        .from('subcontractor_availability')
        .select('*')
        .eq('subcontractor_id', subId)
        .order('day_of_week');

      if (error) throw error;

      // Create default availability for all days if none exist
      const daysOfWeek = [0, 1, 2, 3, 4, 5, 6]; // Sunday to Saturday
      const availabilityMap = new Map(data?.map(slot => [slot.day_of_week, slot]) || []);
      
      const fullAvailability = daysOfWeek.map(day => {
        const existing = availabilityMap.get(day);
        return existing ? {
          ...existing,
          available: existing.is_available
        } : {
          day_of_week: day,
          available: false,
          start_time: '09:00',
          end_time: '17:00'
        };
      });

      setAvailability(fullAvailability);
    } catch (error: any) {
      console.error('Error fetching availability:', error);
      toast({
        title: "Error",
        description: "Failed to load availability",
        variant: "destructive",
      });
    }
  };

  // Update availability
  const updateAvailability = async (dayOfWeek: number, available: boolean, startTime?: string, endTime?: string) => {
    if (!subcontractorId) return;

    try {
      const { error } = await supabase
        .from('subcontractor_availability')
        .upsert({
          subcontractor_id: subcontractorId,
          day_of_week: dayOfWeek,
          is_available: available, // Use correct DB field name
          start_time: startTime,
          end_time: endTime
        });

      if (error) throw error;

      setAvailability(prev => 
        prev.map(slot => 
          slot.day_of_week === dayOfWeek 
            ? { ...slot, available, start_time: startTime, end_time: endTime }
            : slot
        )
      );

      toast({
        title: "Success",
        description: "Availability updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating availability:', error);
      toast({
        title: "Error",
        description: "Failed to update availability",
        variant: "destructive",
      });
    }
  };

  // Check in to job
  const checkIn = async (bookingId: string, lat?: number, lng?: number, notes?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('subcontractor-checkin', {
        body: {
          booking_id: bookingId,
          subcontractor_id: subcontractorId,
          lat,
          lng,
          notes,
          type: 'check_in'
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Successfully checked in to job",
      });

      // Refresh jobs
      if (subcontractorId) {
        fetchTodaysJobs(subcontractorId);
      }

      return data;
    } catch (error: any) {
      console.error('Error checking in:', error);
      toast({
        title: "Error",
        description: "Failed to check in",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Check out of job
  const checkOut = async (bookingId: string, lat?: number, lng?: number, notes?: string, photos?: string[]) => {
    try {
      const { data, error } = await supabase.functions.invoke('subcontractor-checkin', {
        body: {
          booking_id: bookingId,
          subcontractor_id: subcontractorId,
          lat,
          lng,
          notes,
          photos,
          type: 'check_out'
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Successfully checked out of job",
      });

      // Refresh jobs
      if (subcontractorId) {
        fetchTodaysJobs(subcontractorId);
      }

      return data;
    } catch (error: any) {
      console.error('Error checking out:', error);
      toast({
        title: "Error",
        description: "Failed to check out",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Upload job photos
  const uploadJobPhotos = async (bookingId: string, photos: File[], checkpointType: string = 'progress') => {
    try {
      if (!subcontractorId) throw new Error('No subcontractor ID');

      const formData = new FormData();
      formData.append('booking_id', bookingId);
      formData.append('subcontractor_id', subcontractorId);
      formData.append('checkpoint_type', checkpointType);
      
      photos.forEach(photo => {
        formData.append('photos', photo);
      });

      const { data, error } = await supabase.functions.invoke('upload-job-photos', {
        body: formData
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Successfully uploaded ${photos.length} photo${photos.length > 1 ? 's' : ''}`,
      });

      return data;
    } catch (error: any) {
      console.error('Error uploading photos:', error);
      toast({
        title: "Error",
        description: "Failed to upload photos",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Request time off
  const requestTimeOff = async (startDate: string, endDate: string, reason: string) => {
    if (!subcontractorId) return;

    try {
      const { error } = await supabase
        .from('subcontractor_timeoff')
        .insert({
          subcontractor_id: subcontractorId,
          start_date: startDate,
          end_date: endDate,
          reason,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Time-off request submitted successfully",
      });
    } catch (error: any) {
      console.error('Error requesting time off:', error);
      toast({
        title: "Error",
        description: "Failed to submit time-off request",
        variant: "destructive",
      });
    }
  };

  // Respond to job assignment
  const respondToAssignment = async (assignmentId: string, action: 'accept' | 'decline') => {
    try {
      const { data, error } = await supabase.functions.invoke('assignment-response', {
        body: {
          assignment_id: assignmentId,
          action
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Job ${action}ed successfully`,
      });

      // Refresh jobs
      if (subcontractorId) {
        await Promise.all([
          fetchTodaysJobs(subcontractorId),
          fetchUpcomingJobs(subcontractorId)
        ]);
      }

      return data;
    } catch (error: any) {
      console.error(`Error ${action}ing assignment:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} job`,
        variant: "destructive",
      });
      throw error;
    }
  };

  const refreshJobs = async () => {
    if (subcontractorId) {
      await Promise.all([
        fetchTodaysJobs(subcontractorId),
        fetchUpcomingJobs(subcontractorId)
      ]);
    }
  };

  useEffect(() => {
    const initializePortal = async () => {
      setLoading(true);
      const subId = await getCurrentSubcontractor();
      if (subId) {
        await Promise.all([
          fetchTodaysJobs(subId),
          fetchUpcomingJobs(subId),
          fetchAvailability(subId)
        ]);
      }
      setLoading(false);
    };

    initializePortal();
  }, []);

  return {
    todaysJobs,
    upcomingJobs,
    availability,
    loading,
    subcontractorId,
    updateAvailability,
    checkIn,
    checkOut,
    uploadJobPhotos,
    requestTimeOff,
    respondToAssignment,
    refreshJobs,
  };
}