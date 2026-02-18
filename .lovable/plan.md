

# Replace Expired New Year Promo with "New Customer Special"

## What's Changing

The New Year Special ($50 off deep clean + 15% off recurring, "Book by Jan 7th") is expired and needs to be replaced across the entire booking funnel and pricing page. We'll replace it with an evergreen **"New Customer Special"** promotion that aligns with the existing discount structure already used elsewhere in the app:

- **20% OFF** first Deep Clean (one-time)
- **10% OFF** first Standard/Recurring Clean

This matches the discounts already shown on the landing page hero section and in other components like `PriceTeaserBanner`, `PricingSummaryCard`, and `PromotionalBanner`.

---

## Files to Update

### 1. `src/pages/book/Zip.tsx` (Booking Entry Page)
- Replace headline "New Year Special: $50 Off Your First Clean + 15% Off Recurring Service" with "New Customer Special: 20% OFF Your First Deep Clean"
- Remove "Book by Jan 7th" deadline text
- Replace "claim your New Year discount" with "claim your new customer discount"

### 2. `src/pages/book/Offer.tsx` (Service Selection Page)
- Replace `NEW_YEAR_PROMO` config with a new `PROMO` config:
  - Deep clean: 20% off (calculated from base price) instead of flat $50 off
  - Recurring: 10% off instead of 15% off
- Update promo code from `NEWYEAR2025` to `WELCOME2025`
- Replace the gold/navy "New Year Special" sticky banner with a clean primary-themed "New Customer Special" banner
- Update all badge text, headings, and copy (remove "New Year", "Jan 7th", "Start 2025")
- Update offer card labels ("20% Off -- New Customer Special" instead of "$50 Off -- New Year Special")

### 3. `src/pages/book/Checkout.tsx` (Payment Page)
- Replace the gold/navy New Year banner with a primary-themed "New Customer Special" banner
- Update heading from "Your New Year Discount is Applied!" to "Your Discount is Applied!"
- Update the discount display label from "New Year Special" to "New Customer Special"
- Remove "Book by Jan 7th" from the subtext

### 4. `src/pages/Pricing.tsx` (Public Pricing Page)
- Replace the "$50 OFF" flat discount with percentage-based discounts matching the booking flow:
  - Standard Clean: 10% OFF (first booking)
  - Deep Clean: 20% OFF (first booking)
  - Move-In/Out: 20% OFF (first booking)
- Update banner text from "$50 Off One-Time Cleanings" to "New Customer Special: Up to 20% OFF Your First Cleaning"
- Update the Helmet meta description accordingly

### 5. `src/components/landing/HeroSection.tsx`
- Already shows "10% OFF Standard / 20% OFF Deep" -- no changes needed (already correct)

### 6. `src/components/booking/PromotionalBanner.tsx`
- Already shows "20% OFF" new customer special -- no changes needed

---

## Technical Details

### New Promo Config (Offer.tsx)
```typescript
const PROMO = {
  deepCleanDiscount: 0.20, // 20% off first deep clean
  recurringDiscount: 0.10, // 10% off recurring service
};

// Pricing calculations
const deepCleanPrice = Math.round(baseDeepPrice * (1 - PROMO.deepCleanDiscount));
const recurringPrice = Math.round(maintenancePrice * (1 - PROMO.recurringDiscount));
```

### Pricing Page Discount Logic
```typescript
// Replace flat $50 off with percentage-based
const regularDiscounted = Math.round(tier.regular * 0.90); // 10% off
const deepDiscounted = Math.round(tier.deep * 0.80);       // 20% off
const moveInOutDiscounted = Math.round(tier.moveInOut * 0.80); // 20% off
```

### Visual Style Change
- Remove gold/navy holiday theme (`hsl(45,93%,47%)` / `hsl(220,50%,15%)`)
- Use standard primary theme colors consistent with the rest of the app

### No Changes Needed
- `HeroSection.tsx` -- already shows correct percentages
- `PromotionalBanner.tsx` -- already shows "20% OFF" new customer special
- `QuickBenefitsBar.tsx` -- already shows "20% OFF first deep clean"
- `PriceTeaserBanner.tsx` -- already uses percentage-based pricing
- Edge functions / backend -- no promo logic changes needed
