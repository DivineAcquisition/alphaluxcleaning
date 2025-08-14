/**
 * Centralized pricing utilities for consistent currency handling
 */

export interface PriceDisplayOptions {
  showCents?: boolean;
  showCurrency?: boolean;
  prefix?: string;
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
export function calculatePaymentAmount(totalDollars: number, paymentType: 'full' | 'deposit'): number {
  if (paymentType === 'deposit') {
    return Math.round(totalDollars * 0.3 * 100) / 100; // Round to nearest cent
  }
  return totalDollars;
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