// Shared GoHighLevel Private Integration client for AlphaLuxClean TX/CA.
//
// Reads GHL_PRIVATE_INTEGRATION_TOKEN (aka PIT) and GHL_LOCATION_ID from
// Edge Function secrets. PIT tokens are *location-scoped*, so every call
// must include the locationId either as a query param or in the request
// body (depending on endpoint).
//
// Public surface used by ghl-sync-booking / ghl-sync-lead / reconcile-ghl:
//   - request(path, init)                  raw HTTP with retry-on-429/5xx
//   - upsertContact(body)                  POST /contacts/upsert
//   - addTags(contactId, tags)             POST /contacts/:id/tags
//   - listCustomFields()                   GET  /locations/:id/customFields
//   - findContactByEmail(email)            GET  /contacts/search/duplicate
//   - listPipelines()                      GET  /opportunities/pipelines
//   - createOpportunity(params)            POST /opportunities/
//   - findLatestOpportunityForContact(id)  GET  /opportunities/search
//   - updateOpportunity(id, patch)         PUT  /opportunities/:id
//   - syncBookingLifecycle({contact,opp})  upsert + find/patch-or-create
//                                          opportunity. Idempotent across
//                                          the booking lifecycle (no
//                                          duplicate cards on every
//                                          retry / reschedule / cancel).
//
// All calls include Version: 2021-07-28 per the LeadConnector API spec
// and retry up to 3 times on transient 429/5xx with exponential backoff.

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
  /** Convenience: pass a key/value bag and let the client resolve ids. */
  customFieldsByKey?: Record<string, unknown>;
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
  upsertContact(body: GHLContactUpsert): Promise<{
    ok: boolean;
    contactId?: string;
    data: any;
    sent: number;
    returned: number;
  }>;
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
  findLatestOpportunityForContact(
    contactId: string,
  ): Promise<{ id: string; name?: string; status?: string; pipelineId?: string } | null>;
  updateOpportunity(
    opportunityId: string,
    patch: {
      name?: string;
      status?: 'open' | 'won' | 'lost' | 'abandoned';
      pipelineId?: string;
      pipelineStageId?: string;
      monetaryValue?: number;
      customFields?: GHLCustomFieldValue[];
    },
  ): Promise<{ ok: boolean; data: any }>;
  syncBookingLifecycle(args: {
    contact: GHLContactUpsert;
    opportunity: {
      pipelineId?: string;
      stageId?: string;
      name: string;
      status?: 'open' | 'won' | 'lost' | 'abandoned';
      monetaryValue?: number;
      source?: string;
      customFields?: GHLCustomFieldValue[];
    };
  }): Promise<{
    contactId: string | null;
    opportunityId: string | null;
    updated: boolean;
    customFieldsSent: number;
    customFieldsReturned: number;
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

function clientLog(step: string, details?: unknown) {
  console.log(
    `[ghl-client] ${step}${details !== undefined ? ' ' + JSON.stringify(details) : ''}`,
  );
}

export function createGhlClient(overrides?: { token?: string; locationId?: string }): GHLClient {
  const creds = overrides?.token && overrides?.locationId
    ? { token: overrides.token, locationId: overrides.locationId }
    : readGhlCredentials();

  // ─── retry-on-failure wrapper ────────────────────────────────
  // Network blips + transient 5xx + 429 rate-limits get up to 3
  // attempts with exponential backoff (200ms → 600ms → 1.8s).
  // Non-retryable statuses (4xx other than 429) return immediately.
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

    const maxAttempts = 3;
    let lastErr: unknown = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const res = await fetch(url.toString(), { ...init, headers });
        const raw = await res.text();
        let data: any = null;
        try { data = raw ? JSON.parse(raw) : null; } catch (_) { data = raw; }
        const retryable = res.status === 429 || res.status >= 500;
        if (!retryable || attempt === maxAttempts) {
          return { ok: res.ok, status: res.status, data, raw };
        }
        clientLog('retrying', { attempt, status: res.status, path });
      } catch (err) {
        lastErr = err;
        if (attempt === maxAttempts) {
          clientLog('network error — giving up', {
            attempt, path, err: err instanceof Error ? err.message : String(err),
          });
          throw err;
        }
        clientLog('network error retrying', {
          attempt, path, err: err instanceof Error ? err.message : String(err),
        });
      }
      // 200 * 3^(attempt-1) → 200, 600, 1800ms
      await new Promise((r) => setTimeout(r, 200 * Math.pow(3, attempt - 1)));
    }
    throw lastErr instanceof Error ? lastErr : new Error('ghl request exhausted retries');
  }

  // ─── Custom-field id cache ───────────────────────────────────
  // `fieldKey` (or normalized variant) → field UUID. Populated
  // once per cold start so the booking sync doesn't refetch this
  // list on every invocation.
  let fieldIdMapCache: Record<string, string> | null = null;
  let fieldIdMapPromise: Promise<Record<string, string>> | null = null;

  async function loadFieldIdMap(): Promise<Record<string, string>> {
    if (fieldIdMapCache) return fieldIdMapCache;
    if (fieldIdMapPromise) return await fieldIdMapPromise;
    fieldIdMapPromise = (async () => {
      const res = await listCustomFields();
      const map = buildCustomFieldMap(res.fields);
      fieldIdMapCache = map;
      return map;
    })();
    return await fieldIdMapPromise;
  }

  async function customFieldsByKeyToArray(
    byKey: Record<string, unknown> | undefined,
  ): Promise<GHLCustomFieldValue[]> {
    if (!byKey) return [];
    const map = await loadFieldIdMap();
    const out: GHLCustomFieldValue[] = [];
    for (const [key, raw] of Object.entries(byKey)) {
      if (raw === undefined || raw === null || raw === '') continue;
      const id = resolveFieldIdWithFallback(map, [key]);
      if (!id) {
        clientLog('custom-field key not in GHL — skipping', { key });
        continue;
      }
      out.push({ id, field_value: raw });
    }
    return out;
  }

  async function upsertContact(body: GHLContactUpsert) {
    // Resolve customFieldsByKey → id-keyed entries, then merge with
    // any explicit customFields the caller passed.
    const fromKeys = await customFieldsByKeyToArray(body.customFieldsByKey);
    const merged: GHLCustomFieldValue[] = [
      ...(body.customFields || []),
      ...fromKeys,
    ];

    // Defensive address splitter — if a caller passes a full address
    // string in address1, lift City/State/ZIP out so each lands in
    // its native GHL slot.
    const split = splitFullAddress(body.address1 || '');
    const street = split.street || body.address1 || undefined;
    const city = body.city || split.city || undefined;
    const state = body.state || split.state || undefined;
    const postalCode = body.postalCode || split.zipCode || undefined;

    const sentCount = merged.length;
    const res = await request('/contacts/upsert', {
      method: 'POST',
      body: JSON.stringify({
        locationId: creds.locationId,
        email: body.email || undefined,
        phone: body.phone || undefined,
        firstName: body.firstName || undefined,
        lastName: body.lastName || undefined,
        name: body.name || undefined,
        address1: street,
        address2: body.address2 || undefined,
        city,
        state,
        postalCode,
        country: body.country || 'US',
        source: body.source || undefined,
        website: body.website || undefined,
        companyName: body.companyName || undefined,
        dnd: body.dnd || undefined,
        tags: body.tags && body.tags.length > 0 ? body.tags : undefined,
        customFields: merged.length > 0 ? merged : undefined,
      }),
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
    // look the contact up directly.
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

    const returnedFields = Array.isArray(res.data?.contact?.customFields)
      ? res.data.contact.customFields.length
      : Array.isArray(res.data?.customFields)
        ? res.data.customFields.length
        : 0;
    clientLog('upsertContact', {
      ok: res.ok || !!contactId,
      contactId,
      sent: sentCount,
      returned: returnedFields,
    });
    return {
      ok: res.ok || !!contactId,
      contactId,
      data: res.data,
      raw: res.raw,
      sent: sentCount,
      returned: returnedFields,
    };
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

  // ─── Opportunity lookup + update ─────────────────────────────
  //
  // GHL's PIT API exposes:
  //   GET  /opportunities/search?location_id=&contact_id=
  //   PUT  /opportunities/:id    (body fields are partial — only what you send)
  //
  // syncBookingLifecycle uses these to keep ONE opportunity per
  // booking and mutate its status + custom fields rather than
  // spamming the pipeline with a new card on every payment / status
  // change.
  async function findLatestOpportunityForContact(contactId: string) {
    if (!contactId) return null;
    const res = await request('/opportunities/search', {
      method: 'GET',
      query: {
        location_id: creds.locationId,
        contact_id: contactId,
        limit: 20,
      },
    });
    if (!res.ok) {
      clientLog('findLatestOpportunityForContact failed', { status: res.status });
      return null;
    }
    const opps: any[] = res.data?.opportunities || [];
    if (opps.length === 0) return null;
    opps.sort((a, b) => {
      const aT = Date.parse(a.updatedAt || a.createdAt || '') || 0;
      const bT = Date.parse(b.updatedAt || b.createdAt || '') || 0;
      return bT - aT;
    });
    const top = opps[0];
    return top?.id
      ? {
        id: top.id as string,
        name: top.name as string | undefined,
        status: top.status as string | undefined,
        pipelineId: (top.pipelineId || top.pipeline_id) as string | undefined,
      }
      : null;
  }

  async function updateOpportunity(
    opportunityId: string,
    patch: {
      name?: string;
      status?: 'open' | 'won' | 'lost' | 'abandoned';
      pipelineId?: string;
      pipelineStageId?: string;
      monetaryValue?: number;
      customFields?: GHLCustomFieldValue[];
    },
  ) {
    if (!opportunityId) return { ok: false, data: null };
    const body: Record<string, unknown> = {};
    if (patch.name !== undefined) body.name = patch.name;
    if (patch.status !== undefined) body.status = patch.status;
    if (patch.pipelineId !== undefined) body.pipelineId = patch.pipelineId;
    if (patch.pipelineStageId !== undefined) body.pipelineStageId = patch.pipelineStageId;
    if (patch.monetaryValue !== undefined) body.monetaryValue = patch.monetaryValue;
    if (patch.customFields && patch.customFields.length > 0) body.customFields = patch.customFields;
    const res = await request(`/opportunities/${encodeURIComponent(opportunityId)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    return { ok: res.ok, data: res.data };
  }

  async function syncBookingLifecycle(args: {
    contact: GHLContactUpsert;
    opportunity: {
      pipelineId?: string;
      stageId?: string;
      name: string;
      status?: 'open' | 'won' | 'lost' | 'abandoned';
      monetaryValue?: number;
      source?: string;
      customFields?: GHLCustomFieldValue[];
    };
  }) {
    const up = await upsertContact(args.contact);
    if (!up.contactId) {
      return {
        contactId: null,
        opportunityId: null,
        updated: false,
        customFieldsSent: up.sent,
        customFieldsReturned: up.returned,
      };
    }

    // Make sure tags get applied even when /contacts/upsert ignored them
    // on the existing-contact branch.
    if (args.contact.tags?.length) {
      try { await addTags(up.contactId, args.contact.tags); } catch (_) { /* ignore */ }
    }

    const existing = await findLatestOpportunityForContact(up.contactId);
    if (existing) {
      const patch = await updateOpportunity(existing.id, {
        name: args.opportunity.name,
        status: args.opportunity.status,
        monetaryValue: args.opportunity.monetaryValue,
        pipelineId: args.opportunity.pipelineId,
        pipelineStageId: args.opportunity.stageId,
        customFields: args.opportunity.customFields,
      });
      return {
        contactId: up.contactId,
        opportunityId: existing.id,
        updated: patch.ok,
        customFieldsSent: up.sent,
        customFieldsReturned: up.returned,
      };
    }

    // No opportunity yet — resolve pipeline + stage, then create one.
    let pipelineId = args.opportunity.pipelineId;
    let stageId = args.opportunity.stageId;
    if (!pipelineId || !stageId) {
      const picked = await pickBookedPipelineStage({
        listPipelines,
      } as unknown as GHLClient);
      pipelineId = pipelineId || picked.pipelineId;
      stageId = stageId || picked.stageId;
    }
    if (!pipelineId || !stageId) {
      clientLog('no pipeline found — skipping opportunity create');
      return {
        contactId: up.contactId,
        opportunityId: null,
        updated: false,
        customFieldsSent: up.sent,
        customFieldsReturned: up.returned,
      };
    }
    const created = await createOpportunity({
      pipelineId,
      stageId,
      name: args.opportunity.name,
      status: args.opportunity.status || 'open',
      contactId: up.contactId,
      monetaryValue: args.opportunity.monetaryValue,
      source: args.opportunity.source,
      customFields: args.opportunity.customFields,
    });
    return {
      contactId: up.contactId,
      opportunityId: created.opportunityId || null,
      updated: false,
      customFieldsSent: up.sent,
      customFieldsReturned: up.returned,
    };
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
    findLatestOpportunityForContact,
    updateOpportunity,
    syncBookingLifecycle,
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
 * subaccount's `/locations/:id/customFields` response on 2026-05-17.
 * Acts as a fallback so new booking fields work even when the dynamic
 * fieldKey lookup can't find a match (e.g. because the field was
 * renamed and we still recognize it by id). The dynamic lookup always
 * takes precedence — this is only consulted when `resolveFieldId`
 * returns undefined.
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
  client: { listPipelines: GHLClient['listPipelines'] },
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

// ─── Address splitter (mirrors client-side parseAddressString) ──────────
//
// Pull ZIP + 2-letter state + city + street out of a freeform address so
// callers can always feed in `address1` and get back clean GHL slots.
// Returns blank fields when nothing matches; the caller is responsible
// for falling back to the original string.
const US_STATE_CODE_SET = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DC', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN',
  'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH',
  'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT',
  'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
]);

export function splitFullAddress(input: string): {
  street: string; city: string; state: string; zipCode: string;
} {
  const empty = { street: '', city: '', state: '', zipCode: '' };
  if (!input || typeof input !== 'string') return empty;
  let work = input.trim().replace(/\s+/g, ' ');
  if (!work) return empty;

  let zipCode = '';
  let state = '';
  let city = '';
  let street = work;

  const zipMatch = work.match(/\b(\d{5})(?:-\d{4})?\b\s*$/);
  if (zipMatch) {
    zipCode = zipMatch[1];
    work = work.slice(0, zipMatch.index).trim().replace(/,\s*$/, '');
  }

  const stateMatch = work.match(/,?\s*([A-Za-z]{2})\s*$/);
  if (stateMatch && US_STATE_CODE_SET.has(stateMatch[1].toUpperCase())) {
    state = stateMatch[1].toUpperCase();
    work = work.slice(0, stateMatch.index).trim().replace(/,\s*$/, '');
  }

  const lastComma = work.lastIndexOf(',');
  if (lastComma >= 0) {
    city = work.slice(lastComma + 1).trim();
    street = work.slice(0, lastComma).trim();
  } else {
    street = work;
  }

  return { street, city, state, zipCode };
}

// ─── Tiny formatters reused across mappers ──────────────────────────────
export function fmtMoney(cents: number | null | undefined): string {
  if (cents === null || cents === undefined || Number.isNaN(cents)) return '';
  return `$${(cents / 100).toFixed(2)}`;
}

export function ynBool(v: boolean | null | undefined): string {
  if (v === true) return 'Yes';
  if (v === false) return 'No';
  return '';
}
