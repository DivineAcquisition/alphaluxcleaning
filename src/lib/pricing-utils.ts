/**
 * Centralized pricing utilities for consistent currency handling
 */

export interface PriceDisplayOptions {
  showCents?: boolean;
  showCurrency?: boolean;
  prefix?: string;
}

/**
 * Apply 20% discount to price - current promotion
 */
export function applyGlobalDiscount(price: number): number {
  return Math.round(price * 0.8 * 100) / 100; // 20% off, rounded to nearest cent
}

/**
 * Calculate 20% discount amount
 */
export function calculateGlobalDiscountAmount(price: number): number {
  return Math.round(price * 0.2 * 100) / 100; // 20% discount amount
}

/**
 * Convert cents to dollars
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Convert dollars to cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Format price for display (assumes input is in dollars)
 */
export function formatPrice(dollars: number, options: PriceDisplayOptions = {}): string {
  const {
    showCents = true,
    showCurrency = true,
    prefix = '$'
  } = options;

  const formatted = showCents 
    ? dollars.toFixed(2)
    : Math.round(dollars).toString();

  return showCurrency ? `${prefix}${formatted}` : formatted;
}

/**
 * Format price from cents for display
 */
export function formatPriceFromCents(cents: number, options: PriceDisplayOptions = {}): string {
  return formatPrice(centsToDollars(cents), options);
}

/**
 * Calculate payment amount based on type and total
 */
export function calculatePaymentAmount(totalDollars: number, paymentType: 'full' | 'deposit' | 'pay_after_service' | '25_percent_with_discount'): number {
  if (paymentType === 'deposit') {
    return Math.round(totalDollars * 0.3 * 100) / 100; // Round to nearest cent
  }
  if (paymentType === 'pay_after_service') {
    return 0; // No charge now, authorize only
  }
  if (paymentType === '25_percent_with_discount') {
    // Apply 5% discount to total, then calculate 25% of discounted amount
    const discountedTotal = totalDollars * 0.95;
    return Math.round(discountedTotal * 0.25 * 100) / 100;
  }
  return totalDollars;
}

/**
 * Calculate the 5% discount amount
 */
export function calculateDiscountAmount(totalDollars: number): number {
  return Math.round(totalDollars * 0.05 * 100) / 100;
}

/**
 * Calculate the discounted total (95% of original)
 */
export function calculateDiscountedTotal(totalDollars: number): number {
  return Math.round(totalDollars * 0.95 * 100) / 100;
}

/**
 * Ensure amount is in the correct format for Stripe (cents)
 */
export function toStripeAmount(dollars: number): number {
  return dollarsToCents(dollars);
}

/**
 * Ensure amount is in dollars for display
 */
export function toDisplayAmount(amount: number, isInCents: boolean = false): number {
  return isInCents ? centsToDollars(amount) : amount;
}