import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  
  // Required fields
  bookingStep: 'service_selection' | 'service_details' | 'payment' | 'confirmation';
  webhookUrl: string;
  timestamp: string;
  source: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const bookingData: BookingWebhookData = await req.json();
    
    console.log('Processing booking webhook:', {
      step: bookingData.bookingStep,
      url: bookingData.webhookUrl,
      serviceType: bookingData.serviceType,
      timestamp: bookingData.timestamp
    });

    // Validate required fields
    if (!bookingData.webhookUrl) {
      throw new Error('Webhook URL is required');
    }

    if (!bookingData.bookingStep) {
      throw new Error('Booking step is required');
    }

    // Prepare webhook payload
    const webhookPayload = {
      ...bookingData,
      webhook_timestamp: new Date().toISOString(),
      webhook_source: 'bay_area_cleaning_pros_booking_system'
    };

    console.log('Sending webhook to:', bookingData.webhookUrl);

    // Send webhook to the provided URL
    const webhookResponse = await fetch(bookingData.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AlphaLux Cleaning/1.0'
      },
      body: JSON.stringify(webhookPayload)
    });

    const responseText = await webhookResponse.text();
    const isSuccess = webhookResponse.ok;

    // Initialize Supabase client for logging
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Log webhook interaction (async, don't block response)
    const logWebhookInteraction = async () => {
      try {
        const logData = {
          webhook_url: bookingData.webhookUrl,
          payload: webhookPayload,
          response_status: webhookResponse.status,
          response_body: responseText.substring(0, 1000), // Limit response body size
          booking_step: bookingData.bookingStep,
          service_type: bookingData.serviceType,
          customer_email: bookingData.customerInfo?.email,
          is_success: isSuccess,
          sent_at: new Date().toISOString()
        };

        await supabase.from('webhook_logs').insert(logData);
      } catch (logError) {
        console.error('Error logging webhook interaction:', logError);
      }
    };

    // Start logging in background
    logWebhookInteraction();

    if (isSuccess) {
      console.log('Webhook sent successfully:', {
        status: webhookResponse.status,
        step: bookingData.bookingStep
      });
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Booking webhook sent successfully',
        webhook_status: webhookResponse.status,
        booking_step: bookingData.bookingStep
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    } else {
      console.error('Webhook failed:', {
        status: webhookResponse.status,
        response: responseText,
        step: bookingData.bookingStep
      });
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Webhook delivery failed',
        webhook_status: webhookResponse.status,
        webhook_response: responseText,
        booking_step: bookingData.bookingStep
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 422
      });
    }

  } catch (error) {
    console.error('Error in send-booking-webhook function:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error',
      details: error.stack
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});