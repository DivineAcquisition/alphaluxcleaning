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
  assertEquals(offerPrice('1501_2000', 'standard', 'NJ'), 249);
  assertEquals(offerPrice('1501_2000', 'deep', 'NJ'), 419);
  assertEquals(offerPrice('1501_2000', 'move_in_out', 'NJ'), 509);
});

Deno.test('the bundle is a deep clean plus half a standard', () => {
  // deep 419 + standard 249 / 2 = 543.5 -> 544
  assertEquals(offerPrice('1501_2000', 'bundle', 'NJ'), 544);
  assertEquals(OFFERS.bundle.visits, 2);
});

Deno.test('recurring applies the cadence discount per visit', () => {
  const standard = offerPrice('1501_2000', 'standard', 'NJ');
  assertEquals(offerPrice('1501_2000', 'recurring', 'NJ', 'weekly'), Math.round(standard * 0.87));
  assertEquals(offerPrice('1501_2000', 'recurring', 'NJ', 'biweekly'), Math.round(standard * 0.92));
  assertEquals(offerPrice('1501_2000', 'recurring', 'NJ', 'monthly'), Math.round(standard * 0.96));
  // A recurring visit must never cost more than the one-off it replaces.
  for (const c of ['weekly', 'biweekly', 'monthly'] as const) {
    if (offerPrice('1501_2000', 'recurring', 'NJ', c) >= standard) {
      throw new Error(`${c} recurring is not cheaper than a one-off standard`);
    }
  }
});

/**
 * Direct cost per job at $33 per cleaner-hour, from the cost model
 * documented in new-pricing-system.ts. Standard runs one cleaner; deep
 * and move-out run a two-person team.
 */
const DIRECT_COST: Record<string, { standard: number; deep: number; move_in_out: number }> = {
  '1000_1500': { standard: 82.5, deep: 132, move_in_out: 165 },
  '1501_2000': { standard: 99, deep: 165, move_in_out: 198 },
  '2001_2500': { standard: 115.5, deep: 198, move_in_out: 231 },
  '2501_3000': { standard: 132, deep: 231, move_in_out: 264 },
  '3001_4000': { standard: 165, deep: 264, move_in_out: 330 },
  '4001_5000': { standard: 198, deep: 330, move_in_out: 396 },
};

Deno.test('no offer is sold below direct cost, even with the 50% promo', () => {
  // The new-customer promo halves the price. A promo booking that does
  // not clear direct cost is a job we pay to perform, and it is very
  // easy to create one by nudging a number in the rate card — so this
  // asserts it rather than trusting a comment.
  const PROMO = 0.5;
  const failures: string[] = [];

  for (const [tierId, costs] of Object.entries(DIRECT_COST)) {
    for (const offerId of ['standard', 'deep', 'move_in_out'] as const) {
      const list = offerPrice(tierId, offerId, 'NJ');
      if (!list) continue;
      const promoPrice = list * PROMO;
      const cost = costs[offerId];
      if (promoPrice < cost) {
        failures.push(
          `${tierId}/${offerId}: promo $${promoPrice.toFixed(2)} < cost $${cost.toFixed(2)}`,
        );
      }
    }
  }

  assertEquals(
    failures,
    [],
    'These offers lose money on a promo booking. Raise the price, or ' +
      'exclude the offer from the new-customer promo:\n  ' + failures.join('\n  '),
  );
});

Deno.test('New York carries the 15% uplift, other markets do not', () => {
  assertEquals(stateMultiplier('NY'), 1.15);
  assertEquals(stateMultiplier('NJ'), 1.0);
  assertEquals(stateMultiplier('TX'), 1.0);
  assertEquals(stateMultiplier('CA'), 1.0);
  // Unknown state must not silently inflate a quote.
  assertEquals(stateMultiplier('FL'), 1.0);
  assertEquals(stateMultiplier(null), 1.0);

  assertEquals(offerPrice('1501_2000', 'deep', 'NY'), Math.round(419 * 1.15));
});

Deno.test('legacy tier ids from older bookings still resolve', () => {
  assertEquals(resolveHomeSizeId('1500_1999'), '1501_2000');
  assertEquals(resolveHomeSizeId('under_1000'), '1000_1500');
  assertEquals(resolveHomeSizeId('5000_plus'), '5001_plus');
  assertEquals(resolveHomeSizeId('1501_2000'), '1501_2000');
  // Nonsense falls back to the smallest tier rather than pricing at zero.
  assertEquals(resolveHomeSizeId('nonsense'), HOME_SIZE_RANGES[0].id);
});

Deno.test('the deposit split matches the funnel 50%', () => {
  assertEquals(DEPOSIT_PERCENT, 0.5);
  assertEquals(splitTotal(400, 'deposit_plus_preauth'), { deposit: 200, remaining: 200 });
  assertEquals(splitTotal(400, 'deposit_plus_remaining', 0.5), { deposit: 200, remaining: 200 });
  assertEquals(splitTotal(400, 'full_now'), { deposit: 400, remaining: 0 });
  assertEquals(splitTotal(400, 'none'), { deposit: 0, remaining: 400 });
});

Deno.test('every offer maps to a booking service and offer type', () => {
  assertEquals(Object.keys(OFFERS).length, 5);
  for (const offer of Object.values(OFFERS)) {
    if (!offer.serviceType || !offer.offerType) {
      throw new Error(`Offer ${offer.id} is missing its booking mapping`);
    }
    if (offer.visits < 1) throw new Error(`Offer ${offer.id} has no visits`);
  }
  assertEquals(OFFERS.recurring.isRecurring, true);
  assertEquals(OFFERS.bundle.visits, 2);
});
