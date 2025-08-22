import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BookingWebhookData {
  // Service Selection Data
  homeSize?: string;
  serviceType?: string;
  frequency?: string;
  addOns?: string[];
  
  // Service Details
  serviceDate?: string;
  serviceTime?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  contactNumber?: string;
  specialInstructions?: string;
  
  // Customer Information
  customerInfo?: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  
  // Pricing Information
  basePrice?: number;
  addOnPrices?: { [key: string]: number };
  frequencyDiscount?: number;
  membershipDiscount?: number;
  referralDiscount?: number;
  totalPrice?: number;
  
  // Payment Information
  paymentType?: 'full' | 'half' | 'prepayment';
  paymentAmount?: number;
  
  // Recurring Information (if applicable)
  selectedTier?: string;
  selectedRecurring?: string;
  membership?: boolean;
  
  // Required fields
  bookingStep: 'service_selection' | 'service_details' | 'payment' | 'confirmation';
  webhookUrl?: string; // Now optional since we use configured URLs
  orderId?: string;
  bookingId?: string;
  sessionId?: string; // Add session ID for enhanced webhook lookup
}

export const useBookingWebhook = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // UUID validation helper
  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  const sendBookingWebhook = async (data: BookingWebhookData) => {
    const webhookStartTime = Date.now();
    setIsLoading(true);
    
    try {
      // Add timestamp and source to payload
      const payload = {
        ...data,
        timestamp: new Date().toISOString(),
        source: 'booking_flow'
      };

      // Choose webhook function based on orderId validity
      const functionName = (data.orderId && isValidUUID(data.orderId)) 
        ? 'enhanced-booking-webhook-v2' 
        : 'send-booking-transaction-to-zapier';

      console.log('🚀 useBookingWebhook: Sending webhook', {
        step: data.bookingStep,
        function: functionName,
        order_id: data.orderId,
        session_id: data.sessionId,
        has_valid_order_id: !!(data.orderId && isValidUUID(data.orderId)),
        timestamp: new Date().toISOString()
      });

      const { data: result, error } = await supabase.functions.invoke(functionName, {
        body: data.orderId ? {
          ...payload,
          trigger_event: data.bookingStep,
          order_id: data.orderId,
          booking_id: data.bookingId,
          session_id: data.sessionId
        } : {
          transactionData: payload,
          type: 'booking_step'
        }
      });

      const webhookTime = Date.now() - webhookStartTime;
      
      if (error) {
        console.error('❌ useBookingWebhook: Webhook failed', {
          step: data.bookingStep,
          function: functionName,
          error: error.message,
          time_ms: webhookTime
        });
        throw error;
      }

      console.log('✅ useBookingWebhook: Webhook succeeded', {
        step: data.bookingStep,
        function: functionName,
        time_ms: webhookTime,
        result_success: result?.success,
        webhooks_sent: result?.results?.length || 0,
        processing_stats: result?.processing_stats
      });

      // Only show toast for confirmation step to avoid spam
      if (data.bookingStep === 'confirmation') {
        toast({
          title: "Booking confirmed",
          description: "Your service has been scheduled successfully.",
        });
      }

      return result;
    } catch (error) {
      const webhookTime = Date.now() - webhookStartTime;
      console.error('🚨 useBookingWebhook: Critical error', {
        step: data.bookingStep,
        error: error.message,
        time_ms: webhookTime,
        order_id: data.orderId
      });
      
      // Only show error toast for confirmation step
      if (data.bookingStep === 'confirmation') {
        toast({
          title: "Booking confirmed",
          description: "Your service has been scheduled (notification processing).",
          variant: "default"
        });
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendBookingWebhook,
    isLoading
  };
};