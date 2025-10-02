/**
 * State-Level Hybrid Pricing System for AlphaLuxClean
 * Supports Texas, California (LA), and New York
 * Automatic 15% discount applied to all services
 */

export type StateCode = 'TX' | 'CA' | 'NY';
export type ServiceType = 'regular' | 'deep' | 'move_in_out';
export type FrequencyType = 'one_time' | 'weekly' | 'bi_weekly' | 'monthly';

export interface PricingTier {
  id: string;
  label: string;
  minSqft: number;
  maxSqft: number;
  regular: number;
  deep: number;
  moveInOut: number;
}

export interface StateConfig {
  code: StateCode;
  name: string;
  displayName: string;
  tiers: PricingTier[];
}

export interface RecurringPricing {
  weeklyPerClean: number;
  weeklyMonthly: number;
  biWeeklyPerClean: number;
  biWeeklyMonthly: number;
  monthlyPerClean: number;
  monthlyMonthly: number;
}

export interface PricingResult {
  state: StateConfig;
  tier: PricingTier;
  serviceType: ServiceType;
  frequency: FrequencyType;
  originalPrice: number;
  discountedPrice: number;
  savings: number;
  recurringDetails?: {
    perClean: number;
    cleansPerMonth: number;
    monthlyTotal: number;
  };
}

export const DISCOUNT_RATE = 0; // No discount

// Texas pricing tiers (baseline: $120)
const TEXAS_TIERS: PricingTier[] = [
  { id: '1000_1500', label: '1,000–1,500 sq ft', minSqft: 1000, maxSqft: 1500, regular: 120, deep: 162, moveInOut: 275 },
  { id: '1501_2000', label: '1,501–2,000 sq ft', minSqft: 1501, maxSqft: 2000, regular: 155, deep: 209, moveInOut: 310 },
  { id: '2001_2500', label: '2,001–2,500 sq ft', minSqft: 2001, maxSqft: 2500, regular: 190, deep: 257, moveInOut: 345 },
  { id: '2501_3000', label: '2,501–3,000 sq ft', minSqft: 2501, maxSqft: 3000, regular: 225, deep: 304, moveInOut: 380 },
  { id: '3001_3500', label: '3,001–3,500 sq ft', minSqft: 3001, maxSqft: 3500, regular: 260, deep: 351, moveInOut: 415 },
  { id: '3501_4000', label: '3,501–4,000 sq ft', minSqft: 3501, maxSqft: 4000, regular: 295, deep: 398, moveInOut: 450 },
  { id: '4001_4500', label: '4,001–4,500 sq ft', minSqft: 4001, maxSqft: 4500, regular: 330, deep: 446, moveInOut: 485 },
  { id: '4501_5000', label: '4,501–5,000 sq ft', minSqft: 4501, maxSqft: 5000, regular: 365, deep: 493, moveInOut: 520 },
  { id: '5000_plus', label: '5,000+ sq ft', minSqft: 5000, maxSqft: 999999, regular: 0, deep: 0, moveInOut: 0 }
];

// California (LA) pricing tiers (baseline: $150)
const CALIFORNIA_TIERS: PricingTier[] = [
  { id: '1000_1500', label: '1,000–1,500 sq ft', minSqft: 1000, maxSqft: 1500, regular: 150, deep: 203, moveInOut: 344 },
  { id: '1501_2000', label: '1,501–2,000 sq ft', minSqft: 1501, maxSqft: 2000, regular: 185, deep: 250, moveInOut: 388 },
  { id: '2001_2500', label: '2,001–2,500 sq ft', minSqft: 2001, maxSqft: 2500, regular: 220, deep: 297, moveInOut: 431 },
  { id: '2501_3000', label: '2,501–3,000 sq ft', minSqft: 2501, maxSqft: 3000, regular: 255, deep: 344, moveInOut: 475 },
  { id: '3001_3500', label: '3,001–3,500 sq ft', minSqft: 3001, maxSqft: 3500, regular: 290, deep: 392, moveInOut: 519 },
  { id: '3501_4000', label: '3,501–4,000 sq ft', minSqft: 3501, maxSqft: 4000, regular: 325, deep: 439, moveInOut: 563 },
  { id: '4001_4500', label: '4,001–4,500 sq ft', minSqft: 4001, maxSqft: 4500, regular: 360, deep: 486, moveInOut: 606 },
  { id: '4501_5000', label: '4,501–5,000 sq ft', minSqft: 4501, maxSqft: 5000, regular: 395, deep: 533, moveInOut: 650 },
  { id: '5000_plus', label: '5,000+ sq ft', minSqft: 5000, maxSqft: 999999, regular: 0, deep: 0, moveInOut: 0 }
];

// New York pricing tiers (baseline: $160)
const NEW_YORK_TIERS: PricingTier[] = [
  { id: '1000_1500', label: '1,000–1,500 sq ft', minSqft: 1000, maxSqft: 1500, regular: 160, deep: 216, moveInOut: 366 },
  { id: '1501_2000', label: '1,501–2,000 sq ft', minSqft: 1501, maxSqft: 2000, regular: 195, deep: 263, moveInOut: 412 },
  { id: '2001_2500', label: '2,001–2,500 sq ft', minSqft: 2001, maxSqft: 2500, regular: 230, deep: 311, moveInOut: 459 },
  { id: '2501_3000', label: '2,501–3,000 sq ft', minSqft: 2501, maxSqft: 3000, regular: 265, deep: 358, moveInOut: 505 },
  { id: '3001_3500', label: '3,001–3,500 sq ft', minSqft: 3001, maxSqft: 3500, regular: 300, deep: 405, moveInOut: 552 },
  { id: '3501_4000', label: '3,501–4,000 sq ft', minSqft: 3501, maxSqft: 4000, regular: 335, deep: 452, moveInOut: 599 },
  { id: '4001_4500', label: '4,001–4,500 sq ft', minSqft: 4001, maxSqft: 4500, regular: 370, deep: 500, moveInOut: 645 },
  { id: '4501_5000', label: '4,501–5,000 sq ft', minSqft: 4501, maxSqft: 5000, regular: 405, deep: 547, moveInOut: 692 },
  { id: '5000_plus', label: '5,000+ sq ft', minSqft: 5000, maxSqft: 999999, regular: 0, deep: 0, moveInOut: 0 }
];

// State configurations
export const STATE_CONFIGS: StateConfig[] = [
  { code: 'TX', name: 'Texas', displayName: 'Texas', tiers: TEXAS_TIERS },
  { code: 'CA', name: 'California', displayName: 'California (LA)', tiers: CALIFORNIA_TIERS },
  { code: 'NY', name: 'New York', displayName: 'New York', tiers: NEW_YORK_TIERS }
];

/**
 * Get state configuration by state code
 */
export function getStateConfig(stateCode: StateCode): StateConfig | null {
  return STATE_CONFIGS.find(s => s.code === stateCode) || null;
}

/**
 * Get pricing tier by state and square footage
 */
export function getPricingTier(stateCode: StateCode, sqft: number): PricingTier | null {
  const state = getStateConfig(stateCode);
  if (!state) return null;
  
  return state.tiers.find(tier => sqft >= tier.minSqft && sqft <= tier.maxSqft) || null;
}

/**
 * Calculate recurring pricing for Regular Clean
 * Weekly: ~40% of one-time × 4/month
 * Bi-Weekly: ~55% of one-time × 2/month
 * Monthly: ~75% of one-time × 1/month
 */
export function calculateRecurringPricing(oneTimePrice: number): RecurringPricing {
  const weeklyPerClean = Math.round(oneTimePrice * 0.40 * 100) / 100;
  const biWeeklyPerClean = Math.round(oneTimePrice * 0.55 * 100) / 100;
  const monthlyPerClean = Math.round(oneTimePrice * 0.75 * 100) / 100;

  return {
    weeklyPerClean,
    weeklyMonthly: Math.round(weeklyPerClean * 4 * 100) / 100,
    biWeeklyPerClean,
    biWeeklyMonthly: Math.round(biWeeklyPerClean * 2 * 100) / 100,
    monthlyPerClean,
    monthlyMonthly: monthlyPerClean
  };
}

/**
 * Apply discount to price (no discount currently applied)
 */
export function applyDiscount(price: number): {
  original: number;
  discounted: number;
  savings: number;
} {
  return {
    original: price,
    discounted: price,
    savings: 0
  };
}

/**
 * Format price with discount display
 */
export function formatPrice(price: number, showOriginal: boolean = true): string {
  const { original, discounted } = applyDiscount(price);
  
  if (showOriginal) {
    return `$${original.toFixed(0)} → $${discounted.toFixed(0)}`;
  }
  
  return `$${discounted.toFixed(0)}`;
}

/**
 * Calculate complete pricing for a service
 */
export function calculatePricing(
  stateCode: StateCode,
  sqft: number,
  serviceType: ServiceType,
  frequency: FrequencyType = 'one_time'
): PricingResult | null {
  const state = getStateConfig(stateCode);
  const tier = getPricingTier(stateCode, sqft);
  
  if (!state || !tier) return null;
  
  // For 5000+ sqft, return custom quote structure
  if (tier.id === '5000_plus') {
    return {
      state,
      tier,
      serviceType,
      frequency,
      originalPrice: 0,
      discountedPrice: 0,
      savings: 0
    };
  }

  // Get base price based on service type
  let basePrice = 0;
  if (serviceType === 'regular') {
    basePrice = tier.regular;
  } else if (serviceType === 'deep') {
    basePrice = tier.deep;
  } else if (serviceType === 'move_in_out') {
    basePrice = tier.moveInOut;
  }

  // Calculate recurring pricing if applicable
  let recurringDetails;
  let finalPrice = basePrice;

  if (serviceType === 'regular' && frequency !== 'one_time') {
    const recurring = calculateRecurringPricing(basePrice);
    
    if (frequency === 'weekly') {
      finalPrice = recurring.weeklyMonthly;
      recurringDetails = {
        perClean: recurring.weeklyPerClean,
        cleansPerMonth: 4,
        monthlyTotal: recurring.weeklyMonthly
      };
    } else if (frequency === 'bi_weekly') {
      finalPrice = recurring.biWeeklyMonthly;
      recurringDetails = {
        perClean: recurring.biWeeklyPerClean,
        cleansPerMonth: 2,
        monthlyTotal: recurring.biWeeklyMonthly
      };
    } else if (frequency === 'monthly') {
      finalPrice = recurring.monthlyMonthly;
      recurringDetails = {
        perClean: recurring.monthlyPerClean,
        cleansPerMonth: 1,
        monthlyTotal: recurring.monthlyMonthly
      };
    }
  }

  // Apply discount (currently 0%)
  const { original, discounted, savings } = applyDiscount(finalPrice);

  return {
    state,
    tier,
    serviceType,
    frequency,
    originalPrice: original,
    discountedPrice: discounted,
    savings,
    recurringDetails: recurringDetails ? {
      ...recurringDetails,
      perClean: applyDiscount(recurringDetails.perClean).discounted,
      monthlyTotal: discounted
    } : undefined
  };
}
