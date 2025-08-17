import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface HubData {
  stats: {
    total: number;
    active: number;
    applications: number;
    unassignedJobs: number;
    alerts: number;
    avgRating: number;
  };
  subcontractors: any[];
  applications: any[];
  assignments: any[];
  analytics: any;
  notifications: any[];
}

export function useSubcontractorHub() {
  const [hubData, setHubData] = useState<HubData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchHubData = async () => {
    try {
      setLoading(true);
      
      // Call the database function to get comprehensive hub data
      const { data, error } = await supabase.rpc('get_subcontractor_hub_data');

      if (error) throw error;

      setHubData(data as unknown as HubData);
    } catch (error) {
      console.error('Error fetching hub data:', error);
      toast({
        title: "Error",
        description: "Failed to load subcontractor hub data",
        variant: "destructive",
      });
      
      // Fallback to basic data structure
      setHubData({
        stats: {
          total: 0,
          active: 0,
          applications: 0,
          unassignedJobs: 0,
          alerts: 0,
          avgRating: 0
        },
        subcontractors: [],
        applications: [],
        assignments: [],
        analytics: {},
        notifications: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHubData();
  }, []);

  const refreshData = () => {
    fetchHubData();
  };

  return {
    hubData,
    loading,
    refreshData
  };
}