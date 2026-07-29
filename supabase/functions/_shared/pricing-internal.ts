// Server mirror of `src/lib/pricing-internal.ts`.
//
// Deliberately a copy rather than a shared import: this file runs in Deno
// on Supabase and the client file runs in the browser bundle, and there is
// no build step joining them. The rate card below MUST stay byte-identical
// to the client's, or the live quote a VA reads on the phone and the
// Stripe invoice the customer receives will silently disagree.
//
// A drift test (`pricing-internal.deno-test.ts`) diffs the two files and
// fails if the exported values stop matching.

export type ServiceType = 'standard' | 'deep' | 'moveInOut' | 'combo';
export type ZoneId = 'A' | 'B' | 'C';

export interface HomeSizeRange {
  id: string;
  label: string;
  /** Base price for a STANDARD clean in zone B, in dollars. */
  standardPrice: number;
  /** Crew hours used for scheduling estimates. */
  baseHours: number;
}

export const HOME_SIZE_RANGES: HomeSizeRange[] = [
  { id: '0_999', label: '0 – 999 sq ft', standardPrice: 150, baseHours: 2.0 },
  { id: '1000_1500', label: '1,000 – 1,500 sq ft', standardPrice: 190, baseHours: 2.5 },
  { id: '1501_2000', label: '1,501 – 2,000 sq ft', standardPrice: 225, baseHours: 3.0 },
  { id: '2001_2500', label: '2,001 – 2,500 sq ft', standardPrice: 260, baseHours: 3.5 },
  { id: '2501_3000', label: '2,501 – 3,000 sq ft', standardPrice: 300, baseHours: 4.0 },
  { id: '3001_3500', label: '3,001 – 3,500 sq ft', standardPrice: 340, baseHours: 4.5 },
  { id: '3501_4000', label: '3,501 – 4,000 sq ft', standardPrice: 375, baseHours: 5.0 },
  { id: '4001_4500', label: '4,001 – 4,500 sq ft', standardPrice: 415, baseHours: 5.5 },
  { id: '4501_5000', label: '4,501 – 5,000 sq ft', standardPrice: 450, baseHours: 6.0 },
];

export const SERVICE_TIERS: Record<ServiceType, { label: string; multiplier: number }> = {
  standard: { label: 'Standard Clean', multiplier: 1.0 },
  deep: { label: 'Deep Clean', multiplier: 1.5 },
  combo: { label: 'Deep + Standard Combo', multiplier: 2.5 },
  moveInOut: { label: 'Move-In / Move-Out', multiplier: 2.0 },
};

/** Geographic modifier. The internal flow always quotes zone B. */
export const SERVICE_ZONES: Record<ZoneId, { label: string; modifier: number }> = {
  A: { label: 'Zone A (premium)', modifier: 1.15 },
  B: { label: 'Zone B (standard)', modifier: 1.0 },
  C: { label: 'Zone C (outer)', modifier: 0.9 },
};

/**
 * Standing discount off list, by service.
 *
 * Combo is not a percentage: it bills the deep clean at full list plus
 * the standard clean at half, which is why it is handled separately in
 * `serviceFinalPrice` rather than living in this table.
 */
export const SERVICE_DISCOUNT_RATES: Record<ServiceType, number> = {
  standard: 0.15,
  deep: 0.25,
  combo: 0,
  moveInOut: 0,
};

export const DEPOSIT_PERCENT = 0.5;

export interface AddOn {
  label: string;
  price: number;
  note?: string;
}

export const ADD_ONS: Record<string, AddOn> = {
  fridge: { label: 'Inside fridge', price: 30, note: 'Included with Move-In/Out' },
  oven: { label: 'Inside oven', price: 30, note: 'Included with Move-In/Out' },
  windows: { label: 'Interior windows', price: 40, note: 'Per visit' },
  laundry: { label: 'Laundry — wash & fold', price: 35, note: 'Per load' },
  changeLinens: { label: 'Change bed linens', price: 15 },
  dishes: { label: 'Dishes & kitchen cleanup', price: 20 },
  baseboards: { label: 'Baseboards (hand-wiped)', price: 35 },
  blinds: { label: 'Blinds & shutters', price: 30 },
  cabinets: { label: 'Inside cabinets', price: 35 },
  walls: { label: 'Spot wall washing', price: 40 },
  ceilingFans: { label: 'Ceiling fans', price: 15 },
  microwave: { label: 'Inside microwave', price: 10 },
  dishwasher: { label: 'Inside dishwasher', price: 15 },
  garage: { label: 'Garage sweep-out', price: 50 },
  basement: { label: 'Basement clean', price: 75 },
  patio: { label: 'Patio / balcony', price: 35 },
  petHair: { label: 'Heavy pet-hair removal', price: 35 },
  closets: { label: 'Inside closets / tidy', price: 30 },
  trashHaul: { label: 'Trash haul', price: 75 },
  deepBathroomDetail: { label: 'Deep bathroom detail', price: 45 },
  cateringEvent: { label: 'Catering / event cleanup', price: 85 },
};

/** Add-ons a Move-In/Out already covers, so they bill at $0. */
const MOVE_IN_OUT_INCLUDED = new Set(['fridge', 'oven']);

const round2 = (n: number) => Math.round(n * 100) / 100;

export function homeSizeBase(homeSizeId: string): number {
  return HOME_SIZE_RANGES.find((r) => r.id === homeSizeId)?.standardPrice ?? 0;
}

export function estimatedHours(homeSizeId: string): number {
  return HOME_SIZE_RANGES.find((r) => r.id === homeSizeId)?.baseHours ?? 3;
}

/** Undiscounted list price for a service — what the rate card says. */
export function serviceListPrice(
  homeSizeId: string,
  serviceType: ServiceType,
  zone: ZoneId = 'B',
): number {
  const base = homeSizeBase(homeSizeId);
  if (!base) return 0;
  return Math.round(base * SERVICE_TIERS[serviceType].multiplier * SERVICE_ZONES[zone].modifier);
}

/** What the customer actually pays for the service, before add-ons. */
export function serviceFinalPrice(
  homeSizeId: string,
  serviceType: ServiceType,
  zone: ZoneId = 'B',
): number {
  const list = serviceListPrice(homeSizeId, serviceType, zone);
  if (!list) return 0;
  if (serviceType === 'combo') {
    // Deep at full list + standard at half — not a flat percentage.
    const standardList = serviceListPrice(homeSizeId, 'standard', zone);
    const deepList = serviceListPrice(homeSizeId, 'deep', zone);
    return round2(deepList + standardList * 0.5);
  }
  return round2(list * (1 - SERVICE_DISCOUNT_RATES[serviceType]));
}

export function addOnPrice(addOnId: string, serviceType: ServiceType): number {
  if (serviceType === 'moveInOut' && MOVE_IN_OUT_INCLUDED.has(addOnId)) return 0;
  return ADD_ONS[addOnId]?.price ?? 0;
}

export function addOnsTotal(addOns: string[], serviceType: ServiceType): number {
  return addOns.reduce((sum, id) => sum + addOnPrice(id, serviceType), 0);
}

export interface Quote {
  /** Rate-card price before the standing discount. */
  listPrice: number;
  /** Service price after the standing discount. */
  servicePrice: number;
  addOnsTotal: number;
  /** What the customer owes in total. */
  total: number;
  /** Savings vs list, for the VA to quote on the phone. */
  discount: number;
  estimatedHours: number;
}

export function buildQuote(
  homeSizeId: string,
  serviceType: ServiceType,
  addOns: string[] = [],
  zone: ZoneId = 'B',
): Quote {
  const listPrice = serviceListPrice(homeSizeId, serviceType, zone);
  const servicePrice = serviceFinalPrice(homeSizeId, serviceType, zone);
  const extras = addOnsTotal(addOns, serviceType);
  return {
    listPrice,
    servicePrice,
    addOnsTotal: extras,
    total: round2(servicePrice + extras),
    discount: round2(listPrice - servicePrice),
    estimatedHours: estimatedHours(homeSizeId),
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
      'Customer signs and pays the deposit on a secure link, and we save the card. The balance is authorized a few days before service and captured after the clean.',
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
