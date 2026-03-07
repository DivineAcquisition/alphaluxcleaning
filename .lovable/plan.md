

## Plan: Fix Deep Clean Discount to $25 Flat on Offer Page

### Problem
The Offer page (`src/pages/book/Offer.tsx`) still uses a **20% percentage discount** for deep cleans. This was missed in the previous $25 flat discount update. Chelsea Lynn's booking shows $81.01 off (20% of $242.99) instead of $25.

### Changes

**File: `src/pages/book/Offer.tsx`**

1. **Remove percentage constant** (line 17): Replace `deepCleanDiscount: 0.20` with `deepCleanFlatDiscount: 25`
2. **Fix price calculation** (line 37): Change from `Math.round(baseDeepPrice * (1 - PROMO.deepCleanDiscount))` to `baseDeepPrice - PROMO.deepCleanFlatDiscount`
3. **Update all UI copy** referencing "20% Off" to "$25 Off" (lines 141, 178, 196)
4. **Fix promo savings calculation** (line 115): Change `(baseDeepPrice - deepCleanPrice)` — this will now correctly equal 25

### Result
- Deep clean promo will always be exactly $25 off regardless of home size
- `promoDiscountCents` stored on bookings will be 2500 (not variable percentages)
- Recurring 10% discount remains unchanged
- All UI badges/banners will say "$25 Off" instead of "20% Off"

