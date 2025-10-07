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
  discount?: number; // Frequency-specific discount: one_time=0, weekly=0.15, bi_weekly=0.10, monthly=0.05
}

export interface StateConfig {
  code: string;
  name: string;
  // No multiplier needed - using universal pricing
}

export interface PricingConfig {
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
    regularPrice: 140,
    deepPrice: 250,
    moveInOutPrice: 265
  },
  {
    id: '1501_2000',
    label: '1,501 – 2,000 sq ft',
    minSqft: 1501,
    maxSqft: 2000,
    bedroomRange: '2–3 BR homes',
    regularPrice: 173,
    deepPrice: 297,
    moveInOutPrice: 315
  },
  {
    id: '2001_2500',
    label: '2,001 – 2,500 sq ft',
    minSqft: 2001,
    maxSqft: 2500,
    bedroomRange: '3 BR homes',
    regularPrice: 206,
    deepPrice: 349,
    moveInOutPrice: 370
  },
  {
    id: '2501_3000',
    label: '2,501 – 3,000 sq ft',
    minSqft: 2501,
    maxSqft: 3000,
    bedroomRange: '3–4 BR homes',
    regularPrice: 238,
    deepPrice: 401,
    moveInOutPrice: 425
  },
  {
    id: '3001_3500',
    label: '3,001 – 3,500 sq ft',
    minSqft: 3001,
    maxSqft: 3500,
    bedroomRange: '4 BR homes',
    regularPrice: 271,
    deepPrice: 453,
    moveInOutPrice: 480
  },
  {
    id: '3501_4000',
    label: '3,501 – 4,000 sq ft',
    minSqft: 3501,
    maxSqft: 4000,
    bedroomRange: '4–5 BR homes',
    regularPrice: 304,
    deepPrice: 505,
    moveInOutPrice: 535
  },
  {
    id: '4001_4500',
    label: '4,001 – 4,500 sq ft',
    minSqft: 4001,
    maxSqft: 4500,
    bedroomRange: '5 BR homes',
    regularPrice: 336,
    deepPrice: 557,
    moveInOutPrice: 590
  },
  {
    id: '4501_5000',
    label: '4,501 – 5,000 sq ft',
    minSqft: 4501,
    maxSqft: 5000,
    bedroomRange: '5+ BR homes',
    regularPrice: 369,
    deepPrice: 609,
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
    { id: 'one_time', name: 'One-time', discount: 0 },
    { id: 'weekly', name: 'Weekly', recurringMultiplier: 0.40, cleansPerMonth: 4, discount: 0.15 },
    { id: 'bi_weekly', name: 'Bi-Weekly', recurringMultiplier: 0.55, cleansPerMonth: 2, discount: 0.10 },
    { id: 'monthly', name: 'Monthly', recurringMultiplier: 0.75, cleansPerMonth: 1, discount: 0.05 }
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

  // Calculate pricing based on frequency
  let finalPrice = basePrice;
  let discountAmount = 0;
  let mrrEstimate = 0;
  let arrEstimate = 0;
  let savings = '';

  // For one-time cleanings: no discount
  if (frequencyId === 'one_time') {
    finalPrice = basePrice;
    discountAmount = 0;
    savings = '';
  } 
  // For recurring cleanings (Regular Clean only): apply frequency-specific discount
  else if (serviceTypeId === 'regular' && frequency.recurringMultiplier && frequency.cleansPerMonth) {
    // Calculate recurring base price
    const recurringBase = basePrice * frequency.recurringMultiplier;
    
    // Apply frequency-specific discount
    const frequencyDiscount = frequency.discount || 0;
    discountAmount = recurringBase * frequencyDiscount;
    finalPrice = recurringBase - discountAmount; // Per clean price after discount
    
    // Calculate MRR and ARR
    mrrEstimate = finalPrice * frequency.cleansPerMonth;
    arrEstimate = mrrEstimate * 12;
    
    // Format savings message
    if (frequencyDiscount > 0) {
      savings = `You save ${(frequencyDiscount * 100).toFixed(0)}% on recurring cleanings! ($${discountAmount.toFixed(2)} off per clean)`;
    }
  }

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