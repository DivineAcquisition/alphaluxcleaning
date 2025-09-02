import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Timesheet {
  id: string;
  job_id: string;
  contractor_id: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  hours_calc: number;
  notes_text?: string;
  evidence_urls: string[];
  status: 'submitted' | 'manager_review' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  job?: {
    service_type: string;
    client?: {
      name: string;
    };
  };
}

export interface CreateTimesheetData {
  job_id: string;
  contractor_id: string;
  start_time: string;
  end_time: string;
  break_minutes?: number;
  notes_text?: string;
  evidence_urls?: string[];
}

export function useTimesheets(contractorId?: string) {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTimesheets = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('timesheets')
        .select(`
          id,
          job_id,
          contractor_id,
          start_time,
          end_time,
          break_minutes,
          hours_calc,
          notes_text,
          evidence_urls,
          status,
          reviewed_by,
          reviewed_at,
          created_at,
          jobs:job_id (
            service_type,
            clients:client_id (
              name
            )
          )
        `);

      if (contractorId) {
        query = query.eq('contractor_id', contractorId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTimesheets: Timesheet[] = (data || []).map(timesheet => ({
        id: timesheet.id,
        job_id: timesheet.job_id,
        contractor_id: timesheet.contractor_id,
        start_time: timesheet.start_time,
        end_time: timesheet.end_time,
        break_minutes: timesheet.break_minutes,
        hours_calc: timesheet.hours_calc,
        notes_text: timesheet.notes_text,
        evidence_urls: timesheet.evidence_urls,
        status: timesheet.status,
        reviewed_by: timesheet.reviewed_by,
        reviewed_at: timesheet.reviewed_at,
        created_at: timesheet.created_at,
        job: timesheet.jobs ? {
          service_type: timesheet.jobs.service_type,
          client: timesheet.jobs.clients
        } : undefined
      }));

      setTimesheets(formattedTimesheets);
    } catch (error) {
      console.error('Error fetching timesheets:', error);
      toast({
        title: "Error",
        description: "Failed to load timesheets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTimesheet = async (data: CreateTimesheetData) => {
    try {
      const { error } = await supabase
        .from('timesheets')
        .insert({
          job_id: data.job_id,
          contractor_id: data.contractor_id,
          start_time: data.start_time,
          end_time: data.end_time,
          break_minutes: data.break_minutes || 0,
          notes_text: data.notes_text,
          evidence_urls: data.evidence_urls || [],
          status: 'submitted'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Timesheet submitted successfully",
      });

      fetchTimesheets(); // Refresh timesheets
    } catch (error) {
      console.error('Error creating timesheet:', error);
      toast({
        title: "Error",
        description: "Failed to submit timesheet",
        variant: "destructive",
      });
    }
  };

  const updateTimesheetStatus = async (timesheetId: string, status: 'approved' | 'rejected', reviewedBy: string) => {
    try {
      const { error } = await supabase
        .from('timesheets')
        .update({
          status,
          reviewed_by: reviewedBy,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', timesheetId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Timesheet ${status} successfully`,
      });

      fetchTimesheets(); // Refresh timesheets
    } catch (error) {
      console.error('Error updating timesheet status:', error);
      toast({
        title: "Error",
        description: `Failed to ${status} timesheet`,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchTimesheets();
  }, [contractorId]);

  return {
    timesheets,
    loading,
    refreshTimesheets: fetchTimesheets,
    createTimesheet,
    updateTimesheetStatus
  };
}