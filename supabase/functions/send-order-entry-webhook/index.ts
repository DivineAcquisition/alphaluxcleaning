import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderEntryWebhookData {
  assignment_id?: string;
  booking_id?: string;
  order_id?: string;
  webhook_url?: string;
  comprehensive_data?: any; // New field for comprehensive booking data
}

interface GHLFormattedPayload {
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address1: string;
    city: string;
    state: string;
    postalCode: string;
  };
  service: {
    serviceType: string;
    homeSize: string;
    frequency: string;
    flooringType: string;
    addOns: string[];
    serviceDate: string;
    serviceTime: string;
    serviceDateTime: string;
  };
  pricing: {
    basePrice: number;
    addOnsPrice: number;
    subtotal: number;
    globalDiscountPercent: number;
    globalDiscountAmount: number;
    frequencyDiscountPercent: number;
    frequencyDiscountAmount: number;
    membershipDiscountPercent: number;
    membershipDiscountAmount: number;
    referralDiscountPercent: number;
    referralDiscountAmount: number;
    promoDiscountPercent: number;
    promoDiscountAmount: number;
    totalDiscounts: number;
    finalTotal: number;
    totalSavings: number;
  };
  laborCosts: {
    tier1HourlyRate: number;
    tier2HourlyRate: number;
    tier3HourlyRate: number;
    estimatedHours: number;
    estimatedLaborCost: number;
  };
  pipeline: {
    stage: string;
    leadScore: number;
    dealValue: number;
    source: string;
  };
  createdAt: string;
  updatedAt: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestData: OrderEntryWebhookData = await req.json();
    console.log('Order entry webhook request data:', requestData);

    const { assignment_id, booking_id, order_id, webhook_url, comprehensive_data } = requestData;

    if (!assignment_id && !booking_id && !order_id && !comprehensive_data) {
      return new Response(
        JSON.stringify({ error: 'assignment_id, booking_id, order_id, or comprehensive_data is required' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let orderData: any = null;
    let assignmentData: any = null;

    // Fetch assignment data if assignment_id provided
    if (assignment_id) {
      const { data: assignment, error: assignmentError } = await supabase
        .from('subcontractor_job_assignments')
        .select(`
          *,
          bookings (*),
          subcontractors (*)
        `)
        .eq('id', assignment_id)
        .single();

      if (assignmentError) {
        console.error('Assignment fetch error:', assignmentError);
      } else {
        assignmentData = assignment;
        
        // Try to get order data from booking
        if (assignment?.bookings) {
          const { data: order } = await supabase
            .from('orders')
            .select('*')
            .eq('customer_email', assignment.bookings.customer_email)
            .eq('service_date', assignment.bookings.service_date)
            .single();
          orderData = order;
        }
      }
    }

    // Only fetch database data if comprehensive_data is not provided
    if (!comprehensive_data) {
      // Fetch booking data if booking_id provided
      if (booking_id && !assignmentData) {
        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', booking_id)
          .single();

        if (bookingError) {
          console.log('Booking fetch error (expected if comprehensive_data provided):', bookingError);
        } else {
          // Get assignments for this booking
          const { data: assignments } = await supabase
            .from('subcontractor_job_assignments')
            .select(`
              *,
              subcontractors (*)
            `)
            .eq('booking_id', booking_id);

          assignmentData = { bookings: booking, assignments };
        }
      }

      // Fetch order data if order_id provided
      if (order_id) {
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', order_id)
          .single();

        if (orderError) {
          console.log('Order fetch error (expected if comprehensive_data provided):', orderError);
        } else {
          orderData = order;
        }
      }
    }

    // Get webhook URL from environment or request
    const targetWebhookUrl = webhook_url || Deno.env.get('DEFAULT_WEBHOOK_URL');
    
    if (!targetWebhookUrl) {
      console.log('No webhook URL configured, skipping webhook transmission');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Order processed successfully but no webhook URL configured for external transmission' 
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Construct comprehensive webhook payload with GHL formatting
    let webhookPayload: any;
    
    if (comprehensive_data) {
      // Use comprehensive data from booking flow
      console.log('Using comprehensive booking data for webhook payload');
      
      // Enhanced payload with GHL formatting and comprehensive data
      webhookPayload = {
        event_type: 'order_entry',
        timestamp: new Date().toISOString(),
        source: 'bay_area_cleaning_pros',
        
        // Original comprehensive data
        comprehensive_booking_data: comprehensive_data,
        
        // GHL formatted data (if available)
        ghl_formatted_data: comprehensive_data.ghlFormattedData || null,
        
        // Enhanced service information with separate and unified date/time
        service_details: {
          service_type: comprehensive_data.serviceType,
          home_size: comprehensive_data.homeSize,
          frequency: comprehensive_data.frequency,
          flooring_type: comprehensive_data.flooringType,
          add_ons: comprehensive_data.addOns || [],
          service_date_separate: comprehensive_data.serviceDateSeparate || comprehensive_data.serviceDate,
          service_time_separate: comprehensive_data.serviceTimeSeparate || comprehensive_data.serviceTime,
          service_date_time_unified: comprehensive_data.serviceDateTime || 
            (comprehensive_data.serviceDate && comprehensive_data.serviceTime ? 
              `${comprehensive_data.serviceDate} ${comprehensive_data.serviceTime}` : null)
        },
        
        // Comprehensive pricing breakdown
        pricing_breakdown: {
          base_price: comprehensive_data.basePrice || 0,
          add_ons_price: Object.values(comprehensive_data.addOnPrices || {}).reduce((sum: number, price: any) => sum + price, 0),
          
          // Detailed discount information
          discounts: comprehensive_data.discounts || {
            global: { percentage: 0, dollarAmount: 0, description: 'No global discount' },
            frequency: { percentage: 0, dollarAmount: 0, description: 'No frequency discount' },
            membership: { percentage: 0, dollarAmount: 0, description: 'No membership discount' },
            referral: { percentage: 0, dollarAmount: 0, description: 'No referral discount' },
            promo: { percentage: 0, dollarAmount: 0, description: 'No promo discount' }
          },
          
          // Labor cost information
          labor_costs: comprehensive_data.laborCosts || {
            tier1Rate: 16.00,
            tier2Rate: 18.00,
            tier3Rate: 21.00,
            estimatedHours: 3,
            estimatedLaborCost: 54.00
          },
          
          total_price: comprehensive_data.totalPrice || 0,
          total_savings: comprehensive_data.totalSavings || 0
        },
        
        // Customer information
        customer_info: comprehensive_data.customerInfo || {},
        
        // Metadata
        metadata: {
          assignment_id,
          booking_id,
          order_id,
          processed_at: new Date().toISOString(),
          data_source: 'comprehensive_booking_flow',
          webhook_version: '2.0'
        }
      };
    } else {
      // Use traditional data fetching method with enhanced structure
      console.log('Using database-fetched data for webhook payload');
      webhookPayload = {
        event_type: 'order_entry',
        timestamp: new Date().toISOString(),
        source: 'bay_area_cleaning_pros',
        
        // Traditional data structure
        order_data: orderData,
        assignment_data: assignmentData,
        booking_data: assignmentData?.bookings || null,
        subcontractor_data: assignmentData?.subcontractors || assignmentData?.assignments || null,
        
        // Enhanced service details for legacy data
        service_details: {
          service_date_separate: assignmentData?.bookings?.service_date || null,
          service_time_separate: assignmentData?.bookings?.service_time || null,
          service_date_time_unified: (assignmentData?.bookings?.service_date && assignmentData?.bookings?.service_time) ?
            `${assignmentData.bookings.service_date} ${assignmentData.bookings.service_time}` : null
        },
        
        metadata: {
          assignment_id,
          booking_id,
          order_id,
          processed_at: new Date().toISOString(),
          data_source: 'database_legacy',
          webhook_version: '1.0'
        }
      };
    }

    console.log('Sending order entry webhook to:', targetWebhookUrl);

    // Send to webhook URL
    const webhookResponse = await fetch(targetWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'BayAreaCleaning-OrderEntry-Webhook'
      },
      body: JSON.stringify(webhookPayload)
    });

    const webhookStatus = webhookResponse.status;
    const webhookSuccess = webhookStatus >= 200 && webhookStatus < 300;

    // Log webhook interaction
    try {
      await supabase.from('webhook_logs').insert({
        webhook_url: targetWebhookUrl,
        payload: webhookPayload,
        response_status: webhookStatus,
        success: webhookSuccess,
        event_type: 'order_entry',
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Failed to log webhook interaction:', logError);
    }

    if (!webhookSuccess) {
      console.error(`Webhook failed with status: ${webhookStatus}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Webhook failed with status ${webhookStatus}` 
        }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    console.log('Order entry webhook sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Order entry webhook sent successfully',
        webhook_status: webhookStatus
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error('Error in send-order-entry-webhook:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
});