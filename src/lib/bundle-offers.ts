/**
 * Bundle Offer Utilities
 * Manages recurring service + deep clean bundle offers
 */

export interface BundleOffer {
  code: string;
  commitmentMonths: number;
  recurringDiscount: number; // percentage
  freeDeepCleanValue: number; // dollars
  totalSavings: number;
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
}

/**
 * Calculate total savings for bundle offer
 */
export function calculateBundleSavings(
  recurringPrice: number,
  frequency: 'weekly' | 'bi-weekly' | 'monthly',
  commitmentMonths: number = 3
): number {
  // Calculate number of visits over commitment period
  const visitsPerMonth = frequency === 'weekly' ? 4.3 : frequency === 'bi-weekly' ? 2.15 : 1;
  const totalVisits = visitsPerMonth * commitmentMonths;
  
  // 20% discount on each visit
  const recurringDiscount = recurringPrice * 0.20 * totalVisits;
  
  // Free deep clean value
  const freeDeepClean = 355;
  
  return Math.round((recurringDiscount + freeDeepClean) * 100) / 100;
}

/**
 * Generate bundle offer details
 */
export function getBundleOffer(
  recurringPrice: number,
  frequency: 'weekly' | 'bi-weekly' | 'monthly'
): BundleOffer {
  const totalSavings = calculateBundleSavings(recurringPrice, frequency);
  
  return {
    code: 'BUNDLE_3MO_WEEKLY',
    commitmentMonths: 3,
    recurringDiscount: 20,
    freeDeepCleanValue: 355,
    totalSavings,
    frequency
  };
}

/**
 * Generate unique deep clean promo code
 */
export function generateDeepCleanCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'DEEP-CLEAN-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
