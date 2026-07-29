// Guards the two copies of the internal rate card against drift.
//
// `src/lib/pricing-internal.ts` (browser) and
// `supabase/functions/_shared/pricing-internal.ts` (Deno) are duplicated
// on purpose — there is no build step joining the browser bundle to the
// edge runtime. The failure mode that duplication invites is silent and
// expensive: a VA quotes one number on the phone while Stripe invoices
// another. This test diffs everything below the header comment and fails
// on any difference. Run with: npm test

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {
  ADD_ONS,
  buildQuote,
  DEPOSIT_PERCENT,
  HOME_SIZE_RANGES,
  serviceFinalPrice,
  serviceListPrice,
  SERVICE_TIERS,
  splitTotal,
} from './pricing-internal.ts';

/** Strip the leading `//` header so only the code body is compared. */
function body(source: string): string {
  const lines = source.split('\n');
  let i = 0;
  while (i < lines.length && (lines[i].startsWith('//') || lines[i].trim() === '')) i++;
  return lines.slice(i).join('\n').trim();
}

Deno.test('the browser and Deno rate cards are identical', async () => {
  const [client, server] = await Promise.all([
    Deno.readTextFile(new URL('../../../src/lib/pricing-internal.ts', import.meta.url)),
    Deno.readTextFile(new URL('./pricing-internal.ts', import.meta.url)),
  ]);
  assertEquals(
    body(server),
    body(client),
    'Internal rate card drifted between the browser and edge copies — ' +
      'a VA would quote one price and Stripe would invoice another.',
  );
});

Deno.test('list price applies the service tier multiplier', () => {
  // 1,501–2,000 sq ft, zone B base is $225.
  assertEquals(serviceListPrice('1501_2000', 'standard'), 225);
  assertEquals(serviceListPrice('1501_2000', 'deep'), 338); // 225 x 1.5, rounded
  assertEquals(serviceListPrice('1501_2000', 'moveInOut'), 450);
  assertEquals(serviceListPrice('1501_2000', 'combo'), 563);
});

Deno.test('standing discounts come off list', () => {
  assertEquals(serviceFinalPrice('1501_2000', 'standard'), 191.25); // 15% off 225
  assertEquals(serviceFinalPrice('1501_2000', 'deep'), 253.5); // 25% off 338
  assertEquals(serviceFinalPrice('1501_2000', 'moveInOut'), 450); // no discount
});

Deno.test('combo bills deep at list plus standard at half', () => {
  // deep 338 + (standard 225 / 2) = 450.50
  assertEquals(serviceFinalPrice('1501_2000', 'combo'), 450.5);
});

Deno.test('move-in/out absorbs the fridge and oven add-ons', () => {
  const withExtras = buildQuote('1501_2000', 'moveInOut', ['fridge', 'oven', 'windows']);
  // Only the $40 windows add-on is billable.
  assertEquals(withExtras.addOnsTotal, 40);

  const standard = buildQuote('1501_2000', 'standard', ['fridge', 'oven']);
  assertEquals(standard.addOnsTotal, 60);
});

Deno.test('the quote totals service plus add-ons', () => {
  const q = buildQuote('1501_2000', 'standard', ['windows']);
  assertEquals(q.servicePrice, 191.25);
  assertEquals(q.addOnsTotal, 40);
  assertEquals(q.total, 231.25);
  assertEquals(q.discount, 33.75);
});

Deno.test('deposit split honours the invoice mode', () => {
  assertEquals(splitTotal(200, 'deposit_plus_preauth'), { deposit: 100, remaining: 100 });
  assertEquals(splitTotal(200, 'deposit_plus_remaining', 0.25), { deposit: 50, remaining: 150 });
  assertEquals(splitTotal(200, 'full_now'), { deposit: 200, remaining: 0 });
  assertEquals(splitTotal(200, 'none'), { deposit: 0, remaining: 200 });
});

Deno.test('the rate card covers every size with a positive price', () => {
  assertEquals(HOME_SIZE_RANGES.length, 9);
  for (const range of HOME_SIZE_RANGES) {
    if (range.standardPrice <= 0) throw new Error(`${range.id} has no price`);
    if (range.baseHours <= 0) throw new Error(`${range.id} has no hours`);
  }
  assertEquals(DEPOSIT_PERCENT, 0.5);
  assertEquals(Object.keys(SERVICE_TIERS).length, 4);
  assertEquals(Object.keys(ADD_ONS).length, 21);
});
