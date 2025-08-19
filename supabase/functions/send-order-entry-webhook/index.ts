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
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestData: OrderEntryWebhookData = await req.json();
    console.log('Order entry webhook request data:', requestData);

    const { assignment_id, booking_id, order_id, webhook_url } = requestData;

    if (!assignment_id && !booking_id && !order_id) {
      return new Response(
        JSON.stringify({ error: 'assignment_id, booking_id, or order_id is required' }),
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

    // Fetch booking data if booking_id provided
    if (booking_id && !assignmentData) {
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', booking_id)
        .single();

      if (bookingError) {
        console.error('Booking fetch error:', bookingError);
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
        console.error('Order fetch error:', orderError);
      } else {
        orderData = order;
      }
    }

    // Get webhook URL from environment or request
    const targetWebhookUrl = webhook_url || Deno.env.get('DEFAULT_WEBHOOK_URL');
    
    if (!targetWebhookUrl) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No webhook URL provided and no default webhook URL configured' 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Construct comprehensive webhook payload
    const webhookPayload = {
      event_type: 'order_entry',
      timestamp: new Date().toISOString(),
      source: 'bay_area_cleaning_pros',
      order_data: orderData,
      assignment_data: assignmentData,
      booking_data: assignmentData?.bookings || null,
      subcontractor_data: assignmentData?.subcontractors || assignmentData?.assignments || null,
      metadata: {
        assignment_id,
        booking_id,
        order_id,
        processed_at: new Date().toISOString()
      }
    };

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