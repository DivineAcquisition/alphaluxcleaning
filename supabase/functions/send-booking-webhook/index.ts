import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  
  // Additional Metadata
  timestamp: string;
  source: string;
  bookingStep: 'service_selection' | 'service_details' | 'payment' | 'confirmation';
  webhookUrl: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const bookingData: BookingWebhookData = await req.json();
    
    console.log('Received booking webhook request:', {
      step: bookingData.bookingStep,
      serviceType: bookingData.serviceType,
      customerEmail: bookingData.customerInfo?.email,
      webhookUrl: bookingData.webhookUrl ? 'provided' : 'missing'
    });

    if (!bookingData.webhookUrl) {
      throw new Error('Webhook URL is required');
    }

    // Prepare webhook payload
    const webhookPayload = {
      event_type: 'booking_data',
      booking_step: bookingData.bookingStep,
      timestamp: bookingData.timestamp,
      source: bookingData.source || 'bay_area_cleaning_pros',
      data: {
        // Service Information
        service: {
          homeSize: bookingData.homeSize,
          serviceType: bookingData.serviceType,
          frequency: bookingData.frequency,
          addOns: bookingData.addOns || [],
          serviceDate: bookingData.serviceDate,
          serviceTime: bookingData.serviceTime,
          specialInstructions: bookingData.specialInstructions
        },
        
        // Customer Information
        customer: bookingData.customerInfo ? {
          name: bookingData.customerInfo.name,
          email: bookingData.customerInfo.email,
          phone: bookingData.customerInfo.phone,
          address: {
            street: bookingData.address?.street || bookingData.customerInfo.address,
            city: bookingData.address?.city || bookingData.customerInfo.city,
            state: bookingData.address?.state || bookingData.customerInfo.state,
            zipCode: bookingData.address?.zipCode || bookingData.customerInfo.zipCode
          }
        } : null,
        
        // Pricing Information
        pricing: {
          basePrice: bookingData.basePrice,
          addOnPrices: bookingData.addOnPrices,
          frequencyDiscount: bookingData.frequencyDiscount,
          membershipDiscount: bookingData.membershipDiscount,
          referralDiscount: bookingData.referralDiscount,
          totalPrice: bookingData.totalPrice,
          paymentType: bookingData.paymentType,
          paymentAmount: bookingData.paymentAmount
        },
        
        // Additional Service Details
        recurring: {
          selectedTier: bookingData.selectedTier,
          selectedRecurring: bookingData.selectedRecurring,
          membership: bookingData.membership
        }
      }
    };

    // Send to webhook
    console.log('Sending data to webhook:', bookingData.webhookUrl);
    
    const webhookResponse = await fetch(bookingData.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'BayAreaCleaningPros-Webhook/1.0'
      },
      body: JSON.stringify(webhookPayload)
    });

    // Log the webhook attempt (don't wait for completion)
    const logPromise = supabase.from('webhook_logs').insert({
      webhook_url: bookingData.webhookUrl,
      payload: webhookPayload,
      response_status: webhookResponse.status,
      booking_step: bookingData.bookingStep,
      customer_email: bookingData.customerInfo?.email,
      sent_at: new Date().toISOString()
    });

    // Don't wait for log insertion to complete
    logPromise.catch(error => {
      console.error('Failed to log webhook attempt:', error);
    });

    if (!webhookResponse.ok) {
      console.error('Webhook failed:', {
        status: webhookResponse.status,
        statusText: webhookResponse.statusText
      });
      
      throw new Error(`Webhook failed with status: ${webhookResponse.status}`);
    }

    console.log('Webhook sent successfully:', {
      status: webhookResponse.status,
      step: bookingData.bookingStep
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Booking data sent to webhook successfully',
        webhook_status: webhookResponse.status,
        booking_step: bookingData.bookingStep
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error sending booking webhook:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to send booking data to webhook'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});