import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TierInfo {
  tier_level: number;
  tier_name: string;
  hourly_rate: number;
  monthly_fee: number;
  requirements: {
    reviews: number;
    jobs: number;
  };
}

export interface SubcontractorWithTier {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  is_available: boolean;
  review_count: number;
  completed_jobs_count: number;
  hourly_rate: number;
  monthly_fee: number;
  tier_level: number;
  subscription_status: string;
  user_id: string;
}

export function useSubcontractorTiers() {
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Dynamic tier definitions from database
  const [tierConfigs, setTierConfigs] = useState<any[]>([]);

  useEffect(() => {
    fetchTierConfigs();
  }, []);

  const fetchTierConfigs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tier_system_config')
        .select('*')
        .eq('is_active', true)
        .order('tier_level');
      
      if (error) throw error;
      setTierConfigs(data || []);
    } catch (error) {
      console.error('Error fetching tier configs:', error);
      toast({
        title: "Error",
        description: "Failed to load tier configurations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTierInfo = (tierLevel: number): TierInfo => {
    const config = tierConfigs.find(c => c.tier_level === tierLevel);
    if (config) {
      return {
        tier_level: config.tier_level,
        tier_name: config.tier_name,
        hourly_rate: config.hourly_rate,
        monthly_fee: config.monthly_fee,
        requirements: { 
          reviews: config.reviews_required, 
          jobs: config.jobs_required 
        }
      };
    }
    
    // Fallback to static definitions with updated rates
    switch (tierLevel) {
      case 4:
        return {
          tier_level: 4,
          tier_name: 'Premium',
          hourly_rate: 20.00,
          monthly_fee: 70.00,
          requirements: { reviews: 30, jobs: 40 }
        };
      case 3:
        return {
          tier_level: 3,
          tier_name: 'Elite',
          hourly_rate: 18.00,
          monthly_fee: 55.00,
          requirements: { reviews: 20, jobs: 25 }
        };
      case 2:
        return {
          tier_level: 2,
          tier_name: 'Professional',
          hourly_rate: 16.00,
          monthly_fee: 40.00,
          requirements: { reviews: 10, jobs: 15 }
        };
      default:
        return {
          tier_level: 1,
          tier_name: 'Standard',
          hourly_rate: 14.00,
          monthly_fee: 25.00,
          requirements: { reviews: 0, jobs: 0 }
        };
    }
  };

  const getAllTiers = (): TierInfo[] => {
    if (tierConfigs.length > 0) {
      return tierConfigs.map(config => getTierInfo(config.tier_level));
    }
    return [1, 2, 3, 4].map(level => getTierInfo(level));
  };

  const getNextTier = (currentLevel: number): TierInfo | null => {
    const nextLevel = currentLevel + 1;
    return nextLevel <= 4 ? getTierInfo(nextLevel) : null;
  };

  const canUpgradeToTier = (subcontractor: SubcontractorWithTier, targetTier: number): boolean => {
    const tierRequirements = getTierInfo(targetTier).requirements;
    return subcontractor.review_count >= tierRequirements.reviews && 
           subcontractor.completed_jobs_count >= tierRequirements.jobs;
  };

  const updateSubcontractorMetrics = async (subcontractorId: string, reviewCount: number, jobsCount: number) => {
    try {
      const { error } = await supabase
        .from('subcontractors')
        .update({
          review_count: reviewCount,
          completed_jobs_count: jobsCount
        })
        .eq('id', subcontractorId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subcontractor metrics updated successfully"
      });

      return true;
    } catch (error) {
      console.error('Error updating metrics:', error);
      toast({
        title: "Error",
        description: "Failed to update subcontractor metrics",
        variant: "destructive"
      });
      return false;
    }
  };

  const manuallyUpdateTier = async (subcontractorId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('update_subcontractor_tier', {
          p_subcontractor_id: subcontractorId
        });

      if (error) throw error;

      const result = data as any;
      if (result?.success) {
        toast({
          title: "Tier Updated",
          description: `Tier updated from ${result.old_tier} to ${result.new_tier}`
        });
        return result;
      } else {
        throw new Error(result?.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error updating tier:', error);
      toast({
        title: "Error",
        description: "Failed to update tier",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateHourlyRate = async (subcontractorId: string, hourlyRate: number) => {
    try {
      const { error } = await supabase
        .from('subcontractors')
        .update({ hourly_rate: hourlyRate })
        .eq('id', subcontractorId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Hourly rate updated successfully"
      });

      return true;
    } catch (error) {
      console.error('Error updating hourly rate:', error);
      toast({
        title: "Error",
        description: "Failed to update hourly rate",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    getTierInfo,
    getAllTiers,
    getNextTier,
    canUpgradeToTier,
    updateSubcontractorMetrics,
    manuallyUpdateTier,
    updateHourlyRate,
    loading
  };
}