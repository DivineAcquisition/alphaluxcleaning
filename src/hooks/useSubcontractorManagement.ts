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
  account_status: 'active' | 'suspended' | 'banned' | 'pending';
  jobsCompleted: number;
  city?: string;
  state?: string;
  split_tier?: string;
  type: 'application' | 'subcontractor';
  status?: 'pending' | 'approved' | 'rejected';
  hourly_rate?: number;
  monthly_fee?: number;
  review_count?: number;
  completed_jobs_count?: number;
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
      
      // Fetch active subcontractors
      const { data: subcontractorData, error: subError } = await supabase
        .from('subcontractors')
        .select(`
          id, user_id, full_name, email, phone, is_available, rating,
          tier_level, subscription_status, created_at, city, state, split_tier,
          review_count, completed_jobs_count, hourly_rate, monthly_fee
        `)
        .order('created_at', { ascending: false });

      if (subError) throw subError;

      // Fetch approved applications (pending onboarding)
      const { data: applicationData, error: appError } = await supabase
        .from('subcontractor_applications')
        .select(`
          id, full_name, email, phone, city, state, created_at,
          status
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (appError) throw appError;

      // Enhance subcontractors with job completion counts
      const enhancedSubcontractors = await Promise.all(
        (subcontractorData || []).map(async (sub) => {
          const { count: jobsCompleted } = await supabase
            .from('subcontractor_job_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('subcontractor_id', sub.id)
            .eq('status', 'completed');

          return {
            ...sub,
            jobsCompleted: jobsCompleted || 0,
            account_status: sub.is_available ? 'active' as const : 'suspended' as const,
            type: 'subcontractor' as const
          };
        })
      );

      // Transform applications to match interface
      const enhancedApplications = (applicationData || []).map(app => ({
        ...app,
        user_id: undefined,
        is_available: false,
        rating: 5.0,
        tier_level: 2, // Default to Professional tier
        subscription_status: 'pending',
        last_activity: undefined,
        account_status: 'pending' as const,
        jobsCompleted: 0,
        split_tier: undefined,
        type: 'application' as const,
        hourly_rate: 18.00,
        monthly_fee: 50.00,
        review_count: 0,
        completed_jobs_count: 0,
        status: app.status as 'pending' | 'approved' | 'rejected'
      }));

      // Combine both datasets
      const allData = [...enhancedSubcontractors, ...enhancedApplications];
      setSubcontractors(allData);
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

  const completeOnboarding = async (applicationId: string) => {
    try {
      const response = await supabase.functions.invoke('complete-subcontractor-onboarding', {
        body: { applicationId }
      });

      if (response.error) throw response.error;

      toast({
        title: "Success",
        description: "Subcontractor onboarding completed successfully",
      });

      await fetchSubcontractors();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: "Error",
        description: "Failed to complete onboarding",
        variant: "destructive",
      });
    }
  };

  const updateTier = async (subcontractorId: string, newTier: number, reason: string) => {
    try {
      // Get tier config
      const { data: tierConfig } = await supabase
        .from('tier_system_config')
        .select('*')
        .eq('tier_level', newTier)
        .single();

      if (!tierConfig) throw new Error('Invalid tier level');

      // Get current tier for logging
      const currentSub = subcontractors.find(s => s.id === subcontractorId);

      // Update subcontractor tier
      const { error: updateError } = await supabase
        .from('subcontractors')
        .update({
          tier_level: newTier,
          hourly_rate: tierConfig.hourly_rate,
          monthly_fee: tierConfig.monthly_fee
        })
        .eq('id', subcontractorId);

      if (updateError) throw updateError;

      // Log the tier change
      const { error: logError } = await supabase
        .from('tier_change_history')
        .insert({
          subcontractor_id: subcontractorId,
          old_tier: currentSub?.tier_level,
          new_tier: newTier,
          change_reason: reason,
          automatic: false
        });

      if (logError) throw logError;

      toast({
        title: "Success",
        description: "Tier updated successfully",
      });

      await fetchSubcontractors();
    } catch (error) {
      console.error('Error updating tier:', error);
      toast({
        title: "Error",
        description: "Failed to update tier",
        variant: "destructive",
      });
    }
  };

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
    completeOnboarding,
    updateTier,
    refreshSubcontractors: fetchSubcontractors
  };
}