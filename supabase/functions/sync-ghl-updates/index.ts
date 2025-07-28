import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SYNC-GHL-UPDATES] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const GHL_API_KEY = Deno.env.get("GOHIGHLEVEL_API_KEY");
    const GHL_LOCATION_ID = Deno.env.get("GOHIGHLEVEL_LOCATION_ID");

    if (!GHL_API_KEY || !GHL_LOCATION_ID) {
      throw new Error("GoHighLevel API credentials not configured");
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { action, orderId, appointmentId, newDate, newTime, reason } = await req.json();
    logStep("Request data received", { action, orderId, appointmentId });

    let result;

    switch (action) {
      case 'cancel':
        result = await handleCancellation(orderId, appointmentId, reason, supabase);
        break;
      case 'reschedule':
        result = await handleReschedule(orderId, appointmentId, newDate, newTime, supabase);
        break;
      case 'sync_from_ghl':
        result = await syncFromGHL(supabase);
        break;
      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    return new Response(JSON.stringify({ 
      success: true,
      action,
      result
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in sync-ghl-updates", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handleCancellation(orderId: string, appointmentId: string, reason: string, supabase: any) {
  logStep("Handling cancellation", { orderId, appointmentId });

  const GHL_API_KEY = Deno.env.get("GOHIGHLEVEL_API_KEY");

  // Cancel appointment in GoHighLevel
  if (appointmentId) {
    const cancelResponse = await fetch(`https://services.leadconnectorhq.com/calendars/events/appointments/${appointmentId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${GHL_API_KEY}`,
        "Content-Type": "application/json",
        "Version": "2021-07-28"
      }
    });

    if (!cancelResponse.ok) {
      logStep("Failed to cancel appointment in GHL", { appointmentId, status: cancelResponse.status });
    } else {
      logStep("Appointment cancelled in GHL", { appointmentId });
    }
  }

  // Update order status in Supabase
  const { error: updateError } = await supabase
    .from('orders')
    .update({ 
      status: 'cancelled',
      cancellation_reason: reason,
      cancelled_at: new Date().toISOString()
    })
    .eq('id', orderId);

  if (updateError) {
    throw new Error(`Failed to update order status: ${updateError.message}`);
  }

  // Log the cancellation
  await supabase
    .from('service_modifications')
    .insert({
      order_id: orderId,
      modification_type: 'cancelled',
      details: { reason, cancelled_by: 'system' },
      created_at: new Date().toISOString()
    });

  return { orderId, appointmentId, status: 'cancelled' };
}

async function handleReschedule(orderId: string, appointmentId: string, newDate: string, newTime: string, supabase: any) {
  logStep("Handling reschedule", { orderId, appointmentId, newDate, newTime });

  const GHL_API_KEY = Deno.env.get("GOHIGHLEVEL_API_KEY");
  
  // Calculate new start and end times
  const startDateTime = new Date(`${newDate}T${getTimeSlotHour(newTime)}:00`);
  const endDateTime = new Date(startDateTime.getTime() + (2 * 60 * 60 * 1000)); // 2 hours default

  // Update appointment in GoHighLevel
  if (appointmentId) {
    const updateResponse = await fetch(`https://services.leadconnectorhq.com/calendars/events/appointments/${appointmentId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${GHL_API_KEY}`,
        "Content-Type": "application/json",
        "Version": "2021-07-28"
      },
      body: JSON.stringify({
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        appointmentStatus: "confirmed"
      })
    });

    if (!updateResponse.ok) {
      logStep("Failed to reschedule appointment in GHL", { appointmentId, status: updateResponse.status });
    } else {
      logStep("Appointment rescheduled in GHL", { appointmentId, newDate, newTime });
    }
  }

  // Update order in Supabase
  const { error: updateError } = await supabase
    .from('orders')
    .update({ 
      scheduled_date: newDate,
      scheduled_time: newTime,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);

  if (updateError) {
    throw new Error(`Failed to update order: ${updateError.message}`);
  }

  // Log the reschedule
  await supabase
    .from('service_modifications')
    .insert({
      order_id: orderId,
      modification_type: 'rescheduled',
      details: { 
        old_date: null, // Would need to get from original order
        new_date: newDate,
        new_time: newTime,
        rescheduled_by: 'system'
      },
      created_at: new Date().toISOString()
    });

  return { orderId, appointmentId, newDate, newTime, status: 'rescheduled' };
}

async function syncFromGHL(supabase: any) {
  logStep("Syncing appointments from GHL");

  const GHL_API_KEY = Deno.env.get("GOHIGHLEVEL_API_KEY");
  const GHL_LOCATION_ID = Deno.env.get("GOHIGHLEVEL_LOCATION_ID");

  // Get recent appointments from GHL (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const today = new Date();

  const appointmentsResponse = await fetch(`https://services.leadconnectorhq.com/calendars/events/appointments?locationId=${GHL_LOCATION_ID}&startDate=${thirtyDaysAgo.toISOString().split('T')[0]}&endDate=${today.toISOString().split('T')[0]}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${GHL_API_KEY}`,
      "Content-Type": "application/json",
      "Version": "2021-07-28"
    }
  });

  const appointmentsData = await appointmentsResponse.json();
  logStep("Retrieved appointments from GHL", { count: appointmentsData.events?.length });

  const syncResults = [];

  for (const appointment of appointmentsData.events || []) {
    // Find corresponding order in Supabase
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .or(`ghl_appointment_id.eq.${appointment.id},customer_email.eq.${appointment.contactEmail}`);

    if (orders && orders.length > 0) {
      const order = orders[0];
      
      // Check if appointment status changed
      const ghlStatus = appointment.appointmentStatus;
      let newStatus = order.status;

      if (ghlStatus === 'cancelled' && order.status !== 'cancelled') {
        newStatus = 'cancelled';
      } else if (ghlStatus === 'confirmed' && order.status === 'cancelled') {
        newStatus = 'confirmed';
      }

      if (newStatus !== order.status) {
        await supabase
          .from('orders')
          .update({ 
            status: newStatus,
            ghl_appointment_id: appointment.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id);

        syncResults.push({
          orderId: order.id,
          appointmentId: appointment.id,
          statusChange: `${order.status} -> ${newStatus}`
        });
      }
    }
  }

  return { syncedAppointments: syncResults.length, details: syncResults };
}

function getTimeSlotHour(timeSlot: string): string {
  if (timeSlot.includes("Morning") || timeSlot.includes("8:00") || timeSlot.includes("9:00")) return "09";
  if (timeSlot.includes("Afternoon") || timeSlot.includes("12:00") || timeSlot.includes("1:00")) return "12";
  if (timeSlot.includes("Evening") || timeSlot.includes("5:00") || timeSlot.includes("6:00")) return "17";
  return "09"; // Default to 9 AM
}