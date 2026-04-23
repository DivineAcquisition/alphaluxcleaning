// queue-booking-reminders — schedules a 24-hour and 2-hour email
// reminder for an upcoming booking by inserting rows into the
// `email_jobs` table. The `process-scheduled-emails` worker picks
// them up once `scheduled_for <= now()` and dispatches them through
// the `send-email-system` function so customers get pre-service
// nudges without a manual step.
//
// Input: { booking_id: uuid }
// Behaviour:
//   - Looks up the booking + customer (email, service_date, time_slot).
//   - Parses the time_slot (e.g. "10 AM - 12 PM") to build a real
//     start timestamp in US Eastern time.
//   - Enqueues rows keyed by (booking_id, trigger_kind) so retries
//     are idempotent (see the unique index on the table).
//   - Skips reminders in the past (e.g. when a same-day booking is
//     < 2 hours away) so we never queue jobs that will never fire.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, data?: unknown) =>
  console.log(
    `[queue-booking-reminders] ${step}`,
    data !== undefined ? JSON.stringify(data) : "",
  );

/**
 * Parse strings like "10 AM - 12 PM", "10am-12pm", "2 PM – 4 PM",
 * "1:30 PM - 3:30 PM" and return the start hour/minute in 24h.
 * Falls back to 10:00 so a malformed slot still yields a defensible
 * reminder time.
 */
function parseSlotStart(slot: string): { hours: number; minutes: number } {
  if (!slot) return { hours: 10, minutes: 0 };
  const first = slot.split(/[-–—]/)[0] || slot;
  const m = first.trim().match(/(\d{1,2})(?::(\d{2}))?\s*([ap]m)?/i);
  if (!m) return { hours: 10, minutes: 0 };
  let hours = parseInt(m[1], 10);
  const minutes = m[2] ? parseInt(m[2], 10) : 0;
  const ampm = (m[3] || "").toLowerCase();
  if (ampm === "pm" && hours < 12) hours += 12;
  if (ampm === "am" && hours === 12) hours = 0;
  if (!ampm && hours < 7) hours += 12; // heuristic: "3 - 5" likely afternoon
  return { hours, minutes };
}

/**
 * Build a UTC ISO timestamp representing `date`+`slot` in the US
 * Eastern timezone. AlphaLux operates in NY and TX/CA but all
 * customer comms treat the service date as local-to-NY for now.
 */
function serviceStartUtc(dateISO: string, slot: string | null): Date | null {
  if (!dateISO) return null;
  const { hours, minutes } = parseSlotStart(slot || "10 AM");
  // Default to America/New_York (UTC-5 standard, UTC-4 DST). We pick
  // the naive offset for April–October (DST) to avoid bundling a TZ
  // database into the edge function. For the non-DST half of the
  // year the reminder lands an hour early, which is a conservative
  // behaviour for a reminder.
  const offsetHours = 4; // EDT
  const [y, m, d] = dateISO.split("-").map(Number);
  if (!y || !m || !d) return null;
  const utc = Date.UTC(y, m - 1, d, hours + offsetHours, minutes);
  return new Date(utc);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const bookingId = body?.booking_id || body?.bookingId;
    if (!bookingId) throw new Error("Missing booking_id");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data: booking, error } = await supabase
      .from("bookings")
      .select(
        "*, customer:customers!bookings_customer_id_fkey(email, first_name, last_name, phone)",
      )
      .eq("id", bookingId)
      .single();
    if (error || !booking) {
      throw new Error(`Booking not found: ${error?.message || "unknown"}`);
    }

    const customer = (booking as any).customer || {};
    if (!customer?.email) {
      log("Skipping — booking has no customer email", { bookingId });
      return json({ success: true, skipped: "no_email" });
    }
    if (!booking.service_date) {
      log("Skipping — no service_date yet", { bookingId });
      return json({ success: true, skipped: "no_service_date" });
    }

    const startUtc = serviceStartUtc(booking.service_date, booking.time_slot);
    if (!startUtc) {
      log("Unable to parse service_date — skipping reminders", {
        bookingId,
        service_date: booking.service_date,
      });
      return json({ success: true, skipped: "parse_failed" });
    }

    const now = Date.now();
    const reminders = [
      { kind: "reminder_24h", offsetMs: -24 * 60 * 60 * 1000 },
      { kind: "reminder_2h", offsetMs: -2 * 60 * 60 * 1000 },
    ];

    const basePayload = {
      booking_id: booking.id,
      customer_name:
        customer.first_name ||
        booking.full_name ||
        `${customer.first_name || ""} ${customer.last_name || ""}`.trim() ||
        "there",
      service_type: booking.service_type || "cleaning",
      service_date: booking.service_date,
      time_window: booking.time_slot || "",
      address: booking.address_line1,
      total_amount: booking.est_price || booking.base_price || 0,
      deposit_amount: booking.deposit_amount || 0,
      balance_due: booking.balance_due || 0,
    };

    const scheduled: Array<{ kind: string; scheduled_for: string }> = [];
    const skipped: Array<{ kind: string; reason: string }> = [];

    for (const r of reminders) {
      const when = new Date(startUtc.getTime() + r.offsetMs);
      if (when.getTime() <= now + 60_000) {
        skipped.push({ kind: r.kind, reason: "already_past" });
        continue;
      }
      const row = {
        to_email: customer.email,
        to_name:
          basePayload.customer_name === "there" ? null : basePayload.customer_name,
        template_name: r.kind,
        category: "transactional" as const,
        status: "scheduled",
        scheduled_for: when.toISOString(),
        booking_id: booking.id,
        trigger_kind: r.kind,
        event_id: `${booking.id}:${r.kind}`,
        payload: basePayload,
      };
      const { error: upsertErr } = await supabase
        .from("email_jobs")
        .upsert(row, { onConflict: "booking_id,trigger_kind" });
      if (upsertErr) {
        log("Failed to queue reminder", { kind: r.kind, err: upsertErr.message });
        skipped.push({ kind: r.kind, reason: upsertErr.message });
        continue;
      }
      scheduled.push({ kind: r.kind, scheduled_for: when.toISOString() });
    }

    return json({ success: true, scheduled, skipped, service_start_utc: startUtc.toISOString() });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log("ERROR", { msg });
    return json({ success: false, error: msg }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
