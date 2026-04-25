/**
 * AlphaLux Cleaning — Promotional code constants.
 *
 * To re-enable an automatic new-customer discount, flip
 * `NEW_CUSTOMER_PROMO_ACTIVE` to true and set the percent you want.
 * When `active` is false, every surface that uses `previewPromoDiscount`
 * will render "no discount" and the checkout / confirmation screens
 * won't show a strike-through line for the auto-promo.
 *
 * Specific campaign codes stored in the `promo_codes` table (e.g.
 * `DEEPCLEAN60`) are unaffected — they continue to validate / redeem
 * server-side via the `promo-system` edge function.
 */
export const NEW_CUSTOMER_PROMO_ACTIVE = true;
export const NEW_CUSTOMER_PROMO_CODE = "ALC2026";
export const NEW_CUSTOMER_PROMO_PERCENT = NEW_CUSTOMER_PROMO_ACTIVE ? 50 : 0;
export const NEW_CUSTOMER_PROMO_LABEL = NEW_CUSTOMER_PROMO_ACTIVE
  ? `${NEW_CUSTOMER_PROMO_PERCENT}% OFF your first cleaning`
  : "";
export const NEW_CUSTOMER_PROMO_DESCRIPTION = NEW_CUSTOMER_PROMO_ACTIVE
  ? `New customers save ${NEW_CUSTOMER_PROMO_PERCENT}% on their first AlphaLux Cleaning with code ${NEW_CUSTOMER_PROMO_CODE}.`
  : "";

/**
 * Small helper used by checkout flows to compute a preview discount.
 * Returns a zero-discount result when the auto-promo is turned off so
 * we never show a phantom strike-through price on the confirmation
 * screen.
 */
export function previewPromoDiscount(subtotal: number): {
  percent: number;
  amount: number;
  total: number;
  code: string;
  active: boolean;
} {
  if (!NEW_CUSTOMER_PROMO_ACTIVE || NEW_CUSTOMER_PROMO_PERCENT <= 0) {
    return {
      percent: 0,
      amount: 0,
      total: Math.max(0, Math.round(subtotal * 100) / 100),
      code: NEW_CUSTOMER_PROMO_CODE,
      active: false,
    };
  }
  const percent = NEW_CUSTOMER_PROMO_PERCENT;
  const amount = Math.max(0, Math.round(subtotal * (percent / 100) * 100) / 100);
  const total = Math.max(0, Math.round((subtotal - amount) * 100) / 100);
  return { percent, amount, total, code: NEW_CUSTOMER_PROMO_CODE, active: true };
}

import { supabase } from "@/integrations/supabase/client";

export interface PromoValidationResult {
  valid: boolean;
  code?: string;
  reason?: string;
  already_redeemed?: boolean;
  discount_cents?: number;
  display?: string;
  type?: "FIXED" | "PERCENT";
  percent_off?: number | null;
  once_per_customer?: boolean;
  new_customers_only?: boolean;
}

/**
 * Pre-flight validation (stateless). Use this before the customer
 * submits checkout to show a clear error if they already redeemed the
 * code or if it has expired.
 */
export async function validatePromoForCustomer(params: {
  code: string;
  subtotalCents: number;
  bookingType?: "ONE_TIME" | "RECUR_FIRST" | "ANY";
  customerId?: string | null;
  email?: string | null;
}): Promise<PromoValidationResult> {
  const { code, subtotalCents, bookingType = "ONE_TIME", customerId, email } = params;
  try {
    const { data, error } = await supabase.functions.invoke("promo-system", {
      body: {
        action: "validate",
        code,
        subtotal_cents: subtotalCents,
        booking_type: bookingType,
        customer_id: customerId ?? null,
        email: email ?? null,
      },
    });
    if (error) {
      return { valid: false, reason: error.message ?? "Unable to validate code" };
    }
    return (data ?? { valid: false }) as PromoValidationResult;
  } catch (err) {
    return {
      valid: false,
      reason: err instanceof Error ? err.message : "Unable to validate code",
    };
  }
}
