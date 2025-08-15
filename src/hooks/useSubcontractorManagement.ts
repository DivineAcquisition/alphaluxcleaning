import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EnhancedSubcontractor {
  id: string;
  user_id?: string;
  full_name: string;
  email: string;
  phone: string;
  is_available: boolean;
  rating: number;
  tier_level: number;
  subscription_status: string;
  created_at: string;
  last_activity?: string;
  account_status: 'active' | 'suspended' | 'banned';
  jobsCompleted: number;
  city?: string;
  state?: string;
  split_tier?: string;
}

export interface UserAction {
  id: string;
  subcontractor_id: string;
  action_type: 'suspend' | 'unsuspend' | 'ban' | 'email_sent' | 'tier_change' | 'restriction_added';
  reason: string;
  performed_by: string;
  performed_at: string;
  details?: any;
}

export function useSubcontractorManagement() {
  const [subcontractors, setSubcontractors] = useState<EnhancedSubcontractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionHistory, setActionHistory] = useState<UserAction[]>([]);
  const { toast } = useToast();

  const fetchSubcontractors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subcontractors')
        .select(`
          id, user_id, full_name, email, phone, is_available, rating,
          tier_level, subscription_status, created_at, city, state, split_tier,
          review_count, completed_jobs_count
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enhance with job completion counts and account status
      const enhancedData = await Promise.all(
        (data || []).map(async (sub) => {
          const { count: jobsCompleted } = await supabase
            .from('subcontractor_job_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('subcontractor_id', sub.id)
            .eq('status', 'completed');

          return {
            ...sub,
            jobsCompleted: jobsCompleted || 0,
            account_status: 'active' as const, // Default to active, would be determined by restrictions table
          };
        })
      );

      setSubcontractors(enhancedData);
    } catch (error) {
      console.error('Error fetching subcontractors:', error);
      toast({
        title: "Error",
        description: "Failed to load subcontractors",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const suspendAccount = async (subcontractorId: string, reason: string, endDate?: Date) => {
    try {
      const { error } = await supabase
        .from('subcontractor_restrictions')
        .insert({
          subcontractor_id: subcontractorId,
          reason: reason,
          restriction_type: 'account_suspension',
          end_date: endDate?.toISOString(),
          is_active: true
        });

      if (error) throw error;

      // Update local state
      setSubcontractors(prev => prev.map(sub => 
        sub.id === subcontractorId ? { ...sub, account_status: 'suspended' } : sub
      ));

      toast({
        title: "Account Suspended",
        description: "Subcontractor account has been suspended"
      });

      await fetchSubcontractors(); // Refresh data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to suspend account",
        variant: "destructive"
      });
    }
  };

  const unsuspendAccount = async (subcontractorId: string) => {
    try {
      const { error } = await supabase
        .from('subcontractor_restrictions')
        .update({ is_active: false })
        .eq('subcontractor_id', subcontractorId)
        .eq('restriction_type', 'account_suspension');

      if (error) throw error;

      setSubcontractors(prev => prev.map(sub => 
        sub.id === subcontractorId ? { ...sub, account_status: 'active' } : sub
      ));

      toast({
        title: "Account Reactivated",
        description: "Subcontractor account has been reactivated"
      });

      await fetchSubcontractors();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reactivate account",
        variant: "destructive"
      });
    }
  };

  const banAccount = async (subcontractorId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('subcontractor_restrictions')
        .insert({
          subcontractor_id: subcontractorId,
          reason: reason,
          restriction_type: 'permanent_ban',
          is_active: true
        });

      if (error) throw error;

      setSubcontractors(prev => prev.map(sub => 
        sub.id === subcontractorId ? { ...sub, account_status: 'banned' } : sub
      ));

      toast({
        title: "Account Banned",
        description: "Subcontractor account has been permanently banned"
      });

      await fetchSubcontractors();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to ban account",
        variant: "destructive"
      });
    }
  };

  const forcePasswordReset = async (subcontractorId: string) => {
    try {
      const subcontractor = subcontractors.find(s => s.id === subcontractorId);
      if (!subcontractor?.email) {
        throw new Error('Subcontractor email not found');
      }

      const { error } = await supabase.functions.invoke('send-password-reset', {
        body: { email: subcontractor.email }
      });

      if (error) throw error;

      toast({
        title: "Password Reset Sent",
        description: "Password reset email has been sent to the subcontractor"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send password reset",
        variant: "destructive"
      });
    }
  };

  const sendCustomEmail = async (subcontractorIds: string[], subject: string, message: string) => {
    try {
      const selectedSubcontractors = subcontractors.filter(s => subcontractorIds.includes(s.id));
      
      const { error } = await supabase.functions.invoke('send-custom-message', {
        body: {
          recipients: selectedSubcontractors.map(s => ({ email: s.email, name: s.full_name })),
          subject,
          message,
          type: 'email'
        }
      });

      if (error) throw error;

      toast({
        title: "Emails Sent",
        description: `Custom email sent to ${subcontractorIds.length} subcontractors`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send emails",
        variant: "destructive"
      });
    }
  };

  const exportSubcontractorData = async (subcontractorIds?: string[]) => {
    try {
      const dataToExport = subcontractorIds 
        ? subcontractors.filter(s => subcontractorIds.includes(s.id))
        : subcontractors;

      const csvContent = [
        // CSV Headers
        ['Name', 'Email', 'Phone', 'Tier', 'Rating', 'Jobs Completed', 'Status', 'Location'].join(','),
        // CSV Data
        ...dataToExport.map(sub => [
          sub.full_name,
          sub.email,
          sub.phone,
          sub.tier_level,
          sub.rating,
          sub.jobsCompleted,
          sub.account_status,
          `${sub.city || ''}, ${sub.state || ''}`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subcontractors-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Subcontractor data has been exported to CSV"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchSubcontractors();
  }, []);

  return {
    subcontractors,
    loading,
    actionHistory,
    suspendAccount,
    unsuspendAccount,
    banAccount,
    forcePasswordReset,
    sendCustomEmail,
    exportSubcontractorData,
    refreshData: fetchSubcontractors
  };
}