

## Plan: Deduplicate and Restructure Webhook Payload

### Problem

The current `webhookDataPayload` in `enhanced-booking-webhook-v2/index.ts` has significant duplication across its 10 nested objects. Key examples:

| Data Point | Duplicated In |
|---|---|
| frequency | root, `pricing.frequency`, `ltv_metrics.expected_recurring_frequency` |
| is_recurring | `job_details`, `offer_details`, `pricing` |
| base_price / est_price | root (`price_before/after_discount`), `offer_details.base_price`, `pricing.base_price`, `pricing.est_price`, `payment.amount_paid` |
| deposit / balance_due | `offer_details.deposit_paid`, `offer_details.balance_due`, `pricing.deposit_amount`, `pricing.balance_due` |
| service dates | ISO + GHL format duplicated for every date field (6 fields → 12) |
| addons | `pricing.addons` AND `pricing.addons_total` alongside processed addons |
| discount info | root `discount_applied/rate` AND `pricing.prepayment_discount_*` |

### Proposed Clean Structure

Collapse from 10 objects to 6 logical groups with zero duplication:

```text
data
├── booking_id
├── booking_source
├── type (service type)
├── frequency
├── is_recurring
├── sq_ft_range
│
├── customer
│   ├── first_name, last_name, email, phone
│   └── stripe_customer_id
│
├── address
│   ├── street, city, state, zip
│   └── property_type, flooring
│
├── schedule
│   ├── date, time_window (ISO)
│   ├── date_formatted, time_formatted (GHL MM/DD/YYYY)
│   ├── start_datetime, end_datetime
│   ├── est_duration_hours
│   └── recurring_start_date
│
├── pricing
│   ├── base_price, est_price (final)
│   ├── deposit_amount, balance_due, deposit_pct
│   ├── promo_code, promo_discount_cents
│   ├── prepayment_discount_applied, prepayment_discount_amount
│   ├── addons (array), addons_total
│   ├── mrr, arr, expected_ltv, ltv_score
│   └── pricing_breakdown (raw JSONB)
│
├── payment
│   ├── method, status, transaction_id
│   ├── receipt_url, balance_invoice_url
│   └── payment_plan
│
├── job
│   ├── bedrooms, bathrooms
│   ├── notes (special instructions)
│   ├── labor_rate_per_hour, labor_cost_total
│   └── upgraded_from_onetime
│
├── marketing
│   ├── utm_source, utm_campaign, ad_id
│   └── campaign
│
├── referral
│   ├── code, link, incentive, tracking_id
│
└── meta
    ├── origin, environment, version
    └── timestamp
```

### Changes

**Single file**: `supabase/functions/enhanced-booking-webhook-v2/index.ts`

1. **Remove** `offer_details` object entirely (merged into `pricing`)
2. **Remove** `ltv_metrics` object (LTV fields moved into `pricing`)
3. **Merge** `referral_program` → `referral` (shorter key)
4. **Merge** `system_meta` → `meta`
5. **Remove** root-level `discount_applied`, `discount_rate`, `price_before_discount`, `price_after_discount` (all in `pricing`)
6. **Create** `schedule` object from `job_details` date/time fields
7. **Create** `job` object with only non-date job fields (bedrooms, bathrooms, notes, labor)
8. **Remove** duplicate `frequency` and `is_recurring` from nested objects — keep only at root
9. **Move** `stripe_customer_id` into `customer`, remove from `payment`
10. **Move** `property_type` and `flooring` into `address`
11. **Deduplicate** date fields: keep one ISO + one GHL-formatted version per date (not both scattered across objects)

### Backward Compatibility Note

This is a breaking change for any existing Zapier/GHL mappings. After deploying, the Zapier zap field mappings will need to be updated to match the new structure. The GHL webhook will also need remapping.

### Deployment

Redeploy the edge function after editing via `supabase--deploy_edge_functions`.

