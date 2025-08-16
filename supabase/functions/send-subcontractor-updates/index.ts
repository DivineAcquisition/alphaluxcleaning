import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubcontractorUpdateRequest {
  update_type: 'check_in' | 'check_out' | 'status_message' | 'assignment_change';
  subcontractor_id?: string;
  assignment_id?: string;
  order_id?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  message?: string;
  status?: string;
  estimated_arrival_minutes?: number;
  photos?: string[];
  notes?: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SUBCONTRACTOR-UPDATES] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Subcontractor update notification started");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const updateData: SubcontractorUpdateRequest = await req.json();
    logStep("Request parsed", { update_type: updateData.update_type });

    // Get subcontractor details
    let subcontractorData = null;
    if (updateData.subcontractor_id) {
      const { data } = await supabase
        .from('subcontractors')
        .select('id, full_name, email, phone, user_id')
        .eq('id', updateData.subcontractor_id)
        .single();
      subcontractorData = data;
    }

    // Get order and assignment details if available
    let orderData = null;
    let assignmentData = null;
    
    if (updateData.order_id) {
      const { data } = await supabase
        .from('orders')
        .select(`
          *,
          bookings (
            customer_name,
            customer_email,
            service_address,
            service_date,
            service_time
          )
        `)
        .eq('id', updateData.order_id)
        .single();
      orderData = data;
    }

    if (updateData.assignment_id) {
      const { data } = await supabase
        .from('subcontractor_job_assignments')
        .select('*')
        .eq('id', updateData.assignment_id)
        .single();
      assignmentData = data;
    }

    // Build webhook payload
    const webhookPayload = {
      event_type: 'subcontractor_update',
      update_type: updateData.update_type,
      timestamp: new Date().toISOString(),
      subcontractor: subcontractorData ? {
        id: subcontractorData.id,
        name: subcontractorData.full_name,
        email: subcontractorData.email,
        phone: subcontractorData.phone
      } : null,
      order: orderData ? {
        id: orderData.id,
        customer_name: orderData.bookings?.customer_name,
        service_address: orderData.bookings?.service_address,
        service_date: orderData.bookings?.service_date,
        service_time: orderData.bookings?.service_time,
        status: orderData.status
      } : null,
      assignment: assignmentData ? {
        id: assignmentData.id,
        status: assignmentData.status,
        assigned_at: assignmentData.assigned_at,
        accepted_at: assignmentData.accepted_at,
        completed_at: assignmentData.completed_at
      } : null,
      location: updateData.location || null,
      message: updateData.message || null,
      status: updateData.status || null,
      estimated_arrival_minutes: updateData.estimated_arrival_minutes || null,
      photos: updateData.photos || null,
      notes: updateData.notes || null,
      metadata: {
        webhook_version: '1.0',
        sent_at: new Date().toISOString(),
        environment: 'production'
      }
    };

    // Send to Zapier webhook
    try {
      const webhookResponse = await fetch('https://hooks.zapier.com/hooks/catch/5011258/u6v07y3/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });

      if (webhookResponse.ok) {
        logStep("Subcontractor update sent to Zapier successfully", { update_type: updateData.update_type });
      } else {
        logStep("Failed to send update to Zapier", { status: webhookResponse.status, update_type: updateData.update_type });
      }
    } catch (webhookError) {
      logStep("Error sending update to Zapier", webhookError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Subcontractor update sent to webhook",
      update_type: updateData.update_type
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in subcontractor update", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});