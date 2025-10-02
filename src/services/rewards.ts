/**
 * Rewards Service
 * Handles the 30% Deep Clean reward code generation and management
 */

import { supabase } from '@/integrations/supabase/client';
import { addDays } from 'date-fns';

export interface DeepCleanReward {
  code: string;
  expiresAt: Date;
  customerId: string;
}

/**
 * Generate a unique deep clean reward code
 * Format: ALC-DC30-{4-6 upper base36}
 */
function generateRewardCode(): string {
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ALC-DC30-${randomPart}`;
}

/**
 * Issue a 30% Deep Clean reward code
 */
export async function issueDeepClean30Reward(
  customerId: string,
  customerEmail: string,
  frequency: string
): Promise<DeepCleanReward> {
  // Validate frequency is weekly or bi-weekly
  const validFrequencies = ['weekly', 'bi_weekly', 'biweekly'];
  if (!validFrequencies.includes(frequency.toLowerCase().replace('-', '_'))) {
    throw new Error('Reward only available for Weekly or Bi-Weekly plans');
  }

  // Check if customer already has an active reward
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('deep_clean_reward_code, deep_clean_reward_expires')
    .eq('id', customerId)
    .maybeSingle();

  if (existingCustomer?.deep_clean_reward_code && existingCustomer?.deep_clean_reward_expires) {
    const expiryDate = new Date(existingCustomer.deep_clean_reward_expires);
    if (expiryDate > new Date()) {
      // Return existing valid reward
      return {
        code: existingCustomer.deep_clean_reward_code,
        expiresAt: expiryDate,
        customerId
      };
    }
  }

  // Generate new reward code
  const code = generateRewardCode();
  const expiresAt = addDays(new Date(), 90);

  // Create promo code in database
  const { error: promoError } = await supabase
    .from('promo_codes')
    .insert({
      code,
      type: 'percentage',
      amount_cents: 3000, // 30%
      max_redemptions: 1,
      redemptions: 0,
      applies_to: 'ONE_TIME',
      service_type_restriction: 'deep',
      issued_to_customer_id: customerId,
      reward_type: 'DEEP_CLEAN_30',
      expires_at: expiresAt.toISOString(),
      active: true,
      metadata: {
        reward_for: 'recurring_commitment',
        frequency,
        issued_via: 'booking_flow'
      }
    });

  if (promoError) {
    console.error('Failed to create promo code:', promoError);
    throw new Error('Failed to issue reward code');
  }

  // Update customer record
  const { error: customerError } = await supabase
    .from('customers')
    .update({
      deep_clean_reward_code: code,
      deep_clean_reward_expires: expiresAt.toISOString(),
      recurrence_plan: frequency.toUpperCase()
    })
    .eq('id', customerId);

  if (customerError) {
    console.error('Failed to update customer:', customerError);
  }

  return {
    code,
    expiresAt,
    customerId
  };
}

/**
 * Validate a deep clean reward code
 */
export async function validateRewardCode(code: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', code)
    .eq('active', true)
    .maybeSingle();

  if (error || !data) return false;

  // Check expiry
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return false;
  }

  // Check redemptions
  if (data.redemptions >= data.max_redemptions) {
    return false;
  }

  // Check service type restriction
  if (data.service_type_restriction !== 'deep') {
    return false;
  }

  return true;
}

/**
 * Redeem a deep clean reward code
 */
export async function redeemRewardCode(
  code: string,
  bookingId: string,
  customerId: string
): Promise<void> {
  const { data: promo, error: fetchError } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', code)
    .maybeSingle();

  if (fetchError || !promo) {
    throw new Error('Invalid reward code');
  }

  // Validate it's not expired and belongs to customer
  if (promo.issued_to_customer_id !== customerId) {
    throw new Error('This reward code belongs to another customer');
  }

  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    throw new Error('This reward code has expired');
  }

  if (promo.redemptions >= promo.max_redemptions) {
    throw new Error('This reward code has already been used');
  }

  // Increment redemptions
  const { error: updateError } = await supabase
    .from('promo_codes')
    .update({ redemptions: promo.redemptions + 1 })
    .eq('code', code);

  if (updateError) {
    throw new Error('Failed to redeem reward code');
  }

  // Record redemption
  await supabase
    .from('promo_redemptions')
    .insert({
      code,
      customer_id: customerId,
      booking_id: bookingId,
      discount_cents: promo.amount_cents
    });
}