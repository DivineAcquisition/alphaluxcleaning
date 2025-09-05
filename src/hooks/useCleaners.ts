import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Cleaner {
  id: string;
  name: string;
  phone?: string;
  email: string;
  status: string;
  pay_value: number;
  rating: number;
  user_id?: string;
  created_at: string;
  updated_at: string;
  company_id: string;
}

export function useCleaners() {
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCleaners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cleaners')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setCleaners(data || []);
    } catch (error) {
      console.error('Error fetching cleaners:', error);
      toast({
        title: "Error",
        description: "Failed to load cleaners",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCleaners();
  }, []);

  return {
    cleaners,
    loading,
    refreshCleaners: fetchCleaners
  };
}