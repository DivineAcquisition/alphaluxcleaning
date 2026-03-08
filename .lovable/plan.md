

## Plan: Capture All Missing Data Points in Webhook Payload

### Root Causes

There are **3 distinct problems** causing missing data in the Zapier webhook:

**1. Address is empty on the booking row**
The `create-payment-intent` function saves address to the **customer** table (`address_line1`, `city`, `state`, `postal_code`) but does NOT save it to the **booking** row (which has `address_line1`, `address_line2` columns). The webhook reads from customer, which works — but the customer record created by `create-booking` (legacy flow) stores address in the old `address` column, not `address_line1`. The webhook tries `customer.address_line1 || customer.address` but one is always null depending on which flow created the customer.

**2. Stripe balance invoice URL is never stored**
The `send-balance-invoice` function creates the Stripe invoice and has access to `sentInvoice.hosted_invoice_url` (the customer-facing payment link) but only stores `sentInvoice.id` (the Stripe invoice ID) in the `stripe_balance_invoice_id` column. The webhook then constructs a **Stripe dashboard URL** (admin-only) instead of the customer payment link. Additionally, there's no column to store the hosted URL.

**3. Race condition: webhook fires before invoice exists**
The `confirm-booking-payment` function triggers the webhook AND the balance invoice **simultaneously** (both non-blocking). The webhook fires before the invoice is created, so `stripe_balance_invoice_id` is always null at webhook time.

**4. Missing booking-level fields**
The `create-payment-intent` function doesn't save `service_date`, `time_slot`, `special_instructions`, `property_details`, `addons`, or `source` to the booking. These are available in the booking context but not passed through.

### Changes

**File 1: Database migration** — Add `balance_invoice_url` column to bookings
```sql
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS balance_invoice_url text;
```

**File 2: `supabase/functions/send-balance-invoice/index.ts`**
- Store `sentInvoice.hosted_invoice_url` in the new `balance_invoice_url` column alongside the existing `stripe_balance_invoice_id`
- After successfully storing the invoice, trigger `enhanced-booking-webhook-v2` with a `payment_invoice_created` action so Zapier gets the complete data including the invoice link

**File 3: `supabase/functions/create-payment-intent/index.ts`**
- Add missing fields to the booking insert: `service_date`, `time_slot`, `special_instructions`, `property_details`, `addons`, `source`, `address_line1`, `address_line2`
- These fields are already available in the booking context on the frontend but never passed through

**File 4: `src/pages/book/Checkout.tsx`**
- Add the missing fields to `bookingPayload`: `serviceDate`, `timeSlot`, `specialInstructions`, `propertyDetails`, `addons`, `source`

**File 5: `supabase/functions/enhanced-booking-webhook-v2/index.ts`**
- Update `payment.balance_invoice_url` to read from the new `balance_invoice_url` column (the customer-facing link) instead of constructing a dashboard URL
- Ensure address fallback chain: try `bookingData.address_line1` first, then `customer.address_line1`, then `customer.address`

### Result
- Every booking will have address, service date, property details, and addons stored directly on the booking row
- The customer-facing Stripe invoice payment link will be captured and sent to Zapier
- A second webhook fires after the invoice is created, ensuring Zapier always gets the invoice URL
- No more empty fields in the Zapier payload for live bookings

