

## Plan: Create a Hub File Documenting the Booking Flow for Reverse-Engineering

You want a single reference document (call it the "Hub") that describes how AlphaLuxClean's booking flow works — both the **logical/architectural layer** and the **visual layout** — so you can rebuild it as a new app called **Selestial** with a closed calendar system, dedicated booking link, and embeddable widget component.

### Where the hub will live

Create a single markdown file at:
- `docs/SELESTIAL_BOOKING_HUB.md`

This is documentation only — no runtime code changes. It will be the canonical reference your team (or another AI) reads to recreate the flow.

### What the hub will contain

The document will be organized into 8 sections:

**1. Flow Overview (the 6-step funnel)**
A high-level map of every route, in order:
```text
/book/zip      → ZIP validation + lead capture (name/email/phone)
/book/sqft     → Home size selection (bedrooms / sqft buckets)
/book/offer    → Offer cards: Deep Clean, Deep + Recurring, Tester
/book/checkout → Stripe Payment Element (25% deposit)
/book/details  → Address + preferred date/time + notes (post-payment)
/book/confirmation → Receipt + reward summary + next steps
```
Plus a Mermaid flow diagram showing transitions, redirects (`/book/schedule → /book/details`), and the routing guard that bounces users back to `/book/details` when address/schedule are missing.

**2. State Management (BookingContext)**
- The global `BookingData` shape (zip, homeSizeId, offerType, basePrice, contactInfo, etc.)
- localStorage persistence key `alphalux-booking-flow`
- Dynamic `depositAmount` = 25% of basePrice
- Pricing recalculation triggers and the "skip if offerType set" rule

**3. Pricing Logic**
- `HOME_SIZE_RANGES` buckets (1000–1500 sqft … 5000+)
- State multipliers (TX 1.20x, CA 1.10x, NY 1.15x)
- Deep clean vs. recurring discount tiers (15/10/5%)
- Promo: $25 off deep, 10% off recurring (`WELCOME2025`)

**4. Visual Layout (per page)**
For each of the 6 pages, a brief description of:
- Hero/headline, primary CTA, trust elements (Google Guaranteed badge, reviews widget, showcase carousel)
- Sidebar summary card behavior
- Progress bar (`BookingProgressBar`) with phone number `972-559-0223`
- Mobile vs. desktop layout breakpoints
- ASCII wireframe of the key page (zip + offer + checkout)

**5. Backend Architecture (Edge Functions)**
The chain that powers a booking, with inputs/outputs:
```text
validate-zip            → city/state lookup
emit-lead-webhook       → GHL/Zapier lead capture
create-payment-intent   → creates customer + booking, returns clientSecret
stripe-webhook          → payment_intent.succeeded → confirms booking
confirm-booking-payment → client-side confirmation path
save-booking-details    → writes address + schedule post-payment
send-balance-invoice    → 75% balance invoice via Stripe
enhanced-booking-webhook-v2 → fires GHL + Zapier sync
```

**6. Database Schema (the 4 tables that matter)**
- `customers` — contact + address
- `bookings` — the order (status, payment_status, deposit_amount, balance_due, service_date, time_slot)
- `partial_bookings` — abandoned funnel tracking
- `availability_schedule` — date/time_slot/booked_slots (this is the **closed calendar system** you asked about)

**7. Closed Calendar System (Selestial-relevant)**
Dedicated section on how availability works:
- `availability_schedule` table: `date + time_slot + zip_code + available_slots + booked_slots`
- `get-available-slots` / `get-live-availability` / `check-calendar-availability` edge functions
- How slots are decremented on confirmation
- How to expose this as a public read-only API for your embed

**8. Embed Component Blueprint**
Pattern for shipping the flow as an `<iframe>` + JS SDK:
- A dedicated `/embed/book` route that strips `Navigation` (uses `minimal` mode)
- `postMessage` events for height auto-resize and `booking_completed` callback
- URL params: `?zip=&utm_source=&theme=light` for parent-page integration
- A snippet template:
```html
<script src="https://selestial.app/embed.js"></script>
<div data-selestial-book data-zip="77001"></div>
```

### Diagram artifact

Alongside the markdown, a Mermaid diagram of the full flow will be generated to `docs/selestial-booking-flow.mmd` and rendered as a visual artifact for download.

### What this is NOT

- Not a code port — no Selestial app code is written
- Not a working embed — the embed section is a blueprint/spec, not a built feature
- No changes to AlphaLuxClean runtime behavior

### Deliverables

1. `docs/SELESTIAL_BOOKING_HUB.md` — the full hub reference (~8 sections, ~600 lines)
2. `docs/selestial-booking-flow.mmd` — Mermaid diagram of the flow
3. Both linked at the bottom of the chat as downloadable artifacts

