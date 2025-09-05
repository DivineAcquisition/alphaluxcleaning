import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface JobTrackingData {
  id?: string;
  assignment_id?: string;
  subcontractor_id?: string;
  order_id?: string;
  check_in_time?: string;
  check_out_time?: string;
  check_in_location?: string;
  check_out_location?: string;
  photos?: string[];
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export function useJobTracking(assignmentId?: string) {
  const [tracking, setTracking] = useState<JobTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (assignmentId) {
      fetchTracking();
      subscribeToUpdates();
    }
  }, [assignmentId]);

  const fetchTracking = async () => {
    if (!assignmentId) return;

    try {
      const { data, error } = await supabase
        .from('job_tracking')
        .select('*')
        .eq('assignment_id', assignmentId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found is ok
        throw error;
      }

      setTracking(data ? {
        ...data,
        photos: Array.isArray(data.photos) ? data.photos.map(p => String(p)) : []
      } : null);
    } catch (error) {
      console.error('Error fetching job tracking:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToUpdates = () => {
    if (!assignmentId) return;

    const channel = supabase
      .channel('job-tracking-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_tracking',
          filter: `assignment_id=eq.${assignmentId}`
        },
        (payload) => {
          console.log('Job tracking update:', payload);
          if (payload.eventType === 'DELETE') {
            setTracking(null);
          } else {
            const newData = payload.new as any;
            setTracking({
              ...newData,
              photos: Array.isArray(newData.photos) ? newData.photos.map(p => String(p)) : []
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const checkIn = async (location?: string, notes?: string): Promise<boolean> => {
    if (!assignmentId || tracking?.check_in_time) return false;

    setUpdating(true);
    try {
      // Get current user to set subcontractor_id
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      // Get subcontractor data
      const { data: subcontractorData } = await supabase
        .from('subcontractors')
        .select('id')
        .eq('user_id', userData.user.id)
        .single();

      const trackingData: Partial<JobTrackingData> = {
        assignment_id: assignmentId,
        subcontractor_id: subcontractorData?.id,
        check_in_time: new Date().toISOString(),
        check_in_location: location || 'Location captured',
        notes: notes || null
      };

      const { data, error } = await supabase
        .from('job_tracking')
        .insert(trackingData)
        .select()
        .single();

      if (error) throw error;

      setTracking({
        ...data,
        photos: Array.isArray(data.photos) ? data.photos.map(p => String(p)) : []
      });
      
      toast({
        title: "Checked In Successfully",
        description: `Check-in recorded at ${new Date().toLocaleTimeString()}`,
      });

      return true;
    } catch (error) {
      console.error('Error checking in:', error);
      toast({
        title: "Check-in Failed",
        description: "Unable to record check-in. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setUpdating(false);
    }
  };

  const checkOut = async (location?: string, notes?: string, photos?: string[]): Promise<boolean> => {
    if (!tracking?.id || tracking.check_out_time) return false;

    setUpdating(true);
    try {
      const updates: Partial<JobTrackingData> = {
        check_out_time: new Date().toISOString(),
        check_out_location: location || 'Location captured',
        notes: notes || tracking.notes,
        photos: photos || tracking.photos || []
      };

      const { data, error } = await supabase
        .from('job_tracking')
        .update(updates)
        .eq('id', tracking.id)
        .select()
        .single();

      if (error) throw error;

      setTracking({
        ...data,
        photos: Array.isArray(data.photos) ? data.photos.map(p => String(p)) : []
      });

      // Update assignment status to completed
      await supabase
        .from('subcontractor_job_assignments')
        .update({ status: 'completed' })
        .eq('id', assignmentId);

      toast({
        title: "Checked Out Successfully",
        description: `Job completed at ${new Date().toLocaleTimeString()}`,
      });

      return true;
    } catch (error) {
      console.error('Error checking out:', error);
      toast({
        title: "Check-out Failed",
        description: "Unable to record check-out. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setUpdating(false);
    }
  };

  const updateNotes = async (notes: string): Promise<boolean> => {
    if (!tracking?.id) return false;

    try {
      const { error } = await supabase
        .from('job_tracking')
        .update({ notes })
        .eq('id', tracking.id);

      if (error) throw error;

      setTracking(prev => prev ? { ...prev, notes } : null);
      return true;
    } catch (error) {
      console.error('Error updating notes:', error);
      return false;
    }
  };

  const addPhotos = async (newPhotos: string[]): Promise<boolean> => {
    if (!tracking?.id) return false;

    try {
      const currentPhotos = tracking.photos || [];
      const updatedPhotos = [...currentPhotos, ...newPhotos];

      const { error } = await supabase
        .from('job_tracking')
        .update({ photos: updatedPhotos })
        .eq('id', tracking.id);

      if (error) throw error;

      setTracking(prev => prev ? { ...prev, photos: updatedPhotos } : null);
      return true;
    } catch (error) {
      console.error('Error adding photos:', error);
      return false;
    }
  };

  const getElapsedTime = (): string | null => {
    if (!tracking?.check_in_time) return null;

    const start = new Date(tracking.check_in_time);
    const end = tracking.check_out_time ? new Date(tracking.check_out_time) : new Date();
    const diff = end.getTime() - start.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const isCheckedIn = !!tracking?.check_in_time;
  const isCheckedOut = !!tracking?.check_out_time;
  const canCheckIn = !isCheckedIn;
  const canCheckOut = isCheckedIn && !isCheckedOut;

  return {
    tracking,
    loading,
    updating,
    isCheckedIn,
    isCheckedOut,
    canCheckIn,
    canCheckOut,
    checkIn,
    checkOut,
    updateNotes,
    addPhotos,
    getElapsedTime,
    refresh: fetchTracking
  };
}