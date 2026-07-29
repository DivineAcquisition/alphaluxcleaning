// GENERATED FILE — do not edit by hand.
//
// Run `npm run pricing:mirror` to regenerate. Source of truth is
// src/lib/new-pricing-system.ts, the public AlphaLux booking funnel's
// rate card, so a phone booking always quotes the same price as the
// website for the same house.
//
// Deno cannot import the browser rate card (no build step joins them),
// which is why the tier table below is inlined. `npm test` fails if this
// file drifts from what the generator would produce.

export type OfferId = 'standard' | 'deep' | 'move_in_out' | 'bundle' | 'recurring';
export type Cadence = 'weekly' | 'biweekly' | 'monthly';

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

export const HOME_SIZE_RANGES: HomeSizeRange[] = [
  {
    "id": "1000_1500",
    "label": "Up to 1,500 sq ft",
    "minSqft": 0,
    "maxSqft": 1500,
    "deepPrice": 339,
    "maintenancePrice": 209,
    "ninetyDayPrice": 935,
    "moveInOutPrice": 419
  },
  {
    "id": "1501_2000",
    "label": "1,500 – 2,000 sq ft",
    "minSqft": 1500,
    "maxSqft": 2000,
    "deepPrice": 419,
    "maintenancePrice": 249,
    "ninetyDayPrice": 1125,
    "moveInOutPrice": 509
  },
  {
    "id": "2001_2500",
    "label": "2,000 – 2,500 sq ft",
    "minSqft": 2000,
    "maxSqft": 2500,
    "deepPrice": 499,
    "maintenancePrice": 275,
    "ninetyDayPrice": 1289,
    "moveInOutPrice": 585
  },
  {
    "id": "2501_3000",
    "label": "2,500 – 3,000 sq ft",
    "minSqft": 2500,
    "maxSqft": 3000,
    "deepPrice": 579,
    "maintenancePrice": 299,
    "ninetyDayPrice": 1445,
    "moveInOutPrice": 679
  },
  {
    "id": "3001_4000",
    "label": "3,000 – 4,000 sq ft",
    "minSqft": 3000,
    "maxSqft": 4000,
    "deepPrice": 665,
    "maintenancePrice": 349,
    "ninetyDayPrice": 1629,
    "moveInOutPrice": 825
  },
  {
    "id": "4001_5000",
    "label": "4,000 – 5,000 sq ft",
    "minSqft": 4000,
    "maxSqft": 5000,
    "deepPrice": 829,
    "maintenancePrice": 409,
    "ninetyDayPrice": 1929,
    "moveInOutPrice": 999
  },
  {
    "id": "5001_plus",
    "label": "5,000+ sq ft",
    "minSqft": 5000,
    "maxSqft": 999999,
    "requiresEstimate": true,
    "deepPrice": 969,
    "maintenancePrice": 459,
    "ninetyDayPrice": 2199,
    "moveInOutPrice": 0
  }
];

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

export const DEPOSIT_PERCENT = 0.5;

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
