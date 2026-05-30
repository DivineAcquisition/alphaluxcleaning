// ─── LeadConnector inbound webhook mirror (safety net) ─────────────────────
//
// Optional always-on backup destination. Every booking/lifecycle event
// also fires here so the data lands in GHL even if the Private
// Integration API call silently dropped a field (e.g. the location was
// missing a custom field id we tried to push, or a transient API outage
// returned 2xx without persisting).
//
// The URL is INTENTIONALLY env-only — ops sets
// `GHL_INBOUND_WEBHOOK_URL` (or `LEADCONNECTOR_INBOUND_WEBHOOK_URL`)
// per GHL location. The AlphaLuxClean inbound URL must NOT be hard-
// coded because it differs from the Novara one and rotates over time.

interface MirrorOptions {
  /** Event family — "booking.confirmed", "booking.cancelled", "lead", etc. */
  event: string;
  /** Arbitrary payload to forward verbatim. */
  payload: Record<string, unknown>;
  /** Optional override URL (mostly for tests). */
  url?: string;
}

function resolveUrl(): string {
  const fromEnv =
    (Deno.env.get('GHL_INBOUND_WEBHOOK_URL') ||
      Deno.env.get('LEADCONNECTOR_INBOUND_WEBHOOK_URL') ||
      '').trim();
  return fromEnv;
}

/**
 * Fire-and-forget mirror to the LeadConnector inbound webhook. Never
 * throws — failures are logged and swallowed so they don't break the
 * primary flow. Adds a top-level `event` discriminator + ISO timestamp
 * so the receiving GHL automation can route different event types to
 * different sub-workflows.
 *
 * Returns silently when no URL is configured (ops can opt in by setting
 * the env var without any code change).
 */
export async function mirrorToLeadConnector({
  event,
  payload,
  url,
}: MirrorOptions): Promise<void> {
  const target = (url || resolveUrl()).trim();
  if (!target) {
    // Not configured — fine, the PIT call above is the primary path.
    return;
  }

  const enriched = {
    event,
    timestamp: new Date().toISOString(),
    source: 'alphaluxclean-supabase',
    ...payload,
  };

  try {
    const res = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enriched),
    });
    const text = await res.text().catch(() => '');
    console.log(
      `[leadconnector-mirror] event=${event} status=${res.status}` +
        (text ? ` bodyPreview=${text.slice(0, 200)}` : ''),
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[leadconnector-mirror] event=${event} failed: ${msg}`);
  }
}
