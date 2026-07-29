// OpenPhone helpers — state-routed business numbers.
//
// AlphaLux operates one OpenPhone number per service state. Every outbound
// SMS must go out from the number that matches the customer's state so
// replies land in the right OpenPhone inbox and the caller ID is local:
//
//   NJ → (551) 239-9444    TX → (972) 559-0223
//   CA → (323) 300-5528    NY → (631) 366-8565
//
// The live registry is `public.sms_state_numbers` (admin-editable); the
// hardcoded map below is the fallback when the DB is unreachable. The
// customer's state is resolved from an explicit state value first, then
// inferred from the ZIP code.

import { toE164US } from './phone-format.ts';

export type StateCode = 'NJ' | 'TX' | 'CA' | 'NY';

export interface StateNumber {
  stateCode: StateCode;
  phoneE164: string;
  /** OpenPhone phoneNumberId (PN…) when known — preferred by the API. */
  phoneNumberId?: string | null;
  timezone: string;
}

export const STATE_NUMBER_DEFAULTS: Record<StateCode, StateNumber> = {
  NJ: { stateCode: 'NJ', phoneE164: '+15512399444', timezone: 'America/New_York' },
  TX: { stateCode: 'TX', phoneE164: '+19725590223', timezone: 'America/Chicago' },
  CA: { stateCode: 'CA', phoneE164: '+13233005528', timezone: 'America/Los_Angeles' },
  NY: { stateCode: 'NY', phoneE164: '+16313668565', timezone: 'America/New_York' },
};

const STATE_ALIASES: Record<string, StateCode> = {
  nj: 'NJ', 'new jersey': 'NJ',
  tx: 'TX', texas: 'TX',
  ca: 'CA', california: 'CA',
  ny: 'NY', 'new york': 'NY', nyc: 'NY', 'new york city': 'NY',
};

/** Normalize free-form state input ("New Jersey", "N.J.", "nyc") to a code. */
export function normalizeStateCode(raw: string | null | undefined): StateCode | null {
  const cleaned = String(raw || '').trim().toLowerCase().replace(/\./g, '');
  if (!cleaned) return null;
  return STATE_ALIASES[cleaned] ?? null;
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

export function defaultStateCode(): StateCode {
  return normalizeStateCode(Deno.env.get('OPENPHONE_DEFAULT_STATE')) ?? 'NJ';
}

/**
 * Resolve the outbound OpenPhone number for a customer. Precedence:
 *   1. Explicit state (customer.state / booking state)
 *   2. ZIP inference
 *   3. OPENPHONE_DEFAULT_STATE env (default NJ)
 * The DB registry (`sms_state_numbers`) overrides the hardcoded defaults
 * when a Supabase client is provided, so ops can rotate numbers or attach
 * OpenPhone phoneNumberIds without a deploy.
 */
export async function resolveStateNumber(opts: {
  state?: string | null;
  zip?: string | null;
  supabase?: { from: (t: string) => any } | null;
}): Promise<StateNumber> {
  const stateCode =
    normalizeStateCode(opts.state) ?? stateFromZip(opts.zip) ?? defaultStateCode();

  if (opts.supabase) {
    try {
      const { data } = await opts.supabase
        .from('sms_state_numbers')
        .select('state_code, phone_e164, openphone_phone_id, timezone')
        .eq('state_code', stateCode)
        .maybeSingle();
      if (data?.phone_e164) {
        return {
          stateCode,
          phoneE164: data.phone_e164,
          phoneNumberId: data.openphone_phone_id || null,
          timezone: data.timezone || STATE_NUMBER_DEFAULTS[stateCode].timezone,
        };
      }
    } catch (_) { /* fall through to hardcoded defaults */ }
  }
  return STATE_NUMBER_DEFAULTS[stateCode];
}

/** Customer-local timezone for quiet-hours checks. */
export function timezoneForState(state: string | null | undefined, zip?: string | null): string {
  const code = normalizeStateCode(state) ?? stateFromZip(zip) ?? defaultStateCode();
  return STATE_NUMBER_DEFAULTS[code].timezone;
}

/** "+15512399444" → "(551) 239-9444" for embedding in message copy. */
export function formatUsNumber(e164: string | null | undefined): string {
  const digits = String(e164 || '').replace(/\D/g, '');
  const core = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (core.length !== 10) return String(e164 || '');
  return `(${core.slice(0, 3)}) ${core.slice(3, 6)}-${core.slice(6)}`;
}

export interface SupportNumber {
  stateCode: StateCode;
  e164: string;
  /** Human-readable form, e.g. "(551) 239-9444". */
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

/** Raw OpenPhone send. `from` should come from resolveStateNumber(). */
export async function openPhoneSend(opts: {
  to: string;
  message: string;
  from?: string | null;
  phoneNumberId?: string | null;
}): Promise<OpenPhoneSendResult> {
  const apiKey = Deno.env.get('OPENPHONE_API_KEY');
  if (!apiKey) return { ok: false, error: 'OPENPHONE_API_KEY not configured' };

  const to = toE164US(opts.to) || opts.to;
  const body: Record<string, unknown> = { content: opts.message, to: [to] };
  if (opts.phoneNumberId) body.phoneNumberId = opts.phoneNumberId;
  else if (opts.from) body.from = opts.from;
  else {
    // Last-resort env fallbacks so a misconfigured caller still sends.
    const envId = Deno.env.get('OPENPHONE_PHONE_NUMBER_ID');
    const envFrom = Deno.env.get('OPENPHONE_PHONE_NUMBER');
    if (envId) body.phoneNumberId = envId;
    else if (envFrom) body.from = envFrom;
    else body.from = STATE_NUMBER_DEFAULTS[defaultStateCode()].phoneE164;
  }

  // OpenPhone's v1 API expects the raw API key in the Authorization header
  // (no "Bearer" prefix). The legacy code sent `Bearer <key>` which 401s —
  // we try the documented scheme first and fall back once for safety.
  const attempt = async (auth: string) => {
    const res = await fetch('https://api.openphone.com/v1/messages', {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let json: any = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = null; }
    return { res, json, text };
  };

  /**
   * OpenPhone nests failures under `errors[]` / `error.message`, so a naive
   * `json.message` renders "[object Object]" and hides the actual reason
   * (bad key vs. a `from` number the workspace doesn't own). Flatten it.
   */
  const describe = (json: any, text: string): string => {
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
  };

  try {
    let { res, json, text } = await attempt(apiKey);
    if (res.status === 401) {
      ({ res, json, text } = await attempt(`Bearer ${apiKey}`));
    }
    if (!res.ok) {
      const hint = res.status === 401
        ? ' (check OPENPHONE_API_KEY in Supabase secrets)'
        : res.status === 403
        ? ` (does the OpenPhone workspace own ${body.from || body.phoneNumberId}?)`
        : '';
      return {
        ok: false,
        error: `OpenPhone failed (status ${res.status}): ${describe(json, text)}${hint}`,
      };
    }
    return { ok: true, messageId: json?.data?.id || json?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
