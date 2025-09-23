import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PaymentPreloadData {
  clientSecret: string | null;
  paymentIntentId: string | null;
  isLoading: boolean;
  error: string | null;
  isReady: boolean;
}

export interface PreloadPaymentParams {
  fullAmount: number;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  pricingData: any;
  schedulingData: any;
  shouldPreload: boolean;
}

/**
 * Hook for preloading payment intents to eliminate form loading delays
 * Creates PaymentIntent in background as soon as user data is ready
 */
export const usePreloadedPayment = ({
  fullAmount,
  customerInfo,
  pricingData,
  schedulingData,
  shouldPreload
}: PreloadPaymentParams): PaymentPreloadData & { 
  createPaymentIntent: () => Promise<void>;
  clearPayment: () => void;
} => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearPayment = useCallback(() => {
    setClientSecret(null);
    setPaymentIntentId(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const createPaymentIntent = useCallback(async () => {
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      return; // Wait for complete customer info
    }

    if (fullAmount <= 0) {
      return; // Wait for valid pricing
    }

    if (!pricingData.cleaningType) {
      return; // Wait for service selection
    }

    // Don't create duplicate payment intents
    if (clientSecret || isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🚀 Preloading payment intent with data:', {
        fullAmount,
        payment_type: 'deposit_20',
        customerEmail: customerInfo.email,
        customerName: customerInfo.name
      });

      const { data, error: paymentError } = await supabase.functions.invoke('create-payment', {
        body: {
          fullAmount,
          booking_data: {
            serviceType: pricingData.cleaningType,
            homeSize: String(pricingData.squareFootage || ''),
            frequency: pricingData.frequency,
            addOns: pricingData.addOns,
            serviceDate: schedulingData?.scheduledDate || '',
            serviceTime: schedulingData?.scheduledTime || '',
            totalPrice: fullAmount,
            customerName: customerInfo.name,
            customerEmail: customerInfo.email,
          },
          customerEmail: customerInfo.email,
          customerName: customerInfo.name,
          payment_type: 'deposit_20'
        }
      });

      if (paymentError) {
        console.error('❌ Payment intent preload failed:', paymentError);
        throw new Error(`Payment preload failed: ${paymentError.message}`);
      }

      if (!data?.clientSecret) {
        console.error('❌ No client secret in preload response:', data);
        throw new Error('Failed to preload payment - no client secret received.');
      }

      console.log('✅ Payment intent preloaded successfully');
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId || null);
      
    } catch (err: any) {
      console.error('❌ Payment preload error:', err);
      setError(err.message || 'Failed to preload payment');
      // Don't show error toast for background preloading
    } finally {
      setIsLoading(false);
    }
  }, [fullAmount, customerInfo, pricingData, schedulingData, clientSecret, isLoading]);

  // Auto-preload when conditions are met
  useEffect(() => {
    if (shouldPreload && !clientSecret && !isLoading && !error) {
      // Small delay to avoid creating too many requests
      const timer = setTimeout(() => {
        createPaymentIntent();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [shouldPreload, createPaymentIntent, clientSecret, isLoading, error]);

  const isReady = Boolean(clientSecret && !isLoading && !error);

  return {
    clientSecret,
    paymentIntentId,
    isLoading,
    error,
    isReady,
    createPaymentIntent,
    clearPayment
  };
};