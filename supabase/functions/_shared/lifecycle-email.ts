// Lifecycle email rail — Resend sends with the branded mobile-first
// shell, one dominant CTA, and a compliant unsubscribe footer.
//
// Cadence/offer/campaign copy is admin-authored HTML fragments (stored in
// lifecycle_cadence_steps / lifecycle_offers / lifecycle_campaigns); this
// module wraps them in the AlphaLux shell so every lifecycle email looks
// branded without React Email templates per step.

import { getSecret } from './secrets.ts';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function fromAddress(): string {
  return (
    Deno.env.get('EMAIL_FROM') ||
    Deno.env.get('EMAIL_FROM_CUSTOMER') ||
    'AlphaLux Clean <noreply@info.alphaluxcleaning.com>'
  );
}

function replyTo(): string {
  return Deno.env.get('EMAIL_REPLY_TO') || 'support@alphaluxcleaning.com';
}

/**
 * HMAC token binding an unsubscribe link to an email address, keyed off
 * the service-role key (shared between the engine that builds links and
 * the lifecycle-unsubscribe endpoint that verifies them).
 */
export async function unsubscribeToken(email: string): Promise<string> {
  const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'alphalux-lifecycle';
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(email.trim().toLowerCase()),
  );
  return Array.from(new Uint8Array(sig).slice(0, 16))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function buildUnsubscribeUrl(email: string): Promise<string> {
  const base = Deno.env.get('SUPABASE_URL') || 'https://yltvknkqnzdeiqckqjha.supabase.co';
  const token = await unsubscribeToken(email);
  const encoded = btoa(email.trim().toLowerCase())
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return `${base}/functions/v1/lifecycle-unsubscribe?e=${encoded}&t=${token}`;
}

export function renderBrandedEmail(opts: {
  bodyHtml: string;
  ctaUrl?: string | null;
  ctaLabel?: string | null;
  unsubscribeUrl: string;
}): string {
  const cta = opts.ctaUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto;">
        <tr><td style="border-radius:8px;background:#111827;">
          <a href="${opts.ctaUrl}"
             style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
            ${opts.ctaLabel || 'Book your next clean'}
          </a>
        </td></tr>
      </table>`
    : '';
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#111827;padding:20px 32px;">
          <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.5px;">AlphaLux Clean</span>
        </td></tr>
        <tr><td style="padding:32px;color:#1f2937;font-size:16px;line-height:1.6;">
          ${opts.bodyHtml}
          ${cta}
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;line-height:1.5;">
          AlphaLux Clean · A Divine Acquisition company<br/>
          You're receiving this because you've booked with us.
          <a href="${opts.unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export interface LifecycleEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function sendLifecycleEmail(opts: {
  to: string;
  subject: string;
  bodyHtml: string;
  ctaUrl?: string | null;
  ctaLabel?: string | null;
}): Promise<LifecycleEmailResult> {
  const apiKey = await getSecret('RESEND_API_KEY');
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY not configured' };

  const unsubscribeUrl = await buildUnsubscribeUrl(opts.to);
  const html = renderBrandedEmail({
    bodyHtml: opts.bodyHtml,
    ctaUrl: opts.ctaUrl,
    ctaLabel: opts.ctaLabel,
    unsubscribeUrl,
  });

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: fromAddress(),
        to: [opts.to],
        reply_to: replyTo(),
        subject: opts.subject,
        html,
        headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>` },
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: `Resend failed (status ${res.status}): ${json?.message || 'unknown'}` };
    }
    return { ok: true, id: json?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
