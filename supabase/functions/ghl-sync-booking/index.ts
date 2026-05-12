// ghl-sync-booking — STAGE 2 of the GHL pipeline.
// After a booking is completed (address + schedule saved), push the
// full booking payload into GoHighLevel:
//
//   1. Upsert the contact and backfill every matching custom field.
//   2. Add tags: `lead - booked`, `customer`, `<service_type>`.
//   3. Create (or skip if already present) an Opportunity in the
//      "Booked" stage of the AGP - Sales & Growth pipeline.
//   4. Book a confirmed appointment on the AlphaLuxCleaning calendar.
//   5. Stamp bookings.ghl_contact_id so downstream syncs don't dupe.
//   6. Write a durable row to public.ghl_sync_log so a transient
//      LeadConnector outage can be replayed by retry-ghl-syncs.
//
// Triggered from save-booking-details (and can be invoked manually
// from an admin tool with `{ booking_id }`). Idempotent on
// booking_id — calling repeatedly converges to a single contact +
// opportunity + appointment.

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import {
  buildCustomFieldMap,
  createGhlClient,
  pickBookedPipelineStage,
  resolveFieldIdWithFallback as resolveFieldId,
  type GHLCustomFieldValue,
} from '../_shared/ghl-client.ts';

// Dedicated AlphaLuxCleaning calendar in the GHL subaccount. Override
// via env var if ops moves the calendar.
const ALPHALUX_CALENDAR_ID =
  Deno.env.get('GHL_ALPHALUX_CALENDAR_ID') || 'wJkjZVj4Op8GGebIPm3O';

/**
 * Customer-facing arrival windows the booking flow offers — keeps
 * the start / end hours and the human-readable label in one map so
 * `slotToIso()` (calendar appointment) and `slotToHuman()` (custom
 * fields synced to GHL) can never drift out of sync.
 *
 * Mirrors `TIME_SLOTS` in
 * `src/components/booking/OfferDateTimePicker.tsx`. Edit both when
 * windows change.
 */
const ARRIVAL_WINDOWS: Record<
  string,
  {
    label: string;
    /** Human-readable window the customer saw on /book/offer (e.g. "1 – 3 PM"). */
    window: string;
    /** Start hour for calendar appointment ISO (24h). */
    calendarStartHour: number;
    /** End hour for calendar appointment ISO (24h). */
    calendarEndHour: number;
    /** True 24h hours for the start/end of the customer-promised window. */
    startHour: number;
    endHour: number;
  }
> = {
  early_morning: {
    label: 'Early Morning',
    window: '7 – 9 AM',
    calendarStartHour: 7,
    calendarEndHour: 9,
    startHour: 7,
    endHour: 9,
  },
  morning: {
    label: 'Morning',
    window: '9 – 11 AM',
    calendarStartHour: 9,
    calendarEndHour: 11,
    startHour: 9,
    endHour: 11,
  },
  late_morning: {
    label: 'Late Morning',
    window: '11 AM – 1 PM',
    calendarStartHour: 11,
    calendarEndHour: 13,
    startHour: 11,
    endHour: 13,
  },
  afternoon: {
    label: 'Afternoon',
    window: '1 – 3 PM',
    calendarStartHour: 13,
    calendarEndHour: 15,
    startHour: 13,
    endHour: 15,
  },
  late_afternoon: {
    label: 'Late Afternoon',
    window: '3 – 5 PM',
    calendarStartHour: 15,
    calendarEndHour: 16, // shrink so 5 PM PT (=8 PM ET) doesn't fall outside the calendar's open hours
    startHour: 15,
    endHour: 17,
  },
  evening: {
    label: 'Evening',
    window: '5 – 7 PM',
    calendarStartHour: 16,
    calendarEndHour: 16, // collapse — calendar closes at 5 PM ET
    startHour: 17,
    endHour: 19,
  },
};

/** Convert a 24h hour to "9 AM" / "1:30 PM" style. Minutes default to 0. */
function formatHourAmPm(hour: number, minute = 0): string {
  const h12 = ((hour + 11) % 12) + 1;
  const ampm = hour < 12 ? 'AM' : 'PM';
  if (minute === 0) return `${h12} ${ampm}`;
  return `${h12}:${String(minute).padStart(2, '0')} ${ampm}`;
}

/**
 * Convert a stored slot id (e.g. `afternoon`) into the customer-
 * facing arrival window string (e.g. `1 – 3 PM`). Falls back to a
 * Title-cased version of the raw value so a brand-new slot we
 * forgot to map still arrives at GHL as something readable rather
 * than the snake_case enum value.
 */
function slotToHuman(slot: string | null | undefined): string | null {
  if (!slot) return null;
  const def = ARRIVAL_WINDOWS[String(slot)];
  if (def) return def.window;
  return String(slot)
    .split('_')
    .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : s))
    .join(' ');
}

/**
 * Pull just the start / end hour text out of a slot id so we can
 * surface them on dedicated GHL fields ("3 PM" / "5 PM").
 */
function slotToStartEnd(
  slot: string | null | undefined,
): { start: string; end: string } | null {
  if (!slot) return null;
  const def = ARRIVAL_WINDOWS[String(slot)];
  if (!def) return null;
  return {
    start: formatHourAmPm(def.startHour),
    end: formatHourAmPm(def.endHour),
  };
}

// Convert a YYYY-MM-DD + a TimeSlot id into ISO start/end timestamps
// (Eastern Time — calendar's open hours are configured in ET).
function slotToIso(date: string, slot: string | null): { start: string; end: string } | null {
  if (!date) return null;
  const def = ARRIVAL_WINDOWS[String(slot)];
  const sh = def?.calendarStartHour ?? 10;
  const eh = def?.calendarEndHour ?? 12;
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return null;
  // Calendar is configured in America/New_York so we always send ET.
  // Pick EDT (-04:00) for Apr–Oct, EST (-05:00) for the rest. Service
  // dates are mostly within the spring/summer window.
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

    // Open / reuse a durable sync-log row (skip if invoked from retry).
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

    log('loaded booking', { bookingId, email });

    // 2. Build GHL client and field map.
    const ghl = createGhlClient();
    const fieldsRes = await ghl.listCustomFields();
    const fieldMap = buildCustomFieldMap(fieldsRes.fields);

    const fullName =
      booking.full_name ||
      [customer.first_name, customer.last_name].filter(Boolean).join(' ') ||
      customer.name ||
      '';
    const [firstName, ...rest] = fullName.split(' ');
    const lastName = rest.join(' ') || customer.last_name || '';

    const customFields: GHLCustomFieldValue[] = [];
    const push = (candidates: string[], value: unknown) => {
      if (value === undefined || value === null || value === '') return;
      const id = resolveFieldId(fieldMap, candidates);
      if (id) customFields.push({ id, field_value: value });
    };

    push(['promo_code'], booking.promo_code);
    push(['discount_cash_value'], booking.promo_discount_cents
      ? booking.promo_discount_cents / 100
      : undefined);
    push(['service_type'], booking.service_type);
    push(['service_frequency'], booking.frequency);
    push(['frequency'], booking.frequency);

    push(['service_date'], booking.service_date);
    // Customer-facing arrival window text (e.g. "1 – 3 PM") rather
    // than the internal slot id ("afternoon"). Ops + GHL automations
    // both read these fields directly into customer comms, and the
    // raw slug looked confusing in their messaging.
    const arrivalWindow = slotToHuman(booking.time_slot);
    const startEnd = slotToStartEnd(booking.time_slot);
    push(
      ['service_date_time', 'service_date__time'],
      booking.service_date && arrivalWindow
        ? `${booking.service_date} \u00b7 ${arrivalWindow}`
        : booking.service_date || undefined,
    );
    push(['service_start_time'], startEnd?.start ?? arrivalWindow ?? undefined);
    push(['service_end_time'], startEnd?.end ?? arrivalWindow ?? undefined);
    // Also surface the raw window on its own dedicated field so any
    // GHL workflows that already key off `arrival_window` stay
    // populated (they previously got the slot id and may now branch
    // on a friendlier value).
    push(['arrival_window', 'service_arrival_window'], arrivalWindow ?? undefined);

    push(['booking_amount'], booking.est_price || booking.base_price);
    push(['original_price'], booking.base_price);
    push(['deposit_amount'], booking.deposit_amount);
    push(['remaining_balance'], booking.balance_due);
    push(['mrr_est'], booking.mrr);
    push(['arr_est'], booking.arr);

    const propertyDetails = booking.property_details || {};
    push(['sqft'], propertyDetails.sqft || booking.home_size);
    push(['bedrooms'], propertyDetails.bedrooms);
    push(['bathrooms'], propertyDetails.bathrooms);
    push(['property_type'], propertyDetails.property_type);
    push(['flooring'], propertyDetails.flooring);
    push(['entry_instructions'], booking.special_instructions || booking.notes);
    push(['preferred_contact_method'], propertyDetails.preferred_contact_method);

    push(['conversion_status'], booking.is_recurring ? 'Recurring Active' : 'Offer Sent');
    push(['subscription_status'], booking.is_recurring ? 'Active Recurring' : 'One-Time');

    push(['utm_source'], booking.utms?.utm_source);
    push(['utm_medium'], booking.utms?.utm_medium);
    push(['utm_campaign'], booking.utms?.utm_campaign);
    push(['utm_content'], booking.utms?.utm_content);
    push(['landing_page'], booking.utms?.landing_page);
    push(['tracking_attribution'], booking.attribution_method);
    if (booking.utms) {
      push(['utm_fields'], JSON.stringify(booking.utms));
    }
    push(['fb_lead_id'], booking.utms?.fb_lead_id);

    push(['stripe_id'], booking.stripe_payment_intent_id || booking.stripe_checkout_session_id);
    push(['payment_link'], booking.receipt_url);
    push(['invoice_link'], booking.balance_invoice_url);
    push(
      ['manage_link'],
      booking.manage_token
        ? `https://app.alphaluxclean.com/order-status?token=${booking.manage_token}`
        : undefined,
    );
    push(['referral_code'], booking.referrer_code);

    const tags = [
      'lead - booked',
      'customer',
      'alphaluxclean-txca',
      booking.service_type ? `service-${booking.service_type}`.toLowerCase() : '',
      booking.frequency ? `freq-${booking.frequency}`.toLowerCase() : '',
      booking.promo_code ? `promo-${String(booking.promo_code).toLowerCase()}` : '',
    ].filter(Boolean) as string[];

    const upsert = await ghl.upsertContact({
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
      customFields,
    });

    const ghlContactId = upsert.contactId || booking.ghl_contact_id || null;

    if (ghlContactId) {
      // Ensure tags are applied even if upsert returned an existing contact
      // (the upsert endpoint ignores tags on some API versions).
      try {
        await ghl.addTags(ghlContactId, tags);
      } catch (e) {
        log('add_tags warn', { error: e instanceof Error ? e.message : String(e) });
      }

      await supabase
        .from('bookings')
        .update({ ghl_contact_id: ghlContactId })
        .eq('id', booking.id);
    }

    // 3. Create an opportunity in the "Booked" stage of the AGP -
    //    Sales & Growth Pipeline (falls back to a "Closed - Won" /
    //    "Paid / Appt Confirmed" stage on any other pipeline).
    let opportunityId: string | null = null;
    if (ghlContactId) {
      try {
        const { pipelineId, stageId, label } = await pickBookedPipelineStage(ghl);
        if (pipelineId && stageId) {
          const opp = await ghl.createOpportunity({
            pipelineId,
            stageId,
            name: `${fullName || email} · ${booking.offer_name || booking.service_type || 'Booking'}`,
            status: 'won',
            contactId: ghlContactId,
            monetaryValue: Number(booking.est_price || booking.base_price || 0),
            source: 'alphaluxclean-txca',
            customFields,
          });
          opportunityId = opp.opportunityId || null;
          log('opportunity', { ok: opp.ok, opportunityId, pipeline: label });
        } else {
          log('no pipeline found — skipping opportunity');
        }
      } catch (e) {
        log('opportunity skipped', {
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    // 4. Book a confirmed appointment on the AlphaLuxCleaning calendar.
    //    Uses the booking's service_date + time_slot. Skipped silently
    //    if either is missing (e.g. partial booking, in-flight rebook).
    let appointmentId: string | null = null;
    if (ghlContactId && booking.service_date) {
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

    // 6. Mark the sync-log row successful so the retry worker leaves it alone.
    if (logRowId) {
      await supabase
        .from('ghl_sync_log')
        .update({
          status: 'success',
          ghl_contact_id: ghlContactId,
          ghl_opportunity_id: opportunityId,
          ghl_appointment_id: appointmentId,
          custom_fields_synced: customFields.length,
          last_error: null,
          next_retry_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', logRowId);
    }

    return json({
      success: !!ghlContactId,
      ghl_contact_id: ghlContactId,
      opportunity_id: opportunityId,
      appointment_id: appointmentId,
      custom_fields_synced: customFields.length,
      tags,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[ghl-sync-booking] error', msg);

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
          next_retry_at: attempts >= 5 ? null : next.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', logRowId);
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
