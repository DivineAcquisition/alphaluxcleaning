/**
 * Two-Tier Pricing System
 * Replaces the complex 108-combination pricing with simple Essential/Premium tiers
 */

interface TierPricingResult {
  basePrice: number;
  discountAmount: number;
  finalPrice: number;
  depositAmount: number;
  tierLabel: string;
  frequencyLabel: string;
  savings?: string;
  annualSavings?: number;
}

// Essential pricing by bedrooms (base prices)
const ESSENTIAL_PRICES: Record<number, number> = {
  1: 139,
  2: 179,
  3: 219,
  4: 259,
  5: 299, // 5+ bedrooms
};

// Premium is 1.75x Essential
const PREMIUM_MULTIPLIER = 1.75;

// Flat deposit for all bookings
const FLAT_DEPOSIT = 49;

// State multipliers
const STATE_MULTIPLIERS: Record<string, number> = {
  TX: 1.0,
  CA: 1.1,
  NY: 1.15,
};

// Frequency discounts (applied to recurring bookings)
const FREQUENCY_DISCOUNTS: Record<string, number> = {
  one_time: 0,
  weekly: 0.15,      // 15% off
  bi_weekly: 0.10,   // 10% off
  monthly: 0.05,     // 5% off
};

/**
 * Calculate tier-based pricing
 */
export function getTierPrice(
  tier: 'essential' | 'premium',
  bedrooms: number,
  stateCode: string,
  frequency: string
): TierPricingResult {
  // Get base essential price
  const essentialBase = ESSENTIAL_PRICES[bedrooms] || ESSENTIAL_PRICES[5];
  
  // Calculate tier price
  const tierBase = tier === 'essential' 
    ? essentialBase 
    : Math.round(essentialBase * PREMIUM_MULTIPLIER);
  
  // Apply state multiplier
  const stateMultiplier = STATE_MULTIPLIERS[stateCode] || 1.0;
  const stateAdjustedPrice = Math.round(tierBase * stateMultiplier);
  
  // Apply frequency discount
  const frequencyDiscount = FREQUENCY_DISCOUNTS[frequency] || 0;
  const discountAmount = Math.round(stateAdjustedPrice * frequencyDiscount);
  const finalPrice = stateAdjustedPrice - discountAmount;
  
  // Calculate annual savings for recurring
  let annualSavings: number | undefined;
  if (frequency !== 'one_time') {
    const cleansPerYear = {
      weekly: 52,
      bi_weekly: 26,
      monthly: 12,
    }[frequency] || 0;
    
    const oneTimePrice = stateAdjustedPrice;
    annualSavings = (oneTimePrice * cleansPerYear) - (finalPrice * cleansPerYear);
  }
  
  // Labels
  const tierLabel = tier === 'premium' ? 'Premium Reset' : 'Essential Clean';
  const frequencyLabels: Record<string, string> = {
    one_time: 'One-Time',
    weekly: 'Weekly',
    bi_weekly: 'Bi-Weekly',
    monthly: 'Monthly',
  };
  const frequencyLabel = frequencyLabels[frequency] || 'One-Time';
  
  // Savings message
  let savings: string | undefined;
  if (frequencyDiscount > 0) {
    savings = `Save ${Math.round(frequencyDiscount * 100)}% with ${frequencyLabel.toLowerCase()} service`;
  }
  
  return {
    basePrice: stateAdjustedPrice,
    discountAmount,
    finalPrice,
    depositAmount: FLAT_DEPOSIT,
    tierLabel,
    frequencyLabel,
    savings,
    annualSavings,
  };
}

/**
 * Get tier pricing for display (no state/frequency discounts)
 */
export function getBaseTierPricing(tier: 'essential' | 'premium', bedrooms: number) {
  const essentialBase = ESSENTIAL_PRICES[bedrooms] || ESSENTIAL_PRICES[5];
  const price = tier === 'essential' 
    ? essentialBase 
    : Math.round(essentialBase * PREMIUM_MULTIPLIER);
  
  return {
    price,
    tierLabel: tier === 'premium' ? 'Premium Reset' : 'Essential Clean',
  };
}

/**
 * Format tier pricing for webhook
 */
export function formatTierPricingForWebhook(
  result: TierPricingResult,
  tier: string,
  bedrooms: number,
  frequency: string,
  stateCode: string
) {
  return {
    tier,
    bedrooms,
    frequency,
    state: stateCode,
    base_price: result.basePrice,
    discount_amount: result.discountAmount,
    final_price: result.finalPrice,
    deposit_amount: result.depositAmount,
    tier_label: result.tierLabel,
    frequency_label: result.frequencyLabel,
    savings_message: result.savings,
    annual_savings: result.annualSavings,
  };
}
