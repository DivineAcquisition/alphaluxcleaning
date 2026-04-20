/**
 * AlphaLux Cleaning — canonical pricing calculator.
 *
 * This module encodes the pricing table the customer sent over on
 * 2026-04-20. Every dollar value below mirrors a cell in that
 * spreadsheet so it is easy to cross-reference when the tables are
 * updated again.
 *
 * Sections covered:
 *   - Deep Clean flat ladder (sqft -> price)
 *   - Move-Out flat ladder (sqft -> price)
 *   - Windows surcharge (per window)
 *   - Bedroom / bathroom (and other room) surcharges
 *   - Hourly cleaning model (1 vs 2 cleaners, hrs, $50/$95 tiers)
 *   - Bedroom / kitchen / bathroom-hour formulas for the hourly quote
 */

export type ServiceType = 'deep' | 'moveout' | 'hourly' | 'standard';

export interface SqftPricePoint {
  uptoSqft: number;
  price: number;
}

export const DEEP_CLEAN_LADDER: SqftPricePoint[] = [
  { uptoSqft: 1100, price: 200 },
  { uptoSqft: 1500, price: 275 },
  { uptoSqft: 2200, price: 345 },
];

export const MOVE_OUT_LADDER: SqftPricePoint[] = [
  { uptoSqft: 1100, price: 225 },
  { uptoSqft: 1500, price: 300 },
  { uptoSqft: 2000, price: 350 },
];

export const WINDOW_PRICE_PER_WINDOW = 6;

export const BEDROOM_SURCHARGE = 20;
export const BATHROOM_SURCHARGE = 30;

/** Hourly model — cleaner count, rates, and tier-based sqft brackets. */
export const HOURLY_RATES = {
  oneCleanerBelow6h: 50,
  oneCleanerAbove6h: 95,
  twoCleanersBelow6h: 110,
  twoCleanersAbove6h: 160,
};

export const CLEANER_COUNT_BRACKETS: { uptoSqft: number; cleaners: number; ratePerHour: number }[] = [
  { uptoSqft: 1600, cleaners: 1, ratePerHour: 50 },
  { uptoSqft: 2400, cleaners: 2, ratePerHour: 95 },
  { uptoSqft: 3200, cleaners: 3, ratePerHour: 130 },
];

/** Room-based hours model (spreadsheet "Calculation" box). */
export const ROOM_HOUR_WEIGHTS = {
  bedroom: 0.5,
  kitchen: 1.0,
  bathroom: 0.75,
  other: 0.75,
};

export const HOURLY_SQFT_ESTIMATE_TABLE: { sqft: number; twoCleanerLow: number; twoCleanerHigh: number }[] = [
  { sqft: 800, twoCleanerLow: 110, twoCleanerHigh: 165 },
  { sqft: 1200, twoCleanerLow: 165, twoCleanerHigh: 220 },
  { sqft: 1600, twoCleanerLow: 220, twoCleanerHigh: 275 },
  { sqft: 2000, twoCleanerLow: 275, twoCleanerHigh: 330 },
  { sqft: 2400, twoCleanerLow: 165, twoCleanerHigh: 220 },
  { sqft: 2800, twoCleanerLow: 175, twoCleanerHigh: 255 },
  { sqft: 3200, twoCleanerLow: 220, twoCleanerHigh: 275 },
  { sqft: 3600, twoCleanerLow: 250, twoCleanerHigh: 300 },
  { sqft: 4000, twoCleanerLow: 275, twoCleanerHigh: 330 },
];

function priceFromLadder(ladder: SqftPricePoint[], sqft: number): number {
  if (!ladder.length) return 0;
  const sorted = [...ladder].sort((a, b) => a.uptoSqft - b.uptoSqft);
  for (const tier of sorted) {
    if (sqft <= tier.uptoSqft) return tier.price;
  }
  return sorted[sorted.length - 1].price;
}

export function calculateDeepCleanPrice(sqft: number): number {
  return priceFromLadder(DEEP_CLEAN_LADDER, sqft);
}

export function calculateMoveOutPrice(sqft: number): number {
  return priceFromLadder(MOVE_OUT_LADDER, sqft);
}

export function calculateWindowsSurcharge(windowCount: number): number {
  if (!windowCount || windowCount <= 0) return 0;
  return windowCount * WINDOW_PRICE_PER_WINDOW;
}

export function calculateAdditionalRoomsSurcharge({
  extraBedrooms = 0,
  extraBathrooms = 0,
}: {
  extraBedrooms?: number;
  extraBathrooms?: number;
}): number {
  return Math.max(0, extraBedrooms) * BEDROOM_SURCHARGE + Math.max(0, extraBathrooms) * BATHROOM_SURCHARGE;
}

/**
 * Hourly quote based on the spreadsheet's room-weight model.
 * Kitchen is always counted as 1, plus bedrooms (0.5 each) and
 * bathrooms/other rooms (0.75 each). Minimum 2 hours.
 */
export function calculateHourlyQuote({
  bedrooms = 0,
  bathrooms = 0,
  otherRooms = 0,
  kitchens = 1,
  sqft = 0,
  addWindows = false,
}: {
  bedrooms?: number;
  bathrooms?: number;
  otherRooms?: number;
  kitchens?: number;
  sqft?: number;
  addWindows?: boolean;
}): {
  hours: number;
  cleaners: number;
  ratePerHour: number;
  estimate: number;
  estimateLow: number;
  estimateHigh: number;
} {
  let hours =
    bedrooms * ROOM_HOUR_WEIGHTS.bedroom +
    kitchens * ROOM_HOUR_WEIGHTS.kitchen +
    bathrooms * ROOM_HOUR_WEIGHTS.bathroom +
    otherRooms * ROOM_HOUR_WEIGHTS.other;

  hours = Math.max(2, hours);
  if (addWindows) hours += 1;

  const bracket =
    CLEANER_COUNT_BRACKETS.find((tier) => sqft <= tier.uptoSqft) ??
    CLEANER_COUNT_BRACKETS[CLEANER_COUNT_BRACKETS.length - 1];

  const cleaners = hours > 6 ? Math.max(2, bracket.cleaners) : bracket.cleaners;
  const ratePerHour =
    cleaners >= 2
      ? hours > 6
        ? HOURLY_RATES.twoCleanersAbove6h
        : HOURLY_RATES.twoCleanersBelow6h
      : hours > 6
        ? HOURLY_RATES.oneCleanerAbove6h
        : HOURLY_RATES.oneCleanerBelow6h;

  const estimate = hours * ratePerHour;
  const estimateLow = Math.round(estimate * 0.85);
  const estimateHigh = Math.round(estimate * 1.15);

  return { hours: Math.round(hours * 100) / 100, cleaners, ratePerHour, estimate, estimateLow, estimateHigh };
}

export interface FullQuoteInput {
  serviceType: ServiceType;
  sqft: number;
  bedrooms?: number;
  bathrooms?: number;
  otherRooms?: number;
  kitchens?: number;
  windowCount?: number;
  extraBedrooms?: number;
  extraBathrooms?: number;
  addWindows?: boolean;
}

export interface FullQuoteResult {
  serviceType: ServiceType;
  basePrice: number;
  additionalRoomsSurcharge: number;
  windowsSurcharge: number;
  hourlyEstimate?: ReturnType<typeof calculateHourlyQuote>;
  total: number;
}

export function calculateQuote(input: FullQuoteInput): FullQuoteResult {
  const {
    serviceType,
    sqft,
    bedrooms = 0,
    bathrooms = 0,
    otherRooms = 0,
    kitchens = 1,
    windowCount = 0,
    extraBedrooms = 0,
    extraBathrooms = 0,
    addWindows = false,
  } = input;

  const additionalRoomsSurcharge = calculateAdditionalRoomsSurcharge({ extraBedrooms, extraBathrooms });
  const windowsSurcharge = calculateWindowsSurcharge(windowCount);

  if (serviceType === 'hourly') {
    const hourlyEstimate = calculateHourlyQuote({
      bedrooms,
      bathrooms,
      otherRooms,
      kitchens,
      sqft,
      addWindows,
    });
    return {
      serviceType,
      basePrice: hourlyEstimate.estimate,
      additionalRoomsSurcharge: 0,
      windowsSurcharge: addWindows ? 0 : windowsSurcharge,
      hourlyEstimate,
      total: hourlyEstimate.estimate + (addWindows ? 0 : windowsSurcharge),
    };
  }

  let basePrice = 0;
  if (serviceType === 'deep') basePrice = calculateDeepCleanPrice(sqft);
  else if (serviceType === 'moveout') basePrice = calculateMoveOutPrice(sqft);
  else basePrice = calculateDeepCleanPrice(sqft);

  const total = basePrice + additionalRoomsSurcharge + windowsSurcharge;
  return { serviceType, basePrice, additionalRoomsSurcharge, windowsSurcharge, total };
}
