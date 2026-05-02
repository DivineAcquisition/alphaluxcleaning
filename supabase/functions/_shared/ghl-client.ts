// Shared GoHighLevel Private Integration client.
//
// Reads GHL_PRIVATE_INTEGRATION_TOKEN (aka PIT) and GHL_LOCATION_ID from
// Edge Function secrets. Private Integration tokens are *location-scoped*,
// so every call must include the locationId either as a query param or
// in the request body (depending on endpoint).
//
// Endpoints used by AlphaLuxClean TX/CA:
//   - POST   /contacts/upsert
//   - POST   /contacts/{contactId}/tags
//   - GET    /locations/{locationId}/customFields
//   - GET    /contacts/search/duplicate?locationId&email|phone
//   - POST   /opportunities/
//   - GET    /opportunities/pipelines?locationId
//
// All calls include Version: 2021-07-28 per the LeadConnector API spec.

export const GHL_BASE = 'https://services.leadconnectorhq.com';
export const GHL_API_VERSION = '2021-07-28';

// AlphaLuxClean TX/CA (and alphaluxcleaning NY) both live under this
// GHL subaccount; the PIT below is location-scoped to it. These
// defaults let the edge functions run out-of-the-box — override them
// by setting the matching env vars on any edge function.
const DEFAULT_PIT = 'pit-299cc7eb-1702-4549-b976-f95d682c744e';
const DEFAULT_LOCATION_ID = 'Lvvq87zxxbYFnaTEklYX';

export interface GHLCustomFieldValue {
  /** Custom field id (preferred) or key. LeadConnector accepts either. */
  id?: string;
  key?: string;
  field_value: unknown;
}

export interface GHLContactUpsert {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string;
  source?: string | null;
  website?: string | null;
  tags?: string[];
  customFields?: GHLCustomFieldValue[];
  companyName?: string | null;
  dnd?: boolean;
}

export interface GHLClient {
  token: string;
  locationId: string;
  request(
    path: string,
    init?: RequestInit & { query?: Record<string, string | number | undefined> },
  ): Promise<{ ok: boolean; status: number; data: any; raw: string }>;
  upsertContact(body: GHLContactUpsert): Promise<{ ok: boolean; contactId?: string; data: any }>;
  addTags(contactId: string, tags: string[]): Promise<{ ok: boolean; data: any }>;
  listCustomFields(): Promise<{
    ok: boolean;
    fields: Array<{ id: string; name: string; fieldKey: string; dataType?: string }>;
    data: any;
  }>;
  findContactByEmail(email: string): Promise<{ ok: boolean; contactId?: string; data: any }>;
  createOpportunity(params: {
    pipelineId: string;
    stageId: string;
    name: string;
    status?: 'open' | 'won' | 'lost' | 'abandoned';
    contactId: string;
    monetaryValue?: number;
    source?: string;
    customFields?: GHLCustomFieldValue[];
  }): Promise<{ ok: boolean; opportunityId?: string; data: any }>;
  listPipelines(): Promise<{
    ok: boolean;
    pipelines: Array<{ id: string; name: string; stages: Array<{ id: string; name: string }> }>;
    data: any;
  }>;
}

export function readGhlCredentials(): { token: string; locationId: string } {
  const token =
    Deno.env.get('GHL_PRIVATE_INTEGRATION_TOKEN') ||
    Deno.env.get('GOHIGHLEVEL_API_KEY') ||
    DEFAULT_PIT;
  const locationId =
    Deno.env.get('GHL_LOCATION_ID') ||
    Deno.env.get('GOHIGHLEVEL_LOCATION_ID') ||
    DEFAULT_LOCATION_ID;
  if (!token) throw new Error('GHL_PRIVATE_INTEGRATION_TOKEN is not configured.');
  if (!locationId) {
    throw new Error('GHL_LOCATION_ID is not configured. Private Integration tokens are location-scoped.');
  }
  return { token, locationId };
}

export function createGhlClient(overrides?: { token?: string; locationId?: string }): GHLClient {
  const creds = overrides?.token && overrides?.locationId
    ? { token: overrides.token, locationId: overrides.locationId }
    : readGhlCredentials();

  async function request(
    path: string,
    init?: RequestInit & { query?: Record<string, string | number | undefined> },
  ) {
    const url = new URL(path.startsWith('http') ? path : `${GHL_BASE}${path}`);
    if (init?.query) {
      for (const [k, v] of Object.entries(init.query)) {
        if (v === undefined || v === null || v === '') continue;
        url.searchParams.set(k, String(v));
      }
    }
    const headers = new Headers(init?.headers || {});
    headers.set('Authorization', `Bearer ${creds.token}`);
    headers.set('Version', GHL_API_VERSION);
    headers.set('Accept', 'application/json');
    if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    const res = await fetch(url.toString(), { ...init, headers });
    const raw = await res.text();
    let data: any = null;
    try { data = raw ? JSON.parse(raw) : null; } catch (_) { data = raw; }
    return { ok: res.ok, status: res.status, data, raw };
  }

  async function upsertContact(body: GHLContactUpsert) {
    const res = await request('/contacts/upsert', {
      method: 'POST',
      body: JSON.stringify({ ...body, locationId: creds.locationId }),
    });

    // GHL's upsert response shape varies between "new contact" and
    // "existing contact" branches and across API revisions. Try every
    // known location for the contact id before giving up.
    let contactId =
      res.data?.contact?.id ||
      res.data?.id ||
      res.data?.contactId ||
      res.data?.data?.contact?.id ||
      res.data?.data?.id ||
      res.data?.contact?._id ||
      res.data?._id;

    // Last-ditch fallback: if we got a 2xx but couldn't extract an id,
    // OR the upsert failed but we have an email we can search on,
    // look the contact up directly. This prevents spurious "contact
    // not synced" failures when GHL returns a 200 with a payload
    // shape we don't recognize, or when an over-strict customFields
    // entry caused the upsert to silently 4xx while the underlying
    // contact existed all along.
    if (!contactId && body.email) {
      try {
        const lookup = await request('/contacts/search/duplicate', {
          method: 'GET',
          query: { locationId: creds.locationId, email: body.email },
        });
        contactId =
          lookup.data?.contact?.id ||
          lookup.data?.id ||
          lookup.data?.contactId ||
          undefined;
      } catch (_) {
        // ignore — caller surfaces the original failure
      }
    }

    return { ok: res.ok || !!contactId, contactId, data: res.data, raw: res.raw };
  }

  async function addTags(contactId: string, tags: string[]) {
    if (!contactId || !tags?.length) return { ok: true, data: null };
    const res = await request(`/contacts/${contactId}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tags }),
    });
    return { ok: res.ok, data: res.data };
  }

  async function listCustomFields() {
    const res = await request(`/locations/${creds.locationId}/customFields`, { method: 'GET' });
    const rawFields: any[] = res.data?.customFields || res.data?.fields || [];
    const fields = rawFields.map((f: any) => ({
      id: f.id || f._id,
      name: f.name || f.label,
      fieldKey: f.fieldKey || f.key || f.name,
      dataType: f.dataType || f.type,
    }));
    return { ok: res.ok, fields, data: res.data };
  }

  async function findContactByEmail(email: string) {
    const res = await request('/contacts/search/duplicate', {
      method: 'GET',
      query: { locationId: creds.locationId, email },
    });
    const contactId = res.data?.contact?.id || res.data?.id;
    return { ok: res.ok, contactId, data: res.data };
  }

  async function listPipelines() {
    const res = await request('/opportunities/pipelines', {
      method: 'GET',
      query: { locationId: creds.locationId },
    });
    const pipelines: any[] = res.data?.pipelines || [];
    return { ok: res.ok, pipelines, data: res.data };
  }

  async function createOpportunity(params: {
    pipelineId: string;
    stageId: string;
    name: string;
    status?: 'open' | 'won' | 'lost' | 'abandoned';
    contactId: string;
    monetaryValue?: number;
    source?: string;
    customFields?: GHLCustomFieldValue[];
  }) {
    const res = await request('/opportunities/', {
      method: 'POST',
      body: JSON.stringify({
        pipelineId: params.pipelineId,
        locationId: creds.locationId,
        name: params.name,
        pipelineStageId: params.stageId,
        status: params.status || 'open',
        contactId: params.contactId,
        monetaryValue: params.monetaryValue,
        source: params.source,
        customFields: params.customFields,
      }),
    });
    const opportunityId = res.data?.opportunity?.id || res.data?.id;
    return { ok: res.ok, opportunityId, data: res.data };
  }

  return {
    token: creds.token,
    locationId: creds.locationId,
    request,
    upsertContact,
    addTags,
    listCustomFields,
    findContactByEmail,
    listPipelines,
    createOpportunity,
  };
}

/**
 * Normalize a key for fuzzy comparison. We strip the LeadConnector
 * `contact.`, `opportunity.`, `company.` prefix (all GHL v2 custom
 * fields are returned keyed like `contact.promo_code`) and reduce
 * anything non-alphanumeric to a single underscore so `Promo Code`,
 * `promo_code`, `promo-code`, `contact.promo_code` all collapse to
 * `promo_code`.
 */
function normalizeKey(s: string): string {
  return String(s || '')
    .toLowerCase()
    .replace(/^(contact|opportunity|company)\./, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Build a lookup table that maps every normalized alias of every GHL
 * custom field to its id. This lets the booking sync pick up fields by
 * their logical name (e.g. `promo_code`, `service_date`, `booking_amount`)
 * without hard-coding the 20-char GHL ids — and keeps working when a
 * field is renamed as long as its fieldKey/name stays recognizable.
 */
export function buildCustomFieldMap(
  fields: Array<{ id: string; name: string; fieldKey: string }>,
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const f of fields) {
    const candidates = [f.fieldKey, f.name].filter(Boolean) as string[];
    for (const c of candidates) {
      const norm = normalizeKey(c);
      if (norm && !map[norm]) map[norm] = f.id;
    }
  }
  return map;
}

export function resolveFieldId(
  map: Record<string, string>,
  candidates: string[],
): string | undefined {
  for (const c of candidates) {
    const norm = normalizeKey(c);
    if (map[norm]) return map[norm];
  }
  return undefined;
}

/**
 * Baseline mapping of "logical booking field" → the GHL subaccount's
 * actual 20-char custom field id, snapshotted from the AlphaLuxClean
 * subaccount's `/locations/:id/customFields` response. Acts as a
 * fallback so new booking fields work even when the dynamic fieldKey
 * lookup can't find a match (e.g. because the field was renamed and we
 * still recognize it by id). The dynamic lookup always takes
 * precedence — this is only consulted when `resolveFieldId` returns
 * undefined.
 */
export const KNOWN_GHL_FIELD_IDS: Record<string, string> = {
  promo_code: 'hzImH3cMPM6Cj5J8e1uy',
  discount_cash_value: 'vE91v97WzEdzQa87Elfj',
  service_type: 'vocRlkakgv2xpjq2hboB',
  service_frequency: 'rxRm0cS6YzQ0WxjWBnhm',
  frequency: '5G0eOYGBjWVCNoaIHSnt',
  service_date: 'maICPrr3pzfw0Tys6tY7',
  service_date_time: 'gxFEQgfzRx1AmyION3Lm',
  service_start_time: 'WNMBMqL587QVfxyb46hE',
  service_end_time: '45oB3nW4qpDs0JXeX77l',
  sqft: 'BI70nAIMEwPitLS4tDq1',
  bedrooms: 'KyuoJxzMuptC8rVvRYno',
  bathrooms: 'vze2zer9b8ELHDz0ktfU',
  property_type: '6B2st722Eo1gAZcqVVIi',
  flooring: 'VwxCMKNz03RD3T15IpSo',
  entry_instructions: 'XGIgNx2OJMmeW3OYZuxF',
  preferred_contact_method: 'DNjNcsWBJCwC5bHKpfdH',
  urgency: 'u3c4Sk7uywD4XIZSpPjy',
  conversion_status: '7n1z4v250F7GNL6mF2SF',
  subscription_status: 'HNKs61LbyQRtt7EKi38z',
  booking_amount: 'EuqFOk0d8gm4UUAdFFU5',
  original_price: 'KhZGtMNpquhTRt3tzwUo',
  deposit_amount: 'NJEevPnCpNqGIlOZLn7m',
  remaining_balance: 'ClzRZQNKpOJl4qaRmQ5S',
  cancel_fee_amount: 'IPSZc26bbAVyMlbZMMFT',
  mrr_est: 'LSbQ6BMQmnZFgBgmDoeZ',
  arr_est: 'jBGVSSBB9y0NyjKEgU3L',
  utm_source: 'S2TL9WCMxTwvJLJ632qh',
  utm_medium: 'zG1XiVVJ4z7FBy0PU4WA',
  utm_campaign: 'DCdHF938a5m3dBhW9YU1',
  utm_content: 'UXGs3AzKfN5QrnTvRDKn',
  utm_fields: 'WGAUW6Yl23jmFQyDYRd0',
  landing_page: 'KJFPQFwhxthmPPK7Evik',
  tracking_attribution: 'pwgPBfUxurA1qaRPw2Z5',
  fb_lead_id: 'PvKgPrXwjJrXrUiYVXNv',
  stripe_id: 'nyIGUcTiVfZhryfo5arQ',
  payment_link: 'Tl6FLcufUnM6N8sX5rq5',
  invoice_link: 'B8p5vfGemDl6XPXFSzSA',
  manage_link: 'lImnqhbUGFKXgxbA6Ww6',
  referral_code: 'ycwBGlB3IZyyQilzy8Wk',
  referral_link: '3KVKOe2GhxTgjxWqOXra',
};

/**
 * Return the GHL field id for a logical booking field, preferring the
 * dynamic fieldKey/name match and falling back to the baseline map
 * above. Matches the same candidate list pattern as `resolveFieldId`.
 */
export function resolveFieldIdWithFallback(
  map: Record<string, string>,
  candidates: string[],
): string | undefined {
  const dyn = resolveFieldId(map, candidates);
  if (dyn) return dyn;
  for (const c of candidates) {
    const norm = normalizeKey(c);
    if (KNOWN_GHL_FIELD_IDS[norm]) return KNOWN_GHL_FIELD_IDS[norm];
  }
  return undefined;
}

/**
 * Default pipeline + stage for a "booked customer". The AGP - Sales &
 * Growth Pipeline has a dedicated "Booked" stage (stage index 4). We
 * look it up dynamically so renaming the pipeline in GHL can't break
 * the integration as long as the stage name stays recognizable.
 */
export async function pickBookedPipelineStage(
  client: GHLClient,
): Promise<{ pipelineId?: string; stageId?: string; label?: string }> {
  const res = await client.listPipelines();
  const pipelines = res.pipelines || [];
  const preferred = pipelines.find((p) => /sales\s*&\s*growth|agp\s*-\s*sales/i.test(p.name));
  const pool = preferred ? [preferred, ...pipelines.filter((p) => p !== preferred)] : pipelines;
  for (const p of pool) {
    const stage =
      p.stages?.find((s) => /^\s*booked\b/i.test(s.name)) ||
      p.stages?.find((s) => /paid\s*\/\s*appt/i.test(s.name)) ||
      p.stages?.find((s) => /closed\s*.*won/i.test(s.name));
    if (stage) return { pipelineId: p.id, stageId: stage.id, label: `${p.name} → ${stage.name}` };
  }
  // Fall back to the very first stage of the first pipeline.
  const first = pipelines[0];
  if (first?.stages?.[0]) {
    return { pipelineId: first.id, stageId: first.stages[0].id, label: `${first.name} → ${first.stages[0].name}` };
  }
  return {};
}
