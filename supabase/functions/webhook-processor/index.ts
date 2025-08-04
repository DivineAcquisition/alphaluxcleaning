import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookEvent {
  type: string;
  data: any;
  timestamp: string;
  source?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const webhookEvent: WebhookEvent = await req.json();
    console.log("Processing webhook event:", webhookEvent);

    // Route webhook based on type
    switch (webhookEvent.type) {
      case "order-status-changed":
        await handleOrderStatusChange(supabase, webhookEvent.data);
        break;
        
      case "service-modified":
        await handleServiceModification(supabase, webhookEvent.data);
        break;
        
      case "payment-processed":
        await handlePaymentEvent(supabase, webhookEvent.data);
        break;
        
      case "customer-message":
        await handleCustomerMessage(supabase, webhookEvent.data);
        break;
        
      case "booking-updated":
        await handleBookingUpdate(supabase, webhookEvent.data);
        break;
        
      case "quality-check":
        await handleQualityCheck(supabase, webhookEvent.data);
        break;
        
      case "staff-activity":
        await handleStaffActivity(supabase, webhookEvent.data);
        break;
        
      case "customer-lifecycle":
        await handleCustomerLifecycle(supabase, webhookEvent.data);
        break;
        
      case "inventory-update":
        await handleInventoryUpdate(supabase, webhookEvent.data);
        break;
        
      case "urgent-alert":
        await handleUrgentAlert(supabase, webhookEvent.data);
        break;
        
      case "analytics-event":
        await handleAnalyticsEvent(supabase, webhookEvent.data);
        break;
        
      case "external-sync":
        await handleExternalSync(supabase, webhookEvent.data);
        break;
        
      default:
        console.log("Unknown webhook type:", webhookEvent.type);
    }

    // Log all webhook events for audit trail
    await supabase.from('webhook_events').insert({
      event_type: webhookEvent.type,
      event_data: webhookEvent.data,
      processed_at: new Date().toISOString(),
      source: webhookEvent.source || 'unknown'
    });

    return new Response(
      JSON.stringify({ success: true, message: "Webhook processed successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

async function handleOrderStatusChange(supabase: any, data: any) {
  console.log("Processing order status change:", data);
  
  // Update order status
  await supabase
    .from('orders')
    .update({ 
      status: data.new_status,
      updated_at: new Date().toISOString()
    })
    .eq('id', data.order_id);

  // Create status update record
  await supabase
    .from('order_status_updates')
    .insert({
      order_id: data.order_id,
      status_message: `Order status changed to ${data.new_status}`,
      subcontractor_id: data.subcontractor_id
    });

  // Send customer notification if needed
  if (data.notify_customer) {
    await sendCustomerNotification(supabase, data.order_id, data.new_status);
  }
}

async function handleServiceModification(supabase: any, data: any) {
  console.log("Processing service modification:", data);
  
  // Update service request status if applicable
  if (data.request_id) {
    await supabase
      .from('customer_service_requests')
      .update({ 
        status: data.status,
        admin_notes: data.admin_notes,
        reviewed_by: data.reviewed_by,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', data.request_id);
  }

  // Update order if changes are approved
  if (data.status === 'approved' && data.changes) {
    await supabase
      .from('orders')
      .update(data.changes)
      .eq('id', data.order_id);
  }
}

async function handlePaymentEvent(supabase: any, data: any) {
  console.log("Processing payment event:", data);
  
  // Update order payment status
  await supabase
    .from('orders')
    .update({
      status: data.payment_successful ? 'confirmed' : 'payment_failed',
      updated_at: new Date().toISOString()
    })
    .eq('id', data.order_id);

  // Record tip if included
  if (data.tip_amount > 0) {
    await supabase
      .from('order_tips')
      .insert({
        order_id: data.order_id,
        amount: data.tip_amount,
        subcontractor_id: data.subcontractor_id
      });
  }
}

async function handleCustomerMessage(supabase: any, data: any) {
  console.log("Processing customer message:", data);
  
  // Create customer service request if it's a support message
  await supabase
    .from('customer_service_requests')
    .insert({
      order_id: data.order_id,
      request_type: 'general',
      customer_notes: data.message,
      requested_by_email: data.customer_email,
      requested_by_name: data.customer_name
    });
}

async function handleBookingUpdate(supabase: any, data: any) {
  console.log("Processing booking update:", data);
  
  // Update booking details
  await supabase
    .from('bookings')
    .update({
      assigned_employee_id: data.assigned_employee_id,
      service_date: data.service_date,
      service_time: data.service_time,
      updated_at: new Date().toISOString()
    })
    .eq('id', data.booking_id);
}

async function handleQualityCheck(supabase: any, data: any) {
  console.log("Processing quality check:", data);
  
  // Insert customer feedback
  await supabase
    .from('customer_feedback')
    .insert({
      booking_id: data.booking_id,
      subcontractor_id: data.subcontractor_id,
      customer_email: data.customer_email,
      customer_name: data.customer_name,
      overall_rating: data.overall_rating,
      cleanliness_rating: data.cleanliness_rating,
      timeliness_rating: data.timeliness_rating,
      professionalism_rating: data.professionalism_rating,
      feedback_text: data.feedback_text,
      photos: data.photos || []
    });
}

async function handleStaffActivity(supabase: any, data: any) {
  console.log("Processing staff activity:", data);
  
  // Update job tracking
  await supabase
    .from('job_tracking')
    .upsert({
      assignment_id: data.assignment_id,
      check_in_time: data.check_in_time,
      check_out_time: data.check_out_time,
      check_in_location: data.check_in_location,
      check_out_location: data.check_out_location,
      notes: data.notes,
      photos: data.photos || []
    });
}

async function handleCustomerLifecycle(supabase: any, data: any) {
  console.log("Processing customer lifecycle event:", data);
  
  // Track customer milestones, referrals, etc.
  // This would integrate with marketing automation systems
}

async function handleInventoryUpdate(supabase: any, data: any) {
  console.log("Processing inventory update:", data);
  
  // Track supply usage and equipment status
  // This would integrate with inventory management systems
}

async function handleUrgentAlert(supabase: any, data: any) {
  console.log("Processing urgent alert:", data);
  
  // Create incident report for urgent issues
  await supabase
    .from('incidents')
    .insert({
      booking_id: data.booking_id,
      subcontractor_id: data.subcontractor_id,
      incident_type: data.alert_type,
      severity: 'high',
      description: data.description,
      incident_date: new Date().toISOString(),
      reported_by: data.reported_by
    });
}

async function handleAnalyticsEvent(supabase: any, data: any) {
  console.log("Processing analytics event:", data);
  
  // Update performance metrics
  if (data.metric_type === 'performance_update') {
    await supabase
      .from('performance_metrics')
      .upsert({
        subcontractor_id: data.subcontractor_id,
        month_year: data.month_year,
        jobs_completed: data.jobs_completed,
        customer_rating: data.customer_rating,
        on_time_percentage: data.on_time_percentage
      });
  }
}

async function handleExternalSync(supabase: any, data: any) {
  console.log("Processing external sync:", data);
  
  // Handle data synchronization with external systems
  // This would manage integrations with CRM, accounting, etc.
}

async function sendCustomerNotification(supabase: any, orderId: string, status: string) {
  // This would trigger email/SMS notifications to customers
  console.log(`Sending notification for order ${orderId} - status: ${status}`);
  
  // Insert notification record
  await supabase
    .from('order_status_updates')
    .insert({
      order_id: orderId,
      status_message: `Your service has been ${status}. You'll receive an email confirmation shortly.`
    });
}