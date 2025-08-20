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
}

export const useBookingWebhook = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendBookingWebhook = async (data: BookingWebhookData) => {
    setIsLoading(true);
    
    try {
      const webhookData = {
        ...data,
        timestamp: new Date().toISOString(),
        source: 'bay_area_cleaning_pros_website'
      };

      console.log('Sending booking webhook for step:', data.bookingStep, {
        serviceType: data.serviceType,
        customerEmail: data.customerInfo?.email,
        totalPrice: data.totalPrice
      });

      // Use the new enhanced webhook function that handles configured URLs
      const { data: response, error } = await supabase.functions.invoke('enhanced-booking-webhook', {
        body: webhookData
      });

      if (error) {
        throw error;
      }

      console.log('Booking webhook sent successfully:', response);
      
      // Don't show toast for every webhook call to avoid spam
      if (data.bookingStep === 'confirmation') {
        toast({
          title: "Booking Data Sent",
          description: "Your booking information has been sent to configured webhooks.",
        });
      }

      return response;
      
    } catch (error) {
      console.error('Error sending booking webhook:', error);
      
      // Only show error toast for final step to avoid spam
      if (data.bookingStep === 'confirmation') {
        toast({
          title: "Webhook Error",
          description: "Failed to send booking data to webhook. Please check your webhook configuration.",
          variant: "destructive",
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