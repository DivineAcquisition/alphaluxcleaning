import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

/**
 * Booking notification fan-out.
 *
 * This function is the single entry-point for "tell the team a new
 * booking just paid". It currently fans out to two destinations,
 * each independently enabled by the presence of an env var:
 *
 *   - Slack — set `SLACK_WEBHOOK_URL` to an Incoming Webhook URL
 *     (https://api.slack.com/messaging/webhooks). When set, every
 *     paid booking posts a formatted message with the customer,
 *     service, schedule, total, and HCP/Stripe links.
 *
 *   - Google Sheet (or any other catcher) — set `BOOKING_TRACKER_WEBHOOK_URL`
 *     to a Google Apps Script web-app URL (or any HTTPS endpoint
 *     that accepts POST JSON). The function ships a stable JSON
 *     payload that the Apps Script appends as a row in the sheet.
 *     See `docs/booking-tracker-apps-script.gs` for a drop-in
 *     Apps Script that does exactly that.
 *
 * Both are best-effort. A failure on either destination is logged
 * but does NOT cause the function to fail the caller, because we
 * never want a Slack outage to block a paid booking from being
 * confirmed in the database. The function returns 200 with a
 * per-destination status map so callers can surface the result.
 *
 * Caller contract:
 *   POST {
 *     bookingId: string  // required, the public.bookings UUID
 *     event?: 'payment_confirmed' | 'manual_replay'  // optional
 *   }
 *
 * The function loads the booking + linked customer rows itself, so
 * callers don't have to ship the full payload — just the id.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Mirror of the customer-facing TIME_SLOTS in
// `src/components/booking/OfferDateTimePicker.tsx` so the
// notification reads the same arrival window the customer saw.
const TIME_SLOT_LABELS: Record<string, string> = {
  early_morning: "Early Morning · 7–9 AM",
  morning: "Morning · 9–11 AM",
  late_morning: "Late Morning · 11 AM–1 PM",
  afternoon: "Afternoon · 1–3 PM",
  late_afternoon: "Late Afternoon · 3–5 PM",
  evening: "Evening · 5–7 PM",
};

/**
 * Resolve a wall-clock arrival window for a `bookings.time_slot` id.
 * Mirrors `OfferDateTimePicker.tsx`'s table — kept here too so this
 * function works without a shared module across edge functions.
 */
function timeSlotWindow(slot: string | null | undefined): string {
  if (!slot) return "Time TBD";
  return TIME_SLOT_LABELS[slot] ?? slot;
}

function fmtDate(yyyymmdd: string | null | undefined): string {
  if (!yyyymmdd) return "Date TBD";
  // Treat as a calendar date in the customer's local zone — we
  // don't know the timezone here, but a YYYY-MM-DD string is
  // unambiguous so we render it day-only without any TZ math.
  const [y, m, d] = String(yyyymmdd).split("-").map(Number);
  if (!y || !m || !d) return String(yyyymmdd);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function fmtMoney(amount: number | string | null | undefined): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  return `$${n.toFixed(2)}`;
}

function buildAddress(b: any, c: any): string {
  const line1 = b?.address_line1 || c?.address_line1 || "";
  const line2 = b?.address_line2 || c?.address_line2 || "";
  const city = c?.city || "";
  const state = c?.state || "";
  const zip = c?.postal_code || b?.zip_code || "";
  const cityLine = [city, state, zip].filter(Boolean).join(", ").replace(/, ([A-Z]{2}), /, ", $1 ");
  const parts = [line1, line2, cityLine].filter(Boolean);
  return parts.join(", ");
}

function fullName(b: any, c: any): string {
  if (b?.full_name) return String(b.full_name).trim();
  const composed = `${c?.first_name || ""} ${c?.last_name || ""}`.trim();
  return composed || "Customer";
}

/**
 * Build a Slack `blocks` payload that renders nicely in both desktop
 * and mobile Slack clients. We use Block Kit instead of raw `text`
 * so the booking details land in a clean two-column layout.
 */
function buildSlackBlocks(opts: {
  booking: any;
  customer: any;
  tracker: ReturnType<typeof buildTrackerPayload>;
  appUrl: string;
}) {
  const { booking, customer, tracker, appUrl } = opts;
  const rushPrefix = tracker.rush_upcharge > 0 ? ":zap: RUSH · " : "";
  const headline = `${rushPrefix}:sparkles: New paid booking — ${fmtMoney(tracker.total_paid)}`;
  const customerName = fullName(booking, customer);
  const offer = booking?.offer_name || tracker.service_label || "Cleaning Service";
  const dateLabel = fmtDate(tracker.service_date);
  const slotLabel = timeSlotWindow(tracker.time_slot);
  const address = buildAddress(booking, customer);
  const phone = customer?.phone || "—";
  const email = customer?.email || "—";
  const promoLine = tracker.promo_code
    ? `${tracker.promo_code} (-${fmtMoney(tracker.promo_discount)})`
    : "—";

  const adminUrl = `${appUrl}/admin/bookings/${booking.id}`.replace(/\/+/, (m) =>
    m === "//" ? "/" : m,
  );

  const linkLines: string[] = [];
  if (tracker.hcp_job_id) {
    linkLines.push(`*HCP job:* \`${tracker.hcp_job_id}\``);
  }
  if (tracker.stripe_payment_intent_id) {
    linkLines.push(
      `*Stripe:* <https://dashboard.stripe.com/payments/${tracker.stripe_payment_intent_id}|${tracker.stripe_payment_intent_id}>`,
    );
  }
  linkLines.push(`*Booking:* <${adminUrl}|${booking.id.slice(0, 8)}…>`);

  return {
    text: `New paid booking from ${customerName} — ${fmtMoney(tracker.total_paid)}`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: headline, emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Customer*\n${customerName}` },
          { type: "mrkdwn", text: `*Service*\n${offer}` },
          { type: "mrkdwn", text: `*Date*\n${dateLabel}` },
          { type: "mrkdwn", text: `*Window*\n${slotLabel}` },
          { type: "mrkdwn", text: `*Phone*\n${phone}` },
          { type: "mrkdwn", text: `*Email*\n${email}` },
          { type: "mrkdwn", text: `*Address*\n${address || "—"}` },
          { type: "mrkdwn", text: `*Promo*\n${promoLine}` },
          {
            type: "mrkdwn",
            text: `*Rush booking*\n${
              tracker.rush_upcharge > 0
                ? `:zap: Yes (+${fmtMoney(tracker.rush_upcharge)})`
                : "No"
            }`,
          },
          { type: "mrkdwn", text: `*Total*\n${fmtMoney(tracker.total_paid)}` },
          {
            type: "mrkdwn",
            text: `*Special Instructions*\n${
              booking?.special_instructions ? booking.special_instructions.slice(0, 280) : "—"
            }`,
          },
        ],
      },
      { type: "context", elements: [{ type: "mrkdwn", text: linkLines.join("  ·  ") }] },
    ],
  };
}

/**
 * Stable, flat payload sent to the Google Sheet Apps Script (or
 * any other tracker). Keys are designed to map directly to sheet
 * columns; never reorder existing keys, only append, so older
 * sheets keep working.
 */
function buildTrackerPayload(opts: { booking: any; customer: any; event: string }) {
  const { booking, customer, event } = opts;
  const total = Number(booking?.pricing_breakdown?.finalPrice) ||
    Number(booking?.base_price) ||
    Number(booking?.est_price) ||
    0;
  const promoDiscount = Number(booking?.promo_discount_cents)
    ? Number(booking?.promo_discount_cents) / 100
    : 0;
  const rushUpcharge = Number(
    booking?.pricing_breakdown?.rushUpcharge ??
      booking?.pricing_breakdown?.rush_upcharge ??
      0,
  );
  return {
    event,
    booking_id: booking?.id ?? null,
    paid_at: booking?.paid_at ?? null,
    created_at: booking?.created_at ?? null,
    customer_name: fullName(booking, customer),
    customer_email: customer?.email ?? null,
    customer_phone: customer?.phone ?? null,
    address_line1: booking?.address_line1 ?? customer?.address_line1 ?? null,
    address_line2: booking?.address_line2 ?? customer?.address_line2 ?? null,
    city: customer?.city ?? null,
    state: customer?.state ?? null,
    zip: customer?.postal_code ?? booking?.zip_code ?? null,
    service_label: booking?.offer_name ?? booking?.service_type ?? null,
    service_type: booking?.service_type ?? null,
    frequency: booking?.frequency ?? null,
    sqft_or_bedrooms: booking?.sqft_or_bedrooms ?? null,
    home_size: booking?.home_size ?? null,
    service_date: booking?.service_date ?? booking?.preferred_date ?? null,
    time_slot: booking?.time_slot ?? null,
    arrival_window: timeSlotWindow(booking?.time_slot),
    total_paid: total,
    promo_code: booking?.promo_code ?? null,
    promo_discount: promoDiscount,
    rush_upcharge: rushUpcharge,
    rush_booking: rushUpcharge > 0 ? "Yes" : "No",
    payment_status: booking?.payment_status ?? null,
    stripe_payment_intent_id: booking?.stripe_payment_intent_id ?? null,
    stripe_subscription_id: booking?.stripe_subscription_id ?? null,
    hcp_customer_id: booking?.hcp_customer_id ?? null,
    hcp_job_id: booking?.hcp_job_id ?? null,
    source: booking?.source ?? booking?.source_channel ?? null,
    special_instructions: booking?.special_instructions ?? null,
  };
}

async function postSlack(webhookUrl: string, body: any): Promise<{ ok: boolean; status: number; error?: string }> {
  try {
    const r = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const text = await r.text();
      return { ok: false, status: r.status, error: text.slice(0, 240) };
    }
    return { ok: true, status: r.status };
  } catch (err) {
    return { ok: false, status: 0, error: err instanceof Error ? err.message : String(err) };
  }
}

async function postTracker(
  url: string,
  payload: any,
  bearer?: string,
): Promise<{ ok: boolean; status: number; error?: string }> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (bearer) headers["Authorization"] = `Bearer ${bearer}`;
    const r = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      // Apps Script web apps redirect to a content URL on POST; let
      // fetch follow the redirect so we get the final 200 response
      // instead of being stuck on the 302.
      redirect: "follow",
    });
    if (!r.ok) {
      const text = await r.text();
      return { ok: false, status: r.status, error: text.slice(0, 240) };
    }
    return { ok: true, status: r.status };
  } catch (err) {
    return { ok: false, status: 0, error: err instanceof Error ? err.message : String(err) };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId, event = "payment_confirmed" } = await req.json();
    if (!bookingId) {
      return new Response(
        JSON.stringify({ error: "Missing required field: bookingId", success: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data: booking, error: bErr } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();
    if (bErr || !booking) {
      return new Response(
        JSON.stringify({
          error: `Booking not found: ${bErr?.message || "unknown"}`,
          success: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 },
      );
    }

    let customer: any = null;
    if (booking.customer_id) {
      const { data: customerRow } = await supabase
        .from("customers")
        .select(
          "id, email, phone, first_name, last_name, name, address_line1, address_line2, city, state, postal_code",
        )
        .eq("id", booking.customer_id)
        .maybeSingle();
      customer = customerRow;
    }

    const tracker = buildTrackerPayload({ booking, customer, event });
    const appUrl = Deno.env.get("APP_URL") || "https://alphaluxcleaning.com";

    const slackUrl = (Deno.env.get("SLACK_WEBHOOK_URL") || "").trim();
    const trackerUrl = (Deno.env.get("BOOKING_TRACKER_WEBHOOK_URL") || "").trim();
    const trackerSecret = (Deno.env.get("BOOKING_TRACKER_SECRET") || "").trim();

    const results: Record<string, any> = {};

    if (slackUrl) {
      results.slack = await postSlack(
        slackUrl,
        buildSlackBlocks({ booking, customer, tracker, appUrl }),
      );
    } else {
      results.slack = { skipped: true, reason: "SLACK_WEBHOOK_URL not configured" };
    }

    if (trackerUrl) {
      results.tracker = await postTracker(trackerUrl, tracker, trackerSecret || undefined);
    } else {
      results.tracker = { skipped: true, reason: "BOOKING_TRACKER_WEBHOOK_URL not configured" };
    }

    return new Response(
      JSON.stringify({ success: true, bookingId, event, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("notify-booking error:", msg);
    return new Response(
      JSON.stringify({ error: msg, success: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
