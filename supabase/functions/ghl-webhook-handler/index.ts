import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GHL-WEBHOOK-HANDLER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const webhookData = await req.json();
    logStep("Webhook data received", { type: webhookData.type, eventId: webhookData.id });

    // Handle different webhook events
    switch (webhookData.type) {
      case 'appointment.updated':
        await handleAppointmentUpdate(webhookData, supabase);
        break;
      case 'appointment.cancelled':
        await handleAppointmentCancellation(webhookData, supabase);
        break;
      case 'appointment.created':
        await handleAppointmentCreation(webhookData, supabase);
        break;
      case 'appointment.rescheduled':
        await handleAppointmentReschedule(webhookData, supabase);
        break;
      default:
        logStep("Unhandled webhook type", { type: webhookData.type });
    }

    return new Response(JSON.stringify({ 
      success: true,
      processed: true,
      type: webhookData.type
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in ghl-webhook-handler", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handleAppointmentUpdate(webhookData: any, supabase: any) {
  const appointmentId = webhookData.appointment?.id;
  const contactEmail = webhookData.appointment?.contactEmail;
  
  if (!appointmentId) return;

  logStep("Handling appointment update", { appointmentId, contactEmail });

  // Find the corresponding order
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .or(`ghl_appointment_id.eq.${appointmentId},customer_email.eq.${contactEmail}`)
    .limit(1);

  if (orders && orders.length > 0) {
    const order = orders[0];
    const appointment = webhookData.appointment;

    // Update order with latest appointment data
    const updateData: any = {
      ghl_appointment_id: appointmentId,
      updated_at: new Date().toISOString()
    };

    // Update status if changed
    if (appointment.appointmentStatus) {
      updateData.status = mapGHLStatusToOrderStatus(appointment.appointmentStatus);
    }

    // Update scheduling if changed
    if (appointment.startTime) {
      const startTime = new Date(appointment.startTime);
      updateData.scheduled_date = startTime.toISOString().split('T')[0];
      updateData.scheduled_time = formatTimeSlot(startTime);
    }

    await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id);

    logStep("Order updated from GHL webhook", { orderId: order.id, appointmentId });
  }
}

async function handleAppointmentCancellation(webhookData: any, supabase: any) {
  const appointmentId = webhookData.appointment?.id;
  
  if (!appointmentId) return;

  logStep("Handling appointment cancellation", { appointmentId });

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('ghl_appointment_id', appointmentId)
    .limit(1);

  if (orders && orders.length > 0) {
    const order = orders[0];

    await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id);

    // Log the cancellation
    await supabase
      .from('service_modifications')
      .insert({
        order_id: order.id,
        modification_type: 'cancelled',
        details: { 
          cancelled_by: 'ghl_webhook',
          appointment_id: appointmentId
        },
        created_at: new Date().toISOString()
      });

    logStep("Order cancelled from GHL webhook", { orderId: order.id, appointmentId });
  }
}

async function handleAppointmentCreation(webhookData: any, supabase: any) {
  const appointment = webhookData.appointment;
  
  if (!appointment) return;

  logStep("Handling appointment creation", { appointmentId: appointment.id });

  // Check if we already have an order for this appointment
  const { data: existingOrders } = await supabase
    .from('orders')
    .select('*')
    .eq('ghl_appointment_id', appointment.id)
    .limit(1);

  if (!existingOrders || existingOrders.length === 0) {
    // This might be an appointment created directly in GHL
    // You could create a new order record here if needed
    logStep("New appointment created in GHL (no matching order found)", { appointmentId: appointment.id });
  }
}

async function handleAppointmentReschedule(webhookData: any, supabase: any) {
  const appointmentId = webhookData.appointment?.id;
  const appointment = webhookData.appointment;
  
  if (!appointmentId || !appointment) return;

  logStep("Handling appointment reschedule", { appointmentId });

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('ghl_appointment_id', appointmentId)
    .limit(1);

  if (orders && orders.length > 0) {
    const order = orders[0];
    const startTime = new Date(appointment.startTime);

    const oldDate = order.scheduled_date;
    const oldTime = order.scheduled_time;
    const newDate = startTime.toISOString().split('T')[0];
    const newTime = formatTimeSlot(startTime);

    await supabase
      .from('orders')
      .update({
        scheduled_date: newDate,
        scheduled_time: newTime,
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id);

    // Log the reschedule
    await supabase
      .from('service_modifications')
      .insert({
        order_id: order.id,
        modification_type: 'rescheduled',
        details: { 
          old_date: oldDate,
          old_time: oldTime,
          new_date: newDate,
          new_time: newTime,
          rescheduled_by: 'ghl_webhook',
          appointment_id: appointmentId
        },
        created_at: new Date().toISOString()
      });

    logStep("Order rescheduled from GHL webhook", { orderId: order.id, appointmentId, newDate, newTime });
  }
}

function mapGHLStatusToOrderStatus(ghlStatus: string): string {
  switch (ghlStatus.toLowerCase()) {
    case 'confirmed':
      return 'confirmed';
    case 'cancelled':
      return 'cancelled';
    case 'completed':
      return 'completed';
    case 'no-show':
      return 'no_show';
    default:
      return 'pending';
  }
}

function formatTimeSlot(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  
  if (hours < 12) {
    return `${hours}:${minutes.toString().padStart(2, '0')} AM`;
  } else if (hours === 12) {
    return `12:${minutes.toString().padStart(2, '0')} PM`;
  } else {
    return `${hours - 12}:${minutes.toString().padStart(2, '0')} PM`;
  }
}