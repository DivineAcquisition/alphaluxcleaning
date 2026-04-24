import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, data?: any) => {
  console.log(`[save-booking-details] ${step}`, data ? JSON.stringify(data) : '');
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      bookingId,
      addressLine1,
      addressLine2,
      city,
      state,
      zipCode,
      serviceDate,
      timeSlot,
      specialInstructions,
      propertyDetails,
    } = body;

    if (!bookingId) throw new Error("Missing bookingId");
    if (!addressLine1 || !city || !state || !zipCode) {
      throw new Error("Missing required address fields");
    }
    if (!serviceDate || !timeSlot) {
      throw new Error("Missing required scheduling fields");
    }

    log("Saving booking details", { bookingId, serviceDate, timeSlot });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Update booking with full details
    const updatePayload: Record<string, any> = {
      address_line1: addressLine1,
      address_line2: addressLine2 || null,
      zip_code: zipCode,
      service_date: serviceDate,
      time_slot: timeSlot,
      preferred_date: serviceDate,
      preferred_time_block: timeSlot,
      special_instructions: specialInstructions || null,
      status: 'confirmed',
      updated_at: new Date().toISOString(),
    };

    if (propertyDetails && typeof propertyDetails === 'object') {
      updatePayload.property_details = propertyDetails;
    }

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .update(updatePayload)
      .eq('id', bookingId)
      .select('customer_id')
      .single();

    if (bookingError) {
      log("Booking update failed", { error: bookingError.message });
      throw new Error(`Failed to update booking: ${bookingError.message}`);
    }

    // Update customer with full address
    if (booking?.customer_id) {
      const { error: customerError } = await supabase
        .from('customers')
        .update({
          address_line1: addressLine1,
          address_line2: addressLine2 || null,
          city,
          state,
          postal_code: zipCode,
        })
        .eq('id', booking.customer_id);

      if (customerError) {
        log("Customer update warning", { error: customerError.message });
      }
    }

    // Re-trigger webhook so GHL/Zapier get the address + schedule data
    try {
      await supabase.functions.invoke('enhanced-booking-webhook-v2', {
        body: {
          booking_id: bookingId,
          action: 'booking_details_updated',
          trigger_event: 'address_and_schedule_saved',
        }
      });
    } catch (webhookErr) {
      log("Webhook trigger warning", { error: (webhookErr as Error).message });
    }

    // Kick off the email + CRM fan-out in parallel (best-effort — each
    // step logs its own failure but never blocks the booking flow).
    //   1. send-booking-confirmation: customer-facing "you're booked"
    //      email + internal ops notification.
    //   2. ghl-sync-booking: push contact + custom fields + booked-stage
    //      opportunity into GoHighLevel.
    //   3. queue-booking-reminders: schedule the 24h + 2h reminder
    //      emails in the email_jobs table so the worker can pick them
    //      up at the right moment.
    const fanOut: Promise<any>[] = [];
    fanOut.push(
      supabase.functions
        .invoke('send-booking-confirmation', { body: { bookingId } })
        .then((r) => log('send-booking-confirmation', { ok: !r.error, err: r.error?.message }))
        .catch((e) => log('send-booking-confirmation threw', { err: (e as Error).message })),
    );
    fanOut.push(
      supabase.functions
        .invoke('ghl-sync-booking', { body: { booking_id: bookingId } })
        .then((r) => log('ghl-sync-booking', { ok: !r.error, err: r.error?.message }))
        .catch((e) => log('ghl-sync-booking threw', { err: (e as Error).message })),
    );
    fanOut.push(
      supabase.functions
        .invoke('queue-booking-reminders', { body: { booking_id: bookingId } })
        .then((r) => log('queue-booking-reminders', { ok: !r.error, err: r.error?.message }))
        .catch((e) => log('queue-booking-reminders threw', { err: (e as Error).message })),
    );
    fanOut.push(
      supabase.functions
        .invoke('hcp-sync-booking', { body: { booking_id: bookingId } })
        .then((r) => log('hcp-sync-booking', { ok: !r.error, err: r.error?.message, data: r.data }))
        .catch((e) => log('hcp-sync-booking threw', { err: (e as Error).message })),
    );
    // Fire-and-forget — we don't block the response on external sends.
    Promise.allSettled(fanOut);

    log("Saved successfully", { bookingId });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ success: false, error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
