# Selestial Booking Hub

> **Purpose**: This document is the canonical reference for reverse-engineering the AlphaLuxClean booking flow into a new app called **Selestial** — a closed-calendar booking system with a dedicated link and embeddable widget component.
>
> Every section maps a concrete piece of the existing system (routes, state, pricing, edge functions, database tables) so you can reconstruct it stack-by-stack.

---

## Table of Contents

1. [Flow Overview — The 6-Step Funnel](#1-flow-overview--the-6-step-funnel)
2. [State Management (BookingContext)](#2-state-management-bookingcontext)
3. [Pricing Logic](#3-pricing-logic)
4. [Visual Layout Per Page](#4-visual-layout-per-page)
5. [Backend Architecture — Edge Functions](#5-backend-architecture--edge-functions)
6. [Database Schema](#6-database-schema)
7. [Closed Calendar System](#7-closed-calendar-system)
8. [Embed Component Blueprint](#8-embed-component-blueprint)

---

## 1. Flow Overview — The 6-Step Funnel

The user journey is a **strict, sequential funnel**. Each route checks for the prior step's data and redirects backward if missing.

| # | Route | Purpose | Captures | Persists To |
|---|-------|---------|----------|-------------|
| 1 | `/book/zip` | ZIP validation + lead capture | zip, city, state, first/last name, email, phone | `partial_bookings` + `BookingContext` |
| 2 | `/book/sqft` | Home size selection | bedrooms, sqft bucket, homeSizeId | `BookingContext` |
| 3 | `/book/offer` | Offer card selection | offerType, offerName, basePrice, visitCount, isRecurring | `BookingContext` |
| 4 | `/book/checkout` | Stripe Payment Element (25% deposit) | paymentIntentId, customerId, bookingId | `customers` + `bookings` (server-side) |
| 5 | `/book/details` | Post-payment address + schedule | address_line1/2, city, state, zip, service_date, time_slot, special_instructions | `bookings` (via `save-booking-details`) |
| 6 | `/book/confirmation` | Receipt + reward summary | (read-only) | — |

### Redirects & Guards

- `/book/schedule` → **redirects to** `/book/details` (legacy alias)
- `/book/confirmation` mounts a **routing guard**: if `payment_status === 'deposit_paid'` but `address_line1` or `service_date` is null → redirect to `/book/details?booking_id=<id>`
- Every step checks `BookingContext` for required prior fields; missing data → bounce to earliest incomplete step

### Visual Flow

See [`selestial-booking-flow.mmd`](./selestial-booking-flow.mmd) for the full Mermaid diagram.

---

## 2. State Management (BookingContext)

**File**: `src/contexts/BookingContext.tsx`

A single React context wraps the entire `/book/*` route tree. It mirrors itself to **localStorage** (key `alphalux-booking-flow`) on every change, so refreshes never lose progress.

### `BookingData` Shape

```ts
interface BookingData {
  // Step 1: ZIP
  zipCode: string;
  city: string;
  state: string;            // 'TX' | 'CA' | 'NY' | ...

  // Step 2: Home Size
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  homeSizeId?: string;      // '2001_2500' | '5000_plus' | ...
  homeType: 'house' | 'apartment' | 'condo';

  // Step 3: Offer
  offerType?: 'tester_deep_clean' | '90_day_plan' | 'standard_clean' | 'deep_clean' | 'recurring';
  offerName?: string;
  basePrice?: number;       // dollars
  visitCount?: number;
  isRecurring?: boolean;

  // Promo
  promoCode?: string;
  promoDiscount?: number;

  // Service (locked in this flow)
  serviceType: 'regular' | 'deep' | 'move_in_out';   // default 'deep'
  frequency: 'one_time' | 'weekly' | 'bi_weekly' | 'monthly';

  // Step 5: Schedule (post-payment)
  date: string;
  timeSlot: string;
  bookingExpiresAt?: number;

  // Contact
  contactInfo: ContactInfo;
  specialInstructions: string;
  joinMembership: boolean;
}
```

### Key Rules

1. **Persistence**: `useEffect` writes the entire `bookingData` to `localStorage` on every change.
2. **Hydration**: On mount, the provider reads `localStorage` and merges with `defaultBookingData`.
3. **Dynamic deposit**: `depositAmount = Math.round(basePrice * 0.25)` — always 25% of the selected offer's price.
4. **Pricing recalculation skip rule**: If `offerType` is set, the auto-pricing engine **does not** recalculate (offers carry pre-calculated bundle/promo pricing). This prevents the `WELCOME2025` bundle price from being overwritten by the standard pricing engine.
5. **Clear**: `clearBookingData()` resets state and removes the localStorage key — called only after successful confirmation.

---

## 3. Pricing Logic

**File**: `src/lib/new-pricing-system.ts`

### Home Size Buckets (`HOME_SIZE_RANGES`)

| ID | Sqft Range |
|----|------------|
| `1000_1500` | 1,000–1,500 |
| `1501_2000` | 1,501–2,000 |
| `2001_2500` | 2,001–2,500 (default) |
| `2501_3000` | 2,501–3,000 |
| `3001_3500` | 3,001–3,500 |
| `3501_4000` | 3,501–4,000 |
| `4001_4500` | 4,001–4,500 |
| `4501_5000` | 4,501–5,000 |
| `5000_plus` | 5,000+ |

Bedroom-to-bucket fallback (when sqft unknown): 1bd→1000_1500, 2bd→1501_2000, 3bd→2001_2500, 4bd→2501_3000, 5+→3001_3500.

### State Multipliers

| State | Multiplier | Notes |
|-------|------------|-------|
| TX    | 1.20×      | Texas premium positioning |
| CA    | 1.10×      | California baseline |
| NY    | 1.15×      | New York urban premium |

### Service Multipliers

- Regular: 1.0×
- **Deep clean: 1.4×** (default for this funnel)
- Move in/out: 1.5×

### Recurring Discounts

| Frequency | Discount |
|-----------|----------|
| Weekly | 15% |
| Bi-weekly | 10% |
| Monthly | 5% |
| One-time | 0% |

### Promotional Bundles

- **`WELCOME2025`**: $25 flat off Deep Clean OR 10% off recurring services
- **30% Deep Clean reward**: Issued via `ALC-DC30-XXXXXX` codes when user opts into 2-month commitment bundle (`mem://marketing/promotions/new-customer-special`)

### Deposit Rule

```ts
const DEPOSIT_PERCENTAGE = 0.25;
depositAmount = Math.round(basePrice * 0.25);
balanceDue = basePrice - depositAmount;
```

The 75% balance is invoiced via Stripe immediately after deposit succeeds (see §5).

---

## 4. Visual Layout Per Page

All pages share:
- **Header**: `<Navigation mode="minimal" />` — only brand logo, no nav links
- **Progress bar**: `<BookingProgressBar />` — shows current step + persistent CTA `Call 972-559-0223`
- **Sidebar (desktop ≥`lg`)**: `<BookingSummaryCard />` (steps 2+) — sticky on right column
- **Trust elements**: Google Guaranteed badge, reviews widget, before/after carousel
- **Theme**: Semantic HSL tokens from `index.css` — never raw colors

### Page-by-Page

#### `/book/zip` — Lead Capture
- **Hero**: "Get an instant quote in 60 seconds"
- **Phase 1**: ZIP input → calls `validate-zip` → shows city/state confirmation
- **Phase 2**: First/last name + email + phone form
- **Footer trust row**: Stars · "10,000+ cleans" · Google Guaranteed badge
- **Submit**: Fires `emit-lead-webhook` → GHL/Zapier (`mem://integrations/lead-capture-webhooks`)

#### `/book/sqft` — Home Size
- **Header**: "How big is your home?"
- **Bedroom chips** (1·2·3·4·5+) with **sqft bucket toggle** below
- Live price preview updates as user picks (uses `calculatePricing()`)

#### `/book/offer` — Offer Cards
3 stacked cards (mobile) / 3-column grid (desktop):
1. **Tester Deep Clean** — single discounted intro
2. **Deep Clean + 90-Day Plan** — bundle with reward code
3. **Standard Deep Clean** — full price, no recurring

Each card shows: price, what's included, "Best Value" badge, CTA button.

#### `/book/checkout` — Stripe
- **Layout**: 2 columns desktop — left: Stripe `<PaymentElement />`, right: order summary
- **Trust badges**: "Secure Payment" · "48-Hr Refund" · "No Hidden Fees" · "5-Star Service" (`mem://design/checkout-trust-messaging`)
- **Payment**: Charges 25% deposit only; sets up customer for balance invoice
- `return_url = window.location.href` (3DS-safe — `mem://integrations/stripe-3ds-redirect-logic`)

#### `/book/details` — Address & Schedule (Post-Payment)
- **Banner**: "Payment received! Just a few more details."
- **Address form**: line1, line2, city (autofilled), state (autofilled), ZIP (locked)
- **Calendar**: Closed-system slot picker (see §7)
- **Notes textarea**: special_instructions
- **Submit**: Calls `save-booking-details` → marks booking `confirmed`

#### `/book/confirmation` — Receipt
- **Hero**: "Your clean is booked!"
- **Receipt card**: Service date, time window, address, deposit paid, balance due
- **Reward summary card** (if bundle): displays `ALC-DC30-XXXXXX` code + expiry
- **Next steps**: SMS confirmation note, contact info, "Add to calendar" button

### ASCII Wireframe (Checkout — the most complex page)

```
┌─────────────────────────────────────────────────────────────┐
│  [LOGO]                                  Call 972-559-0223  │ Navigation (minimal)
├─────────────────────────────────────────────────────────────┤
│  [●──●──●──○──○──○]  Step 4 of 6                            │ ProgressBar
├──────────────────────────────────────┬──────────────────────┤
│                                      │  ORDER SUMMARY       │
│  Complete Your Booking               │  ─────────────       │
│                                      │  Deep Clean (3BR)    │
│  ┌────────────────────────────────┐  │  $360.00             │
│  │ Card number                    │  │  Promo: -$25         │
│  │ [4242 4242 4242 4242        ]  │  │  ─────────────       │
│  │ Exp [MM/YY]   CVC [___]        │  │  Total: $335.00      │
│  │ ZIP [_____]                    │  │  Today (25%): $83.75 │
│  └────────────────────────────────┘  │  Balance:    $251.25 │
│                                      │                      │
│  [Pay $83.75 deposit]                │  ✓ Secure  ✓ 48h ref │
│                                      │  ✓ No fees ✓ 5-star  │
│  Google Guaranteed · 4.9★ · 10k+     │                      │
└──────────────────────────────────────┴──────────────────────┘
```

---

## 5. Backend Architecture — Edge Functions

All functions live in `supabase/functions/`. They are stateless, use the **service role** to bypass RLS where needed, and CORS-wrap every response.

### Function Chain

```
USER ACTION                    EDGE FUNCTION                  SIDE EFFECTS
───────────────                ─────────────────              ─────────────
Submit ZIP        ─────────►   validate-zip                   Returns city/state
Submit lead form  ─────────►   emit-lead-webhook              POST → GHL + Zapier
Click "Pay"       ─────────►   create-payment-intent          Upserts customer +
                                                              creates booking row
                                                              Returns clientSecret
Stripe completes  ─────────►   stripe-webhook                 Sets payment_status,
   (server-side)               (payment_intent.succeeded)     triggers balance invoice
Stripe confirms   ─────────►   confirm-booking-payment        Idempotent: same as
   (client-side)                                              webhook, but client-driven
Submit details    ─────────►   save-booking-details           Writes address +
                                                              schedule to bookings
After confirm     ─────────►   send-balance-invoice           Stripe invoice for
   (auto)                                                     remaining 75%
After confirm     ─────────►   enhanced-booking-webhook-v2    GHL contact sync +
   (auto)                                                     Zapier order webhook
```

### Race Condition (resolved)

The Stripe webhook and the client-side `confirm-booking-payment` race to confirm. Both paths now:
1. Update the booking to `confirmed` / `deposit_paid`
2. **Check** `stripe_balance_invoice_id` before sending the balance invoice (idempotency guard)
3. Trigger `send-balance-invoice` only if the field is null

This was the bug fixed in the most recent iteration. (`mem://integrations/stripe-balance-invoicing`)

### Key Function Signatures

#### `create-payment-intent`
```ts
POST { 
  amount: number,           // cents
  email: string,
  fullName: string,
  phone: string,
  basePrice: number,
  balanceDue: number,
  bookingPayload: { ... }   // full BookingData snapshot
}
→ { clientSecret, paymentIntentId, bookingId, customerId }
```

#### `save-booking-details`
```ts
POST {
  bookingId: string,
  addressLine1, addressLine2, city, state, zipCode,
  serviceDate: 'YYYY-MM-DD',
  timeSlot: '8am-12pm' | '12pm-4pm' | ...,
  specialInstructions?: string
}
→ { success: true }
// Updates: bookings + customers; re-fires enhanced-booking-webhook-v2
```

#### `send-balance-invoice`
```ts
POST { bookingId: string, daysUntilDue?: number }
→ { invoiceId, invoiceUrl }
// Idempotent — checks bookings.stripe_balance_invoice_id first
```

---

## 6. Database Schema

### Core Tables

#### `customers`
- `id`, `email` (unique), `first_name`, `last_name`, `phone`
- `address_line1`, `address_line2`, `city`, `state`, `postal_code`
- `stripe_customer_id`, `square_customer_id`
- `referral_code`, `deep_clean_reward_code`, `deep_clean_reward_expires`
- `first_clean_discount_used` (boolean — gates `WELCOME2025`)

#### `bookings`
The order. Key fields:
- **Identity**: `id`, `customer_id` (FK), `created_at`
- **Service**: `service_type`, `frequency`, `home_size`, `sqft_or_bedrooms`
- **Money**: `base_price`, `deposit_amount`, `balance_due`, `est_price`, `pricing_breakdown` (jsonb)
- **Status**: `status` (enum), `payment_status` ('deposit_paid' | 'paid_in_full'), `paid_at`
- **Schedule**: `service_date`, `time_slot`, `preferred_date`, `preferred_time_block`, `service_time_window`
- **Address**: `address_line1`, `address_line2`, `zip_code`
- **Stripe**: `stripe_payment_intent_id`, `stripe_subscription_id`, `stripe_balance_invoice_id`, `balance_invoice_url`
- **Promo**: `promo_code`, `promo_discount_cents`, `reward_code_issued`
- **Recurring**: `is_recurring`, `parent_recurring_service_id`, `commitment_months`
- **Integrations**: `ghl_contact_id`, `hcp_job_id`, `housecall_job_id`
- **Attribution**: `utms` (jsonb), `source`, `source_channel`, `referrer_code`

#### `partial_bookings`
Abandoned funnel tracking (`mem://features/abandoned-checkout-recovery-system`):
- `email`, `phone`, `first_name`, `last_name`
- `last_step` ('lead_captured' | 'sqft_selected' | ...)
- `email_sent_1h`, `email_sent_24h` (recovery flags)
- `converted_booking_id` (set when funnel completes)

#### `availability_schedule`
The closed calendar (see §7):
- `date`, `time_slot`, `zip_code`
- `available_slots` (default 10), `booked_slots` (default 0)
- `active` (boolean)

---

## 7. Closed Calendar System

This is the **core of Selestial** — a closed, slot-based availability system instead of an open calendar (Google Calendar / Calendly style).

### Why Closed?

- You control capacity per ZIP per day per time block
- No double-booking — slot count is decremented atomically on confirmation
- Works for any team-based service (cleaning, lawn care, install techs)

### Schema

```sql
CREATE TABLE availability_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  time_slot text NOT NULL,        -- e.g. '8am-12pm', '12pm-4pm', '4pm-8pm'
  zip_code text,                   -- nullable = applies to all ZIPs
  available_slots integer NOT NULL DEFAULT 10,
  booked_slots integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### Read Side — Public Availability API

Three edge functions answer "what's open?":

- **`get-available-slots`** — returns all open slots for a date range + ZIP
- **`get-live-availability`** — same, but cache-busted for real-time UI
- **`check-calendar-availability`** — single (date, slot) → boolean

These are **anonymous-readable** via RLS policy `Allow public read access to availability` (`active = true`).

### Write Side — Slot Decrement

When `save-booking-details` runs, it should atomically:
```sql
UPDATE availability_schedule
SET booked_slots = booked_slots + 1,
    updated_at = now()
WHERE date = $1 AND time_slot = $2
  AND (zip_code = $3 OR zip_code IS NULL)
  AND booked_slots < available_slots
RETURNING *;
```

If 0 rows return, slot was lost to a race — bounce user back to picker with toast.

### Admin Seeding

Admins seed availability via the admin panel — typically:
- Generate slots 90 days out
- 3 time blocks per day (8a-12p, 12p-4p, 4p-8p)
- 10 slots per block per ZIP

### Selestial Reuse Pattern

Expose two **public read endpoints** for embed consumers:
```
GET /api/availability?zip=77001&from=2026-04-20&to=2026-05-20
GET /api/availability/check?date=2026-04-25&slot=8am-12pm&zip=77001
```

And one **authenticated write** triggered by the booking submit:
```
POST /api/bookings (server-side: decrement slot + create booking in one tx)
```

---

## 8. Embed Component Blueprint

The vision: ship Selestial as a one-line `<script>` tag that any cleaning/service company can drop on their site.

### Architecture

```
┌─────────────────────────────────┐
│ Customer's website              │
│  <script src=".../embed.js" />  │
│  <div data-selestial-book />    │
│           │                     │
│           ▼ (renders)           │
│  ┌─────────────────────────┐    │
│  │  <iframe src="…/embed/  │    │
│  │   book?zip=77001"/>     │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
        │
        │ postMessage events
        ▼
   {type:'height', value:1200}
   {type:'booking_completed', bookingId, total}
```

### Dedicated Route: `/embed/book`

A stripped-down version of `/book/zip` that:
- Uses `<Navigation mode="minimal" />` — no header, no footer
- Removes all marketing chrome (testimonial carousels, blog links)
- Keeps the 6-step funnel verbatim
- Reads URL params on mount: `?zip=&utm_source=&utm_medium=&theme=light|dark&primary_color=`

### `embed.js` SDK (sketch)

```js
(function () {
  const targets = document.querySelectorAll('[data-selestial-book]');
  targets.forEach((el) => {
    const zip = el.dataset.zip || '';
    const theme = el.dataset.theme || 'light';
    const iframe = document.createElement('iframe');
    iframe.src = `https://selestial.app/embed/book?zip=${zip}&theme=${theme}`;
    iframe.style.cssText = 'width:100%;border:0;min-height:600px;';
    el.appendChild(iframe);

    // Auto-resize
    window.addEventListener('message', (e) => {
      if (e.origin !== 'https://selestial.app') return;
      if (e.data.type === 'height') iframe.style.height = e.data.value + 'px';
      if (e.data.type === 'booking_completed') {
        el.dispatchEvent(new CustomEvent('selestial:booked', { detail: e.data }));
      }
    });
  });
})();
```

### Inside the iframe

```ts
// On every layout change:
useEffect(() => {
  const h = document.body.scrollHeight;
  window.parent.postMessage({ type: 'height', value: h }, '*');
}, [currentStep, bookingData]);

// On confirmation:
window.parent.postMessage({
  type: 'booking_completed',
  bookingId,
  total: basePrice,
  serviceDate
}, '*');
```

### Snippet Customers Paste

```html
<!-- Selestial Booking Widget -->
<script async src="https://selestial.app/embed.js"></script>
<div data-selestial-book
     data-zip="77001"
     data-theme="light"
     data-primary-color="#0EA5E9"></div>
```

### Dedicated Booking Link

Each Selestial tenant also gets a hosted page:
```
https://selestial.app/book/<tenant-slug>
https://book.<tenant-domain>.com  (custom domain via CNAME)
```

Same code path as embed, just full-page instead of iframed.

---

## Appendix: File Index

| Concern | File |
|---------|------|
| Global state | `src/contexts/BookingContext.tsx` |
| Pricing engine | `src/lib/new-pricing-system.ts` |
| Step 1 page | `src/pages/book/Zip.tsx` |
| Step 2 page | `src/pages/book/Sqft.tsx` |
| Step 3 page | `src/pages/book/Offer.tsx` |
| Step 4 page | `src/pages/book/Checkout.tsx` |
| Step 5 page | `src/pages/book/Details.tsx` |
| Step 6 page | `src/pages/book/Confirmation.tsx` |
| Progress UI | `src/components/booking/BookingProgressBar.tsx` |
| Summary card | `src/components/booking/BookingSummaryCard.tsx` |
| Edge: payment | `supabase/functions/create-payment-intent/index.ts` |
| Edge: webhook | `supabase/functions/stripe-webhook/index.ts` |
| Edge: confirm | `supabase/functions/confirm-booking-payment/index.ts` |
| Edge: details | `supabase/functions/save-booking-details/index.ts` |
| Edge: invoice | `supabase/functions/send-balance-invoice/index.ts` |
| Edge: GHL/Zap | `supabase/functions/enhanced-booking-webhook-v2/index.ts` |

---

*Last updated: 2026-04-20 · Source app: AlphaLuxClean · Target app: Selestial*
