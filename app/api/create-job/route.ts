import { NextRequest, NextResponse } from "next/server";

/**
 * Housecall Pro job-creation endpoint.
 *
 * Called by `/book/details` once the customer has paid the deposit and
 * entered their service address, home details, and preferred time
 * slot. The route is server-only so the HCP API key never reaches the
 * browser. Docs: https://docs.housecallpro.com
 *
 * Flow:
 *   1. GET /customers?q={email} to find an existing customer.
 *   2. If one is found, make sure a matching service address exists
 *      on that customer (POST /customers/{id}/addresses when missing).
 *   3. If no customer is found, POST /customers with an `addresses[]`
 *      array so the address is persisted in the same round-trip.
 *   4. POST /jobs with the customer id, a specific address id, a rich
 *      line-item name that HCP surfaces as the job's `description`
 *      field (service + sqft + bed/bath + dwelling), and a notes
 *      string that holds the full operational summary.
 *
 * Returns:
 *   { success: true,  job_id: "job_xxx", customer_id: "cus_xxx", address_id: "adr_xxx" }
 *   { success: false, error: "..." }
 */

export const runtime = "nodejs";

const HCP_BASE_URL = "https://api.housecallpro.com";

interface CreateJobBody {
  customer: {
    name?: string;
    first_name?: string;
    last_name?: string;
    email: string;
    phone?: string;
  };
  address: {
    street: string;
    street_line_2?: string | null;
    city: string;
    state: string;
    zip: string;
  };
  service: {
    type: string;
    description?: string;
    sqft?: number | string | null;
    dwelling_type?: string | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    notes?: string | null;
  };
  schedule: {
    /** ISO-8601 scheduled start. */
    start: string;
    /** Optional ISO-8601 scheduled end. Defaults to start + 4 hours. */
    end?: string | null;
    /** Optional arrival window in minutes. Defaults to 30. */
    arrival_window_minutes?: number | null;
  };
  line_items?: Array<{
    name: string;
    description?: string | null;
    /** Unit price in dollars. Converted to cents before hitting HCP. */
    unit_price: number;
    quantity?: number | null;
    kind?: "labor" | "materials" | "discount";
  }>;
  /** Extra context the ops team should see on the HCP job. */
  notes?: string | null;
  /** AlphaLux booking UUID, surfaced as a tag on the HCP job for traceability. */
  booking_id?: string | null;
  /**
   * Optional HCP lead_source. Must match an existing source configured
   * on the HCP account; otherwise HCP returns `"Lead source not found"`.
   */
  lead_source?: string;
}

/* --------------------------- HCP auth + fetch --------------------------- */

function getHcpApiKey(): string | null {
  return (
    process.env.HCP_API_KEY ||
    process.env.HOUSECALL_PRO_API_KEY ||
    (process.env as Record<string, string | undefined>)[
      "cde81b515f914598ac156b335a226adb"
    ] ||
    process.env.HCP_LIVE_API_KEY ||
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
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { status: res.status, body, ok: res.ok };
}

/* --------------------------- Utilities --------------------------- */

function splitName(full?: string): { first_name: string; last_name: string } {
  if (!full) return { first_name: "Customer", last_name: "" };
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { first_name: parts[0], last_name: "" };
  const last = parts.pop() as string;
  return { first_name: parts.join(" "), last_name: last };
}

function addHours(iso: string, hours: number): string {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return iso;
  d.setTime(d.getTime() + hours * 60 * 60 * 1000);
  return d.toISOString();
}

/** Map internal service codes to the label we want HCP dispatchers to see. */
function prettyService(type: string): string {
  const mapping: Record<string, string> = {
    deep: "Deep Clean",
    move_in_out: "Move In / Move Out Clean",
    moveout: "Move In / Move Out Clean",
    regular: "Standard Cleaning",
    standard: "Standard Cleaning",
    recurring: "Recurring Maintenance",
  };
  return mapping[type] || "Cleaning Service";
}

/** "apartment" -> "Apartment", "single_family" -> "Single Family". */
function prettyDwelling(v?: string | null): string | null {
  if (!v) return null;
  const lower = String(v).trim().toLowerCase();
  if (!lower) return null;
  const mapping: Record<string, string> = {
    house: "House",
    single_family: "Single Family",
    apartment: "Apartment",
    condo: "Condo",
    townhouse: "Townhouse",
    studio: "Studio",
    other: "Other",
  };
  return (
    mapping[lower] ||
    lower
      .split(/[_\s]+/)
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(" ")
  );
}

function formatSqft(v?: number | string | null): string | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) {
    const s = String(v).trim();
    return s || null;
  }
  return n.toLocaleString() + " sq ft";
}

/**
 * Compose the short label we send as the first line-item name. HCP
 * surfaces this string as `job.description` — the prominent header
 * the ops team sees on the job card. We pack the service type, sqft,
 * bed/bath count, and dwelling type into it.
 */
function buildJobDescription(service: CreateJobBody["service"]): string {
  const serviceLabel = service.description || prettyService(service.type);
  const parts: string[] = [serviceLabel];
  const sqft = formatSqft(service.sqft);
  if (sqft) parts.push(sqft);

  const br =
    service.bedrooms != null && Number(service.bedrooms) >= 0
      ? `${service.bedrooms} BR`
      : null;
  const ba =
    service.bathrooms != null && Number(service.bathrooms) >= 0
      ? `${service.bathrooms} BA`
      : null;
  const bedBath =
    br && ba ? `${br} / ${ba}` : br || ba;
  if (bedBath) parts.push(bedBath);

  const dwelling = prettyDwelling(service.dwelling_type);
  if (dwelling) parts.push(dwelling);

  return parts.join(" · ");
}

/** Long-form summary for the HCP notes field. */
function buildNotes(
  body: CreateJobBody,
  descriptionLine: string,
): string {
  const lines: string[] = [];
  lines.push(descriptionLine);
  const parts: string[] = [];
  parts.push(`Service: ${prettyService(body.service.type)}`);
  if (body.service.sqft != null && body.service.sqft !== "") {
    const sqft = formatSqft(body.service.sqft);
    if (sqft) parts.push(`Sqft: ${sqft}`);
  }
  if (body.service.bedrooms != null) parts.push(`Bedrooms: ${body.service.bedrooms}`);
  if (body.service.bathrooms != null) parts.push(`Bathrooms: ${body.service.bathrooms}`);
  const dwelling = prettyDwelling(body.service.dwelling_type);
  if (dwelling) parts.push(`Dwelling: ${dwelling}`);
  lines.push(parts.join(" · "));

  if (body.service.notes) lines.push(`Customer notes: ${body.service.notes}`);
  if (body.notes) lines.push(body.notes);
  if (body.booking_id) lines.push(`AlphaLux booking: ${body.booking_id}`);

  return lines.filter(Boolean).join("\n");
}

/* ----------------- HCP customer helpers ----------------- */

type HcpAddressInput = {
  type?: "service" | "billing";
  street: string;
  street_line_2?: string | null;
  city: string;
  state: string;
  zip: string;
  country?: string;
};

function buildHcpAddress(a: CreateJobBody["address"]): HcpAddressInput {
  return {
    type: "service",
    street: a.street,
    street_line_2: a.street_line_2 || null,
    city: a.city,
    state: a.state,
    zip: a.zip,
    country: "US",
  };
}

function addressesMatch(
  a: HcpAddressInput,
  b: any,
): boolean {
  if (!b) return false;
  const norm = (v: any) => String(v ?? "").trim().toLowerCase();
  return (
    norm(a.street) === norm(b.street) &&
    norm(a.city) === norm(b.city) &&
    norm(a.state) === norm(b.state) &&
    norm(a.zip) === norm(b.zip)
  );
}

async function ensureCustomer(
  body: CreateJobBody,
  customerEmail: string,
  apiKey: string,
): Promise<{ customerId: string; addressId: string }> {
  const { first_name: derivedFirst, last_name: derivedLast } = splitName(
    body.customer.name,
  );
  const firstName = body.customer.first_name || derivedFirst;
  const lastName = body.customer.last_name || derivedLast;
  const phone = body.customer.phone?.replace(/\s+/g, "") || undefined;
  const wantedAddress = buildHcpAddress(body.address);

  // ---- 1. Look up by email -----------------------------------
  const lookup = await hcpFetch(
    `/customers?q=${encodeURIComponent(customerEmail)}`,
    { method: "GET" },
    apiKey,
  );
  if (!lookup.ok && lookup.status !== 404) {
    throw Object.assign(
      new Error(`HCP customer lookup returned ${lookup.status}`),
      { details: lookup.body, httpStatus: 502 },
    );
  }

  const candidates: any[] = Array.isArray(lookup.body)
    ? lookup.body
    : lookup.body?.customers ||
      lookup.body?.data ||
      lookup.body?.results ||
      [];

  const matched = candidates.find((c) => {
    const email = (c?.email || c?.primary_email || "").toLowerCase();
    if (email === customerEmail) return true;
    if (Array.isArray(c?.emails)) {
      return c.emails.some((e: any) =>
        typeof e === "string"
          ? e.toLowerCase() === customerEmail
          : (e?.address || e?.email || "").toLowerCase() === customerEmail,
      );
    }
    return false;
  });

  if (matched?.id) {
    // ---- 2a. Customer exists. Make sure service address is on file. ----
    const existingAddrs: any[] =
      matched.addresses && Array.isArray(matched.addresses)
        ? matched.addresses
        : [];
    let existingAddr = existingAddrs.find((a) => addressesMatch(wantedAddress, a));

    if (!existingAddr) {
      // Fall back to pulling the full addresses list — /customers?q
      // responses don't always inline them.
      const addrList = await hcpFetch(
        `/customers/${matched.id}/addresses`,
        { method: "GET" },
        apiKey,
      );
      if (addrList.ok) {
        const listed: any[] = Array.isArray(addrList.body)
          ? addrList.body
          : addrList.body?.addresses || addrList.body?.data || [];
        existingAddr = listed.find((a) => addressesMatch(wantedAddress, a));
      }
    }

    let addressId: string | undefined = existingAddr?.id;
    if (!addressId) {
      const createAddr = await hcpFetch(
        `/customers/${matched.id}/addresses`,
        {
          method: "POST",
          body: JSON.stringify(wantedAddress),
        },
        apiKey,
      );
      if (!createAddr.ok) {
        throw Object.assign(
          new Error(`HCP address creation returned ${createAddr.status}`),
          { details: createAddr.body, httpStatus: 502 },
        );
      }
      addressId =
        createAddr.body?.id ||
        createAddr.body?.address?.id ||
        createAddr.body?.data?.id;
      if (!addressId) {
        throw Object.assign(
          new Error("HCP did not return an address id on create"),
          { details: createAddr.body, httpStatus: 502 },
        );
      }
    }

    return { customerId: matched.id, addressId };
  }

  // ---- 2b. Create a new customer with the address inline ----
  const createCustomerBody: Record<string, any> = {
    first_name: firstName || "Customer",
    last_name: lastName || "",
    email: customerEmail,
    mobile_number: phone,
    notifications_enabled: true,
    // HCP accepts the `addresses` array here and persists it; the
    // older `address: { line1, postal_code }` shape silently drops
    // the address on the floor.
    addresses: [wantedAddress],
    tags: ["AlphaLux_Web", body.service.type].filter(Boolean),
  };
  if (body.lead_source) createCustomerBody.lead_source = body.lead_source;

  const create = await hcpFetch(
    "/customers",
    { method: "POST", body: JSON.stringify(createCustomerBody) },
    apiKey,
  );

  if (!create.ok) {
    throw Object.assign(
      new Error(`HCP customer creation returned ${create.status}`),
      { details: create.body, httpStatus: 502 },
    );
  }

  const customerId =
    create.body?.id ||
    create.body?.customer?.id ||
    create.body?.data?.id ||
    null;
  if (!customerId) {
    throw Object.assign(
      new Error("HCP did not return a customer id on create"),
      { details: create.body, httpStatus: 502 },
    );
  }

  const newAddresses: any[] = Array.isArray(create.body?.addresses)
    ? create.body.addresses
    : [];
  let addressId =
    newAddresses.find((a) => addressesMatch(wantedAddress, a))?.id ||
    newAddresses[0]?.id;

  if (!addressId) {
    // Rare: HCP created the customer without the address. Fall back
    // to an explicit address POST so the job still gets a real address.
    const createAddr = await hcpFetch(
      `/customers/${customerId}/addresses`,
      {
        method: "POST",
        body: JSON.stringify(wantedAddress),
      },
      apiKey,
    );
    if (!createAddr.ok) {
      throw Object.assign(
        new Error(`HCP address creation returned ${createAddr.status}`),
        { details: createAddr.body, httpStatus: 502 },
      );
    }
    addressId =
      createAddr.body?.id ||
      createAddr.body?.address?.id ||
      createAddr.body?.data?.id;
    if (!addressId) {
      throw Object.assign(
        new Error("HCP did not return an address id on create (fallback)"),
        { details: createAddr.body, httpStatus: 502 },
      );
    }
  }

  return { customerId, addressId };
}

/* --------------------------- Route handler --------------------------- */

export async function POST(req: NextRequest) {
  let body: CreateJobBody;
  try {
    body = (await req.json()) as CreateJobBody;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const apiKey = getHcpApiKey();
  if (!apiKey) {
    console.error("[create-job] HCP API key missing from server env");
    return NextResponse.json(
      {
        success: false,
        error:
          "Housecall Pro API key is not configured on the server. Set HCP_API_KEY in the hosting environment.",
      },
      { status: 500 },
    );
  }

  // ---- Input validation ---------------------------------------------
  if (!body?.customer?.email) {
    return NextResponse.json(
      { success: false, error: "customer.email is required" },
      { status: 400 },
    );
  }
  if (
    !body?.address?.street ||
    !body.address?.city ||
    !body.address?.state ||
    !body.address?.zip
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "address (street, city, state, zip) is required",
      },
      { status: 400 },
    );
  }
  if (!body?.service?.type) {
    return NextResponse.json(
      { success: false, error: "service.type is required" },
      { status: 400 },
    );
  }
  if (!body?.schedule?.start) {
    return NextResponse.json(
      { success: false, error: "schedule.start is required" },
      { status: 400 },
    );
  }

  const customerEmail = body.customer.email.trim().toLowerCase();

  try {
    // 1. Find or create the HCP customer + service address.
    const { customerId, addressId } = await ensureCustomer(
      body,
      customerEmail,
      apiKey,
    );

    // 2. Build the job payload.
    const scheduleStart = body.schedule.start;
    const scheduleEnd = body.schedule.end || addHours(scheduleStart, 4);
    const arrivalWindowMinutes = body.schedule.arrival_window_minutes ?? 30;

    // HCP uses the first line-item's `name` as the visible `description`
    // on the job. Pack service + sqft + BR/BA + dwelling into it so
    // dispatchers can eyeball what they're sending a crew to.
    const descriptionLine = buildJobDescription(body.service);
    const longNotes = buildNotes(body, descriptionLine);

    const defaultLineItem = {
      name: descriptionLine,
      description: longNotes,
      unit_price: 0, // in cents
      quantity: 1,
      kind: "labor" as const,
    };

    const lineItems =
      body.line_items && body.line_items.length > 0
        ? body.line_items.map((li, idx) => ({
            // Replace the first line-item name with the rich description
            // so HCP surfaces it on the job card. Subsequent items keep
            // their user-supplied names (e.g. promo discount rows).
            name: idx === 0 ? descriptionLine : li.name,
            description: li.description || (idx === 0 ? longNotes : ""),
            unit_price: Math.round((li.unit_price || 0) * 100),
            quantity: li.quantity ?? 1,
            kind: li.kind || "labor",
          }))
        : [defaultLineItem];

    const jobPayload: Record<string, any> = {
      customer_id: customerId,
      address_id: addressId,
      schedule: {
        scheduled_start: scheduleStart,
        scheduled_end: scheduleEnd,
        arrival_window: arrivalWindowMinutes,
      },
      line_items: lineItems,
      // "scheduled" puts the job straight on the dispatch board. The
      // HCP web app rejects "needs_scheduling" in some accounts.
      work_status: "scheduled",
      notes: longNotes,
      tags: [
        "AlphaLux_Web",
        body.service.type,
        body.booking_id ? `booking:${body.booking_id}` : null,
      ].filter(Boolean),
    };
    if (body.lead_source) jobPayload.lead_source = body.lead_source;

    const createJob = await hcpFetch(
      "/jobs",
      { method: "POST", body: JSON.stringify(jobPayload) },
      apiKey,
    );

    if (!createJob.ok) {
      console.error(
        "[create-job] HCP job creation failed",
        createJob.status,
        createJob.body,
      );
      return NextResponse.json(
        {
          success: false,
          error: `HCP job creation returned ${createJob.status}`,
          details: createJob.body,
        },
        { status: 502 },
      );
    }

    const jobId =
      createJob.body?.id ||
      createJob.body?.job?.id ||
      createJob.body?.data?.id ||
      null;
    if (!jobId) {
      console.error(
        "[create-job] HCP job creation 2xx but no id in body",
        createJob.body,
      );
      return NextResponse.json(
        {
          success: false,
          error: "HCP did not return a job id on create",
          details: createJob.body,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      job_id: jobId,
      customer_id: customerId,
      address_id: addressId,
      job_description: descriptionLine,
    });
  } catch (err: any) {
    const message = err instanceof Error ? err.message : String(err);
    const httpStatus =
      (typeof err?.httpStatus === "number" && err.httpStatus) || 500;
    console.error("[create-job] Unexpected failure:", message, err?.details);
    return NextResponse.json(
      {
        success: false,
        error: message || "Unexpected server error",
        details: err?.details,
      },
      { status: httpStatus },
    );
  }
}
