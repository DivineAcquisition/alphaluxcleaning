/**
 * Fixed Flat Pricing System
 * Static pricing that doesn't vary by square footage - same price for all home sizes
 */

// Static flat pricing — "small home" baseline from the 2026-05-02
// profitability review. Kept in sync with the tier table's
// smallest bucket (Up to 1,500 sq ft) so a `PRICING_MODE=fixed`
// override never undercuts the published floor or drops below
// the cost-model threshold.
export const FLAT_PRICING = {
  regular: 225,
  deep: 365,
  moveInOut: 449,
} as const;

// Frequency multipliers for recurring services
// These represent the per-clean rate as a percentage of the monthly price
export const FREQUENCY_MULTIPLIERS = {
  one_time: 1.0,    // Full price for one-time service
  weekly: 0.40,     // 40% per clean × 4 cleans = monthly price
  bi_weekly: 0.55,  // 55% per clean × 2 cleans = monthly price  
  monthly: 0.75     // 75% per clean × 1 clean = monthly price
} as const;

export type ServiceTypeId = 'regular' | 'deep' | 'move_in_out' | 'moveInOut';
export type FrequencyId = 'one_time' | 'weekly' | 'bi_weekly' | 'monthly';

export interface FixedPricingResult {
  basePrice: number;
  monthlyTotal: number;
  finalPrice: number;
  serviceType: string;
  frequency: string;
  perCleanPrice?: number;
  cleansPerMonth?: number;
  isRecurring: boolean;
}

/**
 * Calculate flat pricing - no square footage impact
 */
export function calculateFixedPricing(
  serviceTypeId: string,
  frequencyId: string
): FixedPricingResult {
  // Normalize service type ID
  const normalizedServiceType = serviceTypeId === 'moveInOut' ? 'move_in_out' : serviceTypeId;
  
  // Get base price (flat across all home sizes)
  let basePrice: number;
  if (normalizedServiceType === 'regular') {
    basePrice = FLAT_PRICING.regular;
  } else if (normalizedServiceType === 'deep') {
    basePrice = FLAT_PRICING.deep;
  } else if (normalizedServiceType === 'move_in_out') {
    basePrice = FLAT_PRICING.moveInOut;
  } else {
    console.warn(`Unknown service type: ${serviceTypeId}, defaulting to regular`);
    basePrice = FLAT_PRICING.regular;
  }

  // Get frequency multiplier
  const multiplier = FREQUENCY_MULTIPLIERS[frequencyId as FrequencyId] || FREQUENCY_MULTIPLIERS.one_time;
  
  // Calculate final price
  const isRecurring = frequencyId !== 'one_time';
  const monthlyTotal = basePrice;
  const finalPrice = isRecurring ? monthlyTotal : basePrice * multiplier;

  // Calculate per-clean breakdown for recurring services
  let perCleanPrice: number | undefined;
  let cleansPerMonth: number | undefined;
  
  if (isRecurring) {
    if (frequencyId === 'weekly') cleansPerMonth = 4;
    else if (frequencyId === 'bi_weekly') cleansPerMonth = 2;
    else if (frequencyId === 'monthly') cleansPerMonth = 1;
    
    if (cleansPerMonth) {
      perCleanPrice = finalPrice / cleansPerMonth;
    }
  }

  return {
    basePrice,
    monthlyTotal,
    finalPrice,
    serviceType: normalizedServiceType,
    frequency: frequencyId,
    perCleanPrice,
    cleansPerMonth,
    isRecurring
  };
}

// Service type display names
export const SERVICE_TYPE_NAMES = {
  regular: 'Regular Clean',
  deep: 'Deep Clean',
  move_in_out: 'Move-In/Out Clean'
} as const;

// Frequency display names  
export const FREQUENCY_NAMES = {
  one_time: 'One-Time',
  weekly: 'Weekly',
  bi_weekly: 'Bi-Weekly',
  monthly: 'Monthly'
} as const;
