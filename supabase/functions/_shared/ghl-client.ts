// Shared GoHighLevel Private Integration client.
//
// Credential resolution:
//
//   token    : GHL_PIT_TOKEN  →  GHL_PRIVATE_INTEGRATION_TOKEN  →
//              GOHIGHLEVEL_API_KEY
//   location : GHL_LOCATION_ID  →  GOHIGHLEVEL_LOCATION_ID
//
// Opportunity owner is resolved from GHL_OWNER_USER_ID or
// GHL_OWNER_EMAIL — never a baked-in inbox. `/admin/integrations/housecall-pro`
// → Test Connection reports which of the two is wrong.
//
// Private Integration tokens are *location-scoped*, so every call must
// include the locationId either as a query param or in the request body
// (depending on endpoint).
//
// Hardening ported from Novara so the PIT path behaves identically:
//   - Automatic retry on 429 / 5xx / network errors (exp. backoff).
//   - Phone numbers normalized to E.164 before contact upsert.
//   - Freeform "Street, City, ST ZIP" addresses split into native slots.
//   - Opportunity owner resolution (GHL_OWNER_USER_ID / GHL_OWNER_EMAIL).
//   - find-or-update opportunity helpers so re-syncs never duplicate cards.
//   - Sales/booking pipeline auto-selection that NEVER lands a customer
//     in a hiring / recruiting pipeline.
//
// Endpoints used:
//   - POST   /contacts/upsert
//   - POST   /contacts/{contactId}/tags
//   - GET    /locations/{locationId}/customFields
//   - GET    /contacts/search/duplicate?locationId&email|phone
//   - GET    /users/?locationId
//   - POST   /opportunities/
//   - PUT    /opportunities/{opportunityId}
//   - GET    /opportunities/search?location_id&contact_id
//   - GET    /opportunities/pipelines?locationId
//   - POST   /conversations/messages
//
// All calls include Version: 2021-07-28 per the LeadConnector API spec.

import { toE164US } from './phone-format.ts';
import { getSecret, getSecretFromDb } from './secrets.ts';

export const GHL_BASE = 'https://services.leadconnectorhq.com';
export const GHL_API_VERSION = '2021-07-28';
// The Conversations/messaging endpoints are pinned to an older API
// revision than contacts/opportunities. Sending an SMS with the
// 2021-07-28 header returns a 400, so messaging calls must override it.
export const GHL_CONVERSATIONS_API_VERSION = '2021-04-15';

// Credentials come from edge-function secrets only. There are
// deliberately NO baked-in defaults:
//
//   * The PIT that used to be hard-coded here has been revoked —
//     GoHighLevel now answers "Invalid Private Integration token" for
//     it — so it could only ever produce 401s.
//   * A default location is worse than none. Private Integration tokens
//     are location-scoped, so pairing a perfectly good token with a
//     default subaccount it doesn't own fails as "This location is not
//     accessible from this token!", which reads like a bad key and
//     sends you looking in the wrong place.
//
// Missing configuration therefore fails loudly, and `ghlIsConfigured()`
// lets callers skip GHL work rather than hammer a broken client.

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

export interface GHLOpportunityUpdate {
  name?: string;
  status?: 'open' | 'won' | 'lost' | 'abandoned';
  pipelineId?: string;
  stageId?: string;
  monetaryValue?: number;
  assignedTo?: string;
  customFields?: GHLCustomFieldValue[];
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
  findContactByPhone(phone: string): Promise<{ ok: boolean; contactId?: string; data: any }>;
  getContact(contactId: string): Promise<{ ok: boolean; contact: any; data: any }>;
  sendSms(params: {
    contactId: string;
    message: string;
    fromNumber?: string;
  }): Promise<{ ok: boolean; status: number; messageId?: string; conversationId?: string; data: any }>;
  createOpportunity(params: {
    pipelineId: string;
    stageId: string;
    name: string;
    status?: 'open' | 'won' | 'lost' | 'abandoned';
    contactId: string;
    monetaryValue?: number;
    source?: string;
    assignedTo?: string;
    customFields?: GHLCustomFieldValue[];
  }): Promise<{ ok: boolean; opportunityId?: string; data: any }>;
  findOpportunityForContact(
    contactId: string,
    pipelineId?: string,
  ): Promise<{ ok: boolean; opportunityId?: string; name?: string; status?: string; data: any }>;
  updateOpportunity(
    opportunityId: string,
    patch: GHLOpportunityUpdate,
  ): Promise<{ ok: boolean; data: any }>;
  listUsers(): Promise<{ ok: boolean; users: Array<{ id: string; email: string; name: string }>; data: any }>;
  resolveOwnerUserId(): Promise<string | null>;
  listPipelines(): Promise<{
    ok: boolean;
    pipelines: Array<{ id: string; name: string; stages: Array<{ id: string; name: string; position?: number }> }>;
    data: any;
  }>;
}

export function readGhlCredentials(): { token: string; locationId: string } {
  const token =
    Deno.env.get('GHL_PIT_TOKEN') ||
    Deno.env.get('GHL_PRIVATE_INTEGRATION_TOKEN') ||
    Deno.env.get('GOHIGHLEVEL_API_KEY');
  const locationId =
    Deno.env.get('GHL_LOCATION_ID') ||
    Deno.env.get('GOHIGHLEVEL_LOCATION_ID');
  if (!token) {
    throw new Error(
      'GHL_PIT_TOKEN is not configured. Create a Private Integration in the ' +
        'GoHighLevel subaccount and store its token as a Supabase edge-function secret.',
    );
  }
  if (!locationId) {
    throw new Error(
      'GHL_LOCATION_ID is not configured. Private Integration tokens are ' +
        'location-scoped, so the token is useless without the id of the subaccount ' +
        'it was created in (GHL → Settings → Business Profile → Location ID).',
    );
  }
  return { token: token.trim(), locationId: locationId.trim() };
}

/**
 * Env-var-only check. Kept for synchronous callers; prefer the async
 * form below, which also sees credentials stored in `app_secrets`.
 */
export function ghlIsConfigured(): boolean {
  const token =
    Deno.env.get('GHL_PIT_TOKEN') ||
    Deno.env.get('GHL_PRIVATE_INTEGRATION_TOKEN') ||
    Deno.env.get('GOHIGHLEVEL_API_KEY');
  const locationId = Deno.env.get('GHL_LOCATION_ID') || Deno.env.get('GOHIGHLEVEL_LOCATION_ID');
  return Boolean(token && locationId);
}

/**
 * Resolve both halves of the location-scoped credential from env vars
 * or `app_secrets`. Returns null when either half is missing — callers
 * should skip GHL work rather than construct a half-configured client.
 */
export async function resolveGhlCredentials(): Promise<
  { token: string; locationId: string } | null
> {
  // Prefer app_secrets for the canonical names so a stale dashboard
  // env var cannot beat the live PIT / location id (same pattern as
  // OPENPHONE_API_KEY). Aliases still fall through env-then-DB.
  // Prefer app_secrets for the canonical names so a stale dashboard
  // env var cannot beat the live PIT / location id (same pattern as
  // OPENPHONE_API_KEY). Aliases still fall through env-then-DB.
  const token =
    (await getSecretFromDb('GHL_PIT_TOKEN')) ||
    (await getSecret('GHL_PIT_TOKEN')) ||
    (await getSecret('GHL_PRIVATE_INTEGRATION_TOKEN')) ||
    (await getSecret('GOHIGHLEVEL_API_KEY'));
  const locationId =
    (await getSecretFromDb('GHL_LOCATION_ID')) ||
    (await getSecret('GHL_LOCATION_ID')) ||
    (await getSecret('GOHIGHLEVEL_LOCATION_ID'));
  if (!token || !locationId) return null;
  return { token, locationId };
}

/** True when a usable token + location pair exists in either store. */
export async function ghlIsConfiguredAsync(): Promise<boolean> {
  return (await resolveGhlCredentials()) !== null;
}

/**
 * Build a client from whichever store holds the credentials. Throws the
 * same descriptive error as `readGhlCredentials` when nothing is set.
 */
export async function createGhlClientFromSecrets(): Promise<GHLClient> {
  const creds = await resolveGhlCredentials();
  if (creds) return createGhlClient(creds);
  // Nothing in app_secrets either — reuse the env path purely for its
  // error message, which names the missing variable.
  return createGhlClient();
}

// ─── Owner / location-user resolution cache (per cold start) ──────────────
let ownerIdCache: string | null | undefined; // undefined = not resolved yet

export function createGhlClient(overrides?: { token?: string; locationId?: string }): GHLClient {
  const creds = overrides?.token && overrides?.locationId
    ? { token: overrides.token, locationId: overrides.locationId }
    : readGhlCredentials();

  // Retry-on-failure wrapper. Network blips + transient 5xx + 429
  // rate-limits get up to 3 attempts with exponential backoff
  // (200 ms → 600 ms → 1.8 s). Non-retryable 4xx return immediately.
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
    if (!headers.has('Version')) headers.set('Version', GHL_API_VERSION);
    headers.set('Accept', 'application/json');
    if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

    const maxAttempts = 3;
    let lastErr: unknown = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await fetch(url.toString(), { ...init, headers });
        const retryable = res.status === 429 || res.status >= 500;
        if (!retryable || attempt === maxAttempts) {
          const raw = await res.text();
          let data: any = null;
          try { data = raw ? JSON.parse(raw) : null; } catch (_) { data = raw; }
          return { ok: res.ok, status: res.status, data, raw };
        }
        console.log(`[ghl-client] retrying ${path} (attempt ${attempt}, status ${res.status})`);
      } catch (err) {
        lastErr = err;
        if (attempt === maxAttempts) throw err;
        console.log(`[ghl-client] network error on ${path} (attempt ${attempt}) — retrying`);
      }
      await new Promise((r) => setTimeout(r, 200 * Math.pow(3, attempt - 1)));
    }
    throw lastErr instanceof Error ? lastErr : new Error('ghl request exhausted retries');
  }

  async function upsertContact(body: GHLContactUpsert) {
    // Normalize phone to E.164 and lift City/State/ZIP out of a freeform
    // address1 so each value lands in its native GHL slot (matches the
    // Novara client). GHL dedupes on a clean phone/email; a malformed
    // phone makes the contact look "missing" downstream.
    const phoneE164 = body.phone ? (toE164US(body.phone) || undefined) : undefined;
    const split = splitFullAddress(body.address1 || '');
    const finalStreet = split.street || body.address1 || undefined;
    const finalCity = body.city || split.city || undefined;
    const finalState = body.state || split.state || undefined;
    const finalZip = body.postalCode || split.zipCode || undefined;

    const payload: GHLContactUpsert & { locationId: string } = {
      ...body,
      phone: phoneE164,
      address1: finalStreet,
      city: finalCity,
      state: finalState,
      postalCode: finalZip,
      country: body.country || 'US',
      locationId: creds.locationId,
    };

    const res = await request('/contacts/upsert', {
      method: 'POST',
      body: JSON.stringify(payload),
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
    // OR the upsert failed but we have an email/phone we can search on,
    // look the contact up directly. This prevents spurious "contact not
    // synced" failures when GHL returns a payload shape we don't
    // recognize, or when an over-strict customFields entry caused the
    // upsert to silently 4xx while the underlying contact existed.
    if (!contactId && (body.email || phoneE164)) {
      try {
        const lookup = await request('/contacts/search/duplicate', {
          method: 'GET',
          query: body.email
            ? { locationId: creds.locationId, email: body.email }
            : { locationId: creds.locationId, number: phoneE164 },
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

  async function findContactByPhone(phone: string) {
    const res = await request('/contacts/search/duplicate', {
      method: 'GET',
      query: { locationId: creds.locationId, number: toE164US(phone) || phone },
    });
    const contactId = res.data?.contact?.id || res.data?.id;
    return { ok: res.ok, contactId, data: res.data };
  }

  async function getContact(contactId: string) {
    const res = await request(`/contacts/${contactId}`, { method: 'GET' });
    const contact = res.data?.contact || res.data || null;
    return { ok: res.ok, contact, data: res.data };
  }

  async function sendSms(params: { contactId: string; message: string; fromNumber?: string }) {
    // POST /conversations/messages with type=SMS. GHL routes the message
    // out through the location's connected phone number (LeadConnector /
    // Twilio) and threads it into the contact's existing conversation,
    // so inbound replies come back to us via the same webhook.
    const payload: Record<string, unknown> = {
      type: 'SMS',
      contactId: params.contactId,
      message: params.message,
    };
    if (params.fromNumber) payload.fromNumber = params.fromNumber;
    const res = await request('/conversations/messages', {
      method: 'POST',
      headers: { Version: GHL_CONVERSATIONS_API_VERSION },
      body: JSON.stringify(payload),
    });
    return {
      ok: res.ok,
      status: res.status,
      messageId: res.data?.messageId || res.data?.id || res.data?.msg?.id,
      conversationId: res.data?.conversationId || res.data?.conversation?.id,
      data: res.data,
    };
  }

  async function listPipelines() {
    const res = await request('/opportunities/pipelines', {
      method: 'GET',
      query: { locationId: creds.locationId },
    });
    const pipelines: any[] = res.data?.pipelines || [];
    return { ok: res.ok, pipelines, data: res.data };
  }

  async function listUsers() {
    const res = await request('/users/', {
      method: 'GET',
      query: { locationId: creds.locationId },
    });
    const raw: any[] = res.data?.users || [];
    const users = raw
      .map((u: any) => ({
        id: String(u.id || ''),
        email: String(u.email || '').trim().toLowerCase(),
        name: (`${u.firstName || ''} ${u.lastName || ''}`.trim() || String(u.name || '')).toLowerCase(),
      }))
      .filter((u) => u.id);
    return { ok: res.ok, users, data: res.data };
  }

  /**
   * Resolve the default opportunity owner. GHL_OWNER_USER_ID wins; else
   * GHL_OWNER_EMAIL is matched against the location's user list. Cached
   * for the cold start; returns null when nothing matches (caller leaves
   * the opportunity unassigned).
   */
  async function resolveOwnerUserId(): Promise<string | null> {
    if (ownerIdCache !== undefined) return ownerIdCache;
    const explicit = (Deno.env.get('GHL_OWNER_USER_ID') || '').trim();
    if (explicit) {
      ownerIdCache = explicit;
      return explicit;
    }
    const ownerEmail = (Deno.env.get('GHL_OWNER_EMAIL') || '')
      .trim()
      .toLowerCase();
    if (!ownerEmail) {
      ownerIdCache = null;
      return null;
    }
    try {
      const { users } = await listUsers();
      const match = users.find((u) => u.email === ownerEmail);
      ownerIdCache = match?.id ?? null;
    } catch (_) {
      ownerIdCache = null;
    }
    return ownerIdCache;
  }

  async function createOpportunity(params: {
    pipelineId: string;
    stageId: string;
    name: string;
    status?: 'open' | 'won' | 'lost' | 'abandoned';
    contactId: string;
    monetaryValue?: number;
    source?: string;
    assignedTo?: string;
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
        assignedTo: params.assignedTo || undefined,
        customFields: params.customFields,
      }),
    });
    const opportunityId = res.data?.opportunity?.id || res.data?.id;
    return { ok: res.ok, opportunityId, data: res.data };
  }

  /**
   * Find the most-recent opportunity for a contact (optionally scoped to
   * one pipeline). Used to keep ONE opportunity per booking instead of
   * spamming a new card on every re-sync.
   */
  async function findOpportunityForContact(contactId: string, pipelineId?: string) {
    if (!contactId) return { ok: false, opportunityId: undefined, data: null };
    const query: Record<string, string | number | undefined> = {
      location_id: creds.locationId,
      contact_id: contactId,
      limit: 20,
    };
    if (pipelineId) query.pipeline_id = pipelineId;
    const res = await request('/opportunities/search', { method: 'GET', query });
    const opps: any[] = res.data?.opportunities || [];
    if (opps.length === 0) return { ok: res.ok, opportunityId: undefined, data: res.data };
    opps.sort((a, b) => {
      const at = Date.parse(a.updatedAt || a.createdAt || '') || 0;
      const bt = Date.parse(b.updatedAt || b.createdAt || '') || 0;
      return bt - at;
    });
    const top = opps[0];
    return {
      ok: res.ok,
      opportunityId: top?.id,
      name: top?.name,
      status: top?.status,
      data: res.data,
    };
  }

  /** PUT /opportunities/:id — partial update. */
  async function updateOpportunity(opportunityId: string, patch: GHLOpportunityUpdate) {
    if (!opportunityId) return { ok: false, data: null };
    const body: Record<string, unknown> = {};
    if (patch.name !== undefined) body.name = patch.name;
    if (patch.status !== undefined) body.status = patch.status;
    if (patch.pipelineId !== undefined) body.pipelineId = patch.pipelineId;
    if (patch.stageId !== undefined) body.pipelineStageId = patch.stageId;
    if (patch.monetaryValue !== undefined) body.monetaryValue = patch.monetaryValue;
    if (patch.assignedTo !== undefined) body.assignedTo = patch.assignedTo;
    if (patch.customFields && patch.customFields.length > 0) body.customFields = patch.customFields;
    const res = await request(`/opportunities/${encodeURIComponent(opportunityId)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    return { ok: res.ok, data: res.data };
  }

  return {
    token: creds.token,
    locationId: creds.locationId,
    request,
    upsertContact,
    addTags,
    listCustomFields,
    findContactByEmail,
    findContactByPhone,
    getContact,
    sendSms,
    listPipelines,
    listUsers,
    resolveOwnerUserId,
    createOpportunity,
    findOpportunityForContact,
    updateOpportunity,
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
 * Baseline mapping of "logical booking field" → the subaccount's actual
 * 20-char custom field id. Only consulted when the dynamic fieldKey
 * lookup returns nothing (a renamed field, or a failed customFields
 * call); `resolveFieldId` always wins.
 *
 * Custom field ids are LOCATION-SPECIFIC. This snapshot is from
 * location ESaf0wtNvMhNtUYQ4rzz, read from
 * GET /locations/:id/customFields — all 40 keys below resolved against
 * the live subaccount.
 *
 * The previous snapshot was taken from a different subaccount, so every
 * id in it was wrong for the location the integration actually talks to.
 * That is worse than having no fallback at all: instead of degrading
 * when the customFields call fails, it would confidently write to ids
 * this location has never heard of. If the subaccount ever changes,
 * re-snapshot this map or delete it — do not leave a stale one here.
 */
export const KNOWN_GHL_FIELD_IDS: Record<string, string> = {
  promo_code: 'FzUjOSsvMKVUJlunydPF',
  discount_cash_value: 'ScHiW7aYVykeB7I3Fsbw',
  service_type: '04fcH1iCBeOg0BJsBXeB',
  service_frequency: 'wxVFdZmn6yS8PZBfemTS',
  frequency: 'Nul3Ned27HuYMNQ7r4dJ',
  service_date: 'YcsQkzVv8H0WseKgLWFX',
  service_date_time: '4znHikx9hky9Sh7W7HSX',
  service_start_time: 'w4d6U1W4eGWU8aSfqVd9',
  service_end_time: 'IgUczKthdDh6ughj6yL2',
  sqft: 'LySVTgYNBUqK9rZUerLi',
  bedrooms: 'KzDv6bpjFcq4akNZbwQ6',
  bathrooms: 'T9q0YuBTvX5h4VwSJXwY',
  property_type: 'MuVXSHeJwbLUG3wMF2IG',
  flooring: 'DAM7y9mhid1SDbf6F6WA',
  entry_instructions: 'Nk0KNbMXO7Sc9S1EzUvx',
  preferred_contact_method: 'tp6R0OwdlEfHBZHMboOw',
  urgency: 'fOWAnj0ugFtX0NElTHtb',
  conversion_status: 'twagqXsLcfAvsiLwx6t5',
  subscription_status: 'bEX5eKgpYLvNLpSZAeuJ',
  booking_amount: '27zv8pgwD0uAg2OMYIYn',
  original_price: 'DXU1e8yYfESPMSc8tMoG',
  deposit_amount: 'DbYDtgMHNgZEilc0egjn',
  remaining_balance: 'Kzpfmz7Ovf2Gr8COsAW8',
  cancel_fee_amount: 'JHxtlkl5O6JiQbS097cE',
  mrr_est: 'mgg5KrYnZ55Quf8BbhKl',
  arr_est: 'fY4OUVdOJHrJe3S9iwZy',
  utm_source: 'NPOFUoi9DPsRBSB5EluW',
  utm_medium: 'xjRoKXJU4WJuugCGQFoG',
  utm_campaign: '14N1RFgpZVe0iMydqibb',
  utm_content: 'y0WCPqqEEv6waxuTp0Gc',
  utm_fields: 'DkHRjYv1XudI5cCbXl0t',
  landing_page: '1s0Hj9hT4rwFKBGmeGWF',
  tracking_attribution: 'EO41flyVlJe3mHTiIEeG',
  fb_lead_id: 'GOES8RgqR8JLgIx0BMx8',
  stripe_id: 'pWepgdBHk9HpgNvmytux',
  payment_link: 'CLa3s66PvyVW2u5hXCeB',
  invoice_link: 'GfL9izAnsJXjJlzIgPPG',
  manage_link: 'y7cOPJpx9s3ouvj3tWwi',
  referral_code: 'y0EWaKfFOJMax0g73SZb',
  referral_link: 'uPvcQ1fgv6SDZjjccgTB',
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

// Pipelines we must NEVER drop a customer/sales opportunity into. The
// hiring / recruiting / contractor onboarding funnel is for cleaners,
// not customers — a booking landing here is a classic GHL bug.
const HIRING_PIPELINE_RE =
  /\b(hir|recruit|cleaner|team|onboard|driver|contractor|applicant|interview|candidate)\b/i;

/**
 * Default pipeline + stage for a "booked customer". Prefers the AGP -
 * Sales & Growth Pipeline and its "Booked" stage, looked up dynamically
 * so renaming the pipeline in GHL can't break the integration as long as
 * the stage name stays recognizable. NEVER selects a hiring/recruiting
 * pipeline (ported guard from the Novara client).
 */
export async function pickBookedPipelineStage(
  client: GHLClient,
): Promise<{ pipelineId?: string; stageId?: string; label?: string }> {
  const res = await client.listPipelines();
  const all = res.pipelines || [];
  // A customer/sales opportunity must never land in the hiring pipeline.
  const pipelines = all.filter((p) => !HIRING_PIPELINE_RE.test(p.name || ''));
  const candidatePool = pipelines.length > 0 ? pipelines : all;
  const preferred = candidatePool.find((p) => /sales\s*&\s*growth|agp\s*-\s*sales/i.test(p.name));
  const pool = preferred ? [preferred, ...candidatePool.filter((p) => p !== preferred)] : candidatePool;
  for (const p of pool) {
    const stage =
      p.stages?.find((s) => /^\s*booked\b/i.test(s.name)) ||
      p.stages?.find((s) => /paid\s*\/\s*appt/i.test(s.name)) ||
      p.stages?.find((s) => /closed\s*.*won/i.test(s.name));
    if (stage) return { pipelineId: p.id, stageId: stage.id, label: `${p.name} → ${stage.name}` };
  }
  // Fall back to the first (non-hiring) pipeline's first stage.
  const first = candidatePool[0];
  if (first?.stages?.[0]) {
    return { pipelineId: first.id, stageId: first.stages[0].id, label: `${first.name} → ${first.stages[0].name}` };
  }
  return {};
}

// ─── Address splitter (mirrors the Novara client) ─────────────────────────
const US_STATE_CODE_SET = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DC', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN',
  'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH',
  'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT',
  'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
]);

/**
 * Pull ZIP + 2-letter state + city + street out of a freeform address.
 * Returns blank fields when nothing matches; the caller is responsible
 * for falling back to the original string.
 */
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

/** Format a dollar amount as "$X.XX" for monetary GHL fields. */
export function fmtMoney(amount: number | null | undefined): string {
  if (!amount && amount !== 0) return '';
  return `$${Number(amount).toFixed(2)}`;
}

/** Yes/No string for GHL dropdowns that store yes/no. */
export function ynBool(v: boolean | null | undefined): string {
  if (v === true) return 'Yes';
  if (v === false) return 'No';
  return '';
}
