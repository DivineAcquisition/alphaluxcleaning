// Internal-booking pricing — the SAME offers and prices the public
// AlphaLux booking flow sells.
//
// This deliberately owns no numbers of its own. Tiers and prices come
// straight from `@/lib/new-pricing-system`, which is what /book/offer
// quotes from and whose rate card is derived from explicit unit
// economics (labour, loading, supplies, travel) so a promo-applied
// booking still clears its margin floor. A phone booking that priced
// independently would undercut that analysis and disagree with the
// website for the same house.
//
// The four sellable offers are exactly the funnel's:
//
//   standard      → maintenancePrice
//   deep          → deepPrice
//   move_in_out   → moveInOutPrice
//   bundle        → deep + half a standard (one deep, one follow-up)
//   recurring     → standard on a cadence, at the funnel's frequency
//                   discount (weekly 13%, biweekly 8%, monthly 4%)
//
// Mirrored for the edge runtime in
// `supabase/functions/_shared/pricing-internal.ts`, which is generated
// from this file's data and diff-tested against it.

import {
  DEPOSIT_PERCENTAGE,
  HOME_SIZE_RANGES,
  resolveHomeSizeId,
  type HomeSizeRange,
} from '@/lib/new-pricing-system';

export { HOME_SIZE_RANGES, resolveHomeSizeId };
export type { HomeSizeRange };

export type OfferId = 'standard' | 'deep' | 'move_in_out' | 'bundle' | 'recurring';

export type Cadence = 'weekly' | 'biweekly' | 'monthly';

export interface OfferDefinition {
  id: OfferId;
  label: string;
  blurb: string;
  /** Which price on the tier this offer bills at. */
  priceField: keyof Pick<
    HomeSizeRange,
    'maintenancePrice' | 'deepPrice' | 'ninetyDayPrice' | 'moveInOutPrice'
  >;
  /** Value written to `bookings.service_type`. */
  serviceType: string;
  /** Value written to `bookings.offer_type`. */
  offerType: string;
  visits: number;
  isRecurring: boolean;
}

export const OFFERS: Record<OfferId, OfferDefinition> = {
  standard: {
    id: 'standard',
    label: 'Standard Clean',
    blurb: 'Maintenance clean for an already-kept home.',
    priceField: 'maintenancePrice',
    serviceType: 'regular',
    offerType: 'standard_clean',
    visits: 1,
    isRecurring: false,
  },
  deep: {
    id: 'deep',
    label: 'Deep Clean',
    blurb: 'Top-to-bottom reset. The usual first clean.',
    priceField: 'deepPrice',
    serviceType: 'deep',
    offerType: 'deep_clean',
    visits: 1,
    isRecurring: false,
  },
  move_in_out: {
    id: 'move_in_out',
    label: 'Move-In / Move-Out',
    blurb: 'Empty-home turnover clean.',
    priceField: 'moveInOutPrice',
    serviceType: 'move_in_out',
    offerType: 'move_in_out',
    visits: 1,
    isRecurring: false,
  },
  bundle: {
    id: 'bundle',
    label: 'Deep + Standard Bundle',
    blurb: 'Deep clean now, standard follow-up at half price.',
    priceField: 'deepPrice',
    serviceType: 'deep',
    offerType: 'bundle_deep_standard',
    visits: 2,
    isRecurring: false,
  },
  recurring: {
    id: 'recurring',
    label: 'Recurring Service',
    blurb: 'Standard clean on a cadence, discounted per visit.',
    priceField: 'maintenancePrice',
    serviceType: 'regular',
    offerType: 'recurring_plan',
    visits: 1,
    isRecurring: true,
  },
};

/**
 * Per-visit discount for a recurring cadence. Mirrors the funnel's
 * FrequencyConfig — recurring customers pay these from visit one, and
 * the rates were tuned in the profitability review to stay attractive
 * without eroding per-visit margin on repeat work.
 */
export const CADENCE_DISCOUNTS: Record<Cadence, number> = {
  weekly: 0.13,
  biweekly: 0.08,
  monthly: 0.04,
};

export const CADENCE_LABELS: Record<Cadence, string> = {
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
};

export const CADENCE_PER_MONTH: Record<Cadence, number> = {
  weekly: 4,
  biweekly: 2,
  monthly: 1,
};

export const OFFER_ORDER: OfferId[] = ['deep', 'standard', 'move_in_out', 'bundle', 'recurring'];

/** Deposit taken up front. Matches the funnel (25%). */
export const DEPOSIT_PERCENT = DEPOSIT_PERCENTAGE;

/**
 * Per-state multiplier, mirroring the funnel's StateConfig. Only NY
 * carries an uplift today; every other market bills at the base rate.
 */
export const STATE_MULTIPLIERS: Record<string, number> = {
  NY: 1.15,
  NJ: 1.0,
  TX: 1.0,
  CA: 1.0,
};

export function stateMultiplier(state?: string | null): number {
  return STATE_MULTIPLIERS[String(state || '').toUpperCase()] ?? 1.0;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function tierFor(homeSizeId: string): HomeSizeRange | undefined {
  const id = resolveHomeSizeId(homeSizeId);
  return HOME_SIZE_RANGES.find((r) => r.id === id);
}

/**
 * Price for an offer at a home size, in the customer's state.
 *
 * Bundle and recurring are derived rather than stored, so they cannot
 * drift out of step with the standard and deep prices they are built
 * from.
 */
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

/** True when the tier is quote-only (5,001+ sq ft). */
export function requiresEstimate(homeSizeId: string): boolean {
  return Boolean(tierFor(homeSizeId)?.requiresEstimate);
}

export interface Quote {
  offerLabel: string;
  /** Rate-card price for this offer, state-adjusted. */
  total: number;
  tierLabel: string;
  visits: number;
  requiresEstimate: boolean;
  isRecurring: boolean;
  cadence?: Cadence;
  /** What the customer pays per month on a recurring plan. */
  monthlyTotal?: number;
}

export function buildQuote(
  homeSizeId: string,
  offerId: OfferId,
  state?: string | null,
  cadence: Cadence = 'biweekly',
): Quote {
  const tier = tierFor(homeSizeId);
  const offer = OFFERS[offerId];
  const total = offerPrice(homeSizeId, offerId, state, cadence);
  return {
    offerLabel: offer.label,
    total,
    tierLabel: tier?.label ?? 'Unknown size',
    visits: offer.visits,
    requiresEstimate: Boolean(tier?.requiresEstimate),
    isRecurring: offer.isRecurring,
    cadence: offer.isRecurring ? cadence : undefined,
    monthlyTotal: offer.isRecurring ? total * CADENCE_PER_MONTH[cadence] : undefined,
  };
}

export type InvoiceMode =
  | 'deposit_plus_preauth'
  | 'deposit_plus_remaining'
  | 'full_now'
  | 'none';

export const INVOICE_MODES: Array<{
  value: InvoiceMode;
  label: string;
  description: string;
}> = [
  {
    value: 'deposit_plus_preauth',
    label: 'Deposit now + pre-auth hold',
    description:
      'Customer pays the deposit on a secure link and we save the card. The balance is authorized before service and captured after the clean.',
  },
  {
    value: 'deposit_plus_remaining',
    label: 'Deposit now + balance invoice',
    description: 'Deposit invoice today, remaining balance invoiced on the service date.',
  },
  {
    value: 'full_now',
    label: 'Full amount now',
    description: 'One invoice for the whole job, due today.',
  },
  {
    value: 'none',
    label: 'No invoice',
    description: 'Hold the booking as pending payment. Nothing is sent to the customer.',
  },
];

/** Split a total into deposit + remaining for a given invoice mode. */
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

export const TIME_SLOTS = [
  { value: 'early_morning', label: 'Early Morning (7–9 AM)' },
  { value: 'morning', label: 'Morning (9–11 AM)' },
  { value: 'late_morning', label: 'Late Morning (11 AM–1 PM)' },
  { value: 'afternoon', label: 'Afternoon (1–3 PM)' },
  { value: 'late_afternoon', label: 'Late Afternoon (3–5 PM)' },
  { value: 'evening', label: 'Evening (5–7 PM)' },
];

export const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
