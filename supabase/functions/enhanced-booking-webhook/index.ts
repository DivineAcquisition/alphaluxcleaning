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
  orderId?: string;
  bookingId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const bookingData: BookingWebhookData = await req.json();
    
    console.log('Processing enhanced booking webhook:', {
      step: bookingData.bookingStep,
      serviceType: bookingData.serviceType,
      orderId: bookingData.orderId,
      bookingId: bookingData.bookingId
    });

    // Get active webhook configurations
    const { data: webhookConfigs, error: configError } = await supabase
      .from('webhook_configurations')
      .select('*')
      .eq('is_active', true);

    if (configError) {
      console.error('Error fetching webhook configs:', configError);
      throw new Error('Failed to fetch webhook configurations');
    }

    if (!webhookConfigs || webhookConfigs.length === 0) {
      console.log('No active webhook configurations found');
      return new Response(JSON.stringify({
        success: true,
        message: 'No active webhook configurations - data logged but not sent'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    const results = [];

    // Send webhook to each configured endpoint
    for (const config of webhookConfigs) {
      // Check if this event type is enabled for this config
      if (!config.webhook_events.includes('booking_created') && 
          !config.webhook_events.includes('booking_updated')) {
        continue;
      }

      const webhookPayload = {
        ...bookingData,
        webhook_timestamp: new Date().toISOString(),
        webhook_source: 'bay_area_cleaning_pros_booking_system',
        config_id: config.id
      };

      console.log('Sending webhook to:', config.webhook_url);

      let webhookResponse;
      let responseText = '';
      let isSuccess = false;

      try {
        webhookResponse = await fetch(config.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'BayAreaCleaningPros/1.0'
          },
          body: JSON.stringify(webhookPayload)
        });

        responseText = await webhookResponse.text();
        isSuccess = webhookResponse.ok;

        console.log(`Webhook ${isSuccess ? 'succeeded' : 'failed'}:`, {
          status: webhookResponse.status,
          url: config.webhook_url
        });

      } catch (fetchError) {
        console.error('Webhook fetch error:', fetchError);
        responseText = fetchError.message;
        isSuccess = false;
      }

      // Log webhook delivery
      const logData = {
        webhook_config_id: config.id,
        webhook_url: config.webhook_url,
        event_type: bookingData.bookingStep === 'confirmation' ? 'booking_created' : 'booking_updated',
        payload: webhookPayload,
        response_status: webhookResponse?.status || null,
        response_body: responseText.substring(0, 1000), // Limit response body size
        is_success: isSuccess,
        error_message: isSuccess ? null : responseText.substring(0, 500)
      };

      const { error: logError } = await supabase
        .from('webhook_delivery_logs')
        .insert(logData);

      if (logError) {
        console.error('Error logging webhook delivery:', logError);
      }

      results.push({
        config_id: config.id,
        webhook_url: config.webhook_url,
        success: isSuccess,
        status: webhookResponse?.status || null,
        error: isSuccess ? null : responseText
      });
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    return new Response(JSON.stringify({
      success: true,
      message: `Webhook delivery completed: ${successCount}/${totalCount} successful`,
      results: results,
      booking_step: bookingData.bookingStep
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error in enhanced-booking-webhook function:', error);
    
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