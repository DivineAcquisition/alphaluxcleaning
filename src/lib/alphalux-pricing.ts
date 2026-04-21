/**
 * AlphaLux Cleaning — canonical pricing calculator.
 *
 * This module encodes the pricing spreadsheet shared on 2026-04-21
 * (tabs: "Price CalculatorSheet1Schedule"). Every formula in this
 * file maps 1:1 to a cell in that sheet so it is easy to cross-
 * reference when the customer refreshes their pricing table.
 *
 * Sections covered:
 *   - Deep Clean flat ladder + per-sqft extrapolation past 1500 sqft
 *   - Move-Out flat ladder + per-sqft extrapolation past 1500 sqft
 *   - Windows surcharge (per window)
 *   - Additional bedrooms / bathrooms surcharges
 *   - Hourly cleaning: sqft -> cleaners bracket, hrs = sqft / 800
 *   - Room-weight formula (bedrooms 0.5, kitchen 1.0, bathroom/other 0.75)
 */

export type ServiceType = 'deep' | 'moveout' | 'hourly' | 'standard';

/* ---------- Deep Clean + Move Out ladders ---------- */

export interface SqftPricePoint {
  uptoSqft: number;
  price: number;
}

/**
 * Deep Clean base ladder. Above 1500 sqft the spreadsheet uses
 * `price = 275 + (sqft - 1500) * 0.10`, so we interpolate linearly
 * from the last anchor point when the home is larger than any listed
 * tier.
 */
export const DEEP_CLEAN_LADDER: SqftPricePoint[] = [
  { uptoSqft: 1100, price: 200 },
  { uptoSqft: 1500, price: 275 },
];

export const DEEP_CLEAN_PER_SQFT_ABOVE_1500 = 0.1;

export const MOVE_OUT_LADDER: SqftPricePoint[] = [
  { uptoSqft: 1100, price: 225 },
  { uptoSqft: 1500, price: 300 },
];

export const MOVE_OUT_PER_SQFT_ABOVE_1500 = 0.1;

/* ---------- Add-on surcharges ---------- */

export const WINDOW_PRICE_PER_WINDOW = 6;
/** Extra windows also add time to hourly jobs — +1 hour. */
export const WINDOWS_ADD_HOURS = 1;

export const BEDROOM_SURCHARGE = 20;
export const BATHROOM_SURCHARGE = 30;

/* ---------- Hourly rates ---------- */

export const HOURLY_RATE_ONE_CLEANER = 50; // Below 6h
export const HOURLY_RATE_ONE_CLEANER_ABOVE_6H = 95;
export const HOURLY_RATE_TWO_CLEANERS = 110; // Below 6h (2 × 55)
export const HOURLY_RATE_TWO_CLEANERS_ABOVE_6H = 160;

/** Range buffer applied to quotes so the customer sees a window. */
export const HOURLY_RANGE_BUFFER = 25;

/** Minimum bookable time for an hourly job. */
export const HOURLY_MIN_HOURS = 2.5;

/**
 * Sqft -> (cleaner count, per-hour rate) brackets. Mirrors the table
 * at the bottom of the spreadsheet.
 */
export interface HourlyBracket {
  uptoSqft: number;
  cleaners: number;
  ratePerHour: number;
}

export const HOURLY_BRACKETS: HourlyBracket[] = [
  { uptoSqft: 1600, cleaners: 1, ratePerHour: 50 },
  { uptoSqft: 2400, cleaners: 2, ratePerHour: 95 },
  { uptoSqft: 3200, cleaners: 3, ratePerHour: 130 },
];

/* ---------- Room weights (hourly room-based quote) ---------- */

export const ROOM_HOUR_WEIGHTS = {
  bedroom: 0.5,
  kitchen: 1.0,
  bathroom: 0.75,
  living: 0.75,
  office: 0.75,
  other: 0.75,
} as const;

/* ---------- Helpers ---------- */

function interpolateLadder(ladder: SqftPricePoint[], sqft: number, perSqftAbove: number): number {
  if (!ladder.length) return 0;
  const sorted = [...ladder].sort((a, b) => a.uptoSqft - b.uptoSqft);
  for (const tier of sorted) {
    if (sqft <= tier.uptoSqft) return tier.price;
  }
  const last = sorted[sorted.length - 1];
  const extra = Math.max(0, sqft - last.uptoSqft) * perSqftAbove;
  return Math.round((last.price + extra) * 100) / 100;
}

export function calculateDeepCleanPrice(sqft: number): number {
  return interpolateLadder(DEEP_CLEAN_LADDER, sqft, DEEP_CLEAN_PER_SQFT_ABOVE_1500);
}

export function calculateMoveOutPrice(sqft: number): number {
  return interpolateLadder(MOVE_OUT_LADDER, sqft, MOVE_OUT_PER_SQFT_ABOVE_1500);
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
  return (
    Math.max(0, extraBedrooms) * BEDROOM_SURCHARGE +
    Math.max(0, extraBathrooms) * BATHROOM_SURCHARGE
  );
}

export function resolveHourlyBracket(sqft: number): HourlyBracket {
  return (
    HOURLY_BRACKETS.find((b) => sqft <= b.uptoSqft) ??
    HOURLY_BRACKETS[HOURLY_BRACKETS.length - 1]
  );
}

/* ---------- Hourly quote ---------- */

export interface HourlyQuoteInput {
  bedrooms?: number;
  bathrooms?: number;
  otherRooms?: number;
  kitchens?: number;
  sqft?: number;
  includeWindows?: boolean;
}

export interface HourlyQuoteResult {
  hours: number;
  cleaners: number;
  ratePerHour: number;
  estimate: number;
  estimateLow: number;
  estimateHigh: number;
}

export function calculateHourlyQuote({
  bedrooms = 0,
  bathrooms = 0,
  otherRooms = 0,
  kitchens = 1,
  sqft = 0,
  includeWindows = false,
}: HourlyQuoteInput): HourlyQuoteResult {
  // Room-weight formula straight from the spreadsheet "Calculation" box.
  let hours =
    bedrooms * ROOM_HOUR_WEIGHTS.bedroom +
    kitchens * ROOM_HOUR_WEIGHTS.kitchen +
    bathrooms * ROOM_HOUR_WEIGHTS.bathroom +
    otherRooms * ROOM_HOUR_WEIGHTS.other;

  // Enforce the 2.5 hr minimum and the "for windows add 1 hr" rule.
  hours = Math.max(HOURLY_MIN_HOURS, hours);
  if (includeWindows) hours += WINDOWS_ADD_HOURS;

  const bracket = resolveHourlyBracket(sqft);

  // If the job will run long (6h+), push into the 2-cleaner pricing so
  // the customer isn't locked into a 10-hour solo clean.
  const over6 = hours > 6;
  const cleaners = over6 ? Math.max(2, bracket.cleaners) : bracket.cleaners;

  let ratePerHour: number;
  if (over6) {
    ratePerHour =
      cleaners >= 2
        ? HOURLY_RATE_TWO_CLEANERS_ABOVE_6H
        : HOURLY_RATE_ONE_CLEANER_ABOVE_6H;
  } else {
    // Default to the sqft-bracket rate ($50 / $95 / $130), matching the
    // bottom table of the spreadsheet. Fall back to 1-cleaner pricing if
    // the bracket is somehow missing.
    ratePerHour = bracket?.ratePerHour ?? HOURLY_RATE_ONE_CLEANER;
  }

  const estimate = Math.round(hours * ratePerHour);
  const estimateLow = Math.max(0, estimate - HOURLY_RANGE_BUFFER);
  const estimateHigh = estimate + HOURLY_RANGE_BUFFER;

  return {
    hours: Math.round(hours * 100) / 100,
    cleaners,
    ratePerHour,
    estimate,
    estimateLow,
    estimateHigh,
  };
}

/* ---------- Unified quote API ---------- */

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
  includeWindows?: boolean;
}

export interface FullQuoteResult {
  serviceType: ServiceType;
  basePrice: number;
  additionalRoomsSurcharge: number;
  windowsSurcharge: number;
  hourlyEstimate?: HourlyQuoteResult;
  total: number;
  totalLow?: number;
  totalHigh?: number;
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
    includeWindows = false,
  } = input;

  const additionalRoomsSurcharge = calculateAdditionalRoomsSurcharge({
    extraBedrooms,
    extraBathrooms,
  });
  const windowsSurcharge = calculateWindowsSurcharge(windowCount);

  if (serviceType === 'hourly' || serviceType === 'standard') {
    const hourlyEstimate = calculateHourlyQuote({
      bedrooms,
      bathrooms,
      otherRooms,
      kitchens,
      sqft,
      includeWindows: includeWindows || windowCount > 0,
    });
    const base = hourlyEstimate.estimate;
    const total = base + windowsSurcharge + additionalRoomsSurcharge;
    return {
      serviceType,
      basePrice: base,
      additionalRoomsSurcharge,
      windowsSurcharge,
      hourlyEstimate,
      total,
      totalLow: Math.max(0, total - HOURLY_RANGE_BUFFER),
      totalHigh: total + HOURLY_RANGE_BUFFER,
    };
  }

  let basePrice = 0;
  if (serviceType === 'deep') basePrice = calculateDeepCleanPrice(sqft);
  else if (serviceType === 'moveout') basePrice = calculateMoveOutPrice(sqft);
  else basePrice = calculateDeepCleanPrice(sqft);

  const total = basePrice + additionalRoomsSurcharge + windowsSurcharge;
  return {
    serviceType,
    basePrice,
    additionalRoomsSurcharge,
    windowsSurcharge,
    total,
  };
}

/* ---------- Public display tables (used by the UI step) ---------- */

export const DEEP_CLEAN_DISPLAY_TABLE = [
  { label: 'Under 1,100 sq ft', sqftMax: 1100, price: 200 },
  { label: '1,100 – 1,500 sq ft', sqftMax: 1500, price: 275 },
  { label: '1,500 – 2,200 sq ft', sqftMax: 2200, price: 345 },
  { label: '2,200 – 3,000 sq ft', sqftMax: 3000, price: 425 },
  { label: '3,000 – 4,000 sq ft', sqftMax: 4000, price: 525 },
  { label: '4,000 – 5,000 sq ft', sqftMax: 5000, price: 625 },
  { label: '5,000+ sq ft', sqftMax: Infinity, price: 725 },
];

export const MOVE_OUT_DISPLAY_TABLE = [
  { label: 'Under 1,100 sq ft', sqftMax: 1100, price: 225 },
  { label: '1,100 – 1,500 sq ft', sqftMax: 1500, price: 300 },
  { label: '1,500 – 2,000 sq ft', sqftMax: 2000, price: 350 },
  { label: '2,000 – 3,000 sq ft', sqftMax: 3000, price: 450 },
  { label: '3,000 – 4,000 sq ft', sqftMax: 4000, price: 550 },
  { label: '4,000 – 5,000 sq ft', sqftMax: 5000, price: 650 },
  { label: '5,000+ sq ft', sqftMax: Infinity, price: 750 },
];

export const HOURLY_DISPLAY_TABLE = [
  { label: 'Up to 1,600 sq ft', cleaners: 1, ratePerHour: 50, hoursHint: '2 – 4 hrs' },
  { label: '1,600 – 2,400 sq ft', cleaners: 2, ratePerHour: 95, hoursHint: '3 – 5 hrs' },
  { label: '2,400 – 3,200 sq ft', cleaners: 3, ratePerHour: 130, hoursHint: '4 – 6 hrs' },
];
