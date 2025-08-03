import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CustomerFeedback {
  id: string;
  customer_name: string;
  customer_email: string;
  booking_id?: string;
  subcontractor_id?: string;
  feedback_text?: string;
  overall_rating?: number;
  cleanliness_rating?: number;
  timeliness_rating?: number;
  professionalism_rating?: number;
  category: string;
  status: string;
  photos?: any;
  response_text?: string;
  responded_by?: string;
  responded_at?: string;
  created_at: string;
  subcontractor?: {
    full_name: string;
  };
  booking?: {
    service_date: string;
  };
}

export function useCustomerFeedback() {
  const [feedback, setFeedback] = useState<CustomerFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_feedback')
        .select(`
          *,
          subcontractor:subcontractors(full_name),
          booking:bookings(service_date)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedback((data || []).map(item => ({
        ...item,
        photos: Array.isArray(item.photos) ? item.photos : []
      })));
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast({
        title: "Error",
        description: "Failed to load customer feedback",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFeedbackStatus = async (feedbackId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('customer_feedback')
        .update({ status: newStatus })
        .eq('id', feedbackId);

      if (error) throw error;

      setFeedback(prev => prev.map(item => 
        item.id === feedbackId ? { ...item, status: newStatus } : item
      ));

      toast({
        title: "Success",
        description: "Feedback status updated successfully"
      });
    } catch (error) {
      console.error('Error updating feedback status:', error);
      toast({
        title: "Error",
        description: "Failed to update feedback status",
        variant: "destructive"
      });
    }
  };

  const respondToFeedback = async (feedbackId: string, responseText: string) => {
    try {
      const { error } = await supabase
        .from('customer_feedback')
        .update({ 
          response_text: responseText,
          status: 'acknowledged',
          responded_at: new Date().toISOString()
        })
        .eq('id', feedbackId);

      if (error) throw error;

      setFeedback(prev => prev.map(item => 
        item.id === feedbackId 
          ? { ...item, response_text: responseText, status: 'acknowledged', responded_at: new Date().toISOString() }
          : item
      ));

      toast({
        title: "Success",
        description: "Response sent successfully"
      });
    } catch (error) {
      console.error('Error responding to feedback:', error);
      toast({
        title: "Error",
        description: "Failed to send response",
        variant: "destructive"
      });
    }
  };

  const filteredFeedback = feedback.filter(item =>
    item.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.subcontractor?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.feedback_text?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchFeedback();
  }, []);

  return {
    feedback: filteredFeedback,
    loading,
    searchTerm,
    setSearchTerm,
    updateFeedbackStatus,
    respondToFeedback,
    refreshFeedback: fetchFeedback
  };
}