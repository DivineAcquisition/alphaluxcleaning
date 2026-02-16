

# Deep Check: Post-Square Cleanup and Payment Flow Fixes

## Issues Found

### Critical Issues (Affect Live Payments)

**1. PaymentLinkPage.tsx - Writes to wrong column and shows wrong branding**
- Line 63: Writes `square_payment_id: paymentId` instead of `stripe_payment_intent_id`
- Line 172: Shows "Secure payment powered by Square" instead of Stripe
- This means payments from payment links won't be properly tracked

**2. usePaymentVerification.ts - Checks wrong column**
- Queries `square_payment_id` to verify payment status instead of checking `stripe_payment_intent_id`
- This means verified bookings paid via Stripe could show as "unverified"

### Non-Critical Issues (Dev/Test Tools - Still Reference Square)

**3. DevTestCleanup.tsx** - Queries `square_payment_id` for test bookings; should also check `stripe_payment_intent_id` starting with "test_"

**4. DevTestModeToggle.tsx** - Same issue as above

**5. TestModeBanner.tsx** - Same issue as above

**6. DemoBooking.tsx** - Text says "square_payment_id starting with test_" (cosmetic)

### Legacy Edge Functions (Unused but Deployed)

**7. `create-square-payment` and `create-square-customer` edge functions** still exist in the codebase. They're unused but add confusion.

**8. `get-square-config` edge function** - still deployed (we saw shutdown logs)

**9. `square-webhook` edge function** - still deployed

### Stripe Webhook - Minor Legacy Reference

**10. `stripe-webhook/index.ts`** - Still has `create90DaySubscription` logic (lines 194-283). Since 90-Day Plan is deprecated per earlier changes, this is dead code but won't cause errors.

---

## Proposed Fixes

### File: `src/pages/PaymentLinkPage.tsx`
- Change `square_payment_id: paymentId` to `stripe_payment_intent_id: paymentId`
- Change "Secure payment powered by Square" to "Secure payment powered by Stripe"

### File: `src/hooks/usePaymentVerification.ts`
- Change query from `square_payment_id` to `stripe_payment_intent_id`
- Update all variable references and log messages from "square" to "stripe"

### File: `src/pages/DevTestCleanup.tsx`
- Update interface to use `stripe_payment_intent_id` instead of `square_payment_id`
- Update query filter to check `stripe_payment_intent_id.like.test_%`
- Update delete filter similarly
- Update display label

### File: `src/pages/DevTestModeToggle.tsx`
- Update both queries from `square_payment_id` to `stripe_payment_intent_id`

### File: `src/components/admin/TestModeBanner.tsx`
- Update query from `square_payment_id` to `stripe_payment_intent_id`

### File: `src/pages/DemoBooking.tsx`
- Update text from "square_payment_id" to "stripe_payment_intent_id"

### Edge Functions to Delete
- `supabase/functions/create-square-payment/` - unused legacy
- `supabase/functions/create-square-customer/` - unused legacy
- `supabase/functions/get-square-config/` - unused legacy
- `supabase/functions/square-webhook/` - unused legacy

### No Changes Needed
- `create-payment-intent` edge function - working correctly with Stripe
- `confirm-booking-payment` edge function - correctly uses `stripe_payment_intent_id`
- `stripe-webhook` edge function - working correctly (90-day code is harmless dead code)
- `EmbeddedStripePaymentForm.tsx` - working correctly
- `src/lib/stripe.ts` - working correctly
- Database columns `square_payment_id` and `square_customer_id` - kept for historical data; no schema changes needed

---

## Summary

| Category | Count |
|----------|-------|
| Critical payment flow bugs | 2 |
| Dev tool fixes | 4 |
| Legacy edge functions to delete | 4 |
| Files working correctly | 5+ |

The most important fix is in `PaymentLinkPage.tsx` -- it's writing the Stripe payment ID into the `square_payment_id` column, which means payment link payments aren't being tracked in the correct Stripe column.

