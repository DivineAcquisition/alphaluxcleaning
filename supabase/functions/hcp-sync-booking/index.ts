// hcp-sync-booking — server-to-server Housecall Pro sync triggered
// after a booking's address + schedule are saved. Loads the booking
// from Supabase and POSTs a job into HCP, mirroring what the
// browser-side /api/create-job route does — but server-side, so the
// job lands in HCP even when the customer never reaches the
// confirmation page (closed tab, network drop, etc.).
//
// Idempotent: if the booking already has an `hcp_job_id`, we skip and
// return success.
//
// Input: { booking_id: uuid }

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const HCP_BASE_URL = "https://api.housecallpro.com";

const log = (step: string, data?: unknown) =>
  console.log(
    `[hcp-sync-booking] ${step}`,
    data !== undefined ? JSON.stringify(data) : "",
  );

function getHcpApiKey(): string | null {
  // Same precedence as /app/api/create-job/route.ts so ops only has
  // one secret to manage.
  return (
    Deno.env.get("HCP_API_KEY") ||
    Deno.env.get("HOUSECALL_PRO_API_KEY") ||
    Deno.env.get("HCP_LIVE_API_KEY") ||
    null
  );
}

function hcpHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Token token=${apiKey}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

async function hcpFetch(
  path: string,
  init: RequestInit,
  apiKey: string,
): Promise<{ status: number; body: any; ok: boolean }> {
  const url = path.startsWith("http") ? path : `${HCP_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: { ...hcpHeaders(apiKey), ...(init.headers || {}) },
  });
  const text = await res.text();
  let body: any = null;
  if (text) {
    try { body = JSON.parse(text); } catch { body = text; }
  }
  return { status: res.status, body, ok: res.ok };
}

function addHours(iso: string, hours: number): string {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return iso;
  d.setTime(d.getTime() + hours * 60 * 60 * 1000);
  return d.toISOString();
}

function timeSlotToIsoWindow(date: string, slot: string | null): {
  start: string;
  end: string;
} {
  // Accept string slots ("morning", "1 PM - 3 PM", etc.). Falls back
  // to a 9–13 default if we can't parse.
  const slotMap: Record<string, [number, number]> = {
    early_morning: [7, 9],
    morning: [9, 11],
    late_morning: [11, 13],
    afternoon: [13, 15],
    late_afternoon: [15, 17],
    evening: [17, 19],
  };
  let startHour = 9;
  let endHour = 13;
  if (slot && slotMap[slot]) {
    [startHour, endHour] = slotMap[slot];
  } else if (slot) {
    const m = slot.match(/(\d{1,2}).*?(\d{1,2})/);
    if (m) {
      startHour = parseInt(m[1], 10) || 9;
      endHour = parseInt(m[2], 10) || startHour + 2;
      if (/pm/i.test(slot)) {
        if (startHour < 12) startHour += 12;
        if (endHour < 12) endHour += 12;
      }
    }
  }
  const [y, mo, d] = date.split("-").map(Number);
  if (!y || !mo || !d) return { start: date, end: date };
  // Eastern offset (EDT). Same heuristic as queue-booking-reminders.
  const offset = 4;
  const start = new Date(Date.UTC(y, mo - 1, d, startHour + offset, 0, 0)).toISOString();
  const end = new Date(Date.UTC(y, mo - 1, d, endHour + offset, 0, 0)).toISOString();
  return { start, end };
}

function prettyService(type: string): string {
  const m: Record<string, string> = {
    deep: "Deep Clean",
    move_in_out: "Move In / Move Out Clean",
    moveout: "Move In / Move Out Clean",
    regular: "Standard Cleaning",
    standard: "Standard Cleaning",
    recurring: "Recurring Maintenance",
  };
  return m[type] || "Cleaning Service";
}

function buildHcpAddress(b: any) {
  return {
    type: "service",
    street: b.address_line1 || "",
    street_line_2: b.address_line2 || null,
    city: b.customer?.city || "",
    state: b.customer?.state || "",
    zip: b.zip_code || b.customer?.postal_code || "",
    country: "US",
  };
}

async function ensureCustomer(
  apiKey: string,
  email: string,
  firstName: string,
  lastName: string,
  phone: string | undefined,
  address: any,
  serviceType: string,
): Promise<{ customerId: string; addressId: string }> {
  const lookup = await hcpFetch(
    `/customers?q=${encodeURIComponent(email)}`,
    { method: "GET" },
    apiKey,
  );
  if (!lookup.ok && lookup.status !== 404) {
    throw new Error(`HCP customer lookup ${lookup.status}: ${JSON.stringify(lookup.body)}`);
  }
  const candidates: any[] = Array.isArray(lookup.body)
    ? lookup.body
    : lookup.body?.customers || lookup.body?.data || lookup.body?.results || [];
  const norm = (v: any) => String(v ?? "").trim().toLowerCase();
  const matched = candidates.find((c) => {
    const e = norm(c?.email || c?.primary_email);
    if (e === email) return true;
    if (Array.isArray(c?.emails)) {
      return c.emails.some((x: any) =>
        typeof x === "string"
          ? norm(x) === email
          : norm(x?.address || x?.email) === email,
      );
    }
    return false;
  });

  if (matched?.id) {
    let addrs: any[] = Array.isArray(matched.addresses) ? matched.addresses : [];
    if (addrs.length === 0) {
      const al = await hcpFetch(`/customers/${matched.id}/addresses`, { method: "GET" }, apiKey);
      if (al.ok) addrs = Array.isArray(al.body) ? al.body : al.body?.addresses || al.body?.data || [];
    }
    const existing = addrs.find((a) =>
      norm(a.street) === norm(address.street) &&
      norm(a.city) === norm(address.city) &&
      norm(a.zip) === norm(address.zip),
    );
    if (existing?.id) return { customerId: matched.id, addressId: existing.id };
    const create = await hcpFetch(
      `/customers/${matched.id}/addresses`,
      { method: "POST", body: JSON.stringify(address) },
      apiKey,
    );
    if (!create.ok) throw new Error(`HCP address create ${create.status}: ${JSON.stringify(create.body)}`);
    const addressId = create.body?.id || create.body?.address?.id || create.body?.data?.id;
    if (!addressId) throw new Error("HCP did not return an address id");
    return { customerId: matched.id, addressId };
  }

  const createBody: Record<string, any> = {
    first_name: firstName || "Customer",
    last_name: lastName || "",
    email,
    mobile_number: phone || undefined,
    notifications_enabled: true,
    addresses: [address],
    tags: ["AlphaLux_Web", serviceType].filter(Boolean),
  };
  const c = await hcpFetch("/customers", { method: "POST", body: JSON.stringify(createBody) }, apiKey);
  if (!c.ok) throw new Error(`HCP customer create ${c.status}: ${JSON.stringify(c.body)}`);
  const customerId = c.body?.id || c.body?.customer?.id || c.body?.data?.id;
  if (!customerId) throw new Error("HCP did not return a customer id");
  const created: any[] = Array.isArray(c.body?.addresses) ? c.body.addresses : [];
  let addressId = created.find((a) => norm(a.zip) === norm(address.zip))?.id || created[0]?.id;
  if (!addressId) {
    const a = await hcpFetch(`/customers/${customerId}/addresses`, { method: "POST", body: JSON.stringify(address) }, apiKey);
    if (!a.ok) throw new Error(`HCP fallback address create ${a.status}: ${JSON.stringify(a.body)}`);
    addressId = a.body?.id || a.body?.address?.id || a.body?.data?.id;
  }
  if (!addressId) throw new Error("HCP did not return an address id (fallback)");
  return { customerId, addressId };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const bookingId = body?.booking_id || body?.bookingId;
    if (!bookingId) throw new Error("Missing booking_id");

    const apiKey = getHcpApiKey();
    if (!apiKey) {
      log("Skipping — HCP_API_KEY not configured");
      return json({ success: false, skipped: "no_api_key" }, 200);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*, customer:customers!bookings_customer_id_fkey(*)")
      .eq("id", bookingId)
      .single();
    if (error || !booking) throw new Error(`Booking not found: ${error?.message || "unknown"}`);

    if (booking.hcp_job_id) {
      log("Already synced", { bookingId, hcp_job_id: booking.hcp_job_id });
      return json({ success: true, skipped: "already_synced", hcp_job_id: booking.hcp_job_id });
    }

    if (!booking.service_date || !booking.address_line1) {
      log("Skipping — booking missing service_date or address", { bookingId });
      return json({ success: false, skipped: "incomplete_booking" }, 200);
    }

    const customer = (booking as any).customer || {};
    const email = (customer.email || "").trim().toLowerCase();
    if (!email) throw new Error("Customer has no email");

    const fullName =
      booking.full_name ||
      [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
      customer.name ||
      "Customer";
    const [firstName, ...rest] = fullName.split(" ");
    const lastName = rest.join(" ") || customer.last_name || "";

    const address = buildHcpAddress({ ...booking, customer });
    const serviceType = booking.service_type || "deep";

    const { customerId, addressId } = await ensureCustomer(
      apiKey, email, firstName, lastName, customer.phone, address, serviceType,
    );

    const { start, end } = timeSlotToIsoWindow(booking.service_date, booking.time_slot);

    const propertyDetails = booking.property_details || {};
    const sqft = propertyDetails.sqft || booking.home_size || booking.sqft_or_bedrooms || "";
    const br = propertyDetails.bedrooms;
    const ba = propertyDetails.bathrooms;
    const dwelling = propertyDetails.dwelling_type || propertyDetails.property_type || "";
    const descriptionLine = [
      booking.offer_name || prettyService(serviceType),
      sqft ? `${sqft} sq ft` : null,
      br != null ? `${br} BR` : null,
      ba != null ? `${ba} BA` : null,
      dwelling || null,
    ].filter(Boolean).join(" · ");

    const notesParts = [
      descriptionLine,
      `Service: ${prettyService(serviceType)}`,
      booking.frequency ? `Frequency: ${booking.frequency}` : null,
      booking.special_instructions ? `Customer notes: ${booking.special_instructions}` : null,
      `Deposit paid: $${Number(booking.deposit_amount || 0).toFixed(2)}`,
      `Balance due: $${Number(booking.balance_due || 0).toFixed(2)}`,
      booking.promo_code ? `Promo: ${booking.promo_code}` : null,
      `AlphaLux booking: ${booking.id}`,
    ].filter(Boolean) as string[];
    const longNotes = notesParts.join("\n");

    const lineItems: any[] = [
      {
        name: descriptionLine,
        description: longNotes,
        unit_price: Math.round(Number(booking.est_price || booking.base_price || 0) * 100),
        quantity: 1,
        kind: "labor",
      },
    ];
    if (booking.promo_discount_cents && booking.promo_discount_cents > 0) {
      lineItems.push({
        name: `Promo ${booking.promo_code || "discount"}`,
        unit_price: -Math.round(Number(booking.promo_discount_cents)),
        quantity: 1,
        kind: "discount",
      });
    }

    const jobPayload: Record<string, any> = {
      customer_id: customerId,
      address_id: addressId,
      schedule: {
        scheduled_start: start,
        scheduled_end: end || addHours(start, 4),
        arrival_window: 30,
      },
      line_items: lineItems,
      work_status: "scheduled",
      notes: longNotes,
      tags: ["AlphaLux_Web", serviceType, `booking:${booking.id}`].filter(Boolean),
    };

    const create = await hcpFetch("/jobs", { method: "POST", body: JSON.stringify(jobPayload) }, apiKey);
    if (!create.ok) {
      log("HCP job create failed", { status: create.status, body: create.body });
      throw new Error(`HCP job create ${create.status}: ${JSON.stringify(create.body)}`);
    }
    const jobId = create.body?.id || create.body?.job?.id || create.body?.data?.id;
    if (!jobId) throw new Error("HCP did not return a job id");

    await supabase.from("bookings").update({
      hcp_job_id: jobId,
      hcp_customer_id: customerId,
      updated_at: new Date().toISOString(),
    }).eq("id", booking.id);

    log("Synced to HCP", { bookingId, jobId, customerId });
    return json({ success: true, hcp_job_id: jobId, hcp_customer_id: customerId, hcp_address_id: addressId });
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
