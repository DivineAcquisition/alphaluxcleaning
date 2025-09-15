import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Job {
  id: string;
  client: string;
  address: string;
  date: string;
  time: string;
  cleaner: string;
  status: string;
  checkIn?: string;
  checkOut?: string;
  booking_id?: string;
  assignment_id?: string;
}

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchJobs = async () => {
    try {
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          customer_name,
          service_address,
          service_date,
          service_time,
          status,
          subcontractor_job_assignments (
            id,
            status,
            subcontractor_id,
            subcontractors (
              full_name
            ),
            job_tracking (
              check_in_time,
              check_out_time
            )
          )
        `)
        .order('service_date', { ascending: false });

      if (bookingsError) throw bookingsError;

      const formattedJobs = bookingsData?.map(booking => ({
        id: booking.id,
        client: booking.customer_name || 'Unknown Client',
        address: booking.service_address || 'No address',
        date: new Date(booking.service_date).toLocaleDateString(),
        time: booking.service_time || 'Not scheduled',
        cleaner: booking.subcontractor_job_assignments?.[0]?.subcontractors?.full_name || 'Unassigned',
        status: booking.subcontractor_job_assignments?.[0]?.status || booking.status,
        checkIn: booking.subcontractor_job_assignments?.[0]?.job_tracking?.[0]?.check_in_time 
          ? new Date(booking.subcontractor_job_assignments[0].job_tracking[0].check_in_time).toLocaleTimeString() 
          : undefined,
        checkOut: booking.subcontractor_job_assignments?.[0]?.job_tracking?.[0]?.check_out_time 
          ? new Date(booking.subcontractor_job_assignments[0].job_tracking[0].check_out_time).toLocaleTimeString() 
          : undefined,
        booking_id: booking.id,
        assignment_id: booking.subcontractor_job_assignments?.[0]?.id
      })) || [];

      setJobs(formattedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch jobs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (jobId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', jobId);

      if (error) throw error;

      setJobs(jobs.map(job => 
        job.id === jobId ? { ...job, status: newStatus } : job
      ));

      toast({
        title: "Success",
        description: "Job status updated successfully"
      });
    } catch (error) {
      console.error('Error updating job status:', error);
      toast({
        title: "Error",
        description: "Failed to update job status",
        variant: "destructive"
      });
    }
  };

  const assignCleaner = async (jobId: string, subcontractorId: string) => {
    try {
      // First check if assignment already exists
      const { data: existingAssignment } = await supabase
        .from('subcontractor_job_assignments')
        .select('id')
        .eq('booking_id', jobId)
        .single();

      if (existingAssignment) {
        // Update existing assignment
        const { error } = await supabase
          .from('subcontractor_job_assignments')
          .update({ subcontractor_id: subcontractorId, status: 'assigned' })
          .eq('booking_id', jobId);
        
        if (error) throw error;
      } else {
        // Create new assignment
        const { error } = await supabase
          .from('subcontractor_job_assignments')
          .insert({
            booking_id: jobId,
            subcontractor_id: subcontractorId,
            status: 'assigned'
          });
        
        if (error) throw error;
      }

      await fetchJobs(); // Refresh the jobs list
      
      toast({
        title: "Success",
        description: "Cleaner assigned successfully"
      });
    } catch (error) {
      console.error('Error assigning cleaner:', error);
      toast({
        title: "Error",
        description: "Failed to assign cleaner",
        variant: "destructive"
      });
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.cleaner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchJobs();
  }, []);

  return {
    jobs: filteredJobs,
    loading,
    searchTerm,
    setSearchTerm,
    updateJobStatus,
    assignCleaner,
    refreshJobs: fetchJobs
  };
}