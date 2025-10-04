/**
 * Pricing Mode Configuration
 * Switch between different pricing calculation engines
 */

export type PricingMode = 'fixed' | 'state' | 'new';

/**
 * Current active pricing mode
 * - 'fixed': Universal flat pricing (same price for all home sizes)
 * - 'state': State-based tiered pricing by square footage
 * - 'new': New hourly-based pricing system
 */
export const PRICING_MODE: PricingMode = 'fixed';
