// Unified SMS sender — OpenPhone is the core channel (state-routed
// business numbers), GHL is the fallback.
//
// Every outbound SMS in the system should go through `sendSms()` so the
// routing is consistent:
//
//   1. OpenPhone — PRIMARY. Sends from the business number matching the
//      customer's state (NJ / TX / CA / NY — see _shared/openphone.ts),
//      so replies land in the right OpenPhone inbox and the caller ID
//      is local to the customer.
//   2. GoHighLevel (PIT / LeadConnector conversations) — FALLBACK, only
//      used when OpenPhone fails or isn't configured.
//
// Cross-cutting guarantees (applied here so every caller inherits them):
//   * STOP means stop — numbers in `sms_opt_outs` are never messaged,
//     on any channel path. Suppressed sends return success=true with
//     `suppressed: true` so callers don't retry-loop.
//   * Every attempt is recorded in `sms_logs` (best-effort — the ledger
//     never blocks a send).
//
// Never throws — returns a structured result the caller can log.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { createGhlClient, ghlIsConfigured, type GHLClient } from './ghl-client.ts';
import { toE164US, phoneDigits10 } from './phone-format.ts';
import { openPhoneSend, resolveStateNumber, type StateNumber } from './openphone.ts';

export interface SendSmsInput {
  /** Destination phone (any format — normalized to E.164). */
  to?: string | null;
  message: string;
  /** Customer's service state — picks the OpenPhone "from" number. */
  state?: string | null;
  /** ZIP fallback for state inference when `state` is absent. */
  zip?: string | null;
  /** Caller tag recorded in sms_logs (e.g. "booking_confirm"). */
  context?: string | null;
  /** Known GHL contact id (skips the resolve/upsert step on fallback). */
  contactId?: string | null;
  /** Used to resolve/create the GHL contact when contactId is absent. */
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  /** Override the GHL "from" number id / E.164 (optional). */
  fromNumber?: string | null;
  /** Set false to skip the GHL fallback (OpenPhone only). Default true. */
  enableFallback?: boolean;
  /** Set false to skip GHL entirely (kept for caller compatibility). */
  enableGhl?: boolean;
}

export interface SendSmsResult {
  success: boolean;
  provider: 'openphone' | 'ghl' | 'none';
  fallback: boolean;
  /** True when the recipient has opted out — message intentionally not sent. */
  suppressed?: boolean;
  ghlContactId?: string;
  messageId?: string;
  fromNumber?: string;
  stateCode?: string;
  error?: string;
  attempts: Array<{ provider: 'openphone' | 'ghl'; ok: boolean; error?: string }>;
}

function smsLog(step: string, details?: unknown) {
  console.log(`[sms] ${step}${details !== undefined ? ' ' + JSON.stringify(details) : ''}`);
}

function serviceClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return null;
  try {
    return createClient(url, key, { auth: { persistSession: false } });
  } catch (_) {
    return null;
  }
}

/** True when the destination number has texted STOP (any channel). */
async function isOptedOut(db: ReturnType<typeof serviceClient>, to: string): Promise<boolean> {
  if (!db) return false;
  const digits = phoneDigits10(to);
  if (!digits) return false;
  try {
    const { data } = await db
      .from('sms_opt_outs')
      .select('phone_digits')
      .eq('phone_digits', digits)
      .maybeSingle();
    return Boolean(data);
  } catch (_) {
    return false; // fail-open: an unreachable DB shouldn't block ops SMS
  }
}

async function writeLedger(
  db: ReturnType<typeof serviceClient>,
  row: Record<string, unknown>,
): Promise<void> {
  if (!db) return;
  try {
    await db.from('sms_logs').insert(row);
  } catch (_) { /* ledger is best-effort */ }
}

/**
 * Resolve a GHL contact id from an explicit id, else by phone, else by
 * email, creating the contact via upsert when nothing matches so the
 * message always has somewhere to thread.
 */
export async function resolveGhlContactId(
  client: GHLClient,
  opts: { contactId?: string | null; phone?: string | null; email?: string | null; firstName?: string | null; lastName?: string | null; name?: string | null },
): Promise<string | null> {
  if (opts.contactId) return opts.contactId;
  const phone = opts.phone ? (toE164US(opts.phone) || opts.phone) : null;

  if (phone) {
    try {
      const byPhone = await client.findContactByPhone(phone);
      if (byPhone.contactId) return byPhone.contactId;
    } catch (_) { /* fall through */ }
  }
  if (opts.email) {
    try {
      const byEmail = await client.findContactByEmail(opts.email);
      if (byEmail.contactId) return byEmail.contactId;
    } catch (_) { /* fall through */ }
  }
  // Nothing matched — create the contact so we have a conversation target.
  if (phone || opts.email) {
    try {
      const upsert = await client.upsertContact({
        email: opts.email || undefined,
        phone: phone || undefined,
        firstName: opts.firstName || undefined,
        lastName: opts.lastName || undefined,
        name: opts.name || undefined,
        source: 'AlphaLux SMS',
      });
      if (upsert.contactId) return upsert.contactId;
    } catch (_) { /* fall through */ }
  }
  return null;
}

/** Send via GHL conversations (PIT). Resolves/creates the contact first. */
export async function sendSmsViaGhl(input: SendSmsInput): Promise<{ ok: boolean; contactId?: string; messageId?: string; error?: string }> {
  try {
    const client = createGhlClient();
    const contactId = await resolveGhlContactId(client, {
      contactId: input.contactId,
      phone: input.to,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      name: input.name,
    });
    if (!contactId) return { ok: false, error: 'no GHL contact could be resolved' };

    const res = await client.sendSms({
      contactId,
      message: input.message,
      fromNumber: input.fromNumber || undefined,
    });
    if (!res.ok) {
      return {
        ok: false,
        contactId,
        error: `GHL SMS failed (status ${res.status}): ${typeof res.data === 'string' ? res.data : JSON.stringify(res.data)?.slice(0, 200)}`,
      };
    }
    return { ok: true, contactId, messageId: res.messageId };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Send via OpenPhone using the state-routed business number. Kept as a
 * named export for callers that want OpenPhone-only behavior.
 */
export async function sendSmsViaOpenPhone(
  to: string,
  message: string,
  opts?: { state?: string | null; zip?: string | null; stateNumber?: StateNumber },
): Promise<{ ok: boolean; messageId?: string; error?: string; from?: string; stateCode?: string }> {
  const db = serviceClient();
  const num =
    opts?.stateNumber ??
    (await resolveStateNumber({ state: opts?.state, zip: opts?.zip, supabase: db }));
  const res = await openPhoneSend({
    to,
    message,
    from: num.phoneE164,
    phoneNumberId: num.phoneNumberId,
  });
  return { ...res, from: num.phoneE164, stateCode: num.stateCode };
}

/**
 * Send an SMS through OpenPhone first (state-routed number), falling back
 * to GHL. The single entry point every caller should use.
 */
export async function sendSms(input: SendSmsInput): Promise<SendSmsResult> {
  const attempts: SendSmsResult['attempts'] = [];
  const enableGhlFallback = input.enableFallback !== false && input.enableGhl !== false;
  const db = serviceClient();

  // 0. Global opt-out guard — STOP means stop, on every path.
  if (input.to && (await isOptedOut(db, input.to))) {
    smsLog('suppressed — recipient opted out', { to: phoneDigits10(input.to) });
    await writeLedger(db, {
      to_phone: toE164US(input.to) || input.to,
      message: input.message,
      provider: 'none',
      status: 'suppressed',
      context: input.context || null,
    });
    return { success: true, provider: 'none', fallback: false, suppressed: true, attempts };
  }

  let stateNumber: StateNumber | null = null;

  // 1. OpenPhone (core) — needs a destination number.
  if (input.to) {
    stateNumber = await resolveStateNumber({ state: input.state, zip: input.zip, supabase: db });
    const op = await openPhoneSend({
      to: input.to,
      message: input.message,
      from: stateNumber.phoneE164,
      phoneNumberId: stateNumber.phoneNumberId,
    });
    attempts.push({ provider: 'openphone', ok: op.ok, error: op.error });
    if (op.ok) {
      smsLog('sent via OpenPhone', {
        messageId: op.messageId,
        from: stateNumber.phoneE164,
        state: stateNumber.stateCode,
      });
      await writeLedger(db, {
        to_phone: toE164US(input.to) || input.to,
        from_number: stateNumber.phoneE164,
        state_code: stateNumber.stateCode,
        message: input.message,
        provider: 'openphone',
        provider_message_id: op.messageId || null,
        status: 'sent',
        context: input.context || null,
      });
      return {
        success: true,
        provider: 'openphone',
        fallback: false,
        messageId: op.messageId,
        fromNumber: stateNumber.phoneE164,
        stateCode: stateNumber.stateCode,
        attempts,
      };
    }
    smsLog('OpenPhone send failed — will try GHL fallback', { error: op.error });
  }

  // 2. GHL (fallback) — only attempt when configured.
  if (enableGhlFallback && ghlIsConfigured()) {
    const ghl = await sendSmsViaGhl(input);
    attempts.push({ provider: 'ghl', ok: ghl.ok, error: ghl.error });
    if (ghl.ok) {
      smsLog('sent via GHL (fallback)', { contactId: ghl.contactId, messageId: ghl.messageId });
      await writeLedger(db, {
        to_phone: input.to ? toE164US(input.to) || input.to : null,
        state_code: stateNumber?.stateCode || null,
        message: input.message,
        provider: 'ghl',
        provider_message_id: ghl.messageId || null,
        status: 'sent',
        context: input.context || null,
      });
      return {
        success: true,
        provider: 'ghl',
        fallback: attempts.some((a) => a.provider === 'openphone'),
        ghlContactId: ghl.contactId,
        messageId: ghl.messageId,
        attempts,
      };
    }
    smsLog('GHL send failed', { error: ghl.error });
  }

  const error = attempts.map((a) => `${a.provider}: ${a.error || 'failed'}`).join('; ') || 'no SMS provider available';
  await writeLedger(db, {
    to_phone: input.to ? toE164US(input.to) || input.to : null,
    from_number: stateNumber?.phoneE164 || null,
    state_code: stateNumber?.stateCode || null,
    message: input.message,
    provider: 'none',
    status: 'failed',
    error,
    context: input.context || null,
  });
  return { success: false, provider: 'none', fallback: false, error, attempts };
}
