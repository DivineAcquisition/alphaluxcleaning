import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ContractorJob {
  id: string;
  service_type: string;
  scheduled_start: string;
  scheduled_end: string;
  location_json: any;
  instructions_text?: string;
  status: 'draft' | 'awaiting_acceptance' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  pricing_model: 'hourly' | 'flat';
  price_quote: number;
  client?: {
    name: string;
    contact_json: any;
    address_json: any;
  };
  assignment?: {
    id: string;
    acceptance_status: 'pending' | 'accepted' | 'declined' | 'expired';
    acceptance_at?: string;
    pay_override_type?: string;
    pay_override_value?: number;
  };
}

export function useContractorJobs(contractorId?: string) {
  const [jobs, setJobs] = useState<ContractorJob[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchJobs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('jobs')
        .select(`
          id,
          service_type,
          scheduled_start,
          scheduled_end,
          location_json,
          instructions_text,
          status,
          pricing_model,
          price_quote,
          clients:client_id (
            name,
            contact_json,
            address_json
          ),
          job_assignments!inner (
            id,
            acceptance_status,
            acceptance_at,
            pay_override_type,
            pay_override_value
          )
        `);

      if (contractorId) {
        query = query.eq('job_assignments.contractor_id', contractorId);
      }

      const { data, error } = await query.order('scheduled_start', { ascending: true });

      if (error) throw error;

      const formattedJobs: ContractorJob[] = (data || []).map(job => ({
        id: job.id,
        service_type: job.service_type,
        scheduled_start: job.scheduled_start,
        scheduled_end: job.scheduled_end,
        location_json: job.location_json,
        instructions_text: job.instructions_text,
        status: job.status,
        pricing_model: job.pricing_model,
        price_quote: job.price_quote,
        client: job.clients,
        assignment: job.job_assignments[0]
      }));

      setJobs(formattedJobs);
    } catch (error) {
      console.error('Error fetching contractor jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load jobs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const respondToAssignment = async (assignmentId: string, response: 'accept' | 'decline') => {
    try {
      const { error } = await supabase
        .from('job_assignments')
        .update({
          acceptance_status: response === 'accept' ? 'accepted' : 'declined',
          acceptance_at: new Date().toISOString()
        })
        .eq('id', assignmentId);

      if (error) throw error;

      // Update job status if accepted
      if (response === 'accept') {
        const assignment = jobs.find(j => j.assignment?.id === assignmentId);
        if (assignment) {
          await supabase
            .from('jobs')
            .update({ status: 'assigned' })
            .eq('id', assignment.id);
        }
      }

      toast({
        title: "Success",
        description: `Assignment ${response}ed successfully`,
      });

      fetchJobs(); // Refresh jobs
    } catch (error) {
      console.error('Error responding to assignment:', error);
      toast({
        title: "Error",
        description: `Failed to ${response} assignment`,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [contractorId]);

  return {
    jobs,
    loading,
    refreshJobs: fetchJobs,
    respondToAssignment
  };
}