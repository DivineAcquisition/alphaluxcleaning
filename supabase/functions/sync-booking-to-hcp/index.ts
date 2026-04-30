import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingPayload {
  booking_id: string;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
  };
  service: {
    type: string;
    frequency: string;
    sqft_range: string;
    addons?: string[];
  };
  schedule: {
    date: string;
    time_window?: string;
    timezone: string;
  };
  pricing: {
    total: number;
    mrr_est?: number;
    arr_est?: number;
    currency: string;
    addons_breakdown?: Array<{
      name: string;
      price: number;
    }>;
  };
  source: string;
  special_instructions?: string;
  property_details?: {
    pets?: string;
    access_code?: string;
    parking_instructions?: string;
  };
  first_booking?: boolean;
  recurring_active?: boolean;
}

interface HCPConfig {
  api_key: string;
  base_url: string;
  enabled: boolean;
  test_mode: boolean;
}

/**
 * Pick the correct Authorization header format for a Housecall Pro
 * credential. Per the official auth docs
 * (https://docs.housecallpro.com/docs/housecall-public-api/b87d37ae48a0d-authentication):
 *
 *   - API keys (generated from Settings -> Integrations -> API Access)
 *     must be sent as `Authorization: Token <key>` — NOT `Bearer`.
 *   - OAuth 2.0 access tokens are sent as `Authorization: Bearer <token>`.
 *
 * The previous implementation hard-coded `Bearer` for everything, which
 * works for OAuth but causes a 401 Unauthorized on every API-key
 * request. We auto-detect by token shape and let ops force a scheme
 * via `HCP_AUTH_SCHEME=token|bearer` if needed.
 */
function buildHcpAuthHeader(rawKey: string): string {
  const key = (rawKey || "").trim();
  const forced = (Deno.env.get("HCP_AUTH_SCHEME") || "").trim().toLowerCase();
  if (forced === "token") return `Token ${key}`;
  if (forced === "bearer") return `Bearer ${key}`;

  // OAuth access tokens HCP issues are long opaque strings; API keys
  // generated from the dashboard are typically a 32-char hex
  // identifier. We use Bearer when the key contains JWT-style dots
  // (modern OAuth) and otherwise default to Token, which matches
  // the format every API-key user actually has.
  if (key.includes(".") && key.split(".").length === 3) return `Bearer ${key}`;
  return `Token ${key}`;
}

function buildHcpHeaders(config: HCPConfig): Record<string, string> {
  return {
    Authorization: buildHcpAuthHeader(config.api_key),
    "Content-Type": "application/json",
  };
}

serve(async (req) => {
  console.log("HCP sync function called with method:", req.method);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  let payload: BookingPayload;
  let requestPayload: any;

  try {
    payload = await req.json();
    requestPayload = payload;
    console.log("Processing booking sync:", payload.booking_id);

    // Get HCP configuration
    const hcpApiKey = Deno.env.get("HCP_API_KEY");
    if (!hcpApiKey) {
      throw new Error("HCP_API_KEY not configured");
    }

    const hcpConfig: HCPConfig = {
      api_key: hcpApiKey,
      // Housecall Pro public API. The third-party guides on the
      // internet still reference `/v1`, but probing
      // api.housecallpro.com directly shows `/v1/customers` returns
      // a 404 HTML "page not found" page while `/customers` returns
      // 401 JSON when unauthenticated — so the live, correct base
      // URL is the unversioned host. Allow override via env so we
      // can flip to a sandbox / staging host without a redeploy.
      base_url: Deno.env.get("HCP_BASE_URL") || "https://api.housecallpro.com",
      enabled: true,
      test_mode: Deno.env.get("HCP_TEST_MODE") === "true"
    };

    if (!hcpConfig.enabled) {
      console.log("HCP integration disabled, skipping sync");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "HCP integration disabled" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if booking already synced
    const { data: existingLog } = await supabase
      .from('hcp_sync_log')
      .select('*')
      .eq('booking_id', payload.booking_id)
      .eq('status', 'success')
      .maybeSingle();

    if (existingLog) {
      console.log("Booking already synced successfully:", payload.booking_id);
      return new Response(JSON.stringify({ 
        success: true,
        customerId: existingLog.hcp_customer_id,
        jobId: existingLog.hcp_job_id,
        message: "Already synced"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get existing log or create new one
    const { data: existingLogEntry } = await supabase
      .from('hcp_sync_log')
      .select('*')
      .eq('booking_id', payload.booking_id)
      .maybeSingle();

    const retryCount = existingLogEntry ? (existingLogEntry.retry_count || 0) : 0;

    // Create or update sync log entry
    const { data: syncLog, error: logError } = await supabase
      .from('hcp_sync_log')
      .upsert({
        booking_id: payload.booking_id,
        status: 'pending',
        attempts: (existingLogEntry?.attempts || 0) + 1,
        retry_count: retryCount,
        request_payload: requestPayload
      }, {
        onConflict: 'booking_id'
      })
      .select()
      .single();

    if (logError) {
      console.error("Failed to create sync log:", logError);
      throw new Error("Failed to create sync log");
    }

    let hcpCustomerId: string;
    let hcpJobId: string;
    let responsePayload: any;

    if (hcpConfig.test_mode) {
      console.log("TEST MODE: Would sync booking to HCP:", payload);
      hcpCustomerId = `test_customer_${Date.now()}`;
      hcpJobId = `test_job_${Date.now()}`;
      responsePayload = { test_mode: true, customer_id: hcpCustomerId, job_id: hcpJobId };
    } else {
      // Find or create customer. The customer-search probe also
      // resolves which auth scheme HCP accepts (Token vs Bearer);
      // we thread the resolved headers through so the job-create
      // POST below uses the same scheme that just worked.
      const customerResult = await findOrCreateCustomer(hcpConfig, payload);
      hcpCustomerId = customerResult.id;
      console.log("HCP Customer ID:", hcpCustomerId);

      const jobResult = await createJob(hcpConfig, payload, hcpCustomerId, customerResult.headers);
      hcpJobId = jobResult.id;
      responsePayload = jobResult.response;
      console.log("HCP Job ID:", hcpJobId);
    }

    // Update sync log with success
    await supabase
      .from('hcp_sync_log')
      .update({
        hcp_customer_id: hcpCustomerId,
        hcp_job_id: hcpJobId,
        status: 'success',
        response_payload: responsePayload,
        error_category: null,
        last_error: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', syncLog.id);

    // Update booking record with HCP IDs. We also write the legacy
    // `housecall_job_id` column so older code paths / dashboards
    // that still read it continue to surface the job link.
    await supabase
      .from('bookings')
      .update({
        hcp_customer_id: hcpCustomerId,
        hcp_job_id: hcpJobId,
        housecall_job_id: hcpJobId,
      })
      .eq('id', payload.booking_id);

    console.log("Successfully synced booking to HCP");

    return new Response(JSON.stringify({
      success: true,
      customerId: hcpCustomerId,
      jobId: hcpJobId
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("HCP sync error:", error);

    // Categorize error
    const errorCategory = categorizeError(error);
    const retryCount = (await getRetryCount(supabase, payload?.booking_id)) + 1;
    const nextRetry = calculateNextRetry(retryCount);

    // Try to update sync log with error
    try {
      const shouldRetry = retryCount < 5 && ['network_error', 'rate_limit', 'server_error'].includes(errorCategory);
      
      await supabase
        .from('hcp_sync_log')
        .update({
          status: 'failed',
          last_error: error.message,
          error_category: errorCategory,
          retry_count: retryCount,
          next_retry_at: shouldRetry ? nextRetry.toISOString() : null,
          request_payload: requestPayload,
          response_payload: error.response || null,
          updated_at: new Date().toISOString()
        })
        .eq('booking_id', payload.booking_id);
    } catch (logError) {
      console.error("Failed to update error log:", logError);
    }

    return new Response(JSON.stringify({
      error: error.message,
      error_category: errorCategory,
      success: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function getRetryCount(supabase: any, bookingId: string): Promise<number> {
  try {
    const { data } = await supabase
      .from('hcp_sync_log')
      .select('retry_count')
      .eq('booking_id', bookingId)
      .single();
    return data?.retry_count || 0;
  } catch {
    return 0;
  }
}

async function findOrCreateCustomer(
  config: HCPConfig,
  payload: BookingPayload,
): Promise<{ id: string; response: any; headers: Record<string, string> }> {
  // Auto-detect the right auth scheme: try whichever buildHcpHeaders
  // chose first; if HCP returns 401 (auth error) on the search GET,
  // flip the scheme and retry once. This handles the case where the
  // API key shape doesn't match our heuristic — e.g. an older
  // restricted-format key issued with `Bearer` semantics, or a fresh
  // dashboard API key that needs the `Token` prefix. We log which
  // scheme worked so ops can pin it explicitly via HCP_AUTH_SCHEME.
  let headers = buildHcpHeaders(config);
  const altScheme = headers.Authorization.startsWith("Token ")
    ? `Bearer ${config.api_key.trim()}`
    : `Token ${config.api_key.trim()}`;
  const altHeaders = { ...headers, Authorization: altScheme };

  // Log only the scheme + a short fingerprint so we can correlate
  // 401s in logs without ever printing the full key.
  const keyTrim = config.api_key.trim();
  const fingerprint =
    keyTrim.length > 8
      ? `${keyTrim.slice(0, 4)}…${keyTrim.slice(-4)} (len=${keyTrim.length})`
      : `(len=${keyTrim.length})`;
  console.log(
    `Primary auth scheme: ${headers.Authorization.split(" ")[0]} | key fingerprint: ${fingerprint}`,
  );

  // Search for existing customer by email
  console.log("Searching for customer:", payload.customer.email);
  const searchUrl = `${config.base_url}/customers?email=${encodeURIComponent(payload.customer.email)}`;
  // Probe with the primary scheme; if we get 401 try the alt and
  // adopt whichever returned 2xx for the rest of this request.
  const probe = await fetch(searchUrl, { method: "GET", headers });
  if (probe.status === 401) {
    console.log("Primary auth scheme returned 401, trying fallback scheme");
    const probeAlt = await fetch(searchUrl, { method: "GET", headers: altHeaders });
    if (probeAlt.ok || probeAlt.status === 404) {
      console.log("Fallback auth scheme accepted; using it for the rest of this request");
      headers = altHeaders;
    } else {
      const body = await probeAlt.text();
      throw new Error(
        `HCP authentication failed under both Token and Bearer schemes (last ${probeAlt.status}: ${body.slice(0, 200)}). Verify HCP_API_KEY in Supabase secrets is current.`,
      );
    }
  } else if (!probe.ok && probe.status !== 404) {
    const body = await probe.text();
    console.log("Customer search non-OK:", probe.status, body.slice(0, 200));
  } else if (probe.ok) {
    try {
      const searchData = await probe.json();
      if (searchData.customers && searchData.customers.length > 0) {
        const existingCustomer = searchData.customers[0];
        console.log("Found existing customer:", existingCustomer.id);
        const needsUpdate = await checkCustomerNeedsUpdate(existingCustomer, payload);
        if (needsUpdate) await updateCustomerWithHeaders(config, existingCustomer.id, payload, headers);
        return { id: existingCustomer.id, response: searchData, headers };
      }
    } catch (parseErr) {
      console.log("Customer search response parse failed, will create new:", parseErr);
    }
  }

  // Create new customer
  console.log("Creating new customer");
  
  // Classify phone number
  const phoneClassification = classifyPhoneNumber(payload.customer.phone);
  
  // Map lead source
  const leadSource = mapLeadSource(payload.source);
  
  // Build customer tags
  const tags = [
    "AlphaLux_UI",
    payload.address.state,
    leadSource,
    payload.service.type,
    payload.first_booking ? "First_Booking" : "Returning",
    payload.recurring_active ? "Recurring_Active" : "One_Time"
  ].filter(Boolean);

  const createCustomerData = {
    first_name: payload.customer.first_name || 'Unknown',
    last_name: payload.customer.last_name || 'Customer',
    emails: [payload.customer.email],
    mobile_number: phoneClassification.mobile,
    home_number: phoneClassification.home,
    phones: [payload.customer.phone],
    address: {
      line1: payload.address.line1,
      line2: payload.address.line2 || "",
      city: payload.address.city,
      state: payload.address.state,
      postal_code: payload.address.postal_code
    },
    tags: tags,
    lead_source: leadSource,
    notifications_enabled: true
  };

  const createResponse = await fetch(`${config.base_url}/customers`, {
    method: 'POST',
    headers,
    body: JSON.stringify(createCustomerData)
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    console.error("Customer creation failed:", createResponse.status, errorText);
    throw new Error(`Failed to create customer: ${createResponse.status} - ${errorText}`);
  }

  const createData = await createResponse.json();
  console.log("Created customer:", createData.customer?.id || createData.id);
  return {
    id: createData.customer?.id || createData.id,
    response: createData,
    headers,
  };
}

async function updateCustomerWithHeaders(
  config: HCPConfig,
  customerId: string,
  payload: BookingPayload,
  headers: Record<string, string>,
): Promise<void> {
  const phoneClassification = classifyPhoneNumber(payload.customer.phone);
  const updateData = {
    mobile_number: phoneClassification.mobile,
    home_number: phoneClassification.home,
    phones: [payload.customer.phone],
    address: {
      line1: payload.address.line1,
      line2: payload.address.line2 || "",
      city: payload.address.city,
      state: payload.address.state,
      postal_code: payload.address.postal_code,
    },
  };
  const response = await fetch(`${config.base_url}/customers/${customerId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(updateData),
  });
  if (!response.ok) console.error("Customer update failed:", response.status);
}

async function checkCustomerNeedsUpdate(existingCustomer: any, payload: BookingPayload): Promise<boolean> {
  // Check if phone or address has changed
  const phoneMatch = existingCustomer.phones?.includes(payload.customer.phone);
  const addressMatch = existingCustomer.address?.postal_code === payload.address.postal_code;
  
  return !phoneMatch || !addressMatch;
}

async function updateCustomer(config: HCPConfig, customerId: string, payload: BookingPayload): Promise<void> {
  const headers = buildHcpHeaders(config);
  const phoneClassification = classifyPhoneNumber(payload.customer.phone);

  const updateData = {
    mobile_number: phoneClassification.mobile,
    home_number: phoneClassification.home,
    phones: [payload.customer.phone],
    address: {
      line1: payload.address.line1,
      line2: payload.address.line2 || "",
      city: payload.address.city,
      state: payload.address.state,
      postal_code: payload.address.postal_code
    }
  };

  const response = await fetch(`${config.base_url}/customers/${customerId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(updateData)
  });

  if (!response.ok) {
    console.error("Customer update failed:", response.status);
  }
}

async function createJob(
  config: HCPConfig,
  payload: BookingPayload,
  customerId: string,
  headersOverride?: Record<string, string>,
): Promise<{ id: string; response: any }> {
  console.log("Creating job for customer:", customerId);
  const headers = headersOverride || buildHcpHeaders(config);

  // Build job title
  const title = `${payload.service.type} Cleaning (${payload.service.frequency})`;
  
  // Build detailed description
  const descriptionParts = [
    `${payload.service.type} cleaning service`,
    `Frequency: ${payload.service.frequency}`,
    `Property size: ${payload.service.sqft_range}`,
  ];
  
  if (payload.service.addons?.length) {
    descriptionParts.push(`Add-ons: ${payload.service.addons.join(', ')}`);
  }
  
  const description = descriptionParts.join(' | ');
  
  // Build comprehensive notes
  const notes = [
    `Booking ID: ${payload.booking_id}`,
    `Source: ${mapLeadSource(payload.source)}`,
    `Square Footage: ${payload.service.sqft_range}`,
    `Service Type: ${payload.service.type}`,
    `Frequency: ${payload.service.frequency}`,
  ];
  
  if (payload.service.addons?.length) {
    notes.push(`Add-ons: ${payload.service.addons.join(', ')}`);
  }
  
  if (payload.special_instructions) {
    notes.push(`Special Instructions: ${payload.special_instructions}`);
  }
  
  if (payload.property_details?.pets) {
    notes.push(`Pets: ${payload.property_details.pets}`);
  }
  
  if (payload.property_details?.access_code) {
    notes.push(`Access Code: ${payload.property_details.access_code}`);
  }
  
  if (payload.property_details?.parking_instructions) {
    notes.push(`Parking: ${payload.property_details.parking_instructions}`);
  }
  
  if (payload.pricing.mrr_est) {
    notes.push(`MRR Estimate: $${payload.pricing.mrr_est}`);
  }
  
  if (payload.pricing.arr_est) {
    notes.push(`ARR Estimate: $${payload.pricing.arr_est}`);
  }
  
  notes.push(`First Booking: ${payload.first_booking ? 'Yes' : 'No'}`);
  notes.push(`Recurring Active: ${payload.recurring_active ? 'Yes' : 'No'}`);

  // Calculate scheduled times with timezone awareness
  const { start, end } = formatTimeWindow(
    payload.schedule.date, 
    payload.schedule.time_window || "09:00-17:00", 
    payload.schedule.timezone
  );

  // Build line items - main service + individual addons
  const lineItems = [];
  
  // Calculate base service price (total minus addons)
  let basePrice = payload.pricing.total;
  if (payload.pricing.addons_breakdown?.length) {
    const addonsTotal = payload.pricing.addons_breakdown.reduce((sum, addon) => sum + addon.price, 0);
    basePrice = payload.pricing.total - addonsTotal;
  }
  
  // Main service line item
  lineItems.push({
    name: `${payload.service.type} Cleaning - ${payload.service.sqft_range}`,
    description: `${payload.service.frequency} cleaning service`,
    quantity: 1,
    unit_price: basePrice,
    total: basePrice
  });
  
  // Individual addon line items
  if (payload.pricing.addons_breakdown?.length) {
    for (const addon of payload.pricing.addons_breakdown) {
      lineItems.push({
        name: addon.name,
        description: `Add-on service: ${addon.name}`,
        quantity: 1,
        unit_price: addon.price,
        total: addon.price
      });
    }
  }

  // Build job tags
  const jobTags = [
    "AlphaLux_UI",
    payload.address.state,
    payload.service.frequency,
    payload.service.type,
    mapLeadSource(payload.source)
  ].filter(Boolean);

  const jobData = {
    customer_id: customerId,
    title: title,
    description: description,
    work_status: "scheduled",
    scheduled_start: start,
    scheduled_end: end,
    notes: notes.join('\n'),
    lead_source: mapLeadSource(payload.source),
    address_override: {
      line1: payload.address.line1,
      line2: payload.address.line2 || "",
      city: payload.address.city,
      state: payload.address.state,
      postal_code: payload.address.postal_code
    },
    line_items: lineItems,
    tags: jobTags,
    custom_fields: {
      booking_id: payload.booking_id,
      mrr_estimate: payload.pricing.mrr_est || 0,
      arr_estimate: payload.pricing.arr_est || 0,
      frequency: payload.service.frequency,
      source_channel: payload.source
    }
  };

  console.log("Creating job with data:", JSON.stringify(jobData, null, 2));

  const response = await fetch(`${config.base_url}/jobs`, {
    method: 'POST',
    headers,
    body: JSON.stringify(jobData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Job creation failed:", response.status, errorText);
    throw new Error(`Failed to create job: ${response.status} - ${errorText}`);
  }

  const responseData = await response.json();
  console.log("Created job:", responseData.job.id);
  return { id: responseData.job.id, response: responseData };
}

/**
 * Convert a YYYY-MM-DD date + an "HH:MM-HH:MM" wall-clock window in
 * the customer's local timezone into ISO-8601 UTC strings (the
 * format HCP's API expects on `scheduled_start` / `scheduled_end`).
 *
 * Implementation: we compute the timezone's UTC offset *for that
 * specific date* via Intl.DateTimeFormat, which correctly accounts
 * for daylight saving transitions — a 9 AM Los Angeles slot in
 * March is UTC-7, the same slot in January is UTC-8. Naively
 * constructing `new Date('2026-05-04T09:00:00')` (the previous
 * implementation) ran in the server's UTC locale and shifted every
 * appointment into the early hours of the next day in the
 * customer's timezone. This regression is why HCP jobs that did
 * land never matched the customer's expected arrival window.
 */
function formatTimeWindow(date: string, timeWindow: string, timezone: string): { start: string; end: string } {
  const [startTime, endTime] = (timeWindow || "09:00-17:00").split("-");
  const tz = timezone && timezone.length > 0 ? timezone : "America/New_York";

  function toUtcIso(ymd: string, hhmm: string): string {
    const [y, m, d] = ymd.split("-").map(Number);
    const [hh, mm] = hhmm.split(":").map(Number);
    // First-pass UTC guess assuming the wall clock IS UTC.
    const utcGuess = Date.UTC(
      y || 1970,
      Math.max(0, (m || 1) - 1),
      d || 1,
      hh || 0,
      mm || 0,
      0,
    );
    // Render that UTC instant in the target zone — the difference
    // between the rendered wall-clock and the original wall-clock
    // is exactly the timezone offset. Add it back to land at the
    // correct UTC instant.
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const parts = Object.fromEntries(
      dtf.formatToParts(new Date(utcGuess)).map((p) => [p.type, p.value]),
    );
    const renderedUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      // Intl renders 24h "00".."23" but uses "24" for midnight in some
      // locales; normalise to 0.
      Number(parts.hour) === 24 ? 0 : Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );
    const offsetMs = utcGuess - renderedUtc;
    return new Date(utcGuess + offsetMs).toISOString();
  }

  return {
    start: toUtcIso(date, startTime),
    end: toUtcIso(date, endTime),
  };
}

function mapLeadSource(sourceChannel: string): string {
  const mapping: Record<string, string> = {
    'UI_DIRECT': 'Website',
    'META': 'Facebook',
    'GG_LOCAL': 'Google',
    'REENGAGE': 'Referral'
  };
  return mapping[sourceChannel] || 'Other';
}

function classifyPhoneNumber(phone: string): { mobile?: string; home?: string } {
  // Default to mobile for most cases
  // You can enhance this with actual mobile carrier detection
  return { mobile: phone };
}

function categorizeError(error: any): string {
  const message = error?.message?.toLowerCase() || '';
  const status = error?.statusCode || error?.status;
  
  if (status === 401 || status === 403 || message.includes('unauthorized') || message.includes('forbidden')) {
    return 'auth_error';
  }
  if (status === 429 || message.includes('rate limit')) {
    return 'rate_limit';
  }
  if (status >= 400 && status < 500 || message.includes('validation') || message.includes('invalid')) {
    return 'validation_error';
  }
  if (status >= 500 || message.includes('server error') || message.includes('internal error')) {
    return 'server_error';
  }
  if (message.includes('network') || message.includes('timeout') || message.includes('connection')) {
    return 'network_error';
  }
  return 'unknown_error';
}

function calculateNextRetry(retryCount: number): Date {
  const delays = [5, 15, 60, 240, 1440]; // minutes: 5m, 15m, 1h, 4h, 24h
  const delayMinutes = delays[Math.min(retryCount, delays.length - 1)];
  return new Date(Date.now() + delayMinutes * 60 * 1000);
}