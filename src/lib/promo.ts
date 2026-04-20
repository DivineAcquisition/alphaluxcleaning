/**
 * AlphaLux Cleaning — Promotional code constants.
 *
 * Shared by the hero section, navbar banner, booking checkout, and the
 * confirmation / receipt emails so every surface shows the same offer.
 *
 * To change the active promotion, update the values here and (for
 * Supabase-backed promo lookup) the `promo_codes` table / the
 * `promo-system` edge function.
 */
export const NEW_CUSTOMER_PROMO_CODE = "ALC2026";
export const NEW_CUSTOMER_PROMO_PERCENT = 50;
export const NEW_CUSTOMER_PROMO_LABEL =
  `${NEW_CUSTOMER_PROMO_PERCENT}% OFF your first cleaning`;
export const NEW_CUSTOMER_PROMO_DESCRIPTION =
  `New customers save ${NEW_CUSTOMER_PROMO_PERCENT}% on their first AlphaLux Cleaning with code ${NEW_CUSTOMER_PROMO_CODE}.`;

/**
 * Small helper used by checkout flows to compute a preview discount.
 * The real discount is always re-computed and redeemed server-side by
 * the `promo-system` Supabase edge function, which enforces the
 * once-per-customer rule against the `promo_redemptions` table.
 */
export function previewPromoDiscount(subtotal: number): {
  percent: number;
  amount: number;
  total: number;
  code: string;
} {
  const percent = NEW_CUSTOMER_PROMO_PERCENT;
  const amount = Math.max(0, Math.round(subtotal * (percent / 100) * 100) / 100);
  const total = Math.max(0, Math.round((subtotal - amount) * 100) / 100);
  return { percent, amount, total, code: NEW_CUSTOMER_PROMO_CODE };
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
