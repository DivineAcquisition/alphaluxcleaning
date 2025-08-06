import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useAutomatedTierProgression() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const processSubcontractorTier = async (subcontractorId: string) => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('automated-tier-progression', {
        body: { subcontractorId }
      });

      if (error) throw error;

      if (data.tierChanged) {
        toast({
          title: "Tier Updated",
          description: `Subcontractor tier updated from ${data.previousTier} to ${data.newTier}`,
        });
      } else {
        toast({
          title: "No Change",
          description: "Subcontractor tier is already optimal",
        });
      }

      return data;
    } catch (error) {
      console.error('Error processing tier:', error);
      toast({
        title: "Error",
        description: "Failed to process tier progression",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const processAllSubcontractors = async (forceCheck = false) => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('automated-tier-progression', {
        body: { forceCheck }
      });

      if (error) throw error;

      toast({
        title: "Bulk Processing Complete",
        description: `Processed ${data.processed} subcontractors`,
      });

      return data;
    } catch (error) {
      console.error('Error processing all tiers:', error);
      toast({
        title: "Error",
        description: "Failed to process all subcontractor tiers",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerPaymentProcessing = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhanced-payment-processor', {
        body: { processType: 'monthly_fees' }
      });

      if (error) throw error;

      toast({
        title: "Payment Processing Complete",
        description: `Processed ${data.processed} payments`,
      });

      return data;
    } catch (error) {
      console.error('Error processing payments:', error);
      toast({
        title: "Error",
        description: "Failed to process payments",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processSubcontractorTier,
    processAllSubcontractors,
    triggerPaymentProcessing,
    isProcessing
  };
}