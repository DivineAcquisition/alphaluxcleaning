/**
 * Dallas (AlphaLuxClean) Pricing System
 * Structured pricing with automatic 15% discount
 */

export interface DallasPricingTier {
  id: string;
  label: string;
  minSqft: number;
  maxSqft: number;
  regularOneTime: number;
  deepClean: number;
  moveInOut: number;
}

export interface DallasRecurringPricing {
  weeklyPerClean: number;  // ~40% of one-time
  weeklyMonthly: number;    // weekly × 4
  biWeeklyPerClean: number; // ~55% of one-time
  biWeeklyMonthly: number;  // bi-weekly × 2
  monthlyPerClean: number;  // ~75% of one-time
  monthlyMonthly: number;   // monthly × 1
}

export const DALLAS_DISCOUNT_RATE = 0.15; // 15% discount

// Square footage pricing tiers
export const DALLAS_PRICING_TIERS: DallasPricingTier[] = [
  {
    id: '1000_1500',
    label: '1,000–1,500 sq ft',
    minSqft: 1000,
    maxSqft: 1500,
    regularOneTime: 270,
    deepClean: 365,
    moveInOut: 405
  },
  {
    id: '1501_2000',
    label: '1,501–2,000 sq ft',
    minSqft: 1501,
    maxSqft: 2000,
    regularOneTime: 300,
    deepClean: 405,
    moveInOut: 450
  },
  {
    id: '2001_2500',
    label: '2,001–2,500 sq ft',
    minSqft: 2001,
    maxSqft: 2500,
    regularOneTime: 335,
    deepClean: 452,
    moveInOut: 503
  },
  {
    id: '2501_3000',
    label: '2,501–3,000 sq ft',
    minSqft: 2501,
    maxSqft: 3000,
    regularOneTime: 365,
    deepClean: 493,
    moveInOut: 548
  },
  {
    id: '3001_3500',
    label: '3,001–3,500 sq ft',
    minSqft: 3001,
    maxSqft: 3500,
    regularOneTime: 395,
    deepClean: 533,
    moveInOut: 593
  },
  {
    id: '3501_4000',
    label: '3,501–4,000 sq ft',
    minSqft: 3501,
    maxSqft: 4000,
    regularOneTime: 425,
    deepClean: 574,
    moveInOut: 638
  },
  {
    id: '4001_4500',
    label: '4,001–4,500 sq ft',
    minSqft: 4001,
    maxSqft: 4500,
    regularOneTime: 455,
    deepClean: 614,
    moveInOut: 683
  },
  {
    id: '4501_5000',
    label: '4,501–5,000 sq ft',
    minSqft: 4501,
    maxSqft: 5000,
    regularOneTime: 490,
    deepClean: 662,
    moveInOut: 735
  },
  {
    id: '5000_plus',
    label: '5,000+ sq ft',
    minSqft: 5000,
    maxSqft: 999999,
    regularOneTime: 0, // Custom quote
    deepClean: 0,      // Custom quote
    moveInOut: 0       // Custom quote
  }
];

/**
 * Calculate recurring pricing for Regular Clean
 */
export function calculateDallasRecurringPricing(oneTimePrice: number): DallasRecurringPricing {
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
 * Apply 15% discount to price
 */
export function applyDallasDiscount(price: number): {
  original: number;
  discounted: number;
  savings: number;
} {
  const discounted = Math.round(price * (1 - DALLAS_DISCOUNT_RATE) * 100) / 100;
  const savings = Math.round((price - discounted) * 100) / 100;
  
  return {
    original: price,
    discounted,
    savings
  };
}

/**
 * Get pricing tier by square footage
 */
export function getDallasPricingTier(sqft: number): DallasPricingTier | null {
  return DALLAS_PRICING_TIERS.find(tier => sqft >= tier.minSqft && sqft <= tier.maxSqft) || null;
}

/**
 * Format price with discount display
 */
export function formatDallasPrice(price: number, showOriginal: boolean = true): string {
  const { original, discounted } = applyDallasDiscount(price);
  
  if (showOriginal) {
    return `$${original.toFixed(0)} → $${discounted.toFixed(0)}`;
  }
  
  return `$${discounted.toFixed(0)}`;
}

/**
 * Calculate complete pricing for a service
 */
export interface DallasPricingResult {
  tier: DallasPricingTier;
  serviceType: 'regular' | 'deep' | 'move_in_out';
  frequency: 'one_time' | 'weekly' | 'bi_weekly' | 'monthly';
  originalPrice: number;
  discountedPrice: number;
  savings: number;
  recurringDetails?: {
    perClean: number;
    cleansPerMonth: number;
    monthlyTotal: number;
  };
}

export function calculateDallasPricing(
  sqft: number,
  serviceType: 'regular' | 'deep' | 'move_in_out',
  frequency: 'one_time' | 'weekly' | 'bi_weekly' | 'monthly' = 'one_time'
): DallasPricingResult | null {
  const tier = getDallasPricingTier(sqft);
  
  if (!tier) return null;
  
  // For 5000+ sqft, return custom quote structure
  if (tier.id === '5000_plus') {
    return {
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
    basePrice = tier.regularOneTime;
  } else if (serviceType === 'deep') {
    basePrice = tier.deepClean;
  } else if (serviceType === 'move_in_out') {
    basePrice = tier.moveInOut;
  }

  // Calculate recurring pricing if applicable
  let recurringDetails;
  let finalPrice = basePrice;

  if (serviceType === 'regular' && frequency !== 'one_time') {
    const recurring = calculateDallasRecurringPricing(basePrice);
    
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

  // Apply 15% discount
  const { original, discounted, savings } = applyDallasDiscount(finalPrice);

  return {
    tier,
    serviceType,
    frequency,
    originalPrice: original,
    discountedPrice: discounted,
    savings,
    recurringDetails: recurringDetails ? {
      ...recurringDetails,
      perClean: applyDallasDiscount(recurringDetails.perClean).discounted,
      monthlyTotal: discounted
    } : undefined
  };
}
