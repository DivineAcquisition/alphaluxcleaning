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
  // Base prices for each service type (before discount)
  regularPrice: number;
  deepPrice: number;
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
}

export interface StateConfig {
  code: string;
  name: string;
  // No multiplier needed - using universal pricing
}

export interface PricingConfig {
  universalDiscount: number; // 15% discount applied to all services
  states: StateConfig[];
  serviceTypes: ServiceTypeConfig[];
  frequencies: FrequencyConfig[];
}

export interface PricingResult {
  basePrice: number; // Original price before discount
  discountAmount: number; // Amount saved with 15% discount
  finalPrice: number; // Price after discount (for one-time or per-clean)
  mrrEstimate: number; // Monthly recurring revenue (if applicable)
  arrEstimate: number; // Annual recurring revenue (if applicable)
  savings: string; // Formatted savings message
}

// Universal Hybrid Pricing Model - Home size ranges with base prices
export const HOME_SIZE_RANGES: HomeSizeRange[] = [
  {
    id: '1000_1500',
    label: '1,000 – 1,500 sq ft',
    minSqft: 1000,
    maxSqft: 1500,
    bedroomRange: '1–2 BR condos/homes',
    regularPrice: 150,
    deepPrice: 240,
    moveInOutPrice: 265
  },
  {
    id: '1501_2000',
    label: '1,501 – 2,000 sq ft',
    minSqft: 1501,
    maxSqft: 2000,
    bedroomRange: '2–3 BR homes',
    regularPrice: 185,
    deepPrice: 285,
    moveInOutPrice: 315
  },
  {
    id: '2001_2500',
    label: '2,001 – 2,500 sq ft',
    minSqft: 2001,
    maxSqft: 2500,
    bedroomRange: '3 BR homes',
    regularPrice: 220,
    deepPrice: 335,
    moveInOutPrice: 370
  },
  {
    id: '2501_3000',
    label: '2,501 – 3,000 sq ft',
    minSqft: 2501,
    maxSqft: 3000,
    bedroomRange: '3–4 BR homes',
    regularPrice: 255,
    deepPrice: 385,
    moveInOutPrice: 425
  },
  {
    id: '3001_3500',
    label: '3,001 – 3,500 sq ft',
    minSqft: 3001,
    maxSqft: 3500,
    bedroomRange: '4 BR homes',
    regularPrice: 290,
    deepPrice: 435,
    moveInOutPrice: 480
  },
  {
    id: '3501_4000',
    label: '3,501 – 4,000 sq ft',
    minSqft: 3501,
    maxSqft: 4000,
    bedroomRange: '4–5 BR homes',
    regularPrice: 325,
    deepPrice: 485,
    moveInOutPrice: 535
  },
  {
    id: '4001_4500',
    label: '4,001 – 4,500 sq ft',
    minSqft: 4001,
    maxSqft: 4500,
    bedroomRange: '5 BR homes',
    regularPrice: 360,
    deepPrice: 535,
    moveInOutPrice: 590
  },
  {
    id: '4501_5000',
    label: '4,501 – 5,000 sq ft',
    minSqft: 4501,
    maxSqft: 5000,
    bedroomRange: '5+ BR homes',
    regularPrice: 395,
    deepPrice: 585,
    moveInOutPrice: 645
  },
  {
    id: '5000_plus',
    label: '5,000+ sq ft',
    minSqft: 5000,
    maxSqft: 999999,
    bedroomRange: 'Custom Quote Required',
    requiresEstimate: true,
    regularPrice: 0,
    deepPrice: 0,
    moveInOutPrice: 0
  }
];

// Universal Hybrid Pricing Configuration
export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  universalDiscount: 0.15, // 15% automatic discount on all services
  states: [
    { code: 'TX', name: 'Texas' },
    { code: 'CA', name: 'California' },
    { code: 'NY', name: 'New York' }
  ],
  serviceTypes: [
    { id: 'regular', name: 'Regular Clean', allowsRecurring: true },
    { id: 'deep', name: 'Deep Cleaning', allowsRecurring: false },
    { id: 'move_in_out', name: 'Move-In/Out Cleaning', allowsRecurring: false }
  ],
  frequencies: [
    { id: 'one_time', name: 'One-time' },
    { id: 'weekly', name: 'Weekly', recurringMultiplier: 0.40, cleansPerMonth: 4 },
    { id: 'bi_weekly', name: 'Bi-Weekly', recurringMultiplier: 0.55, cleansPerMonth: 2 },
    { id: 'monthly', name: 'Monthly', recurringMultiplier: 0.75, cleansPerMonth: 1 }
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
  const homeSize = HOME_SIZE_RANGES.find(h => h.id === homeSizeId);
  const serviceType = config.serviceTypes.find(s => s.id === serviceTypeId);
  const frequency = config.frequencies.find(f => f.id === frequencyId);
  const state = config.states.find(s => s.code === stateCode);

  if (!homeSize || !serviceType || !frequency || !state) {
    throw new Error('Invalid pricing parameters');
  }

  // Handle custom quote for 5,000+ sq ft
  if (homeSize.requiresEstimate) {
    return {
      basePrice: 0,
      discountAmount: 0,
      finalPrice: 0,
      mrrEstimate: 0,
      arrEstimate: 0,
      savings: 'Custom Quote Required'
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

  // Apply 15% universal discount
  const discountAmount = basePrice * config.universalDiscount;
  const discountedPrice = basePrice - discountAmount;

  // Calculate recurring pricing (only for Regular Clean)
  let finalPrice = discountedPrice;
  let mrrEstimate = 0;
  let arrEstimate = 0;

  if (serviceTypeId === 'regular' && frequencyId !== 'one_time' && frequency.recurringMultiplier && frequency.cleansPerMonth) {
    // For recurring: use formula (basePrice × multiplier × cleansPerMonth) with discount
    const recurringBase = basePrice * frequency.recurringMultiplier;
    finalPrice = recurringBase - (recurringBase * config.universalDiscount); // Per clean price after discount
    mrrEstimate = finalPrice * frequency.cleansPerMonth; // Monthly total
    arrEstimate = mrrEstimate * 12; // Annual total
  }

  // Format savings message
  const savings = `You save 15% today! ($${discountAmount.toFixed(2)} off)`;

  return {
    basePrice: Math.round(basePrice * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    finalPrice: Math.round(finalPrice * 100) / 100,
    mrrEstimate: Math.round(mrrEstimate * 100) / 100,
    arrEstimate: Math.round(arrEstimate * 100) / 100,
    savings
  };
}

/**
 * Get home size by square footage
 */
export function getHomeSizeBySquareFootage(sqft: number): HomeSizeRange | null {
  return HOME_SIZE_RANGES.find(range => sqft >= range.minSqft && sqft <= range.maxSqft) || null;
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