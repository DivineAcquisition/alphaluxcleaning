/**
 * Pricing Psychology Utilities
 * Converts pricing into more appealing formats for higher conversion
 */

import { HOME_SIZE_RANGES } from './new-pricing-system';

export interface PricingBreakdown {
  perClean: number;
  perHour: number;
  perDay: number;
  perWeek: number;
  perMonth: number;
  estimatedHours: number;
  savingsPerYear?: number;
}

/**
 * Calculate estimated hours based on home size
 */
export function getEstimatedHours(homeSizeId: string): number {
  const sizeRange = HOME_SIZE_RANGES.find(range => range.id === homeSizeId);
  
  if (!sizeRange) return 3; // default
  
  // Rough calculation: 1 hour per 500 sqft
  const avgSqft = (sizeRange.minSqft + sizeRange.maxSqft) / 2;
  return Math.max(2, Math.ceil(avgSqft / 500));
}

/**
 * Convert price to multiple display formats
 */
export function calculatePricingBreakdown(
  totalPrice: number,
  frequency: string,
  homeSizeId: string,
  oneTimePrice?: number
): PricingBreakdown {
  const estimatedHours = getEstimatedHours(homeSizeId);
  const perHour = totalPrice / estimatedHours;
  
  let perClean = totalPrice;
  let perDay = 0;
  let perWeek = 0;
  let perMonth = totalPrice;
  let savingsPerYear: number | undefined;
  
  switch (frequency) {
    case 'weekly':
      perClean = totalPrice;
      perDay = totalPrice / 7;
      perWeek = totalPrice;
      perMonth = totalPrice * 4.33; // Average weeks per month
      if (oneTimePrice) {
        savingsPerYear = (oneTimePrice * 52) - (totalPrice * 52);
      }
      break;
    case 'bi_weekly':
      perClean = totalPrice;
      perDay = totalPrice / 14;
      perWeek = totalPrice / 2;
      perMonth = totalPrice * 2.17; // Average bi-weekly per month
      if (oneTimePrice) {
        savingsPerYear = (oneTimePrice * 26) - (totalPrice * 26);
      }
      break;
    case 'monthly':
      perClean = totalPrice;
      perDay = totalPrice / 30;
      perWeek = totalPrice / 4.33;
      perMonth = totalPrice;
      if (oneTimePrice) {
        savingsPerYear = (oneTimePrice * 12) - (totalPrice * 12);
      }
      break;
    case 'one_time':
    default:
      perClean = totalPrice;
      perDay = 0;
      perWeek = 0;
      perMonth = 0;
      break;
  }
  
  return {
    perClean,
    perHour,
    perDay,
    perWeek,
    perMonth,
    estimatedHours,
    savingsPerYear,
  };
}

/**
 * Format price for display with optional comparison
 */
export function formatPriceDisplay(amount: number, format: 'clean' | 'hour' | 'day' | 'week' | 'month'): string {
  const formatted = `$${Math.round(amount)}`;
  
  const labels = {
    clean: '/clean',
    hour: '/hour',
    day: '/day',
    week: '/week',
    month: '/month',
  };
  
  return `${formatted}${labels[format]}`;
}

/**
 * Get promotional message based on frequency
 */
export function getPromotionalMessage(frequency: string, savingsPerYear?: number): string {
  if (frequency === 'one_time') {
    return '✨ First-time customers save 10%';
  }
  
  if (savingsPerYear && savingsPerYear > 0) {
    return `💰 Save $${Math.round(savingsPerYear)}/year with this plan`;
  }
  
  const discounts = {
    weekly: '15%',
    bi_weekly: '10%',
    monthly: '5%',
  };
  
  return `🎯 Save ${discounts[frequency as keyof typeof discounts] || '0%'} with recurring`;
}
