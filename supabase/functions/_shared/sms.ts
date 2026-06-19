// Unified SMS sender — GHL is the core channel, OpenPhone is the fallback.
//
// Every outbound SMS in the system should go through `sendSms()` so the
// routing is consistent:
//
//   1. GoHighLevel (PIT / LeadConnector conversations) — PRIMARY.
//      Threads the message into the contact's GHL conversation so the VA
//      sees the full history and inbound replies come back via the GHL
//      webhook. Requires a GHL contact (we resolve/upsert one from the
//      phone/email automatically).
//   2. OpenPhone — FALLBACK, only used when GHL fails or no GHL contact
//      can be resolved. OpenPhone is where the VA also lives, so a
//      dropped GHL send still reaches a real number.
//
// Never throws — returns a structured result the caller can log.

import { createGhlClient, ghlIsConfigured, type GHLClient } from './ghl-client.ts';
import { toE164US } from './phone-format.ts';

export interface SendSmsInput {
  /** Destination phone (any format — normalized to E.164). */
  to?: string | null;
  message: string;
  /** Known GHL contact id (skips the resolve/upsert step). */
  contactId?: string | null;
  /** Used to resolve/create the GHL contact when contactId is absent. */
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  /** Override the GHL "from" number id / E.164 (optional). */
  fromNumber?: string | null;
  /** Set false to skip the OpenPhone fallback (GHL only). Default true. */
  enableFallback?: boolean;
  /** Set false to skip GHL and go straight to OpenPhone. Default true. */
  enableGhl?: boolean;
}

export interface SendSmsResult {
  success: boolean;
  provider: 'ghl' | 'openphone' | 'none';
  fallback: boolean;
  ghlContactId?: string;
  messageId?: string;
  error?: string;
  attempts: Array<{ provider: 'ghl' | 'openphone'; ok: boolean; error?: string }>;
}

function smsLog(step: string, details?: unknown) {
  console.log(`[sms] ${step}${details !== undefined ? ' ' + JSON.stringify(details) : ''}`);
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

/** Send via OpenPhone REST API directly (fallback channel). */
export async function sendSmsViaOpenPhone(to: string, message: string): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const apiKey = Deno.env.get('OPENPHONE_API_KEY');
  const phoneNumberId = Deno.env.get('OPENPHONE_PHONE_NUMBER_ID');
  const fromNumber = Deno.env.get('OPENPHONE_PHONE_NUMBER'); // optional E.164 "from"
  if (!apiKey || (!phoneNumberId && !fromNumber)) {
    return { ok: false, error: 'OpenPhone credentials not configured' };
  }
  const e164 = toE164US(to) || to;
  try {
    const body: Record<string, unknown> = { content: message, to: [e164] };
    if (phoneNumberId) body.phoneNumberId = phoneNumberId;
    if (fromNumber) body.from = fromNumber;
    const res = await fetch('https://api.openphone.com/v1/messages', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: `OpenPhone failed (status ${res.status}): ${json?.message || json?.error || 'unknown'}` };
    }
    return { ok: true, messageId: json?.id || json?.data?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Send an SMS through GHL first, falling back to OpenPhone. The single
 * entry point every caller should use.
 */
export async function sendSms(input: SendSmsInput): Promise<SendSmsResult> {
  const attempts: SendSmsResult['attempts'] = [];
  const enableGhl = input.enableGhl !== false;
  const enableFallback = input.enableFallback !== false;

  // 1. GHL (core) — only attempt when configured.
  if (enableGhl && ghlIsConfigured()) {
    const ghl = await sendSmsViaGhl(input);
    attempts.push({ provider: 'ghl', ok: ghl.ok, error: ghl.error });
    if (ghl.ok) {
      smsLog('sent via GHL', { contactId: ghl.contactId, messageId: ghl.messageId });
      return {
        success: true,
        provider: 'ghl',
        fallback: false,
        ghlContactId: ghl.contactId,
        messageId: ghl.messageId,
        attempts,
      };
    }
    smsLog('GHL send failed — will try OpenPhone fallback', { error: ghl.error });
  }

  // 2. OpenPhone (fallback) — needs a destination number.
  if (enableFallback && input.to) {
    const op = await sendSmsViaOpenPhone(input.to, input.message);
    attempts.push({ provider: 'openphone', ok: op.ok, error: op.error });
    if (op.ok) {
      smsLog('sent via OpenPhone (fallback)', { messageId: op.messageId });
      return {
        success: true,
        provider: 'openphone',
        fallback: attempts.some((a) => a.provider === 'ghl'),
        messageId: op.messageId,
        attempts,
      };
    }
    smsLog('OpenPhone send failed', { error: op.error });
  }

  const error = attempts.map((a) => `${a.provider}: ${a.error || 'failed'}`).join('; ') || 'no SMS provider available';
  return { success: false, provider: 'none', fallback: false, error, attempts };
}
