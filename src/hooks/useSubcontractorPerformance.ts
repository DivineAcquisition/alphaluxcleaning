import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubcontractorPerformance {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  is_available: boolean;
  rating: number;
  totalReviews: number;
  complaints: number;
  jobsCompleted: number;
  trend: 'up' | 'down' | 'stable';
}

export function useSubcontractorPerformance() {
  const [performance, setPerformance] = useState<SubcontractorPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPerformance = async () => {
    try {
      // Get subcontractors with their performance data
      const { data: subcontractors, error: subError } = await supabase
        .from('subcontractors')
        .select('id, full_name, email, phone, is_available, rating');

      if (subError) throw subError;

      // Get feedback counts for each subcontractor
      const performanceData = await Promise.all(
        (subcontractors || []).map(async (sub) => {
          // Get total reviews
          const { count: totalReviews } = await supabase
            .from('customer_feedback')
            .select('*', { count: 'exact', head: true })
            .eq('subcontractor_id', sub.id);

          // Get complaints
          const { count: complaints } = await supabase
            .from('customer_feedback')
            .select('*', { count: 'exact', head: true })
            .eq('subcontractor_id', sub.id)
            .eq('category', 'complaint');

          // Get completed jobs
          const { count: jobsCompleted } = await supabase
            .from('subcontractor_job_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('subcontractor_id', sub.id)
            .eq('status', 'completed');

          // Simple trend calculation based on complaints ratio
          const complaintRatio = totalReviews ? complaints / totalReviews : 0;
          const trend: 'up' | 'down' | 'stable' = complaintRatio < 0.1 ? 'up' : complaintRatio > 0.2 ? 'down' : 'stable';

          return {
            ...sub,
            totalReviews: totalReviews || 0,
            complaints: complaints || 0,
            jobsCompleted: jobsCompleted || 0,
            trend
          };
        })
      );

      setPerformance(performanceData);
    } catch (error) {
      console.error('Error fetching performance data:', error);
      toast({
        title: "Error",
        description: "Failed to load performance data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const flagSubcontractor = async (subcontractorId: string, reason: string) => {
    try {
      // Create an incident for flagging
      const { error } = await supabase
        .from('incidents')
        .insert({
          subcontractor_id: subcontractorId,
          incident_type: 'performance_flag',
          description: reason,
          incident_date: new Date().toISOString(),
          severity: 'medium',
          status: 'open'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subcontractor has been flagged for review"
      });
    } catch (error) {
      console.error('Error flagging subcontractor:', error);
      toast({
        title: "Error",
        description: "Failed to flag subcontractor",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  return {
    performance,
    loading,
    flagSubcontractor,
    refreshPerformance: fetchPerformance
  };
}