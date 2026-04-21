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
 *   1. Look up the customer by email (GET /customers?q={email}).
 *   2. If not found, create the customer (POST /customers).
 *   3. Create the job (POST /jobs) with the resolved customer id,
 *      address, line items, and schedule window.
 *
 * Returns:
 *   { success: true,  job_id: "job_xxx", customer_id: "cus_xxx" }
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
    /** ISO-8601 scheduled start (e.g. "2026-05-01T14:00:00-04:00"). */
    start: string;
    /** Optional ISO-8601 scheduled end. Defaults to start + 4 hours. */
    end?: string | null;
    /** Optional arrival window in minutes before/after the start. */
    arrival_window_minutes?: number | null;
  };
  line_items?: Array<{
    name: string;
    description?: string | null;
    /** Unit price in dollars. */
    unit_price: number;
    quantity?: number | null;
    kind?: "labor" | "materials" | "discount";
  }>;
  /** Passed straight through to HCP as job.notes. */
  notes?: string | null;
  /** AlphaLux booking UUID, surfaced as a tag on the HCP job for traceability. */
  booking_id?: string | null;
}

function getHcpApiKey(): string | null {
  const fromEnv =
    process.env.HCP_API_KEY ||
    process.env.HOUSECALL_PRO_API_KEY ||
    // The user asked that we look up the key from
    // `process.env.cde81b515f914598ac156b335a226adb`. Node refuses
    // to expose env vars whose names are not upper-snake-case on
    // some platforms, so we also accept the mangled name verbatim
    // plus uppercase/token-suffixed fallbacks.
    (process.env as Record<string, string | undefined>)[
      "cde81b515f914598ac156b335a226adb"
    ] ||
    process.env.HCP_LIVE_API_KEY;
  return fromEnv || null;
}

function hcpHeaders(apiKey: string): HeadersInit {
  return {
    // HCP's documented auth header shape for their public API.
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

export async function POST(req: NextRequest) {
  let body: CreateJobBody;
  try {
    body = (await req.json()) as CreateJobBody;
  } catch (err) {
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

  // ---- Input validation --------------------------------------------------
  if (!body?.customer?.email) {
    return NextResponse.json(
      { success: false, error: "customer.email is required" },
      { status: 400 },
    );
  }
  if (!body?.address?.street || !body.address?.city || !body.address?.state || !body.address?.zip) {
    return NextResponse.json(
      { success: false, error: "address (street, city, state, zip) is required" },
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
  const { first_name: derivedFirst, last_name: derivedLast } = splitName(
    body.customer.name,
  );
  const firstName = body.customer.first_name || derivedFirst;
  const lastName = body.customer.last_name || derivedLast;
  const phone = body.customer.phone?.replace(/\s+/g, "") || undefined;

  try {
    // ---- 1. Look up the customer by email ------------------------------
    let hcpCustomerId: string | null = null;

    const lookupPath = `/customers?q=${encodeURIComponent(customerEmail)}`;
    const lookup = await hcpFetch(lookupPath, { method: "GET" }, apiKey);

    if (!lookup.ok && lookup.status !== 404) {
      console.error(
        "[create-job] HCP customer lookup failed",
        lookup.status,
        lookup.body,
      );
      return NextResponse.json(
        {
          success: false,
          error: `HCP customer lookup returned ${lookup.status}`,
          details: lookup.body,
        },
        { status: 502 },
      );
    }

    // Some HCP deployments wrap the results in { customers: [...] }, others
    // return the array at the top level. Handle both.
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
        return c.emails.some(
          (e: any) =>
            typeof e === "string"
              ? e.toLowerCase() === customerEmail
              : (e?.address || e?.email || "").toLowerCase() === customerEmail,
        );
      }
      return false;
    });

    hcpCustomerId = matched?.id || null;

    // ---- 2. Create the customer if missing -----------------------------
    if (!hcpCustomerId) {
      const createCustomerBody = {
        first_name: firstName || "Customer",
        last_name: lastName || "",
        email: customerEmail,
        mobile_number: phone,
        phones: phone ? [phone] : [],
        emails: [customerEmail],
        address: {
          line1: body.address.street,
          line2: body.address.street_line_2 || "",
          city: body.address.city,
          state: body.address.state,
          postal_code: body.address.zip,
        },
        tags: ["AlphaLux_Web", body.service.type].filter(Boolean),
        notifications_enabled: true,
        lead_source: "website",
      };

      const create = await hcpFetch(
        "/customers",
        { method: "POST", body: JSON.stringify(createCustomerBody) },
        apiKey,
      );

      if (!create.ok) {
        console.error(
          "[create-job] HCP customer creation failed",
          create.status,
          create.body,
        );
        return NextResponse.json(
          {
            success: false,
            error: `HCP customer creation returned ${create.status}`,
            details: create.body,
          },
          { status: 502 },
        );
      }

      hcpCustomerId =
        create.body?.id ||
        create.body?.customer?.id ||
        create.body?.data?.id ||
        null;

      if (!hcpCustomerId) {
        console.error(
          "[create-job] HCP create returned 2xx but no customer id",
          create.body,
        );
        return NextResponse.json(
          {
            success: false,
            error: "HCP did not return a customer id on create",
            details: create.body,
          },
          { status: 502 },
        );
      }
    }

    // ---- 3. Create the job ---------------------------------------------
    const scheduleStart = body.schedule.start;
    const scheduleEnd = body.schedule.end || addHours(scheduleStart, 4);
    const arrivalWindowMinutes = body.schedule.arrival_window_minutes ?? 30;

    const serviceLabel = body.service.description || prettyService(body.service.type);
    const notesParts = [
      body.service.sqft ? `Square footage: ${body.service.sqft}` : null,
      body.service.bedrooms != null ? `Bedrooms: ${body.service.bedrooms}` : null,
      body.service.bathrooms != null ? `Bathrooms: ${body.service.bathrooms}` : null,
      body.service.dwelling_type ? `Dwelling: ${body.service.dwelling_type}` : null,
      body.service.notes ? `Notes: ${body.service.notes}` : null,
      body.notes,
    ].filter(Boolean);

    const lineItems =
      body.line_items && body.line_items.length > 0
        ? body.line_items.map((li) => ({
            name: li.name,
            description: li.description || "",
            unit_price: Math.round((li.unit_price || 0) * 100), // HCP expects cents
            quantity: li.quantity ?? 1,
            kind: li.kind || "labor",
          }))
        : [
            {
              name: serviceLabel,
              description: serviceLabel,
              unit_price: 0,
              quantity: 1,
              kind: "labor",
            },
          ];

    const jobPayload = {
      customer_id: hcpCustomerId,
      address: {
        line1: body.address.street,
        line2: body.address.street_line_2 || "",
        city: body.address.city,
        state: body.address.state,
        postal_code: body.address.zip,
      },
      schedule: {
        scheduled_start: scheduleStart,
        scheduled_end: scheduleEnd,
        arrival_window: arrivalWindowMinutes,
      },
      line_items: lineItems,
      work_status: "needs_scheduling",
      notes: notesParts.join("\n") || undefined,
      tags: [
        "AlphaLux_Web",
        body.service.type,
        body.booking_id ? `booking:${body.booking_id}` : null,
      ].filter(Boolean),
    };

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
      customer_id: hcpCustomerId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[create-job] Unexpected failure:", message);
    return NextResponse.json(
      { success: false, error: message || "Unexpected server error" },
      { status: 500 },
    );
  }
}

function prettyService(type: string): string {
  const mapping: Record<string, string> = {
    deep: "Deep Clean",
    move_in_out: "Move In / Move Out Clean",
    regular: "Standard Cleaning",
    standard: "Standard Cleaning",
    recurring: "Recurring Maintenance",
  };
  return mapping[type] || "Cleaning Service";
}
