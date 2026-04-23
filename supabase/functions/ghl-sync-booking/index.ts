// ghl-sync-booking — after a booking is completed (address + schedule
// saved), push the full booking payload into GoHighLevel:
//
//   1. Upsert the contact and backfill every matching custom field.
//   2. Add tags: `lead - booked`, `customer`, `<service_type>`.
//   3. Create (or skip if already present) an Opportunity in the
//      subaccount's first pipeline, tagged with the service type and
//      dollar value.
//   4. Stamp bookings.ghl_contact_id so downstream syncs don't dupe.
//
// Triggered from save-booking-details (and can be invoked manually from
// an admin tool with `{ booking_id }`).

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import {
  buildCustomFieldMap,
  createGhlClient,
  pickBookedPipelineStage,
  resolveFieldIdWithFallback as resolveFieldId,
  type GHLCustomFieldValue,
} from '../_shared/ghl-client.ts';

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

  try {
    const body = await req.json();
    const bookingId = body?.booking_id || body?.bookingId;
    if (!bookingId) {
      return json({ success: false, error: 'booking_id is required' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    );

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
    push(
      ['service_date_time', 'service_date__time'],
      booking.service_date && booking.time_slot
        ? `${booking.service_date} \u00b7 ${booking.time_slot}`
        : booking.service_date || undefined,
    );
    push(['service_start_time'], booking.time_slot);
    push(['service_end_time'], booking.time_slot);

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

    // 4. Mark the lead_promo_assignments row as redeemed.
    if (booking.promo_code) {
      await supabase
        .from('lead_promo_assignments')
        .update({
          redeemed_booking_id: booking.id,
          redeemed_at: new Date().toISOString(),
        })
        .eq('code', booking.promo_code);
    }

    return json({
      success: upsert.ok,
      ghl_contact_id: ghlContactId,
      opportunity_id: opportunityId,
      custom_fields_synced: customFields.length,
      tags,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[ghl-sync-booking] error', msg);
    return json({ success: false, error: msg }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
