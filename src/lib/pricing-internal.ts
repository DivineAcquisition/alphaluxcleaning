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
//   deep          → deepPrice          ("Tester Deep Clean")
//   90_day        → ninetyDayPrice     (deep + 3 maintenance, bundled)
//   move_in_out   → moveInOutPrice
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

export type OfferId = 'standard' | 'deep' | '90_day' | 'move_in_out';

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
    blurb: 'Recurring-grade maintenance clean.',
    priceField: 'maintenancePrice',
    serviceType: 'regular',
    offerType: 'standard_clean',
    visits: 1,
    isRecurring: false,
  },
  deep: {
    id: 'deep',
    label: 'Tester Deep Clean',
    blurb: 'Top-to-bottom first clean. The usual entry point.',
    priceField: 'deepPrice',
    serviceType: 'deep',
    offerType: 'tester',
    visits: 1,
    isRecurring: false,
  },
  '90_day': {
    id: '90_day',
    label: '90-Day Reset & Maintain',
    blurb: 'Deep clean plus three maintenance visits, bundled.',
    priceField: 'ninetyDayPrice',
    serviceType: 'deep',
    offerType: '90_day_plan',
    visits: 4,
    isRecurring: true,
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
};

export const OFFER_ORDER: OfferId[] = ['deep', 'standard', '90_day', 'move_in_out'];

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

/** List price for an offer at a home size, in the customer's state. */
export function offerPrice(
  homeSizeId: string,
  offerId: OfferId,
  state?: string | null,
): number {
  const tier = tierFor(homeSizeId);
  if (!tier) return 0;
  const base = Number(tier[OFFERS[offerId].priceField]) || 0;
  return Math.round(base * stateMultiplier(state));
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
}

export function buildQuote(
  homeSizeId: string,
  offerId: OfferId,
  state?: string | null,
): Quote {
  const tier = tierFor(homeSizeId);
  const offer = OFFERS[offerId];
  return {
    offerLabel: offer.label,
    total: offerPrice(homeSizeId, offerId, state),
    tierLabel: tier?.label ?? 'Unknown size',
    visits: offer.visits,
    requiresEstimate: Boolean(tier?.requiresEstimate),
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
