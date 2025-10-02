/**
 * Stripe Customer Service
 * Handles Stripe customer creation and metadata management
 */

import { supabase } from '@/integrations/supabase/client';

export interface CustomerInfo {
  email: string;
  name: string;
  phone?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
  };
}

export interface CustomerMetadata {
  recurrence_plan: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'ONE_TIME';
  first_clean_discount_used: 'true' | 'false';
  deep_clean_reward_code?: string;
  deep_clean_reward_expires?: string;
  last_deep_clean_answer?: 'WITHIN_2M' | 'OVER_2M' | 'UNSURE';
  commitment_months?: string;
}

/**
 * Create or retrieve Stripe customer and attach payment method
 */
export async function ensureStripeCustomer(
  customerInfo: CustomerInfo,
  paymentMethodId?: string,
  metadata?: Partial<CustomerMetadata>
): Promise<{ customerId: string; stripeCustomerId: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('create-stripe-customer', {
      body: {
        email: customerInfo.email,
        name: customerInfo.name,
        phone: customerInfo.phone,
        address: customerInfo.address,
        paymentMethodId,
        metadata
      }
    });

    if (error) throw error;

    return {
      customerId: data.customerId,
      stripeCustomerId: data.stripeCustomerId
    };
  } catch (error) {
    console.error('Failed to ensure Stripe customer:', error);
    throw new Error('Failed to create or retrieve Stripe customer');
  }
}

/**
 * Update Stripe customer metadata
 */
export async function updateStripeCustomerMetadata(
  stripeCustomerId: string,
  metadata: Partial<CustomerMetadata>
): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('update-stripe-customer-metadata', {
      body: {
        stripeCustomerId,
        metadata
      }
    });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to update Stripe customer metadata:', error);
    throw new Error('Failed to update customer metadata');
  }
}

/**
 * Attach payment method to Stripe customer
 */
export async function attachPaymentMethod(
  stripeCustomerId: string,
  paymentMethodId: string,
  setAsDefault: boolean = true
): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('attach-payment-method', {
      body: {
        stripeCustomerId,
        paymentMethodId,
        setAsDefault
      }
    });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to attach payment method:', error);
    throw new Error('Failed to attach payment method');
  }
}