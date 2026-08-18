// Runtime secret resolution: platform env var first, then the
// service-role `app_secrets` table.
//
// Supabase exposes no API for setting edge-function environment
// secrets — they are dashboard-only — so `app_secrets` is how this
// project stores credentials that need to be set or rotated without a
// human in the dashboard and without a redeploy. The table is
// service-role only (RLS denies anon and authenticated outright), so a
// value here is reachable from edge functions and nowhere else.
//
// Precedence is env-var-first on purpose: the platform secret always
// wins, so moving a credential into the dashboard later silently takes
// over from the DB copy rather than conflicting with it.
//
// Values are cached for the lifetime of the instance. A rotated secret
// therefore takes effect on the next cold start, or immediately if the
// caller clears the cache.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const cache = new Map<string, string>();

/** undefined = not yet built; null = unavailable in this environment. */
let client: ReturnType<typeof createClient> | null | undefined;

function serviceClient() {
  if (client !== undefined) return client;
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) {
    client = null;
    return client;
  }
  try {
    client = createClient(url, key, { auth: { persistSession: false } });
  } catch (_) {
    client = null;
  }
  return client;
}

/**
 * Resolve a secret by name, trying each alias in order.
 *
 * Every alias is checked against the environment before the database is
 * touched, so a single env var still wins over a stale table row under
 * a different alias.
 */
export async function getSecret(
  name: string,
  aliases: string[] = [],
): Promise<string | undefined> {
  const names = [name, ...aliases];

  for (const n of names) {
    const fromEnv = Deno.env.get(n);
    if (fromEnv) return fromEnv.trim();
  }

  for (const n of names) {
    const hit = cache.get(n);
    if (hit) return hit;
  }

  const db = serviceClient();
  if (!db) return undefined;

  try {
    const { data } = await db
      .from('app_secrets')
      .select('name, value')
      .in('name', names);
    if (!data?.length) return undefined;
    const rows = data as Array<{ name: string; value: string }>;
    // Preserve caller-declared precedence rather than row order.
    for (const n of names) {
      const row = rows.find((r) => r.name === n);
      if (row?.value) {
        const value = String(row.value).trim();
        cache.set(n, value);
        return value;
      }
    }
  } catch (_) {
    // Table missing or unreachable — behave as "not configured".
  }
  return undefined;
}

/**
 * Read a secret from `app_secrets` only, ignoring environment variables.
 *
 * Use this when a dashboard env var is known to go stale (OpenPhone
 * 401s while ops rotates the live key in `app_secrets`). `getSecret`
 * stays env-first for everything else.
 */
export async function getSecretFromDb(name: string): Promise<string | undefined> {
  const cacheKey = `db:${name}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;

  const db = serviceClient();
  if (!db) return undefined;

  try {
    const { data } = await db
      .from('app_secrets')
      .select('value')
      .eq('name', name)
      .maybeSingle();
    const value = data?.value ? String(data.value).trim() : '';
    if (!value) return undefined;
    cache.set(cacheKey, value);
    return value;
  } catch (_) {
    return undefined;
  }
}

/** Drop cached values so a rotation applies without a cold start. */
export function clearSecretCache(): void {
  cache.clear();
}
