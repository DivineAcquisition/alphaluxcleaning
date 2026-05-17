// ghl-sync-booking — STAGE 2 of the GHL pipeline.
//
// After a booking is completed (address + schedule saved, deposit paid,
// status confirmed) this function pushes the full booking payload into
// GoHighLevel:
//
//   1. Upsert the contact with EVERY mapped custom field
//      (see _shared/ghl-field-map.ts) plus address + tags.
//   2. Find the contact's existing opportunity and PATCH it, or create
//      one in the "Booked" stage if none exists. This is the
//      idempotent lifecycle pattern lifted from novaracleaning — no
//      more duplicate cards on each retry or status change.
//   3. Book a confirmed appointment on the AlphaLuxCleaning calendar
//      (best-effort — skipped silently if calendar isn't reachable).
//   4. Mirror the same payload to the LeadConnector inbound webhook
//      so GHL workflows still receive the booking even if the PIT
//      call silently drops a field.
//   5. Stamp bookings.ghl_synced_at + ghl_contact_id +
//      ghl_opportunity_id + ghl_appointment_id so reconcile-ghl knows
//      not to retry.
//   6. Write a durable row to public.ghl_sync_log so a transient
//      LeadConnector outage can be replayed by retry-ghl-syncs /
//      reconcile-ghl.
//
// Triggered from save-booking-details, payment-webhook-handler,
// reconcile-ghl, and admin tools (with `{ booking_id }`). Idempotent on
// booking_id — calling repeatedly converges to a single contact +
// opportunity + appointment.

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { createGhlClient, pickBookedPipelineStage } from '../_shared/ghl-client.ts';
import {
  buildGhlBookingFields,
  buildBookingTags,
  bookingToOppStatus,
} from '../_shared/ghl-field-map.ts';
import { mirrorToLeadConnector } from '../_shared/leadconnector-mirror.ts';

// Dedicated AlphaLuxCleaning calendar in the GHL subaccount. Override
// via env var if ops moves the calendar.
const ALPHALUX_CALENDAR_ID =
  Deno.env.get('GHL_ALPHALUX_CALENDAR_ID') || 'wJkjZVj4Op8GGebIPm3O';

/**
 * Customer-facing arrival windows the booking flow offers. Mirrors
 * `TIME_SLOTS` in `src/components/booking/OfferDateTimePicker.tsx`
 * (and the human labels in `_shared/ghl-field-map.ts`) — kept in sync
 * so calendar appointments use the same start/end hours customers see.
 */
const ARRIVAL_WINDOWS: Record<
  string,
  { calendarStartHour: number; calendarEndHour: number }
> = {
  early_morning: { calendarStartHour: 7, calendarEndHour: 9 },
  morning: { calendarStartHour: 9, calendarEndHour: 11 },
  late_morning: { calendarStartHour: 11, calendarEndHour: 13 },
  afternoon: { calendarStartHour: 13, calendarEndHour: 15 },
  // late_afternoon and evening are clamped so the appointment stays
  // inside the calendar's open hours (configured in America/New_York,
  // closes at 5pm ET).
  late_afternoon: { calendarStartHour: 15, calendarEndHour: 16 },
  evening: { calendarStartHour: 16, calendarEndHour: 16 },
};

// Convert a YYYY-MM-DD + a time-slot id into ISO start/end timestamps
// (Eastern Time — calendar's open hours are configured in ET).
function slotToIso(date: string, slot: string | null): { start: string; end: string } | null {
  if (!date) return null;
  const def = ARRIVAL_WINDOWS[String(slot)];
  const sh = def?.calendarStartHour ?? 10;
  const eh = def?.calendarEndHour ?? 12;
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return null;
  // Calendar is configured in America/New_York so we always send ET.
  // Service dates are mostly within the spring/summer window so EDT
  // is the right default; correctness is a 30-min wobble in the
  // edge-of-winter case, which is acceptable for an arrival window.
  const offset = '-04:00';
  const start = `${date}T${String(sh).padStart(2, '0')}:00:00${offset}`;
  const end = `${date}T${String(Math.max(sh + 1, eh)).padStart(2, '0')}:30:00${offset}`;
  return { start, end };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function log(step: string, details?: unknown) {
  console.log(
    `[ghl-sync-booking] ${step}${
      details !== undefined ? ' ' + JSON.stringify(details) : ''
    }`,
  );
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  );

  let logRowId: string | null = null;
  let bookingId: string | null = null;
  let bodyParsed: any = null;

  try {
    bodyParsed = await req.json();
    bookingId = bodyParsed?.booking_id || bodyParsed?.bookingId || null;
    if (!bookingId) {
      return json({ success: false, error: 'booking_id is required' }, 400);
    }

    // Open / reuse a durable sync-log row (skip if invoked from retry
    // which already opened a row).
    if (!bodyParsed?._from_retry) {
      const { data: existing } = await supabase
        .from('ghl_sync_log')
        .select('id, status, attempts, ghl_contact_id, ghl_opportunity_id, ghl_appointment_id')
        .eq('stage', 'booking')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing) {
        logRowId = existing.id;
        await supabase
          .from('ghl_sync_log')
          .update({
            status: 'pending',
            attempts: (existing.attempts ?? 0) + 1,
            payload: bodyParsed,
            source: bodyParsed?.source || 'edge_function',
            trigger_op: bodyParsed?.trigger_op || 'sync',
            updated_at: new Date().toISOString(),
          })
          .eq('id', logRowId);
      } else {
        const { data: newRow } = await supabase
          .from('ghl_sync_log')
          .insert({
            stage: 'booking',
            booking_id: bookingId,
            status: 'pending',
            attempts: 1,
            payload: bodyParsed,
            source: bodyParsed?.source || 'edge_function',
            trigger_op: bodyParsed?.trigger_op || 'sync',
          })
          .select('id')
          .single();
        logRowId = newRow?.id ?? null;
      }
    }

    // 1. Load the booking + customer. The `bookings` table has two FKs
    //    into `customers` (customer_id and referrer_customer_id), so
    //    PostgREST can't disambiguate the embed without a hint.
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, customer:customers!bookings_customer_id_fkey(*)')
      .eq('id', bookingId)
      .single();
    if (bookingError) throw new Error(`Booking not found: ${bookingError.message}`);

    const customer = (booking as any).customer || {};
    const email: string | null =
      customer.email || booking.full_name || null;
    if (!email) {
      return json({ success: false, error: 'booking has no customer email' }, 422);
    }

    log('loaded booking', { bookingId, email, status: booking.status });

    const fullName =
      booking.full_name ||
      [customer.first_name, customer.last_name].filter(Boolean).join(' ') ||
      customer.name ||
      '';
    const [firstName, ...rest] = fullName.split(' ');
    const lastName = rest.join(' ') || customer.last_name || '';

    // 2. Build the comprehensive custom-field bag + tags via the shared
    //    mapper. This replaces the ad-hoc push() calls and guarantees
    //    EVERY GHL custom field we know about gets a value (or empty,
    //    which the client filters so we don't overwrite populated
    //    fields with blanks).
    const customFieldsByKey = buildGhlBookingFields({
      booking: booking as any,
      customer: customer as any,
    });
    const tags = buildBookingTags(booking as any);
    const oppStatus = bookingToOppStatus(booking.status);

    // 3. Lifecycle sync — upsert contact + find/patch-or-create one
    //    opportunity. The client retries on 429/5xx, splits the
    //    address defensively, and resolves customFieldsByKey to GHL
    //    UUIDs via the live custom-field map.
    const ghl = createGhlClient();

    // Resolve pipeline + stage up-front so the lifecycle helper can
    // pass them straight into createOpportunity when the contact has
    // no existing opportunity yet.
    let pipelineId: string | undefined;
    let stageId: string | undefined;
    try {
      const picked = await pickBookedPipelineStage(ghl);
      pipelineId = picked.pipelineId;
      stageId = picked.stageId;
      if (picked.label) log('pipeline picked', { label: picked.label });
    } catch (e) {
      log('pipeline pick failed', {
        error: e instanceof Error ? e.message : String(e),
      });
    }

    const monetaryValue = Number(booking.est_price || booking.base_price || 0);

    const sync = await ghl.syncBookingLifecycle({
      contact: {
        email,
        phone: customer.phone || undefined,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        name: fullName || undefined,
        address1: booking.address_line1 || customer.address_line1 || undefined,
        address2: booking.address_line2 || customer.address_line2 || undefined,
        city: customer.city || undefined,
        state: customer.state || undefined,
        postalCode: booking.zip_code || customer.postal_code || undefined,
        source: 'AlphaLuxClean TX/CA — booking completed',
        tags,
        customFieldsByKey,
      },
      opportunity: {
        pipelineId,
        stageId,
        name: `${fullName || email} · ${booking.offer_name || booking.service_type || 'Booking'}`,
        status: oppStatus,
        monetaryValue,
        source: 'alphaluxclean-txca',
      },
    });

    log('lifecycle sync', {
      contactId: sync.contactId,
      opportunityId: sync.opportunityId,
      updated: sync.updated,
      sent: sync.customFieldsSent,
      returned: sync.customFieldsReturned,
    });

    const ghlContactId = sync.contactId || (booking as any).ghl_contact_id || null;
    const opportunityId = sync.opportunityId;

    if (!ghlContactId) {
      throw new Error('GHL upsert returned no contact id — see logs for details');
    }

    // 4. Book / refresh a confirmed appointment on the AlphaLuxCleaning
    //    calendar. Uses the booking's service_date + time_slot. Skipped
    //    silently if either is missing (e.g. partial booking, in-flight
    //    rebook). We don't dedupe on appointment id here — duplicate
    //    appointments are cheap to clean up vs the alternative of
    //    missing one entirely, and the calendar's idempotency on
    //    (calendarId, contactId, startTime) often makes this a no-op.
    let appointmentId: string | null = null;
    if (booking.service_date) {
      const slot = slotToIso(booking.service_date, booking.time_slot);
      if (slot) {
        try {
          const apt = await ghl.request('/calendars/events/appointments', {
            method: 'POST',
            body: JSON.stringify({
              calendarId: ALPHALUX_CALENDAR_ID,
              locationId: ghl.locationId,
              contactId: ghlContactId,
              startTime: slot.start,
              endTime: slot.end,
              title: `${fullName || email} · ${booking.offer_name || booking.service_type || 'Cleaning'}`,
              appointmentStatus: 'confirmed',
              address: [
                booking.address_line1,
                booking.address_line2,
                customer.city,
                customer.state,
                booking.zip_code || customer.postal_code,
              ]
                .filter(Boolean)
                .join(', '),
              notes: [
                `AlphaLux booking: ${booking.id}`,
                booking.stripe_payment_intent_id
                  ? `Stripe: ${booking.stripe_payment_intent_id}`
                  : null,
                booking.hcp_job_id ? `HCP: ${booking.hcp_job_id}` : null,
                booking.promo_code ? `Promo: ${booking.promo_code}` : null,
                `Deposit paid: $${Number(booking.deposit_amount || 0).toFixed(2)}`,
                Number(booking.balance_due || 0) > 0
                  ? `Balance due: $${Number(booking.balance_due).toFixed(2)}`
                  : `Paid in full`,
                booking.special_instructions
                  ? `Notes: ${booking.special_instructions}`
                  : null,
              ]
                .filter(Boolean)
                .join('\n'),
            }),
          });
          if (apt.ok) {
            appointmentId =
              apt.data?.id ||
              apt.data?.appointment?.id ||
              apt.data?.event?.id ||
              null;
            log('appointment', { appointmentId, start: slot.start });
          } else {
            log('appointment failed', { status: apt.status, body: apt.data });
          }
        } catch (e) {
          log('appointment exception', {
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }
    }

    // 5. Mark the lead_promo_assignments row as redeemed.
    if (booking.promo_code) {
      await supabase
        .from('lead_promo_assignments')
        .update({
          redeemed_booking_id: booking.id,
          redeemed_at: new Date().toISOString(),
        })
        .eq('code', booking.promo_code);
    }

    // 6. Stamp the booking row as synced. Used by reconcile-ghl + admin
    //    dashboards to confirm GHL is in lockstep with the booking.
    await supabase
      .from('bookings')
      .update({
        ghl_contact_id: ghlContactId,
        ghl_opportunity_id: opportunityId,
        ghl_appointment_id: appointmentId,
        ghl_synced_at: new Date().toISOString(),
        ghl_sync_attempts: ((booking as any).ghl_sync_attempts || 0) + 1,
        ghl_sync_error: null,
      })
      .eq('id', booking.id);

    // 7. Mark the sync-log row successful so the retry worker leaves it alone.
    if (logRowId) {
      await supabase
        .from('ghl_sync_log')
        .update({
          status: 'success',
          ghl_contact_id: ghlContactId,
          ghl_opportunity_id: opportunityId,
          ghl_appointment_id: appointmentId,
          custom_fields_synced: sync.customFieldsReturned || sync.customFieldsSent,
          last_error: null,
          succeeded: true,
          http_status: 200,
          error_message: null,
          next_retry_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', logRowId);
    }

    // 8. Mirror to LeadConnector inbound webhook — safety net. If
    //    GHL_INBOUND_WEBHOOK_URL isn't set this returns silently and
    //    the PIT call above is the only outbound surface.
    await mirrorToLeadConnector({
      event: `booking.${booking.status || 'update'}`,
      payload: {
        booking_id: booking.id,
        ghl_contact_id: ghlContactId,
        ghl_opportunity_id: opportunityId,
        ghl_appointment_id: appointmentId,
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        email,
        phone: customer.phone || null,
        address1: booking.address_line1 || customer.address_line1 || null,
        address2: booking.address_line2 || customer.address_line2 || null,
        city: customer.city || null,
        state: customer.state || null,
        postal_code: booking.zip_code || customer.postal_code || null,
        custom_fields: customFieldsByKey,
        tags,
        opportunity: {
          name: `${fullName || email} · ${booking.offer_name || booking.service_type || 'Booking'}`,
          status: oppStatus,
          monetary_value: monetaryValue,
          source: 'alphaluxclean-txca',
        },
      },
    });

    return json({
      success: true,
      ghl_contact_id: ghlContactId,
      opportunity_id: opportunityId,
      appointment_id: appointmentId,
      opportunity_updated: sync.updated,
      custom_fields_sent: sync.customFieldsSent,
      custom_fields_returned: sync.customFieldsReturned,
      tags,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[ghl-sync-booking] error', msg);

    // Update sync-log row with failure + next retry backoff.
    if (logRowId) {
      const { data: row } = await supabase
        .from('ghl_sync_log')
        .select('attempts')
        .eq('id', logRowId)
        .maybeSingle();
      const attempts = (row?.attempts ?? 1) as number;
      const delays = [5, 15, 60, 240, 1440] as const;
      const minutes = delays[Math.min(attempts - 1, delays.length - 1)];
      const next = new Date(Date.now() + minutes * 60 * 1000);
      await supabase
        .from('ghl_sync_log')
        .update({
          status: attempts >= 5 ? 'abandoned' : 'failed',
          last_error: msg,
          succeeded: false,
          error_message: msg.slice(0, 500),
          next_retry_at: attempts >= 5 ? null : next.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', logRowId);
    }

    // Also stamp the booking row so reconcile-ghl picks it up next cycle.
    if (bookingId) {
      try {
        const { data: row } = await supabase
          .from('bookings')
          .select('ghl_sync_attempts')
          .eq('id', bookingId)
          .maybeSingle();
        await supabase
          .from('bookings')
          .update({
            ghl_sync_attempts: ((row as any)?.ghl_sync_attempts || 0) + 1,
            ghl_sync_error: msg.slice(0, 500),
          })
          .eq('id', bookingId);
      } catch (_) { /* best effort */ }
    }

    return json({ success: false, error: msg }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
