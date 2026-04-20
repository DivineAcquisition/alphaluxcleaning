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
 * The real discount is always re-computed server-side.
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
