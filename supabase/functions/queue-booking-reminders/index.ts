// queue-booking-reminders — schedules 24-hour and 2-hour reminders
// for an upcoming booking on BOTH channels:
//   email → `email_jobs` (picked up by process-scheduled-emails)
//   SMS   → `sms_jobs`   (picked up by process-scheduled-sms)
//
// Input: { booking_id: uuid }
// Behaviour:
//   - Looks up the booking + customer (email, phone, service_date, time_slot).
//   - Parses the time_slot to build a real start timestamp.
//   - Enqueues rows keyed by (booking_id, trigger_kind) so retries
//     are idempotent.
//   - Skips reminders in the past (e.g. same-day booking < 2 hours away).
//   - SMS uses the same rail as the original booking: OpenPhone for
//     public + lead-token bookings, GoHighLevel for blank internal.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { channelFromBookingSource } from "../_shared/sms.ts";
import { resolveSupportNumber } from "../_shared/openphone.ts";
import { toE164US } from "../_shared/phone-format.ts";

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

const TIME_SLOT_WINDOWS: Record<string, string> = {
  early_morning: "7–9 AM",
  morning: "9–11 AM",
  late_morning: "11 AM–1 PM",
  afternoon: "1–3 PM",
  late_afternoon: "3–5 PM",
  evening: "5–7 PM",
};

function parseSlotStart(slot: string): { hours: number; minutes: number } {
  if (!slot) return { hours: 10, minutes: 0 };
  const mapped = TIME_SLOT_WINDOWS[slot];
  const first = (mapped || slot).split(/[-–—]/)[0] || slot;
  const m = first.trim().match(/(\d{1,2})(?::(\d{2}))?\s*([ap]m)?/i);
  if (!m) return { hours: 10, minutes: 0 };
  let hours = parseInt(m[1], 10);
  const minutes = m[2] ? parseInt(m[2], 10) : 0;
  const ampm = (m[3] || "").toLowerCase();
  if (ampm === "pm" && hours < 12) hours += 12;
  if (ampm === "am" && hours === 12) hours = 0;
  if (!ampm && hours < 7) hours += 12;
  return { hours, minutes };
}

function serviceStartUtc(dateISO: string, slot: string | null): Date | null {
  if (!dateISO) return null;
  const { hours, minutes } = parseSlotStart(slot || "10 AM");
  const offsetHours = 4; // EDT heuristic
  const [y, m, d] = dateISO.split("-").map(Number);
  if (!y || !m || !d) return null;
  const utc = Date.UTC(y, m - 1, d, hours + offsetHours, minutes);
  return new Date(utc);
}

function fmtDate(yyyymmdd: string | null | undefined): string {
  if (!yyyymmdd) return "";
  const [y, m, d] = String(yyyymmdd).split("-").map(Number);
  if (!y || !m || !d) return String(yyyymmdd);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
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
        "*, customer:customers!bookings_customer_id_fkey(email, first_name, last_name, phone, city, state, postal_code)",
      )
      .eq("id", bookingId)
      .single();
    if (error || !booking) {
      throw new Error(`Booking not found: ${error?.message || "unknown"}`);
    }

    const customer = (booking as any).customer || {};
    const email = customer.email || null;
    const phoneE164 = toE164US(customer.phone) || null;
    if (!email && !phoneE164) {
      log("Skipping — booking has no email or phone", { bookingId });
      return json({ success: true, skipped: "no_email_or_phone" });
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

    const { data: leadToken } = await supabase
      .from("lead_booking_tokens")
      .select("token")
      .eq("booking_id", bookingId)
      .maybeSingle();

    const smsChannel = leadToken
      ? "public"
      : channelFromBookingSource((booking as any).source);

    const support = await resolveSupportNumber({
      state: customer.state || (booking as any).property_details?.state_multiplier_applied,
      zip: booking.zip_code || customer.postal_code,
      supabase,
    });

    const firstName =
      customer.first_name ||
      String(booking.full_name || "").split(" ")[0] ||
      "there";
    const timeWindow =
      TIME_SLOT_WINDOWS[booking.time_slot] || booking.time_slot || "";
    const address = booking.address_line1 || "";
    const appUrl = Deno.env.get("APP_URL") || "https://alphaluxcleaning.com";

    const basePayload = {
      booking_id: booking.id,
      first_name: firstName,
      customer_name: firstName,
      service_type: booking.offer_name || booking.service_type || "cleaning",
      service_date: fmtDate(booking.service_date),
      time_window: timeWindow,
      address,
      address_line1: address,
      city: customer.city || "",
      state: customer.state || "",
      total_amount: booking.est_price || booking.base_price || 0,
      deposit_amount: booking.deposit_amount || 0,
      balance_due: booking.balance_due || 0,
      support_phone: support.display,
      manage_link: `${appUrl}/manage`,
      special_instructions: booking.special_instructions || "",
    };

    const now = Date.now();
    const reminders = [
      { kind: "reminder_24h", offsetMs: -24 * 60 * 60 * 1000 },
      { kind: "reminder_2h", offsetMs: -2 * 60 * 60 * 1000 },
    ];

    const scheduled: Array<{ kind: string; scheduled_for: string; channel: string }> = [];
    const skipped: Array<{ kind: string; reason: string }> = [];

    for (const r of reminders) {
      const when = new Date(startUtc.getTime() + r.offsetMs);
      if (when.getTime() <= now + 60_000) {
        skipped.push({ kind: r.kind, reason: "already_past" });
        continue;
      }

      if (email) {
        const row = {
          to_email: email,
          to_name: firstName === "there" ? null : firstName,
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
          log("Failed to queue email reminder", { kind: r.kind, err: upsertErr.message });
          skipped.push({ kind: `email:${r.kind}`, reason: upsertErr.message });
        } else {
          scheduled.push({ kind: r.kind, scheduled_for: when.toISOString(), channel: "email" });
        }
      } else {
        skipped.push({ kind: `email:${r.kind}`, reason: "no_email" });
      }

      if (phoneE164) {
        const smsRow = {
          to_phone: phoneE164,
          template_name: r.kind,
          status: "scheduled",
          scheduled_for: when.toISOString(),
          booking_id: booking.id,
          trigger_kind: r.kind,
          event_id: `${booking.id}:sms:${r.kind}`,
          payload: {
            ...basePayload,
            channel: smsChannel,
            state: customer.state || null,
            zip: booking.zip_code || customer.postal_code || null,
            email: email || null,
            last_name: customer.last_name || null,
            ghl_contact_id: booking.ghl_contact_id || null,
          },
        };
        const { error: smsErr } = await supabase
          .from("sms_jobs")
          .upsert(smsRow, { onConflict: "booking_id,trigger_kind" });
        if (smsErr) {
          log("Failed to queue SMS reminder", { kind: r.kind, err: smsErr.message });
          skipped.push({ kind: `sms:${r.kind}`, reason: smsErr.message });
        } else {
          scheduled.push({
            kind: r.kind,
            scheduled_for: when.toISOString(),
            channel: `sms:${smsChannel}`,
          });
        }
      } else {
        skipped.push({ kind: `sms:${r.kind}`, reason: "no_phone" });
      }
    }

    return json({
      success: true,
      scheduled,
      skipped,
      sms_channel: smsChannel,
      service_start_utc: startUtc.toISOString(),
    });
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
