/**
 * Promotions Service
 * Handles the 20% first clean discount logic
 */

import { supabase } from '@/integrations/supabase/client';

export interface PromoApplication {
  code: string;
  discountPercent: number;
  discountAmount: number;
  finalPrice: number;
}

/**
 * Apply 20% first clean discount
 */
export async function applyFirst20Discount(
  subtotalCents: number,
  customerEmail: string
): Promise<PromoApplication> {
  // Check if customer has already used the first clean discount
  const { data: customer } = await supabase
    .from('customers')
    .select('first_clean_discount_used')
    .eq('email', customerEmail)
    .maybeSingle();

  if (customer?.first_clean_discount_used) {
    throw new Error('First clean discount already used');
  }

  const discountPercent = 20;
  const discountAmount = Math.round(subtotalCents * 0.20);
  const finalPrice = subtotalCents - discountAmount;

  return {
    code: 'PROMO_FIRST20',
    discountPercent,
    discountAmount,
    finalPrice
  };
}

/**
 * Mark first clean discount as used for a customer
 */
export async function markFirstCleanUsed(customerEmail: string): Promise<void> {
  await supabase
    .from('customers')
    .update({ first_clean_discount_used: true })
    .eq('email', customerEmail);
}

/**
 * Validate that 20% discount can be applied
 */
export async function canApplyFirst20(customerEmail: string): Promise<boolean> {
  const { data: customer } = await supabase
    .from('customers')
    .select('first_clean_discount_used')
    .eq('email', customerEmail)
    .maybeSingle();

  return !customer?.first_clean_discount_used;
}