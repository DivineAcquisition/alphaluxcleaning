/**
 * New Pricing System - Based on cleaner pay + multipliers
 * Formula: Base = $25/hr × cleaners × hours × state_multiplier × service_multiplier × frequency_discount
 */

export interface HomeSizeRange {
  id: string;
  label: string;
  minSqft: number;
  maxSqft: number;
  bedroomRange: string;
  requiresEstimate?: boolean;
  // Base prices for each service type
  deepPrice: number;           // Tester Deep Clean price
  maintenancePrice: number;    // Standard maintenance clean price
  ninetyDayPrice: number;      // Pre-calculated 90-Day Plan price (deep + 3 maintenance with bundle discount)
  regularPrice: number;        // Deprecated - kept for compatibility
  moveInOutPrice: number;
}

export interface ServiceTypeConfig {
  id: string;
  name: string;
  allowsRecurring: boolean; // Only Regular Clean allows recurring
}

export interface FrequencyConfig {
  id: string;
  name: string;
  recurringMultiplier?: number; // For recurring: weekly=0.40, bi-weekly=0.55, monthly=0.75
  cleansPerMonth?: number; // weekly=4, bi-weekly=2, monthly=1
  discount?: number; // Frequency-specific discount: one_time=0, weekly=0.15, bi_weekly=0.10, monthly=0.05
}

export interface StateConfig {
  code: string;
  name: string;
  multiplier: number; // TX: 1.0, CA: 1.10, NY: 1.15
}

export interface PricingConfig {
  states: StateConfig[];
  serviceTypes: ServiceTypeConfig[];
  frequencies: FrequencyConfig[];
}

export interface PricingResult {
  basePrice: number; // Original price before discount
  discountAmount: number; // Amount saved with discount
  discountedPrice: number; // Price after discount (deprecated, use finalPrice)
  finalPrice: number; // Price after discount (for one-time or per-clean)
  depositAmount: number; // 25% deposit amount
  mrrEstimate: number; // Monthly recurring revenue (if applicable)
  arrEstimate: number; // Annual recurring revenue (if applicable)
  savings: string; // Formatted savings message
  tierLabel: string; // Home size label
  recurringDetails?: {
    perClean: number;
    cleansPerMonth: number;
    monthlyTotal: number;
  };
}

// Deposit configuration
export const DEPOSIT_PERCENTAGE = 0.25; // 25% deposit required

// Universal Hybrid Pricing Model - Home size ranges with base prices.
// Source of truth: AlphaLux pricing spreadsheet (Deep Clean, Move-Out
// calculators). See `src/lib/alphalux-pricing.ts` for the spreadsheet
// helpers used by the standalone calculator.
//
// NOTE: tier `id`s are deliberately kept stable across code revisions so
// that the value persisted in a customer's localStorage on a previous
// visit still resolves on the next. When the pricing spreadsheet is
// refreshed we update the numbers in place rather than renaming the IDs.
export const HOME_SIZE_RANGES: HomeSizeRange[] = [
  {
    id: '1000_1500',
    label: 'Up to 1,500 sq ft',
    minSqft: 0,
    maxSqft: 1500,
    bedroomRange: 'Studio – 2 BR',
    deepPrice: 275,
    maintenancePrice: 185,
    ninetyDayPrice: 749,
    regularPrice: 185,
    moveInOutPrice: 300,
  },
  {
    id: '1501_2000',
    label: '1,500 – 2,000 sq ft',
    minSqft: 1500,
    maxSqft: 2000,
    bedroomRange: '2–3 BR homes',
    deepPrice: 310,
    maintenancePrice: 210,
    ninetyDayPrice: 829,
    regularPrice: 210,
    moveInOutPrice: 350,
  },
  {
    id: '2001_2500',
    label: '2,000 – 2,500 sq ft',
    minSqft: 2000,
    maxSqft: 2500,
    bedroomRange: '3 BR homes',
    deepPrice: 345,
    maintenancePrice: 235,
    ninetyDayPrice: 949,
    regularPrice: 235,
    moveInOutPrice: 385,
  },
  {
    id: '2501_3000',
    label: '2,500 – 3,000 sq ft',
    minSqft: 2500,
    maxSqft: 3000,
    bedroomRange: '3–4 BR homes',
    deepPrice: 395,
    maintenancePrice: 265,
    ninetyDayPrice: 1099,
    regularPrice: 265,
    moveInOutPrice: 445,
  },
  {
    id: '3001_4000',
    label: '3,000 – 4,000 sq ft',
    minSqft: 3000,
    maxSqft: 4000,
    bedroomRange: '4 BR homes',
    deepPrice: 465,
    maintenancePrice: 300,
    ninetyDayPrice: 1249,
    regularPrice: 300,
    moveInOutPrice: 525,
  },
  {
    id: '4001_5000',
    label: '4,000 – 5,000 sq ft',
    minSqft: 4000,
    maxSqft: 5000,
    bedroomRange: '4–5 BR homes',
    deepPrice: 540,
    maintenancePrice: 340,
    ninetyDayPrice: 1399,
    regularPrice: 340,
    moveInOutPrice: 625,
  },
  {
    id: '5001_plus',
    label: '5,000+ sq ft',
    minSqft: 5000,
    maxSqft: 999999,
    bedroomRange: 'Custom Quote Required - Call (857) 754-4557',
    requiresEstimate: true,
    deepPrice: 620,
    maintenancePrice: 385,
    ninetyDayPrice: 1599,
    regularPrice: 0,
    moveInOutPrice: 0,
  },
];

// Legacy/alias home size IDs map to current tiers so older persisted
// bookingData doesn't blow up `calculateNewPricing`.
const HOME_SIZE_ID_ALIASES: Record<string, string> = {
  under_1100: '1000_1500',
  '1100_1500': '1000_1500',
  '1500_2000': '1501_2000',
  '2000_2200': '2001_2500',
  '2200_2800': '2501_3000',
  '2800_3600': '3001_4000',
  '3600_5000': '4001_5000',
  '3001_3500': '3001_4000',
  '3501_4000': '3001_4000',
  '4001_4500': '4001_5000',
  '4501_5000': '4001_5000',
  '5000_plus': '5001_plus',
};

export function resolveHomeSizeId(id: string | undefined | null): string {
  if (!id) return '2001_2500';
  if (HOME_SIZE_RANGES.some((tier) => tier.id === id)) return id;
  return HOME_SIZE_ID_ALIASES[id] || '2001_2500';
}

// Universal Hybrid Pricing Configuration
// AlphaLux Cleaning only operates in New York State, so the pricing
// system is configured for a single NY multiplier.
export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  states: [
    { code: 'NY', name: 'New York', multiplier: 1.15 }
  ],
  serviceTypes: [
    { id: 'regular', name: 'Standard Cleaning', allowsRecurring: true },
    { id: 'deep', name: 'Deep Cleaning', allowsRecurring: false },
    { id: 'move_in_out', name: 'Move-In/Out Cleaning', allowsRecurring: false }
  ],
  frequencies: [
    { id: 'one_time', name: 'One-time', discount: 0 },
    { id: 'weekly', name: 'Weekly', recurringMultiplier: 1.0, cleansPerMonth: 4, discount: 0.15 },
    { id: 'bi_weekly', name: 'Bi-Weekly', recurringMultiplier: 1.0, cleansPerMonth: 2, discount: 0.10 },
    { id: 'monthly', name: 'Monthly', recurringMultiplier: 1.0, cleansPerMonth: 1, discount: 0.05 }
  ]
};

/**
 * Calculate pricing based on Universal Hybrid Pricing Model
 */
export function calculateNewPricing(
  homeSizeId: string,
  serviceTypeId: string,
  frequencyId: string,
  stateCode: string,
  config: PricingConfig = DEFAULT_PRICING_CONFIG
): PricingResult {
  // Be forgiving with unknown/legacy IDs so we never blank the booking
  // flow because of a stale localStorage value.
  const resolvedHomeSizeId = resolveHomeSizeId(homeSizeId);
  const homeSize = HOME_SIZE_RANGES.find(h => h.id === resolvedHomeSizeId);
  const serviceType = config.serviceTypes.find(s => s.id === serviceTypeId);
  const frequency = config.frequencies.find(f => f.id === frequencyId);
  const state =
    config.states.find(s => s.code === stateCode) || config.states[0];

  if (!homeSize || !serviceType || !frequency || !state) {
    console.warn('[calculateNewPricing] falling back — unknown params', {
      homeSizeId,
      resolvedHomeSizeId,
      serviceTypeId,
      frequencyId,
      stateCode,
    });
    return {
      basePrice: 0,
      discountAmount: 0,
      discountedPrice: 0,
      finalPrice: 0,
      depositAmount: 0,
      mrrEstimate: 0,
      arrEstimate: 0,
      savings: '',
      tierLabel: homeSize?.label || 'Custom',
    };
  }

  // Handle custom quote for 5,000+ sq ft
  if (homeSize.requiresEstimate) {
    return {
      basePrice: 0,
      discountAmount: 0,
      discountedPrice: 0,
      finalPrice: 0,
      depositAmount: 0,
      mrrEstimate: 0,
      arrEstimate: 0,
      savings: 'Custom Quote Required - Call (857) 754-4557',
      tierLabel: homeSize.label
    };
  }

  // Get base price from pricing table based on service type
  let basePrice = 0;
  switch (serviceTypeId) {
    case 'regular':
      basePrice = homeSize.regularPrice;
      break;
    case 'deep':
      basePrice = homeSize.deepPrice;
      break;
    case 'move_in_out':
      basePrice = homeSize.moveInOutPrice;
      break;
    default:
      throw new Error(`Unknown service type: ${serviceTypeId}`);
  }

  // Apply state multiplier
  basePrice = basePrice * state.multiplier;

  // Calculate pricing based on frequency
  let finalPrice = basePrice;
  let discountAmount = 0;
  let mrrEstimate = 0;
  let arrEstimate = 0;
  let savings = '';
  let recurringDetails;

  // For one-time cleanings: apply $50 flat discount
  if (frequencyId === 'one_time') {
    discountAmount = 50;
    finalPrice = basePrice - discountAmount;
    savings = 'Save $50 on your one-time cleaning!';
  }
  // For recurring cleanings (Regular Clean only): apply frequency-specific discount
  else if (serviceTypeId === 'regular' && frequency.cleansPerMonth) {
    // Apply frequency-specific discount
    const frequencyDiscount = frequency.discount || 0;
    discountAmount = basePrice * frequencyDiscount;
    finalPrice = basePrice - discountAmount; // Per clean price after discount
    
    // Calculate MRR and ARR
    mrrEstimate = finalPrice * frequency.cleansPerMonth;
    arrEstimate = mrrEstimate * 12;
    
    recurringDetails = {
      perClean: finalPrice,
      cleansPerMonth: frequency.cleansPerMonth,
      monthlyTotal: mrrEstimate
    };
    
    // Format savings message
    if (frequencyDiscount > 0) {
      savings = `You save ${(frequencyDiscount * 100).toFixed(0)}% on recurring cleanings!`;
    }
  }

  // Calculate deposit (25% of final price)
  const depositAmount = finalPrice * DEPOSIT_PERCENTAGE;

  return {
    basePrice: Math.round(basePrice * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    discountedPrice: Math.round(finalPrice * 100) / 100,
    finalPrice: Math.round(finalPrice * 100) / 100,
    depositAmount: Math.round(depositAmount * 100) / 100,
    mrrEstimate: Math.round(mrrEstimate * 100) / 100,
    arrEstimate: Math.round(arrEstimate * 100) / 100,
    savings,
    tierLabel: homeSize.label,
    recurringDetails
  };
}

/**
 * Get home size by square footage
 */
export function getHomeSizeBySquareFootage(sqft: number): HomeSizeRange | null {
  return HOME_SIZE_RANGES.find(range => sqft >= range.minSqft && sqft <= range.maxSqft) || null;
}

/**
 * Calculate recurring upgrade discount when switching from one-time to recurring
 */
export function calculateRecurringUpgradeDiscount(
  basePrice: number,
  currentFrequency: string,
  newFrequency: string,
  wasOneTime: boolean
): { finalPrice: number; totalDiscount: number; bonusDiscount: number; frequencyDiscount: number } {
  // Bonus 10% discount for upgrading from one-time to recurring
  const bonusDiscount = wasOneTime ? 0.10 : 0;
  
  // Get standard frequency discount
  const frequencyConfig = DEFAULT_PRICING_CONFIG.frequencies.find(f => f.id === newFrequency);
  const frequencyDiscount = frequencyConfig?.discount || 0;
  
  // Stack discounts: frequency + bonus (capped at 25% total)
  const totalDiscount = Math.min(frequencyDiscount + bonusDiscount, 0.25);
  
  const finalPrice = basePrice * (1 - totalDiscount);
  
  return {
    finalPrice: Math.round(finalPrice * 100) / 100,
    totalDiscount,
    bonusDiscount,
    frequencyDiscount
  };
}

/**
 * Format pricing for webhook payload
 */
export function formatPricingForWebhook(
  result: PricingResult,
  homeSizeId: string,
  serviceTypeId: string,
  frequencyId: string
) {
  const homeSize = HOME_SIZE_RANGES.find(h => h.id === homeSizeId);
  const serviceType = DEFAULT_PRICING_CONFIG.serviceTypes.find(s => s.id === serviceTypeId);
  const frequency = DEFAULT_PRICING_CONFIG.frequencies.find(f => f.id === frequencyId);

  return {
    sqft_range: homeSize?.label || '',
    service_type: serviceType?.name || '',
    frequency: frequency?.name || '',
    base_price: result.basePrice,
    discount_amount: result.discountAmount,
    price_final: result.finalPrice,
    mrr_est: result.mrrEstimate,
    arr_est: result.arrEstimate,
    savings: result.savings
  };
}