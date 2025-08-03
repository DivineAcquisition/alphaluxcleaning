import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Subcontractor {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  is_available: boolean;
}

export function useSubcontractors() {
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubcontractors = async () => {
    try {
      const { data, error } = await supabase
        .from('subcontractors')
        .select('id, full_name, email, phone, is_available')
        .eq('is_available', true)
        .order('full_name');

      if (error) throw error;
      setSubcontractors(data || []);
    } catch (error) {
      console.error('Error fetching subcontractors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubcontractors();
  }, []);

  return { subcontractors, loading, refreshSubcontractors: fetchSubcontractors };
}