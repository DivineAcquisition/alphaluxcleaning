/**
 * State-Level Hybrid Pricing System for AlphaLux Cleaning
 * AlphaLux Cleaning only operates in New York State.
 */

export type StateCode = 'NY';
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

// New York pricing tiers (base: $175 regular, $265 deep, $275 move-in/out)
const NEW_YORK_TIERS: PricingTier[] = [
  { id: '1000_1500', label: '1,000–1,500 sq ft', minSqft: 1000, maxSqft: 1500, regular: 175, deep: 265, moveInOut: 275 },
  { id: '1501_2000', label: '1,501–2,000 sq ft', minSqft: 1501, maxSqft: 2000, regular: 205, deep: 305, moveInOut: 310 },
  { id: '2001_2500', label: '2,001–2,500 sq ft', minSqft: 2001, maxSqft: 2500, regular: 235, deep: 345, moveInOut: 345 },
  { id: '2501_3000', label: '2,501–3,000 sq ft', minSqft: 2501, maxSqft: 3000, regular: 265, deep: 385, moveInOut: 380 },
  { id: '3001_3500', label: '3,001–3,500 sq ft', minSqft: 3001, maxSqft: 3500, regular: 295, deep: 425, moveInOut: 415 },
  { id: '3501_4000', label: '3,501–4,000 sq ft', minSqft: 3501, maxSqft: 4000, regular: 325, deep: 465, moveInOut: 450 },
  { id: '4001_4500', label: '4,001–4,500 sq ft', minSqft: 4001, maxSqft: 4500, regular: 355, deep: 505, moveInOut: 485 },
  { id: '4501_5000', label: '4,501–5,000 sq ft', minSqft: 4501, maxSqft: 5000, regular: 385, deep: 545, moveInOut: 520 },
  { id: '5000_plus', label: '5,000+ sq ft', minSqft: 5000, maxSqft: 999999, regular: 0, deep: 0, moveInOut: 0 }
];

// State configurations — New York only.
export const STATE_CONFIGS: StateConfig[] = [
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
 * Format price as currency
 */
export function formatPrice(price: number | undefined | null, showOriginal: boolean = true): string {
  if (price === undefined || price === null || isNaN(price)) {
    return '$0';
  }
  return `$${price.toFixed(0)}`;
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
