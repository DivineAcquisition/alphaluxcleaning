import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface JobAssignment {
  id: string;
  subcontractor_id: string;
  booking_id: string;
  status: string;
  assigned_at: string;
  accepted_at?: string;
  completed_at?: string;
  dropped_at?: string;
  subcontractor_notes?: string;
  drop_reason?: string;
  customer_rating?: number;
  created_at: string;
  subcontractors?: {
    full_name: string;
    email: string;
    phone: string;
  };
  bookings?: {
    service_address: string;
    scheduled_date: string;
    scheduled_time: string;
    special_instructions: string;
  };
}

export function useJobAssignments() {
  const [assignments, setAssignments] = useState<JobAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subcontractor_job_assignments')
        .select(`
          id,
          subcontractor_id,
          booking_id,
          status,
          assigned_at,
          accepted_at,
          completed_at,
          dropped_at,
          subcontractor_notes,
          drop_reason,
          customer_rating,
          created_at,
          subcontractors:subcontractor_id (
            full_name,
            email,
            phone
          ),
          bookings:booking_id (
            service_address,
            scheduled_date,
            scheduled_time,
            special_instructions
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAssignments((data as any[]) || []);
    } catch (error) {
      console.error('Error fetching job assignments:', error);
      toast({
        title: "Error",
        description: "Failed to load job assignments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const assignJob = async (bookingId: string, subcontractorId: string, adminNotes?: string) => {
    try {
      const { data: assignment, error: assignmentError } = await supabase
        .from('subcontractor_job_assignments')
        .insert({
          booking_id: bookingId,
          subcontractor_id: subcontractorId,
          status: 'pending',
          assigned_at: new Date().toISOString(),
          subcontractor_notes: adminNotes
        })
        .select('id')
        .single();

      if (assignmentError) throw assignmentError;

      // Send job notification
      const { error: notificationError } = await supabase.functions.invoke('send-job-notifications', {
        body: {
          assignment_id: assignment.id,
          subcontractor_id: subcontractorId
        }
      });

      if (notificationError) {
        console.error('Error sending job notification:', notificationError);
        toast({
          title: "Warning",
          description: "Job assigned but notification may not have been sent",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Job assigned and notification sent to contractor",
        });
      }

      fetchAssignments();
    } catch (error) {
      console.error('Error assigning job:', error);
      toast({
        title: "Error",
        description: "Failed to assign job",
        variant: "destructive",
      });
    }
  };

  const updateAssignmentStatus = async (assignmentId: string, status: 'accepted' | 'declined' | 'expired') => {
    try {
      const { error } = await supabase
        .from('subcontractor_job_assignments')
        .update({ 
          status,
          accepted_at: status === 'accepted' ? new Date().toISOString() : null,
          dropped_at: status === 'declined' ? new Date().toISOString() : null
        })
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Assignment marked as ${status}`,
      });

      fetchAssignments();
    } catch (error) {
      console.error('Error updating assignment status:', error);
      toast({
        title: "Error",
        description: "Failed to update assignment status",
        variant: "destructive",
      });
    }
  };

  const exportAssignmentData = async (periodStart: string, periodEnd: string) => {
    try {
      const { data, error } = await supabase
        .from('subcontractor_job_assignments')
        .select(`
          *,
          subcontractors:subcontractor_id (full_name, email),
          bookings:booking_id (service_address, scheduled_date, customer_name)
        `)
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error exporting assignment data:', error);
      toast({
        title: "Error",
        description: "Failed to export assignment data",
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  return {
    assignments,
    loading,
    refreshAssignments: fetchAssignments,
    assignJob,
    updateAssignmentStatus,
    exportAssignmentData
  };
}