// ghl-new-lead-notify — ping the zip-matched market inbox when a new
// lead lands in GoHighLevel.
//
// Trigger (wire in GHL, no JWT):
//   • Workflow: Contact Created  → POST this URL
//   • Workflow: Facebook Lead Form submitted → POST this URL
//   • Native webhook: ContactCreate
//
// What it does:
//   1. Parse the contact (Facebook Lead Ads payloads are messy — we
//      probe every field name GHL has used, and fetch the contact from
//      the API when the webhook is thin).
//   2. Resolve NJ / TX / CA / NY from ZIP (then state, then default).
//   3. SMS the lead's details TO that market's number in
//      `sms_state_numbers`, FROM the GHL/LeadConnector number.
//      OpenPhone is not used as from or failover: the destination IS
//      the OpenPhone line, and a failover send would text it to itself.
//
// Idempotent on `ghl_contact_id`. Skips ContactUpdate / inbound SMS /
// appointment events, and skips the four market numbers themselves so
// creating the destination contact cannot loop.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  formatUsNumber,
  resolveStateNumber,
  type StateCode,
} from "../_shared/openphone.ts";
import { formatPhoneDisplayUS, phoneDigits10, toE164US } from "../_shared/phone-format.ts";

const GHL_BASE = "https://services.leadconnectorhq.com";

async function ghlRequest(
  creds: { token: string; locationId: string },
  path: string,
  init: RequestInit & { query?: Record<string, string>; version?: string } = {},
) {
  const url = new URL(path.startsWith("http") ? path : `${GHL_BASE}${path}`);
  for (const [k, v] of Object.entries(init.query || {})) url.searchParams.set(k, v);
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${creds.token}`);
  headers.set("Version", init.version || "2021-07-28");
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const res = await fetch(url.toString(), { method: init.method || "GET", headers, body: init.body });
  const raw = await res.text();
  let data: any = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
  return { ok: res.ok, status: res.status, data };
}

async function sendInboxSms(opts: {
  creds: { token: string; locationId: string };
  to: string;
  message: string;
  stateCode: string;
}): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const upsert = await ghlRequest(opts.creds, "/contacts/upsert", {
    method: "POST",
    body: JSON.stringify({
      locationId: opts.creds.locationId,
      phone: opts.to,
      firstName: "AlphaLux",
      lastName: `${opts.stateCode} Inbox`,
      name: `AlphaLux ${opts.stateCode} Inbox`,
      source: "AlphaLux SMS",
      country: "US",
    }),
  });
  const contactId =
    upsert.data?.contact?.id || upsert.data?.id || upsert.data?.contactId;
  if (!contactId) {
    return {
      ok: false,
      error: `no GHL contact could be resolved (${upsert.status})`,
    };
  }
  const sent = await ghlRequest(opts.creds, "/conversations/messages", {
    method: "POST",
    version: "2021-04-15",
    body: JSON.stringify({ type: "SMS", contactId, message: opts.message }),
  });
  if (!sent.ok) {
    return {
      ok: false,
      error: `GHL SMS failed (status ${sent.status}): ${JSON.stringify(sent.data)?.slice(0, 200)}`,
    };
  }
  return {
    ok: true,
    messageId: sent.data?.messageId || sent.data?.id,
  };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-ghl-notify-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const log = (step: string, data?: unknown) =>
  console.log(
    `[ghl-new-lead-notify] ${step}`,
    data !== undefined ? JSON.stringify(data) : "",
  );

const IGNORED_TYPES = new Set([
  "contactupdate",
  "contactdndupdate",
  "contacttagupdate",
  "contactdelete",
  "inboundmessage",
  "outboundmessage",
  "appointment.create",
  "appointment.created",
  "appointment.update",
  "appointment.updated",
  "appointment.cancelled",
  "appointment.rescheduled",
  "note.create",
  "task.create",
]);

const ACCEPTED_TYPES = new Set([
  "contactcreate",
  "contact.created",
  "opportunitycreate",
  "opportunity.created",
  "facebookleadform",
  "facebook_lead_form",
  "leadcreate",
]);

function pick(obj: any, paths: string[]): any {
  for (const p of paths) {
    const parts = p.split(".");
    let cur = obj;
    let ok = true;
    for (const part of parts) {
      if (cur && typeof cur === "object" && part in cur) cur = cur[part];
      else {
        ok = false;
        break;
      }
    }
    if (ok && cur !== undefined && cur !== null && cur !== "") return cur;
  }
  return undefined;
}

function asString(v: unknown): string {
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

function extractZip(raw: string): string {
  const m = String(raw || "").match(/\b(\d{5})(?:-\d{4})?\b/);
  return m ? m[1] : "";
}

function looksLikeFacebook(source: string, tags: string[], extra: string): boolean {
  const blob = `${source} ${tags.join(" ")} ${extra}`.toLowerCase();
  return /\b(facebook|fb[\s_-]?lead|meta ads?|instagram|ig lead)\b/.test(blob);
}

function parseLead(body: any) {
  const type = asString(
    pick(body, ["type", "event", "triggerName", "trigger", "webhookType"]),
  );
  const contactIdPaths = [
    "contactId",
    "contact_id",
    "contact.id",
    "customData.contactId",
    "opportunity.contactId",
    "data.contact.id",
  ];
  // Native ContactCreate uses `id` as the contact id. Other events use
  // `id` for the opportunity/event, so only trust it on create.
  if (/contactcreate|contact\.created/.test(type.toLowerCase())) {
    contactIdPaths.push("id", "data.id");
  }
  const contactId = asString(pick(body, contactIdPaths));
  const firstName = asString(
    pick(body, [
      "firstName",
      "first_name",
      "contact.firstName",
      "contact.first_name",
      "data.firstName",
    ]),
  );
  const lastName = asString(
    pick(body, [
      "lastName",
      "last_name",
      "contact.lastName",
      "contact.last_name",
      "data.lastName",
    ]),
  );
  const fullName = asString(
    pick(body, [
      "full_name",
      "fullName",
      "name",
      "contact.name",
      "contact.fullName",
    ]),
  );
  const email = asString(
    pick(body, ["email", "contact.email", "data.email", "customData.email"]),
  ).toLowerCase();
  const phone = asString(
    pick(body, [
      "phone",
      "phoneNumber",
      "phone_number",
      "contact.phone",
      "data.phone",
      "customData.phone",
    ]),
  );
  const zip = extractZip(
    asString(
      pick(body, [
        "postalCode",
        "postal_code",
        "zip",
        "zipCode",
        "zip_code",
        "contact.postalCode",
        "contact.address.postalCode",
        "address.postalCode",
        "data.postalCode",
        "customData.postalCode",
        "customData.zip",
      ]),
    ),
  );
  const city = asString(
    pick(body, ["city", "contact.city", "address.city", "data.city"]),
  );
  const state = asString(
    pick(body, [
      "state",
      "contact.state",
      "address.state",
      "data.state",
      "customData.state",
    ]),
  );
  const source = asString(
    pick(body, [
      "source",
      "contact.source",
      "attributionSource",
      "sessionSource",
      "data.source",
      "customData.source",
    ]),
  );
  const fbLeadId = asString(
    pick(body, [
      "facebookLeadId",
      "facebook_lead_id",
      "fb_lead_id",
      "leadId",
      "customData.fb_lead_id",
    ]),
  );
  const tagsRaw = pick(body, ["tags", "contact.tags", "data.tags"]) ?? [];
  const tags: string[] = Array.isArray(tagsRaw)
    ? tagsRaw.map((t) => (typeof t === "string" ? t : t?.name || "")).filter(Boolean)
    : typeof tagsRaw === "string"
      ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
      : [];
  const messageBody = asString(
    pick(body, [
      "message",
      "body",
      "messageBody",
      "text",
      "message.body",
      "message.message",
    ]),
  );

  return {
    type,
    contactId,
    firstName,
    lastName,
    fullName,
    email,
    phone,
    zip,
    city,
    state,
    source,
    fbLeadId,
    tags,
    messageBody,
  };
}

function displayName(lead: ReturnType<typeof parseLead>): string {
  const joined = [lead.firstName, lead.lastName].filter(Boolean).join(" ");
  return joined || lead.fullName || "Unknown name";
}

function sourceLabel(lead: ReturnType<typeof parseLead>): string {
  if (lead.fbLeadId || looksLikeFacebook(lead.source, lead.tags, lead.fbLeadId)) {
    return lead.source ? `Facebook (${lead.source})` : "Facebook Lead Ads";
  }
  return lead.source || "GHL";
}

function buildMessage(opts: {
  lead: ReturnType<typeof parseLead>;
  stateCode: StateCode;
}): string {
  const { lead, stateCode } = opts;
  const lines = [
    `New GHL lead · ${sourceLabel(lead)}`,
    displayName(lead),
  ];
  if (lead.phone) lines.push(formatPhoneDisplayUS(lead.phone) || lead.phone);
  if (lead.email) lines.push(lead.email);
  const loc = [lead.city, lead.state || stateCode, lead.zip ? `ZIP ${lead.zip}` : ""]
    .filter(Boolean)
    .join(" · ");
  lines.push(loc || `Market: ${stateCode}`);
  if (lead.tags.length) lines.push(`Tags: ${lead.tags.slice(0, 4).join(", ")}`);
  return lines.join("\n");
}

function authorize(req: Request): boolean {
  const secret = (Deno.env.get("GHL_LEAD_NOTIFY_SECRET") || "").trim();
  if (!secret) return true;
  const url = new URL(req.url);
  const fromQuery = url.searchParams.get("secret") || "";
  const fromHeader = req.headers.get("x-ghl-notify-secret") || "";
  return fromQuery === secret || fromHeader === secret;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ success: false, error: "POST only" }, 405);
  }
  if (!authorize(req)) {
    return json({ success: false, error: "unauthorized" }, 401);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = parseLead(body);
    const typeKey = parsed.type.toLowerCase().replace(/\s+/g, "");

    log("received", {
      type: parsed.type || "(workflow)",
      contactId: parsed.contactId || null,
      hasPhone: !!parsed.phone,
      hasEmail: !!parsed.email,
      zip: parsed.zip || null,
    });

    if (typeKey && IGNORED_TYPES.has(typeKey)) {
      return json({ success: true, skipped: "ignored_event_type", type: parsed.type });
    }
    if (typeKey && !ACCEPTED_TYPES.has(typeKey) && parsed.messageBody && !parsed.email && !parsed.zip) {
      // Inbound SMS / conversation webhook without being labelled as such.
      return json({ success: true, skipped: "looks_like_inbound_sms" });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    let ghlCreds: { token: string; locationId: string } | null = null;
    try {
      const { data: secretRows } = await supabase
        .from("app_secrets")
        .select("name, value")
        .in("name", ["GHL_PIT_TOKEN", "GHL_LOCATION_ID"]);
      const map = Object.fromEntries(
        (secretRows || []).map((r: { name: string; value: string }) => [r.name, r.value]),
      );
      if (map.GHL_PIT_TOKEN && map.GHL_LOCATION_ID) {
        ghlCreds = {
          token: String(map.GHL_PIT_TOKEN).trim(),
          locationId: String(map.GHL_LOCATION_ID).trim(),
        };
      }
    } catch (err) {
      log("app_secrets GHL lookup failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // Enrich from GHL when the webhook only sent an id (common for FB).
    let lead = parsed;
    if (lead.contactId && (!lead.phone || !lead.zip || !lead.email || !lead.firstName)) {
      try {
        if (ghlCreds) {
          const got = await ghlRequest(ghlCreds, `/contacts/${lead.contactId}`);
          const contact = got.data?.contact || (got.ok ? got.data : null);
          if (contact) {
            lead = parseLead({ ...contact, ...body, contactId: lead.contactId, id: lead.contactId });
            lead.zip = parsed.zip || lead.zip;
            lead.source = parsed.source || lead.source;
            lead.fbLeadId = parsed.fbLeadId || lead.fbLeadId;
            lead.tags = parsed.tags.length ? parsed.tags : lead.tags;
          }
        }
      } catch (err) {
        log("ghl getContact failed (continuing with payload)", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    if (!lead.contactId && !lead.phone && !lead.email) {
      return json({ success: true, skipped: "no_contact_identity" });
    }

    const marketNumbers = await loadMarketNumbers(supabase);
    const destDigits = new Set(marketNumbers.map((n) => phoneDigits10(n.phone_e164)));
    if (lead.phone && destDigits.has(phoneDigits10(lead.phone))) {
      log("skip — contact is a market inbox number", { phone: phoneDigits10(lead.phone) });
      return json({ success: true, skipped: "destination_number" });
    }

    const stateNumber = await resolveStateNumber({
      state: lead.state,
      zip: lead.zip,
      supabase,
    });
    const destE164 = toE164US(
      marketNumbers.find((n) => n.state_code === stateNumber.stateCode)?.phone_e164
        || stateNumber.phoneE164,
    );
    if (!destE164) {
      return json({ success: false, error: "no destination number for market" }, 500);
    }

    const claimKey = lead.contactId || `email:${lead.email}` || `phone:${phoneDigits10(lead.phone)}`;
    const { data: claimed, error: claimErr } = await supabase
      .from("ghl_new_lead_notifications")
      .insert({
        ghl_contact_id: claimKey,
        email: lead.email || null,
        phone_digits: phoneDigits10(lead.phone) || null,
        first_name: lead.firstName || null,
        last_name: lead.lastName || null,
        zip_code: lead.zip || null,
        state_code: stateNumber.stateCode,
        source: sourceLabel(lead),
        notified_number: destE164,
      })
      .select("ghl_contact_id")
      .maybeSingle();

    if (claimErr) {
      // Unique violation → already notified.
      if (String(claimErr.code) === "23505" || /duplicate/i.test(claimErr.message)) {
        log("already notified", { claimKey });
        return json({ success: true, skipped: "already_sent", contactId: claimKey });
      }
      throw claimErr;
    }
    if (!claimed) {
      return json({ success: true, skipped: "already_sent", contactId: claimKey });
    }

    const message = buildMessage({
      lead,
      stateCode: stateNumber.stateCode,
    });

    if (!ghlCreds) {
      await supabase.from("ghl_new_lead_notifications").delete().eq("ghl_contact_id", claimKey);
      return json({ success: false, error: "GHL_PIT_TOKEN / GHL_LOCATION_ID missing from app_secrets" }, 200);
    }

    const sent = await sendInboxSms({
      creds: ghlCreds,
      to: destE164,
      message,
      stateCode: stateNumber.stateCode,
    });

    if (!sent.ok) {
      await supabase.from("ghl_new_lead_notifications").delete().eq("ghl_contact_id", claimKey);
      log("GHL SMS failed — claim released", { error: sent.error, destE164 });
      return json(
        { success: false, error: sent.error || "GHL SMS failed", contactId: claimKey },
        200, // don't make GHL retry-storm; claim is released for a later event
      );
    }

    await supabase
      .from("ghl_new_lead_notifications")
      .update({ provider_message_id: sent.messageId || null })
      .eq("ghl_contact_id", claimKey);

    log("notified", {
      contactId: claimKey,
      market: stateNumber.stateCode,
      to: destE164,
      from: "ghl",
      source: sourceLabel(lead),
      messageId: sent.messageId,
    });

    return json({
      success: true,
      contactId: claimKey,
      market: stateNumber.stateCode,
      notifiedNumber: formatUsNumber(destE164),
      source: sourceLabel(lead),
      messageId: sent.messageId,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return json({ success: false, error: msg }, 500);
  }
});

async function loadMarketNumbers(supabase: { from: (t: string) => any }) {
  const { data } = await supabase
    .from("sms_state_numbers")
    .select("state_code, phone_e164");
  return (data || []) as Array<{ state_code: string; phone_e164: string }>;
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
