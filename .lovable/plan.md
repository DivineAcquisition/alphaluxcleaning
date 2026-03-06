

## Plan: Add Detailed Pricing Data to Webhook Payload

### What's Missing

The current webhook sends basic pricing (`price_before_discount`, `price_after_discount`, `deposit_paid`, `balance_due`) but does NOT include the rich `pricing_breakdown` JSONB stored on each booking, nor several booking-level pricing fields that are already in the database.

### What Will Be Added

A new `pricing` object in the webhook `data` payload containing:

| Field | Source | Example |
|---|---|---|
| `base_price` | `bookings.base_price` | 240.00 |
| `est_price` | `bookings.est_price` | 200.00 |
| `deposit_amount` | `bookings.deposit_amount` | 60.00 |
| `balance_due` | `bookings.balance_due` | 140.00 |
| `prepayment_discount_applied` | `bookings.prepayment_discount_applied` | true |
| `prepayment_discount_amount` | `bookings.prepayment_discount_amount` | 40 (cents) |
| `promo_code` | `bookings.promo_code` | "SPRING20" |
| `promo_applied` | `bookings.promo_applied` | "SPRING20" |
| `promo_discount_cents` | `bookings.promo_discount_cents` | 2000 |
| `mrr` | `bookings.mrr` | 200.00 |
| `arr` | `bookings.arr` | 2400.00 |
| `is_recurring` | `bookings.is_recurring` | true |
| `frequency` | `bookings.frequency` | "bi_weekly" |
| `pricing_breakdown` | `bookings.pricing_breakdown` (full JSONB) | `{basePrice, totalPrice, addons, ...}` |
| `addons` | `bookings.addons` (full JSONB) | `[{name, price}, ...]` |
| `addons_total` | Calculated sum | 45.00 |

### Implementation

**Single file change**: `supabase/functions/enhanced-booking-webhook-v2/index.ts`

- Add a `pricing` object to `webhookDataPayload` (around line 336) that pulls all pricing-related fields directly from `bookingData`
- Include the raw `pricing_breakdown` JSONB so downstream systems (GHL/Zapier) get full granularity
- Calculate `addons_total` from the addons array
- Redeploy the edge function

### Existing Fields Retained

The current `offer_details` and `payment` objects remain unchanged for backward compatibility. The new `pricing` object provides the comprehensive breakdown.

