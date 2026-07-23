// lifecycle-engine — the outbound lifecycle runner (cadence + offers +
// campaigns). Invoked by pg_cron every 20 minutes; safe to invoke any
// number of times (all sends are deduped in lifecycle_sends).
//
// What one run does:
//   1. Refreshes customer retention (last_booking_at clock, stages).
//   2. CADENCE — for every customer with a last-booking clock, finds the
//      due step on their track and sends it:
//        * recurring members     → loyalty track (light, no pitches)
//        * exactly 1 completed   → recurring_conversion (Day-3 pitch)
//        * everyone else active  → reactivation (14/30/45/60/90)
//        * lapsed (120+)         → cadence stops; campaigns/offers only
//   3. OFFERS — active offers trickle out to their audience segment.
//   4. CAMPAIGNS — scheduled broadcasts whose time has come.
//
// Guards applied to EVERY send, in order:
//   * rebooked since the step's anchor → step no longer due (the anchor
//     IS last_booking_at, so a new booking resets the clock)
//   * per-channel opt-out (sms_opt_outs / email_opt_outs) → skipped
//   * quiet hours in the customer's local timezone → deferred to next run
//   * frequency cap (touches/week across cadence+offers+campaigns) → deferred
//   * dedupe (already sent/skipped for this step+anchor / offer / campaign)
//
// Channel rails: SMS via _shared/sms.ts (OpenPhone, state-routed number,
// STOP footer). Email via _shared/lifecycle-email.ts (Resend, branded
// shell, unsubscribe footer). Every outcome lands in lifecycle_sends.
//
// Personalization comes from real customer data — {{first_name}},
// {{last_service_type}}, {{days_since}}, {{last_clean_date}},
// {{completed_cleans}}, {{booking_link}}, {{incentive_text}}.
//
// Money rule: incentives are rendered from the step/offer's incentive
// config and always come from company margin — cleaner pay is calculated
// off full job value elsewhere and is never touched here.
//
// Input (all optional): { dryRun?: boolean, maxSends?: number }

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendSms } from "../_shared/sms.ts";
import { sendLifecycleEmail } from "../_shared/lifecycle-email.ts";
import { phoneDigits10 } from "../_shared/phone-format.ts";
import { timezoneForState } from "../_shared/openphone.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, data?: unknown) =>
  console.log(`[lifecycle-engine] ${step}`, data !== undefined ? JSON.stringify(data) : "");

const SMS_FOOTER = " Reply STOP to opt out.";
const CUSTOMER_BATCH = 1000;
const CAMPAIGN_BATCH = 200; // recipients per campaign per run
const OFFER_BATCH = 100;    // recipients per offer per run

interface Settings {
  engine_enabled: boolean;
  quiet_hours_start: number;
  quiet_hours_end: number;
  frequency_cap_per_week: number;
  attribution_window_days: number;
  cadence_grace_days: number;
  lapsed_after_days: number;
  default_timezone: string;
  booking_link: string;
}

interface CadenceStep {
  id: string;
  step_key: string;
  name: string;
  track: "reactivation" | "recurring_conversion" | "loyalty";
  day_offset: number;
  channel: "sms" | "email" | "both";
  enabled: boolean;
  sms_body: string | null;
  email_subject: string | null;
  email_body: string | null;
  incentive: { description?: string } | null;
}

interface Customer {
  id: string;
  email: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  name: string | null;
  state: string | null;
  postal_code: string | null;
  timezone: string | null;
  last_booking_at: string | null;
  next_booking_at: string | null;
  first_service_at: string | null;
  total_bookings: number;
  completed_bookings: number;
  lifecycle_stage: string;
  is_recurring_member: boolean;
  // enriched:
  lastServiceType?: string;
}

interface RunStats {
  sent: number;
  skipped: number;
  deferred: number;
  errors: number;
  details: Array<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// Personalization
// ---------------------------------------------------------------------------

const SERVICE_LABELS: Record<string, string> = {
  regular: "standard",
  standard: "standard",
  deep: "deep",
  move_in_out: "move-in/out",
  moveout: "move-in/out",
  recurring: "recurring",
};

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "your last visit";
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return "your last visit";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function renderTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => vars[key] ?? "");
}

function buildVars(c: Customer, settings: Settings, daysSince: number, incentive?: { description?: string } | null): Record<string, string> {
  return {
    first_name: c.first_name || (c.name || "").split(" ")[0] || "there",
    last_service_type: SERVICE_LABELS[c.lastServiceType || ""] || c.lastServiceType || "last",
    days_since: String(daysSince),
    last_clean_date: fmtDate(c.last_booking_at),
    completed_cleans: String(c.completed_bookings || 0),
    booking_link: settings.booking_link,
    incentive_text: incentive?.description || "a little something extra",
  };
}

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

function localHour(tz: string): number {
  try {
    const hour = new Intl.DateTimeFormat("en-US", {
      hour: "numeric", hour12: false, timeZone: tz,
    }).format(new Date());
    return parseInt(hour, 10) % 24;
  } catch {
    return new Date().getUTCHours();
  }
}

function customerTimezone(c: Customer, settings: Settings): string {
  return c.timezone || timezoneForState(c.state, c.postal_code) || settings.default_timezone;
}

function withinSendWindow(c: Customer, settings: Settings): boolean {
  const hour = localHour(customerTimezone(c, settings));
  return hour >= settings.quiet_hours_start && hour < settings.quiet_hours_end;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const stats: RunStats = { sent: 0, skipped: 0, deferred: 0, errors: 0, details: [] };

  try {
    const body = await req.json().catch(() => ({}));
    const dryRun = Boolean(body?.dryRun);
    const maxSends = Number(body?.maxSends) > 0 ? Number(body.maxSends) : 200;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    ) as SupabaseClient;

    const { data: settingsRow } = await supabase
      .from("lifecycle_settings").select("*").eq("id", 1).maybeSingle();
    const settings = settingsRow as Settings | null;
    if (!settings) throw new Error("lifecycle_settings row missing");
    if (!settings.engine_enabled) {
      log("engine disabled — exiting");
      return json({ success: true, skipped: "engine_disabled" });
    }

    // Keep the clock + stages fresh before evaluating anyone.
    const { error: refreshError } = await supabase.rpc("refresh_customer_retention");
    if (refreshError) log("retention refresh failed (continuing)", { error: refreshError.message });

    // Auto-expire offers whose window closed.
    await supabase.from("lifecycle_offers")
      .update({ status: "ended", updated_at: new Date().toISOString() })
      .eq("status", "active")
      .not("ends_at", "is", null)
      .lt("ends_at", new Date().toISOString());

    const { data: steps } = await supabase
      .from("lifecycle_cadence_steps").select("*").eq("enabled", true).order("day_offset");

    const { data: customersRaw } = await supabase
      .from("customers")
      .select("id, email, phone, first_name, last_name, name, state, postal_code, timezone, last_booking_at, next_booking_at, first_service_at, total_bookings, completed_bookings, lifecycle_stage, is_recurring_member")
      .limit(CUSTOMER_BATCH);
    const customers = (customersRaw || []) as Customer[];

    await enrichLastServiceType(supabase, customers);

    const ctx: EngineContext = { supabase, settings, dryRun, stats, maxSends };

    // ---------------- 1. Cadence ----------------
    const withClock = customers.filter((c) => c.last_booking_at);
    for (const c of withClock) {
      if (stats.sent >= maxSends) break;
      const step = pickDueStep(c, (steps || []) as CadenceStep[], settings);
      if (!step) continue;
      await dispatchTouch(ctx, c, {
        track: "cadence",
        stepId: step.id,
        anchorDate: String(c.last_booking_at).slice(0, 10),
        channel: step.channel,
        smsBody: step.sms_body,
        emailSubject: step.email_subject,
        emailBody: step.email_body,
        incentive: step.incentive,
        label: `lifecycle:${step.step_key}`,
      });
    }

    // ---------------- 2. Offers ----------------
    const { data: offers } = await supabase
      .from("lifecycle_offers")
      .select("*")
      .eq("status", "active")
      .lte("starts_at", new Date().toISOString());
    for (const offer of offers || []) {
      if (stats.sent >= maxSends) break;
      const audience = filterAudience(customers, offer.audience, offer.custom_filter);
      let sentForOffer = 0;
      for (const c of audience) {
        if (stats.sent >= maxSends || sentForOffer >= OFFER_BATCH) break;
        const did = await dispatchTouch(ctx, c, {
          track: "offer",
          offerId: offer.id,
          channel: offer.channel,
          smsBody: offer.sms_body,
          emailSubject: offer.email_subject,
          emailBody: offer.email_body,
          incentive: offer.incentive,
          label: `offer:${offer.name}`,
        });
        if (did) sentForOffer++;
      }
    }

    // ---------------- 3. Campaigns ----------------
    const { data: campaigns } = await supabase
      .from("lifecycle_campaigns")
      .select("*")
      .in("status", ["scheduled", "sending"])
      .lte("scheduled_at", new Date().toISOString());
    for (const campaign of campaigns || []) {
      if (stats.sent >= maxSends) break;
      if (campaign.status === "scheduled" && !dryRun) {
        await supabase.from("lifecycle_campaigns")
          .update({ status: "sending", updated_at: new Date().toISOString() })
          .eq("id", campaign.id);
      }
      const audience = filterAudience(customers, campaign.segment, campaign.custom_filter);
      let remaining = 0;
      let sentForCampaign = 0;
      for (const c of audience) {
        if (stats.sent >= maxSends || sentForCampaign >= CAMPAIGN_BATCH) {
          remaining++;
          continue;
        }
        const did = await dispatchTouch(ctx, c, {
          track: "campaign",
          campaignId: campaign.id,
          channel: campaign.channel,
          smsBody: campaign.sms_body,
          emailSubject: campaign.email_subject,
          emailBody: campaign.email_body,
          label: `campaign:${campaign.name}`,
        });
        if (did === "deferred") remaining++;
        if (did === true) sentForCampaign++;
      }
      if (!dryRun) {
        const updates: Record<string, unknown> = {
          sent_count: (campaign.sent_count || 0) + sentForCampaign,
          updated_at: new Date().toISOString(),
        };
        if (remaining === 0) updates.status = "sent";
        await supabase.from("lifecycle_campaigns").update(updates).eq("id", campaign.id);
      }
    }

    log("run complete", { sent: stats.sent, skipped: stats.skipped, deferred: stats.deferred, errors: stats.errors, dryRun });
    return json({ success: true, dryRun, ...stats, details: dryRun ? stats.details : stats.details.slice(0, 50) });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("ERROR", { message });
    return json({ success: false, error: message, ...stats }, 500);
  }
});

// ---------------------------------------------------------------------------
// Cadence step selection
// ---------------------------------------------------------------------------

function pickDueStep(c: Customer, steps: CadenceStep[], settings: Settings): CadenceStep | null {
  const daysSince = Math.floor(
    (Date.now() - new Date(c.last_booking_at as string).getTime()) / 86_400_000,
  );
  if (daysSince < 0) return null;

  let track: CadenceStep["track"];
  if (c.is_recurring_member) {
    track = "loyalty"; // members get the light track — no reactivation, no pitches
  } else if (c.next_booking_at) {
    return null; // they already have an upcoming clean — nothing to reactivate
  } else if (c.lifecycle_stage === "lapsed" || daysSince >= settings.lapsed_after_days) {
    return null; // auto-cadence stops at 120+; campaigns/offers still reach them
  } else if (c.completed_bookings === 1) {
    // Post-first-clean: conversion steps take priority; reactivation
    // steps still apply once the conversion window has passed.
    const conv = steps.find(
      (s) => s.track === "recurring_conversion" &&
        daysSince >= s.day_offset &&
        daysSince < s.day_offset + settings.cadence_grace_days,
    );
    if (conv) return conv;
    track = "reactivation";
  } else {
    track = "reactivation";
  }

  // The latest step that is due and still within its grace window.
  const due = steps
    .filter((s) => s.track === track &&
      daysSince >= s.day_offset &&
      daysSince < s.day_offset + settings.cadence_grace_days)
    .sort((a, b) => b.day_offset - a.day_offset);
  return due[0] || null;
}

// ---------------------------------------------------------------------------
// Audience segmentation (offers + campaigns)
// ---------------------------------------------------------------------------

function daysSinceLast(c: Customer): number | null {
  if (!c.last_booking_at) return null;
  return Math.floor((Date.now() - new Date(c.last_booking_at).getTime()) / 86_400_000);
}

function filterAudience(customers: Customer[], audience: string, customFilter?: Record<string, unknown>): Customer[] {
  return customers.filter((c) => {
    if (!c.phone && !c.email) return false;
    const days = daysSinceLast(c);
    switch (audience) {
      case "new_0_30":
        return days !== null && days <= 30 && !c.is_recurring_member;
      case "lapsed_31_90":
        return days !== null && days >= 31 && days <= 90 && !c.is_recurring_member;
      case "lapsed_90_plus":
        return days !== null && days > 90 && !c.is_recurring_member;
      case "active":
        return c.lifecycle_stage === "active";
      case "recurring_members":
        return c.is_recurring_member;
      case "all":
        return true;
      case "custom": {
        const f = (customFilter || {}) as {
          states?: string[]; min_days_since?: number; max_days_since?: number;
          recurring?: boolean; service_types?: string[];
        };
        if (f.states?.length) {
          const st = String(c.state || "").trim().toUpperCase();
          if (!f.states.map((s) => String(s).toUpperCase()).includes(st)) return false;
        }
        if (typeof f.recurring === "boolean" && c.is_recurring_member !== f.recurring) return false;
        if (f.min_days_since != null && (days === null || days < f.min_days_since)) return false;
        if (f.max_days_since != null && (days === null || days > f.max_days_since)) return false;
        if (f.service_types?.length && !f.service_types.includes(c.lastServiceType || "")) return false;
        return true;
      }
      default:
        return false;
    }
  });
}

// ---------------------------------------------------------------------------
// Dispatch — one touch (possibly two channel sends) with all guards
// ---------------------------------------------------------------------------

interface EngineContext {
  supabase: SupabaseClient;
  settings: Settings;
  dryRun: boolean;
  stats: RunStats;
  maxSends: number;
}

interface Touch {
  track: "cadence" | "offer" | "campaign";
  stepId?: string;
  offerId?: string;
  campaignId?: string;
  anchorDate?: string;
  channel: "sms" | "email" | "both";
  smsBody?: string | null;
  emailSubject?: string | null;
  emailBody?: string | null;
  incentive?: { description?: string } | null;
  label: string;
}

/** Returns true when at least one channel send went out, "deferred" when
 * deferred to a later run, false when skipped/deduped. */
async function dispatchTouch(ctx: EngineContext, c: Customer, touch: Touch): Promise<boolean | "deferred"> {
  const { supabase, settings, dryRun, stats } = ctx;
  const daysSince = daysSinceLast(c) ?? 0;
  const channels: Array<"sms" | "email"> =
    touch.channel === "both" ? ["sms", "email"] : [touch.channel];

  // Dedupe first (cheap, and skips the guard queries for handled touches).
  const pending: Array<"sms" | "email"> = [];
  for (const channel of channels) {
    if (await alreadyHandled(supabase, c, touch, channel)) continue;
    pending.push(channel);
  }
  if (pending.length === 0) return false;

  // Quiet hours — defer the whole touch to a later run.
  if (!withinSendWindow(c, settings)) {
    stats.deferred++;
    return "deferred";
  }

  // Frequency cap across all tracks (rolling 7 days) — defer, don't drop.
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const { count } = await supabase
    .from("lifecycle_sends")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", c.id)
    .eq("status", "sent")
    .gt("created_at", weekAgo);
  if ((count || 0) >= settings.frequency_cap_per_week) {
    stats.deferred++;
    return "deferred";
  }

  const vars = buildVars(c, settings, daysSince, touch.incentive);
  let anySent = false;

  for (const channel of pending) {
    const base = {
      customer_id: c.id,
      phone_digits: c.phone ? phoneDigits10(c.phone) : null,
      email: c.email ? c.email.trim().toLowerCase() : null,
      track: touch.track,
      step_id: touch.stepId || null,
      offer_id: touch.offerId || null,
      campaign_id: touch.campaignId || null,
      anchor_date: touch.anchorDate || null,
      channel,
    };

    if (channel === "sms") {
      if (!c.phone) {
        await recordSend(ctx, { ...base, status: "skipped", skip_reason: "no_phone" });
        continue;
      }
      if (await smsOptedOut(supabase, c.phone)) {
        await recordSend(ctx, { ...base, status: "skipped", skip_reason: "opted_out" });
        continue;
      }
      if (!touch.smsBody) {
        await recordSend(ctx, { ...base, status: "skipped", skip_reason: "no_sms_copy" });
        continue;
      }
      const message = renderTemplate(touch.smsBody, vars) + SMS_FOOTER;
      if (dryRun) {
        stats.details.push({ customer: c.id, channel, label: touch.label, message });
        continue;
      }
      const res = await sendSms({
        to: c.phone,
        message,
        state: c.state,
        zip: c.postal_code,
        email: c.email,
        firstName: c.first_name,
        lastName: c.last_name,
        name: c.name,
        context: touch.label,
      });
      if (res.suppressed) {
        await recordSend(ctx, { ...base, status: "skipped", skip_reason: "opted_out", body: message });
      } else if (res.success) {
        anySent = true;
        await recordSend(ctx, {
          ...base, status: "sent", body: message,
          provider: res.provider, provider_message_id: res.messageId || null,
          from_number: res.fromNumber || null,
        });
      } else {
        stats.errors++;
        await recordSend(ctx, { ...base, status: "failed", body: message, skip_reason: res.error?.slice(0, 300) });
      }
    } else {
      if (!c.email) {
        await recordSend(ctx, { ...base, status: "skipped", skip_reason: "no_email" });
        continue;
      }
      if (await emailOptedOut(supabase, c.email)) {
        await recordSend(ctx, { ...base, status: "skipped", skip_reason: "opted_out" });
        continue;
      }
      if (!touch.emailBody || !touch.emailSubject) {
        await recordSend(ctx, { ...base, status: "skipped", skip_reason: "no_email_copy" });
        continue;
      }
      const subject = renderTemplate(touch.emailSubject, vars);
      const bodyHtml = renderTemplate(touch.emailBody, vars);
      if (dryRun) {
        stats.details.push({ customer: c.id, channel, label: touch.label, subject });
        continue;
      }
      const res = await sendLifecycleEmail({
        to: c.email,
        subject,
        bodyHtml,
        ctaUrl: settings.booking_link,
        ctaLabel: "Book your next clean",
      });
      if (res.ok) {
        anySent = true;
        await recordSend(ctx, {
          ...base, status: "sent", subject, body: bodyHtml,
          provider: "resend", provider_message_id: res.id || null,
        });
      } else {
        stats.errors++;
        await recordSend(ctx, { ...base, status: "failed", subject, skip_reason: res.error?.slice(0, 300) });
      }
    }
  }

  return anySent;
}

async function alreadyHandled(
  supabase: SupabaseClient, c: Customer, touch: Touch, channel: "sms" | "email",
): Promise<boolean> {
  let q = supabase
    .from("lifecycle_sends")
    .select("id")
    .eq("customer_id", c.id)
    .eq("channel", channel)
    .in("status", ["sent", "skipped"])
    .limit(1);
  if (touch.stepId) q = q.eq("step_id", touch.stepId).eq("anchor_date", touch.anchorDate);
  else if (touch.offerId) q = q.eq("offer_id", touch.offerId);
  else if (touch.campaignId) q = q.eq("campaign_id", touch.campaignId);
  const { data } = await q;
  return Boolean(data && data.length > 0);
}

async function smsOptedOut(supabase: SupabaseClient, phone: string): Promise<boolean> {
  const digits = phoneDigits10(phone);
  if (!digits) return true;
  const { data } = await supabase
    .from("sms_opt_outs").select("phone_digits").eq("phone_digits", digits).maybeSingle();
  return Boolean(data);
}

async function emailOptedOut(supabase: SupabaseClient, email: string): Promise<boolean> {
  const { data } = await supabase
    .from("email_opt_outs").select("email").eq("email", email.trim().toLowerCase()).maybeSingle();
  return Boolean(data);
}

async function recordSend(ctx: EngineContext, row: Record<string, unknown>): Promise<void> {
  if (ctx.dryRun) {
    ctx.stats.details.push(row);
    if (row.status === "skipped") ctx.stats.skipped++;
    return;
  }
  if (row.status === "sent") ctx.stats.sent++;
  if (row.status === "skipped") ctx.stats.skipped++;
  try {
    await ctx.supabase.from("lifecycle_sends").insert(row);
  } catch (err) {
    log("failed to record send", { error: String(err), row });
  }
}

// ---------------------------------------------------------------------------
// Enrichment — last service type per customer, one batched query
// ---------------------------------------------------------------------------

async function enrichLastServiceType(supabase: SupabaseClient, customers: Customer[]): Promise<void> {
  const ids = customers.filter((c) => c.last_booking_at).map((c) => c.id);
  if (ids.length === 0) return;
  const { data } = await supabase
    .from("bookings")
    .select("customer_id, service_type, service_date")
    .in("customer_id", ids)
    .in("status", ["completed", "confirmed"])
    .order("service_date", { ascending: false })
    .limit(3000);
  const seen = new Map<string, string>();
  for (const b of data || []) {
    if (!seen.has(b.customer_id) && b.service_type) seen.set(b.customer_id, b.service_type);
  }
  for (const c of customers) {
    c.lastServiceType = seen.get(c.id);
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
