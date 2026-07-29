// Pins the precedence rule in _shared/secrets.ts.
//
// Getting this backwards would be quiet and nasty: a stale row in
// app_secrets silently overriding a freshly-rotated dashboard secret,
// with both looking correctly set. Run with: npm test

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { clearSecretCache, getSecret } from './secrets.ts';

function withEnv(vars: Record<string, string | null>, run: () => Promise<void>) {
  const previous: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(vars)) {
    previous[key] = Deno.env.get(key);
    if (value === null) Deno.env.delete(key);
    else Deno.env.set(key, value);
  }
  return run().finally(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) Deno.env.delete(key);
      else Deno.env.set(key, value);
    }
    clearSecretCache();
  });
}

// No SUPABASE_URL / SERVICE_ROLE_KEY means no database to fall back to,
// so these exercise the env branch in isolation.
const NO_DB = { SUPABASE_URL: null, SUPABASE_SERVICE_ROLE_KEY: null };

Deno.test('an environment variable is used directly', async () => {
  await withEnv({ ...NO_DB, TEST_SECRET_A: 'from-env' }, async () => {
    assertEquals(await getSecret('TEST_SECRET_A'), 'from-env');
  });
});

Deno.test('surrounding whitespace is trimmed', async () => {
  await withEnv({ ...NO_DB, TEST_SECRET_A: '  padded  ' }, async () => {
    assertEquals(await getSecret('TEST_SECRET_A'), 'padded');
  });
});

Deno.test('aliases are tried in the order the caller declared', async () => {
  await withEnv(
    { ...NO_DB, TEST_SECRET_A: null, TEST_SECRET_B: 'from-alias' },
    async () => {
      assertEquals(await getSecret('TEST_SECRET_A', ['TEST_SECRET_B']), 'from-alias');
    },
  );
  await withEnv(
    { ...NO_DB, TEST_SECRET_A: 'primary', TEST_SECRET_B: 'alias' },
    async () => {
      // The primary name wins even when both are set.
      assertEquals(await getSecret('TEST_SECRET_A', ['TEST_SECRET_B']), 'primary');
    },
  );
});

Deno.test('an unset secret with no database resolves to undefined', async () => {
  await withEnv({ ...NO_DB, TEST_SECRET_A: null, TEST_SECRET_B: null }, async () => {
    assertEquals(await getSecret('TEST_SECRET_A', ['TEST_SECRET_B']), undefined);
  });
});

Deno.test('an empty environment variable is not treated as configured', async () => {
  await withEnv({ ...NO_DB, TEST_SECRET_A: '' }, async () => {
    assertEquals(await getSecret('TEST_SECRET_A'), undefined);
  });
});
