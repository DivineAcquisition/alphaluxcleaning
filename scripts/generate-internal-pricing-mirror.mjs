#!/usr/bin/env node

/**
 * Generates the edge-runtime copy of the internal booking rate card.
 *
 * The browser reads prices from `src/lib/new-pricing-system.ts` (the
 * public funnel's rate card, derived from unit economics). Deno cannot
 * import that file — there is no build step joining the browser bundle
 * to the edge runtime — so `book-as-va` needs its own copy of the tier
 * table.
 *
 * Copying it by hand is how a VA ends up quoting one price while Stripe
 * invoices another, so this script lifts HOME_SIZE_RANGES straight out
 * of the funnel's source and writes the mirror. `npm test` fails if the
 * committed mirror no longer matches what this would produce.
 *
 * Usage: npm run pricing:mirror
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = resolve(root, 'src/lib/new-pricing-system.ts');
const TARGET = resolve(root, 'supabase/functions/_shared/pricing-internal.ts');

/** Pull the HOME_SIZE_RANGES array literal out of the funnel's rate card. */
export function extractTiers(source) {
  const match = source.match(/export const HOME_SIZE_RANGES: HomeSizeRange\[\] = (\[[\s\S]*?\n\]);/);
  if (!match) throw new Error('HOME_SIZE_RANGES not found in new-pricing-system.ts');

  // The literal is plain data (no expressions), so quoting the keys and
  // stripping comments/trailing commas makes it valid JSON.
  const json = match[1]
    .replace(/\/\/[^\n]*/g, '')
    .replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":')
    .replace(/'/g, '"')
    .replace(/,(\s*[}\]])/g, '$1');

  const tiers = JSON.parse(json);
  if (!Array.isArray(tiers) || tiers.length === 0) throw new Error('No tiers parsed');
  for (const t of tiers) {
    for (const field of ['deepPrice', 'maintenancePrice', 'ninetyDayPrice', 'moveInOutPrice']) {
      if (typeof t[field] !== 'number') {
        throw new Error(`Tier ${t.id} is missing a numeric ${field}`);
      }
    }
  }
  return tiers;
}

export function extractDepositPercent(source) {
  const m = source.match(/export const DEPOSIT_PERCENTAGE\s*=\s*([0-9.]+)/);
  if (!m) throw new Error('DEPOSIT_PERCENTAGE not found');
  return Number(m[1]);
}

export function render(tiers, depositPercent) {
  return `// GENERATED FILE — do not edit by hand.
//
// Run \`npm run pricing:mirror\` to regenerate. Source of truth is
// src/lib/new-pricing-system.ts, the public AlphaLux booking funnel's
// rate card, so a phone booking always quotes the same price as the
// website for the same house.
//
// Deno cannot import the browser rate card (no build step joins them),
// which is why the tier table below is inlined. \`npm test\` fails if this
// file drifts from what the generator would produce.

export type OfferId = 'standard' | 'deep' | 'move_in_out' | 'bundle' | 'recurring';\nexport type Cadence = 'weekly' | 'biweekly' | 'monthly';

export interface HomeSizeRange {
  id: string;
  label: string;
  minSqft: number;
  maxSqft: number;
  requiresEstimate?: boolean;
  deepPrice: number;
  maintenancePrice: number;
  ninetyDayPrice: number;
  moveInOutPrice: number;
}

export const HOME_SIZE_RANGES: HomeSizeRange[] = ${JSON.stringify(
    tiers.map((t) => ({
      id: t.id,
      label: t.label,
      minSqft: t.minSqft,
      maxSqft: t.maxSqft,
      ...(t.requiresEstimate ? { requiresEstimate: true } : {}),
      deepPrice: t.deepPrice,
      maintenancePrice: t.maintenancePrice,
      ninetyDayPrice: t.ninetyDayPrice,
      moveInOutPrice: t.moveInOutPrice,
    })),
    null,
    2,
  )};

export interface OfferDefinition {
  id: OfferId;
  label: string;
  priceField: 'maintenancePrice' | 'deepPrice' | 'ninetyDayPrice' | 'moveInOutPrice';
  serviceType: string;
  offerType: string;
  visits: number;
  isRecurring: boolean;
}

export const OFFERS: Record<OfferId, OfferDefinition> = {
  standard: { id: 'standard', label: 'Standard Clean', priceField: 'maintenancePrice', serviceType: 'regular', offerType: 'standard_clean', visits: 1, isRecurring: false },
  deep: { id: 'deep', label: 'Deep Clean', priceField: 'deepPrice', serviceType: 'deep', offerType: 'deep_clean', visits: 1, isRecurring: false },
  move_in_out: { id: 'move_in_out', label: 'Move-In / Move-Out', priceField: 'moveInOutPrice', serviceType: 'move_in_out', offerType: 'move_in_out', visits: 1, isRecurring: false },
  bundle: { id: 'bundle', label: 'Deep + Standard Bundle', priceField: 'deepPrice', serviceType: 'deep', offerType: 'bundle_deep_standard', visits: 2, isRecurring: false },
  recurring: { id: 'recurring', label: 'Recurring Service', priceField: 'maintenancePrice', serviceType: 'regular', offerType: 'recurring_plan', visits: 1, isRecurring: true },
};

export const CADENCE_DISCOUNTS: Record<Cadence, number> = {
  weekly: 0.13,
  biweekly: 0.08,
  monthly: 0.04,
};

export const CADENCE_PER_MONTH: Record<Cadence, number> = {
  weekly: 4,
  biweekly: 2,
  monthly: 1,
};

export const DEPOSIT_PERCENT = ${depositPercent};

export const STATE_MULTIPLIERS: Record<string, number> = {
  NY: 1.15,
  NJ: 1.0,
  TX: 1.0,
  CA: 1.0,
};

export function stateMultiplier(state?: string | null): number {
  return STATE_MULTIPLIERS[String(state || '').toUpperCase()] ?? 1.0;
}

/** Tolerate legacy tier ids persisted on older bookings. */
export function resolveHomeSizeId(id: string | undefined | null): string {
  const raw = String(id || '').trim();
  if (HOME_SIZE_RANGES.some((r) => r.id === raw)) return raw;
  const legacy: Record<string, string> = {
    under_1000: '1000_1500',
    '1000_1499': '1000_1500',
    '1500_1999': '1501_2000',
    '2000_2499': '2001_2500',
    '2500_2999': '2501_3000',
    '3000_3499': '3001_4000',
    '3500_3999': '3001_4000',
    '4000_4999': '4001_5000',
    '5000_plus': '5001_plus',
  };
  return legacy[raw] || HOME_SIZE_RANGES[0].id;
}

export function tierFor(homeSizeId: string): HomeSizeRange | undefined {
  const id = resolveHomeSizeId(homeSizeId);
  return HOME_SIZE_RANGES.find((r) => r.id === id);
}

export function offerPrice(
  homeSizeId: string,
  offerId: OfferId,
  state?: string | null,
  cadence: Cadence = 'biweekly',
): number {
  const tier = tierFor(homeSizeId);
  if (!tier) return 0;
  const mult = stateMultiplier(state);
  const standard = Math.round(Number(tier.maintenancePrice) * mult);
  const deep = Math.round(Number(tier.deepPrice) * mult);

  // Bundle and recurring are derived, never stored, so they cannot
  // drift from the prices they are built on.
  if (offerId === 'bundle') {
    if (!standard || !deep) return 0;
    return Math.round(deep + standard / 2);
  }
  if (offerId === 'recurring') {
    return Math.round(standard * (1 - CADENCE_DISCOUNTS[cadence]));
  }
  const base = Number(tier[OFFERS[offerId].priceField]) || 0;
  return Math.round(base * mult);
}

export type InvoiceMode =
  | 'deposit_plus_preauth'
  | 'deposit_plus_remaining'
  | 'full_now'
  | 'none';

const round2 = (n: number) => Math.round(n * 100) / 100;

export function splitTotal(
  total: number,
  invoiceMode: InvoiceMode,
  depositPercent = DEPOSIT_PERCENT,
): { deposit: number; remaining: number } {
  if (invoiceMode === 'none') return { deposit: 0, remaining: total };
  if (invoiceMode === 'full_now') return { deposit: total, remaining: 0 };
  const pct = Math.max(0, Math.min(1, depositPercent));
  const deposit = round2(total * pct);
  return { deposit, remaining: round2(Math.max(0, total - deposit)) };
}
`;
}

export function build() {
  const source = readFileSync(SOURCE, 'utf8');
  return render(extractTiers(source), extractDepositPercent(source));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const output = build();
  writeFileSync(TARGET, output);
  console.log(`Wrote ${TARGET} (${output.split('\n').length} lines)`);
}
