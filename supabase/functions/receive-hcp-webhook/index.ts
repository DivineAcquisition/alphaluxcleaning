import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Verify the Housecall Pro webhook signature. HCP sends:
 *   Api-Timestamp: <unix ms>
 *   Api-Signature: hex(HMAC-SHA256(signing_secret, `${timestamp}.${rawBody}`))
 * Enforcement requires HCP_WEBHOOK_SECRET (the signing secret shown in the
 * HCP webhook settings). When unset we accept (fail-open) so the receiver
 * keeps working before the secret is provisioned.
 */
async function verifyHcpSignature(req: Request, rawBody: string, secret: string | null): Promise<boolean> {
  if (!secret) return true;

  const signature = req.headers.get("api-signature") || req.headers.get("x-hcp-signature") || "";
  const timestamp = req.headers.get("api-timestamp") || "";
  if (!signature) return false;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const candidates = timestamp ? [`${timestamp}.${rawBody}`, rawBody] : [rawBody];
    for (const data of candidates) {
      const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
      const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
      if (hex === signature.toLowerCase()) return true;
    }
    return false;
  } catch {
    return false;
  }
}

serve(async (req) => {
  console.log("HCP webhook receiver called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    let webhookSecret = Deno.env.get("HCP_WEBHOOK_SECRET") || null;
    if (!webhookSecret) {
      try {
        const { data } = await supabase
          .from("app_secrets")
          .select("value")
          .eq("name", "HCP_WEBHOOK_SECRET")
          .maybeSingle();
        webhookSecret = data?.value || null;
      } catch (_) { /* env-only */ }
    }

    const rawBody = await req.text();
    if (!(await verifyHcpSignature(req, rawBody, webhookSecret))) {
      console.warn("HCP webhook signature verification failed — rejecting");
      return new Response(JSON.stringify({ success: false, error: "invalid signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const payload = JSON.parse(rawBody);
    console.log("Received HCP webhook:", payload);

    // Extract event type and data
    const eventType = payload.event_type || payload.type;
    const eventData = payload.data || payload;

    // Check for idempotency
    const idempotencyKey = payload.id || payload.event_id || `${eventType}_${eventData.id}_${Date.now()}`;
    
    const { data: existingEvent } = await supabase
      .from('webhook_idempotency')
      .select('*')
      .eq('idempotency_key', idempotencyKey)
      .single();

    if (existingEvent) {
      console.log("Webhook already processed:", idempotencyKey);
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Already processed" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Store idempotency record
    await supabase
      .from('webhook_idempotency')
      .insert({
        idempotency_key: idempotencyKey,
        event_type: eventType,
        payload: payload
      });

    // Process based on event type
    switch (eventType) {
      case 'job.completed':
      case 'job.finished':
        await handleJobCompleted(supabase, eventData);
        break;
      
      case 'job.cancelled':
        await handleJobCancelled(supabase, eventData);
        break;
      
      case 'job.rescheduled':
        await handleJobRescheduled(supabase, eventData);
        break;
      
      case 'invoice.paid':
        await handleInvoicePaid(supabase, eventData);
        break;
      
      case 'invoice.created':
        await handleInvoiceCreated(supabase, eventData);
        break;
      
      default:
        console.log("Unhandled event type:", eventType);
    }

    // Log the webhook event
    await supabase
      .from('integration_logs')
      .insert({
        integration_type: 'HCP',
        action: `webhook_${eventType}`,
        status: 'success',
        request_payload: payload,
        response_payload: { processed: true }
      });

    return new Response(JSON.stringify({
      success: true,
      message: `Processed ${eventType}`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Webhook processing error:", error);
    
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
      success: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handleJobCompleted(supabase: any, data: any) {
  console.log("Handling job completed:", data.id);
  
  // Find booking by HCP job ID
  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('hcp_job_id', data.id)
    .single();

  if (!booking) {
    console.log("No booking found for HCP job:", data.id);
    return;
  }

  // Update booking status
  await supabase
    .from('bookings')
    .update({
      status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('id', booking.id);

  console.log("Updated booking to completed:", booking.id);

  // Collect the balance. The authorization hold placed before service is
  // worthless until it is captured, and Stripe voids it after 7 days —
  // so a completed clean that never reaches this call is simply revenue
  // we authorized and then walked away from. Job completion is the event
  // that earns the money, so it is the event that captures it.
  //
  // Non-blocking and idempotent: capture-booking-balance no-ops when the
  // balance is already settled, and falls back to a fresh off-session
  // charge (then a hosted invoice) if the hold has expired.
  const balanceDue = Number(booking.balance_due) || 0;
  if (balanceDue > 0 && booking.balance_auth_status !== "captured") {
    try {
      const res = await supabase.functions.invoke("capture-booking-balance", {
        body: { booking_id: booking.id, reason: "hcp_job_completed" },
      });
      console.log("Balance capture requested:", JSON.stringify(res.data ?? res.error));
    } catch (err) {
      // Never fail the webhook over this — HCP retries would re-run the
      // status update, and the balance sweep can still collect later.
      console.error("Balance capture failed (non-blocking):", err);
    }
  }
}

async function handleJobCancelled(supabase: any, data: any) {
  console.log("Handling job cancelled:", data.id);
  
  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('hcp_job_id', data.id)
    .single();

  if (!booking) {
    console.log("No booking found for HCP job:", data.id);
    return;
  }

  await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('id', booking.id);

  console.log("Updated booking to cancelled:", booking.id);
}

async function handleJobRescheduled(supabase: any, data: any) {
  console.log("Handling job rescheduled:", data.id);
  
  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('hcp_job_id', data.id)
    .single();

  if (!booking) {
    console.log("No booking found for HCP job:", data.id);
    return;
  }

  // Extract new scheduled date if available
  const updates: any = {
    updated_at: new Date().toISOString()
  };

  if (data.scheduled_start) {
    const newDate = new Date(data.scheduled_start);
    updates.service_date = newDate.toISOString().split('T')[0];
  }

  await supabase
    .from('bookings')
    .update(updates)
    .eq('id', booking.id);

  console.log("Updated booking with new schedule:", booking.id);
}

async function handleInvoicePaid(supabase: any, data: any) {
  console.log("Handling invoice paid:", data.id);
  
  // Find booking by HCP job ID (invoice contains job_id)
  if (!data.job_id) {
    console.log("No job_id in invoice data");
    return;
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('hcp_job_id', data.job_id)
    .single();

  if (!booking) {
    console.log("No booking found for HCP job:", data.job_id);
    return;
  }

  await supabase
    .from('bookings')
    .update({
      paid_at: new Date().toISOString(),
      balance_due: 0,
      updated_at: new Date().toISOString()
    })
    .eq('id', booking.id);

  console.log("Updated booking payment status:", booking.id);
}

async function handleInvoiceCreated(supabase: any, data: any) {
  console.log("Handling invoice created:", data.id);
  
  // Log the invoice creation for future reference
  await supabase
    .from('integration_logs')
    .insert({
      integration_type: 'HCP',
      action: 'invoice_created',
      status: 'success',
      external_id: data.id,
      request_payload: data
    });
}