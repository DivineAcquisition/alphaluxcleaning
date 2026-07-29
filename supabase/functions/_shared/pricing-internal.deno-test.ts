// Guards the edge copy of the internal rate card against drift.
//
// Prices live in `src/lib/new-pricing-system.ts` — the public funnel's
// rate card, derived from unit economics. Deno cannot import it, so
// `scripts/generate-internal-pricing-mirror.mjs` inlines the tier table
// into `pricing-internal.ts`. If someone edits the funnel's prices and
// forgets to regenerate, a VA quotes one number on the phone and Stripe
// invoices another — silent, and it costs money either direction.
//
// This test regenerates the mirror in memory and fails if the committed
// file differs. Run with: npm test

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {
  DEPOSIT_PERCENT,
  HOME_SIZE_RANGES,
  offerPrice,
  OFFERS,
  resolveHomeSizeId,
  splitTotal,
  stateMultiplier,
} from './pricing-internal.ts';

const repoRoot = new URL('../../../', import.meta.url);

Deno.test('the edge mirror matches the funnel rate card', async () => {
  const generator = await import(
    new URL('scripts/generate-internal-pricing-mirror.mjs', repoRoot).href
  );
  const expected = generator.build();
  const committed = await Deno.readTextFile(
    new URL('supabase/functions/_shared/pricing-internal.ts', repoRoot),
  );
  assertEquals(
    committed.trim(),
    expected.trim(),
    'Internal pricing mirror is stale — run `npm run pricing:mirror`. ' +
      'Until you do, phone bookings price differently from the website.',
  );
});

Deno.test('offers bill against the funnel prices', () => {
  // 1,500–2,000 sq ft tier, base (non-NY) rates.
  assertEquals(offerPrice('1501_2000', 'standard', 'NJ'), 269);
  assertEquals(offerPrice('1501_2000', 'deep', 'NJ'), 449);
  assertEquals(offerPrice('1501_2000', '90_day', 'NJ'), 1125);
  assertEquals(offerPrice('1501_2000', 'move_in_out', 'NJ'), 549);
});

Deno.test('New York carries the 15% uplift, other markets do not', () => {
  assertEquals(stateMultiplier('NY'), 1.15);
  assertEquals(stateMultiplier('NJ'), 1.0);
  assertEquals(stateMultiplier('TX'), 1.0);
  assertEquals(stateMultiplier('CA'), 1.0);
  // Unknown state must not silently inflate a quote.
  assertEquals(stateMultiplier('FL'), 1.0);
  assertEquals(stateMultiplier(null), 1.0);

  assertEquals(offerPrice('1501_2000', 'deep', 'NY'), Math.round(449 * 1.15));
});

Deno.test('legacy tier ids from older bookings still resolve', () => {
  assertEquals(resolveHomeSizeId('1500_1999'), '1501_2000');
  assertEquals(resolveHomeSizeId('under_1000'), '1000_1500');
  assertEquals(resolveHomeSizeId('5000_plus'), '5001_plus');
  assertEquals(resolveHomeSizeId('1501_2000'), '1501_2000');
  // Nonsense falls back to the smallest tier rather than pricing at zero.
  assertEquals(resolveHomeSizeId('nonsense'), HOME_SIZE_RANGES[0].id);
});

Deno.test('the deposit split matches the funnel 25%', () => {
  assertEquals(DEPOSIT_PERCENT, 0.25);
  assertEquals(splitTotal(400, 'deposit_plus_preauth'), { deposit: 100, remaining: 300 });
  assertEquals(splitTotal(400, 'deposit_plus_remaining', 0.5), { deposit: 200, remaining: 200 });
  assertEquals(splitTotal(400, 'full_now'), { deposit: 400, remaining: 0 });
  assertEquals(splitTotal(400, 'none'), { deposit: 0, remaining: 400 });
});

Deno.test('every offer maps to a booking service and offer type', () => {
  assertEquals(Object.keys(OFFERS).length, 4);
  for (const offer of Object.values(OFFERS)) {
    if (!offer.serviceType || !offer.offerType) {
      throw new Error(`Offer ${offer.id} is missing its booking mapping`);
    }
    if (offer.visits < 1) throw new Error(`Offer ${offer.id} has no visits`);
  }
  assertEquals(OFFERS['90_day'].visits, 4);
  assertEquals(OFFERS['90_day'].isRecurring, true);
});
