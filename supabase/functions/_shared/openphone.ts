// OpenPhone helpers — state-routed business numbers.
//
// AlphaLux operates one OpenPhone number per service state. Every outbound
// SMS must go out from the number that matches the customer's state so
// replies land in the right OpenPhone inbox and the caller ID is local.
//
// The live registry is `public.sms_state_numbers` (admin-editable). There
// is no baked-in number map — a missing row fails the send rather than
// texting from a stale hardcoded line. State is resolved from an explicit
// value first, then inferred from the ZIP code.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { toE164US } from './phone-format.ts';
import { getSecret, getSecretFromDb } from './secrets.ts';

export type StateCode = 'NJ' | 'TX' | 'CA' | 'NY';

export interface StateNumber {
  stateCode: string;
  phoneE164: string;
  /** OpenPhone phoneNumberId (PN…) when known — preferred by the API. */
  phoneNumberId?: string | null;
  timezone: string;
  isDefault?: boolean;
}

const STATE_ALIASES: Record<string, StateCode> = {
  nj: 'NJ', 'new jersey': 'NJ',
  tx: 'TX', texas: 'TX',
  ca: 'CA', california: 'CA',
  ny: 'NY', 'new york': 'NY', nyc: 'NY', 'new york city': 'NY',
};

/** Normalize free-form state input ("New Jersey", "N.J.", "nyc") to a code. */
export function normalizeStateCode(raw: string | null | undefined): string | null {
  const cleaned = String(raw || '').trim().toLowerCase().replace(/\./g, '');
  if (!cleaned) return null;
  if (STATE_ALIASES[cleaned]) return STATE_ALIASES[cleaned];
  if (/^[a-z]{2}$/.test(cleaned)) return cleaned.toUpperCase();
  return null;
}

/** Infer a service state from a US ZIP code (our four markets only). */
export function stateFromZip(zip: string | null | undefined): StateCode | null {
  const five = String(zip || '').trim().slice(0, 5);
  if (!/^\d{5}$/.test(five)) return null;
  const n = parseInt(five, 10);
  if (n >= 7000 && n <= 8999) return 'NJ';       // 070xx–089xx
  if (n >= 10000 && n <= 14999) return 'NY';
  if (n === 6390) return 'NY';                   // Fishers Island
  if (n >= 90000 && n <= 96199) return 'CA';
  if ((n >= 75000 && n <= 79999) || (n >= 88500 && n <= 88599)) return 'TX';
  return null;
}

/** OPENPHONE_DEFAULT_STATE env, or null — never a baked-in market. */
export function envDefaultStateCode(): string | null {
  return normalizeStateCode(Deno.env.get('OPENPHONE_DEFAULT_STATE'));
}

function serviceDb(): { from: (t: string) => any } | null {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return null;
  try {
    return createClient(url, key, { auth: { persistSession: false } });
  } catch {
    return null;
  }
}

type Registry = {
  byCode: Map<string, StateNumber>;
  defaultCode: string | null;
};

let registryCache: { loadedAt: number; data: Registry } | null = null;
const REGISTRY_TTL_MS = 60_000;

async function loadRegistry(
  supabase?: { from: (t: string) => any } | null,
): Promise<Registry> {
  if (registryCache && Date.now() - registryCache.loadedAt < REGISTRY_TTL_MS) {
    return registryCache.data;
  }
  const db = supabase || serviceDb();
  if (!db) {
    throw new Error('sms_state_numbers: no database client');
  }
  const { data, error } = await db
    .from('sms_state_numbers')
    .select('state_code, phone_e164, openphone_phone_id, timezone, is_default');
  if (error) throw new Error(`sms_state_numbers: ${error.message}`);
  const byCode = new Map<string, StateNumber>();
  let defaultCode: string | null = null;
  for (const row of data || []) {
    if (!row?.state_code || !row?.phone_e164) continue;
    const code = String(row.state_code).toUpperCase();
    byCode.set(code, {
      stateCode: code,
      phoneE164: row.phone_e164,
      phoneNumberId: row.openphone_phone_id || null,
      timezone: row.timezone || '',
      isDefault: Boolean(row.is_default),
    });
    if (row.is_default) defaultCode = code;
  }
  if (byCode.size === 0) {
    throw new Error('sms_state_numbers is empty — configure market numbers in /admin/lifecycle');
  }
  if (!defaultCode) defaultCode = byCode.keys().next().value || null;
  const registry = { byCode, defaultCode };
  registryCache = { loadedAt: Date.now(), data: registry };
  return registry;
}

/**
 * Resolve the outbound OpenPhone number for a customer. Precedence:
 *   1. Explicit state (customer.state / booking state)
 *   2. ZIP inference
 *   3. OPENPHONE_DEFAULT_STATE env
 *   4. sms_state_numbers.is_default
 * Always reads the live registry. Missing rows fail the send.
 */
export async function resolveStateNumber(opts: {
  state?: string | null;
  zip?: string | null;
  supabase?: { from: (t: string) => any } | null;
}): Promise<StateNumber> {
  const registry = await loadRegistry(opts.supabase);
  const stateCode =
    normalizeStateCode(opts.state) ??
    stateFromZip(opts.zip) ??
    envDefaultStateCode() ??
    registry.defaultCode;
  if (!stateCode) {
    throw new Error('Cannot resolve a service state (no state, ZIP, or default market number)');
  }
  const row = registry.byCode.get(stateCode);
  if (!row?.phoneE164) {
    throw new Error(`No OpenPhone number configured for ${stateCode}`);
  }
  return row;
}

/** Customer-local timezone for quiet-hours checks. Live registry only. */
export async function timezoneForState(
  state: string | null | undefined,
  zip?: string | null,
  supabase?: { from: (t: string) => any } | null,
): Promise<string | null> {
  try {
    const num = await resolveStateNumber({ state, zip, supabase });
    return num.timezone || null;
  } catch {
    return null;
  }
}

/** E.164 → national US display form for embedding in message copy. */
export function formatUsNumber(e164: string | null | undefined): string {
  const digits = String(e164 || '').replace(/\D/g, '');
  const core = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (core.length !== 10) return String(e164 || '');
  return `(${core.slice(0, 3)}) ${core.slice(3, 6)}-${core.slice(6)}`;
}

export interface SupportNumber {
  stateCode: string;
  e164: string;
  /** Human-readable form from the live E.164 number. */
  display: string;
}

/**
 * The OpenPhone number a customer should call or text for help.
 *
 * Support is OpenPhone on every rail, including the internal booking
 * flow whose automated messages go out through GoHighLevel: a GHL
 * LeadConnector number is not staffed, so any message it sends has to
 * name the OpenPhone line for the customer's market explicitly.
 */
export async function resolveSupportNumber(opts: {
  state?: string | null;
  zip?: string | null;
  supabase?: { from: (t: string) => any } | null;
}): Promise<SupportNumber> {
  const num = await resolveStateNumber(opts);
  return {
    stateCode: num.stateCode,
    e164: num.phoneE164,
    display: formatUsNumber(num.phoneE164),
  };
}

export interface OpenPhoneSendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

/**
 * OpenPhone API keys to try, in order.
 *
 * The live key lives in `app_secrets` (ops can rotate it without a
 * dashboard deploy). A stale `OPENPHONE_API_KEY` in edge-function env
 * has been 401ing intro SMS for weeks, so the DB copy is tried first
 * and the env copy is only a fallback when it differs.
 */
async function resolveOpenPhoneApiKeys(): Promise<Array<{ key: string; source: 'app_secrets' | 'env' }>> {
  const fromDb = await getSecretFromDb('OPENPHONE_API_KEY');
  const fromEnv = (Deno.env.get('OPENPHONE_API_KEY') || '').trim() || undefined;
  const keys: Array<{ key: string; source: 'app_secrets' | 'env' }> = [];
  if (fromDb) keys.push({ key: fromDb, source: 'app_secrets' });
  if (fromEnv && fromEnv !== fromDb) keys.push({ key: fromEnv, source: 'env' });
  if (keys.length === 0) {
    const fallback = await getSecret('OPENPHONE_API_KEY');
    if (fallback) keys.push({ key: fallback, source: fromEnv ? 'env' : 'app_secrets' });
  }
  return keys;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const OPENPHONE_HOSTS = ['https://api.openphone.com', 'https://api.quo.com'] as const;
const SEND_TIMEOUT_MS = 8_000;

/**
 * OpenPhone v1 `from` is either a phoneNumberId (PN…) or E.164.
 * Prefer the id: sending by E.164 400s after a port/rename, and a
 * complete E.164 payload has been hanging from this project's edge
 * workers even after auth succeeded.
 */
export function pickOpenPhoneFrom(opts: {
  from?: string | null;
  phoneNumberId?: string | null;
}): string[] {
  const out: string[] = [];
  const add = (raw: string | null | undefined) => {
    const v = String(raw || '').trim();
    if (v && !out.includes(v)) out.push(v);
  };
  add(opts.phoneNumberId);
  add(opts.from);
  add(Deno.env.get('OPENPHONE_PHONE_NUMBER'));
  return out;
}

function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const ac = new AbortController();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      try { ac.abort(); } catch { /* already aborted */ }
      reject(new Error(`openphone-timeout after ${timeoutMs}ms`));
    }, timeoutMs);
    fetch(url, { ...init, signal: ac.signal })
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

async function readBody(res: Response, timeoutMs: number): Promise<{ json: any; text: string }> {
  try {
    const text = await Promise.race([
      res.text(),
      sleep(timeoutMs).then(() => ''),
    ]);
    let json: any = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = null; }
    return { json, text };
  } catch {
    return { json: null, text: '' };
  }
}

/**
 * OpenPhone nests failures under `errors[]` / `error.message`, so a naive
 * `json.message` renders "[object Object]" and hides the actual reason
 * (bad key vs. a `from` number the workspace doesn't own). Flatten it.
 */
function describeOpenPhoneError(json: any, text: string): string {
  if (!json) return (text || 'no response body').slice(0, 300);
  const parts: string[] = [];
  if (typeof json.message === 'string') parts.push(json.message);
  else if (json.message) parts.push(JSON.stringify(json.message));
  if (typeof json.error === 'string') parts.push(json.error);
  else if (json.error?.message) parts.push(String(json.error.message));
  if (Array.isArray(json.errors)) {
    parts.push(
      json.errors
        .map((e: any) => e?.message || e?.detail || JSON.stringify(e))
        .join('; '),
    );
  }
  if (json.code) parts.push(`code=${json.code}`);
  const joined = parts.filter(Boolean).join(' | ');
  return (joined || JSON.stringify(json)).slice(0, 300);
}

export interface OpenPhoneHealth {
  ok: boolean;
  ms: number;
  status?: number;
  host?: string;
  auth?: 'raw' | 'bearer';
  numberCount?: number;
  numbers?: Array<{ id?: string; last4?: string }>;
  error?: string;
}

/** GET /v1/phone-numbers — used to confirm the live key + host without sending SMS. */
export async function openPhoneHealthCheck(): Promise<OpenPhoneHealth> {
  const keys = await resolveOpenPhoneApiKeys();
  if (keys.length === 0) {
    return { ok: false, ms: 0, error: 'OPENPHONE_API_KEY not configured' };
  }
  const started = Date.now();
  const key = keys[0].key;
  for (const host of OPENPHONE_HOSTS) {
    for (const auth of ['raw', 'bearer'] as const) {
      const header = auth === 'bearer' ? `Bearer ${key}` : key;
      try {
        const res = await fetchWithTimeout(`${host}/v1/phone-numbers`, {
          method: 'GET',
          headers: { Authorization: header, Accept: 'application/json' },
        }, SEND_TIMEOUT_MS);
        const { json, text } = await readBody(res, 2_000);
        const ms = Date.now() - started;
        if (res.ok) {
          const arr = json?.data || json;
          const numbers = Array.isArray(arr)
            ? arr.slice(0, 8).map((n: any) => {
              const num = String(n?.number || n?.phoneNumber || n?.formattedNumber || '');
              return { id: n?.id, last4: num.replace(/\D/g, '').slice(-4) || undefined };
            })
            : [];
          return { ok: true, ms, status: res.status, host, auth, numberCount: numbers.length, numbers };
        }
        if (res.status !== 401) {
          return { ok: false, ms, status: res.status, host, auth, error: describeOpenPhoneError(json, text) };
        }
      } catch (err) {
        const ms = Date.now() - started;
        const error = err instanceof Error ? err.message : String(err);
        console.log(`[openphone] health ${host} ${auth} failed`, { error, ms });
      }
    }
  }
  return { ok: false, ms: Date.now() - started, error: 'OpenPhone health check timed out on every host/auth pair' };
}

/** Raw OpenPhone send. `from` should come from resolveStateNumber(). */
export async function openPhoneSend(opts: {
  to: string;
  message: string;
  from?: string | null;
  phoneNumberId?: string | null;
}): Promise<OpenPhoneSendResult> {
  const keys = await resolveOpenPhoneApiKeys();
  if (keys.length === 0) {
    return {
      ok: false,
      error:
        'OPENPHONE_API_KEY not configured (checked app_secrets and edge-function secrets)',
    };
  }

  const to = toE164US(opts.to) || opts.to;
  const fromValues = pickOpenPhoneFrom(opts);
  if (fromValues.length === 0) {
    return {
      ok: false,
      error: 'OpenPhone send missing from number — configure sms_state_numbers',
    };
  }
  const userId = (Deno.env.get('OPENPHONE_USER_ID') || '').trim() || undefined;

  let lastError = 'OpenPhone send failed';
  for (const { key, source } of keys) {
    let keyRejected = false;
    for (const from of fromValues) {
      const body: Record<string, unknown> = {
        content: opts.message,
        to: [to],
        // OpenPhone v1 requires `from` (E.164 or PNxxx). The dedicated
        // `phoneNumberId` field is deprecated and 400s if sent instead.
        from: String(from),
      };
      if (userId) body.userId = userId;

      let fromRejected = false;
      for (const host of OPENPHONE_HOSTS) {
        const auths: Array<{ label: 'raw' | 'bearer'; header: string }> = [
          { label: 'raw', header: key },
        ];
        for (let i = 0; i < auths.length; i++) {
          const { label, header } = auths[i];
          const started = Date.now();
          try {
            const res = await fetchWithTimeout(`${host}/v1/messages`, {
              method: 'POST',
              headers: {
                Authorization: header,
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
              body: JSON.stringify(body),
            }, SEND_TIMEOUT_MS);
            const ms = Date.now() - started;
            console.log(`[openphone] POST ${host}/v1/messages status=${res.status} ms=${ms} from=${from} auth=${label} key=${source}`);

            // 202 is the documented success. Don't block on a chunked
            // body that never closes — that is how earlier sends hung
            // past the edge idle timeout after auth had already worked.
            if (res.status === 200 || res.status === 201 || res.status === 202) {
              const { json } = await readBody(res, 2_000);
              console.log(`[openphone] sent via ${source} key host=${host}`);
              return { ok: true, messageId: json?.data?.id || json?.id };
            }

            const { json, text } = await readBody(res, 2_000);
            lastError = `OpenPhone failed (status ${res.status}): ${describeOpenPhoneError(json, text)}`;
            if (res.status === 401) {
              lastError += ` (key source=${source}; check OPENPHONE_API_KEY in app_secrets)`;
              if (label === 'raw') auths.push({ label: 'bearer', header: `Bearer ${key}` });
              else keyRejected = true;
              continue;
            }
            if (res.status === 403) {
              lastError += ` (does the OpenPhone workspace own ${from}?)`;
              fromRejected = true;
              break;
            }
            if (res.status === 400 && /from/i.test(lastError)) {
              fromRejected = true;
              break;
            }
            if (res.status === 502 || res.status === 503 || res.status === 504) {
              continue;
            }
            return { ok: false, error: lastError };
          } catch (err) {
            lastError = err instanceof Error ? err.message : String(err);
            console.log(`[openphone] POST ${host}/v1/messages error from=${from} auth=${label}`, {
              error: lastError,
              ms: Date.now() - started,
            });
          }
        }
        if (keyRejected || fromRejected) break;
      }
      if (keyRejected) break;
    }
    if (!keyRejected) {
      // Timeouts / 5xx on this key — don't burn another 8s on a stale env copy.
      break;
    }
  }
  return { ok: false, error: lastError };
}
