# Lifecycle SMS + Email Engine

Reactivation cadence, new offers, and campaigns for AlphaLuxCleaning — SMS through
**OpenPhone** (state-routed business numbers), email through **Resend**, ops through
**Housecall Pro**. Modeled on the Novara internal-booking retention patterns
(`last_booking_at` clock, derived lifecycle stages, idempotent gated sends), with the
comms platform swapped to OpenPhone and the operations platform swapped to HCP.

**The strategic goal is recurring.** Every reactivation touch and incentive funnels
customers toward a recurring plan; existing members get a lighter loyalty track.

---

## The state-routed OpenPhone numbers

Every outbound SMS goes out from the business number matching the customer's state, so
caller ID is local and replies land in the right OpenPhone inbox:

| State | Number | Timezone |
|-------|--------|----------|
| NJ | (551) 239-9444 · `+15512399444` | America/New_York |
| TX | (972) 559-0223 · `+19725590223` | America/Chicago |
| CA | (323) 300-5528 · `+13233005528` | America/Los_Angeles |
| NY / NYC | (631) 366-8565 · `+16313668565` | America/New_York |

- Registry table: `public.sms_state_numbers` (admin-editable at **/admin/lifecycle →
  Numbers & Opt-outs**). Hardcoded fallbacks live in
  `supabase/functions/_shared/openphone.ts`.
- State resolution order: explicit customer/booking state → ZIP inference → the
  `OPENPHONE_DEFAULT_STATE` env (default `NJ`).
- Routing happens inside `_shared/sms.ts` → `sendSms()`, which picks the provider
  from the message's booking rail: the **public** online booking funnel is
  OpenPhone-only, the **internal** (VA) booking rail sends through GoHighLevel and
  quotes an OpenPhone number for support. Lifecycle sends declare no rail and keep
  the legacy order (OpenPhone, then GHL). Full rationale in
  [`COMMS_ROUTING.md`](./COMMS_ROUTING.md).
- The OpenPhone v1 API takes the raw API key in the `Authorization` header (no
  `Bearer` prefix) — the sender handles both schemes defensively.
- Optional: paste each number's OpenPhone `phoneNumberId` (PN…) into the registry for
  id-based sending.

## How the engine works

```
pg_cron (every 20 min)
  └─ lifecycle-engine edge function
       ├─ refresh_customer_retention()          ← keeps the last-booking clock fresh
       ├─ CADENCE  — per-customer due step on their track
       ├─ OFFERS   — active offers trickle to their audience (deduped)
       └─ CAMPAIGNS — scheduled broadcasts whose time has come
```

### The cadence clock

`customers.last_booking_at` (+ `first_service_at`, `total_bookings`,
`completed_bookings`, `lifecycle_stage`, `is_recurring_member`) is maintained by
DB triggers on `bookings` and `recurring_services` plus the
`refresh_customer_retention()` function. HCP webhook job-completion updates the
booking status, which feeds the clock automatically.

### Tracks + default steps (all editable at /admin/lifecycle → Cadence)

| Step | Day | Track | Channel | Intent |
|------|-----|-------|---------|--------|
| day_3 | 3 | recurring_conversion | SMS | Strongest recurring pitch, post-FIRST-clean only |
| day_14 | 14 | reactivation | SMS | Friendly check-in, soft rebook CTA |
| day_30 | 30 | reactivation | Email | First nudge + recurring plan intro |
| day_45 | 45 | reactivation | SMS | Stronger + first-recurring incentive ($25 credit) |
| day_60 | 60 | reactivation | SMS | "We miss you" — recurring path prominent |
| day_90 | 90 | reactivation | Email | Generous win-back offer; last automatic touch |
| 120+ | — | — | — | Marked `lapsed`; cadence stops, campaigns/offers continue |
| loyalty_30 | 30 | loyalty | Email | Members only: perks/milestones, no pitches |

Every step is evaluated per customer per run and **skipped/deferred** when:

- they rebooked (the anchor is `last_booking_at`, so the clock resets automatically);
- they're on a recurring plan (loyalty track only);
- the channel is opted out (`sms_opt_outs` / `email_opt_outs`);
- it's outside the send window in **their local timezone** (state → timezone);
- the weekly **frequency cap** across cadence + offers + campaigns would be exceeded
  (deferred, not dropped);
- it was already sent for this booking cycle (unique indexes on `lifecycle_sends`).

### Personalization

Templates use real customer data — no generic sends. Placeholders:
`{{first_name}}`, `{{last_service_type}}`, `{{days_since}}`, `{{last_clean_date}}`,
`{{completed_cleans}}`, `{{booking_link}}`, `{{incentive_text}}`. SMS gets a
compliant `Reply STOP to opt out.` footer; emails are wrapped in the branded shell
with a signed one-click unsubscribe link.

### Attribution

DB triggers stamp `lifecycle_sends.attributed_booking_id` /
`attributed_recurring_id` when a booking or recurring signup lands within the
attribution window (default 14 days) of the customer's last touch. Inbound replies
stamp `replied_at` via the OpenPhone webhook. Analytics views:
`lifecycle_step_stats`, `lifecycle_offer_stats`, `lifecycle_campaign_stats`.

### The money rule

Incentives (credits/discounts) configured on steps and offers come from **company
margin only**. Cleaner pay is always calculated off the full, pre-discount job
value — nothing in this engine touches payout math.

## Opt-outs — STOP means stop

- **SMS:** the `openphone-webhook` function receives `message.received` events,
  detects STOP/UNSUBSCRIBE/etc., and writes `sms_opt_outs`. The guard lives inside
  `sendSms()` itself, so *every* SMS path in the system honors it. START/UNSTOP
  opts back in.
- **Email:** every lifecycle email carries a signed unsubscribe link handled by
  `lifecycle-unsubscribe`, writing `email_opt_outs`.
- Channels are independent — STOP doesn't kill email, unsubscribe doesn't kill SMS.
- Admin can view/manage both lists at **/admin/lifecycle → Numbers & Opt-outs**.

## Housecall Pro integration

Booking → HCP flow (unchanged, now self-healing):

1. `save-booking-details` / `confirm-booking-payment` → `hcp-sync-booking`
   (idempotent, stamps `bookings.hcp_job_id`).
2. **New cron** `retry-failed-hcp-syncs` (every 30 min) retries failures from
   `hcp_sync_log`.
3. **New cron** `ensure-recent-bookings-hcp-synced` (hourly) re-pushes any recent
   paid booking missing an `hcp_job_id`.
4. `receive-hcp-webhook` (now registered with `verify_jwt = false` + optional HMAC
   signature verification via `HCP_WEBHOOK_SECRET`) processes job
   completed/cancelled/rescheduled and invoice events — job completion feeds the
   lifecycle clock through the retention triggers.
5. `update-hcp-config` now actually persists settings to `app_secrets`
   (env vars still take precedence); `get-hcp-config` reports a redacted view.

Point the HCP webhook (HCP dashboard → API & Webhooks) at:
`https://<project>.functions.supabase.co/receive-hcp-webhook`

## Speed-to-lead (booking-funnel entry)

The moment a visitor submits name / email / phone on `/book/zip`, two things fire:

1. **Intro SMS** from the OpenPhone number matching their market (state from the
   validated ZIP lookup, falling back to ZIP-range inference).
2. **Internal alert email** to the ops mailbox (`info@alphaluxcleaning.com` +
   `info@alphaluxclean.com`, overridable with `INTERNAL_RECIPIENT_EMAILS`).

Both are owned by the `lead-intro-comms` edge function and recorded in
`lead_intro_notifications`, which is the idempotency ledger: the SMS slot is
claimed atomically (`UPDATE … WHERE intro_sms_sent_at IS NULL`) before dispatch,
so a double-submitted form, a retried webhook, and the client-side backup call
together still produce exactly one text and one alert. A failed send releases the
claim so the next attempt retries. Leads who previously texted STOP
(`sms_opt_outs`) are skipped and recorded as such.

It is triggered from two places on purpose — `emit-lead-webhook` server-side
(primary) and `Zip.tsx` client-side (backup, so the touch still lands if the
webhook's GHL leg is slow or mid-deploy). The ledger makes the duplication safe.

A booking later created by that email address stamps `converted_booking_id` on the
lead row, so **/admin/leads** shows speed-to-lead through to conversion.

## Internal Booking (ported from Novara's book-as-va)

Admin/VA phone-booking workspace at **/admin/internal-booking**, backed by the
`book-as-va` edge function — a port of Novara's internal booking endpoint with the
comms + ops platforms swapped:

| Novara step | AlphaLux port |
|-------------|---------------|
| GHL Sales-pipeline contact + opportunity | Kept — `ghl-sync-booking` drives the automations for this rail |
| GHL calendar appointment | Kept, plus a **Housecall Pro job** via `hcp-sync-booking` — the HCP job is what the crew works from |
| Confirmation SMS via GHL number | Kept — GoHighLevel sends, and the copy names the **state-routed OpenPhone** line (NJ/TX/CA/NY) for support |
| Confirmation email via Resend | Same (through idempotent `booking-confirm-comms`) |
| Stripe deposit invoice + day-of remaining cron | Deposit invoice due today + remaining invoice due **on the service date** (no new cron needed), on the customer's state-routed Stripe account (`try`/`book`) |

One atomic call: admin auth check → customer upsert (city/state drive the support
number + Stripe routing) → booking insert (`source: internal_booking`, canonical
`service_date` / `time_slot`) → invoices per mode (`deposit_plus_remaining` ·
`full_now` · `none`) → HCP sync → GHL sync (fires the workflows) → confirmation
email + invoice-aware SMS through GoHighLevel → response with the booking ref and
hosted-invoice URLs for the VA to copy/paste while still on the phone. Pricing uses a
server-side rate card mirrored 1:1 by the form's live quote. The retention triggers
fire on insert, so internally booked customers enter the lifecycle engine
automatically (and their upcoming clean suppresses reactivation touches).

## Setup checklist

1. **Apply the migration** `20260723100000_lifecycle_engine.sql` (tables, triggers,
   seeds, crons, RLS).
2. **Secrets** (Supabase dashboard → Edge Functions → Secrets):
   - `OPENPHONE_API_KEY` — required for SMS on the public rail and for support numbers
   - `OPENPHONE_WEBHOOK_SECRET` — recommended (webhook signature enforcement)
   - `OPENPHONE_DEFAULT_STATE` — optional, default `NJ`
   - `GHL_PIT_TOKEN` + `GHL_LOCATION_ID` — required for SMS on the internal rail
   - `INTERNAL_SMS_OPENPHONE_FAILOVER` — optional, set `false` for GHL-only internal SMS
   - `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO` — email rail (already set)
   - `HCP_API_KEY` (or `HOUSECALL_PRO_API_KEY`) — already set
   - `HCP_WEBHOOK_SECRET` — recommended
3. **OpenPhone dashboard**: create a webhook for message events (received +
   delivery status) on **all four numbers** →
   `https://<project>.functions.supabase.co/openphone-webhook`.
   Optionally paste each number's `phoneNumberId` into the admin registry.
4. **HCP dashboard**: point the webhook at `receive-hcp-webhook` (above).
5. **Deploy edge functions**: `lifecycle-engine`, `lifecycle-unsubscribe`,
   `openphone-webhook` (new) plus the updated ones (`send-sms`, `send-sms-unified`,
   `send-openphone-sms`, `booking-confirm-comms`, `book-as-va`, `lead-intro-comms`,
   `hcp-sync-booking`, `receive-hcp-webhook`, `get-hcp-config`, `update-hcp-config`,
   `reengage-cold-leads`).
6. **Verify** at `/admin/lifecycle → Settings` with a **Dry run** — it lists exactly
   who would receive what without sending.

## Verifying the behaviors that must hold

- Customer 30 days out, not opted out, not recurring → dry run shows the Day-30
  email with their real name/service; a rebooking customer disappears from the plan.
- Customer with exactly one completed clean, 3+ days out → Day-3 recurring pitch
  via SMS from their state's number.
- Text STOP to any state number → `sms_opt_outs` row appears; subsequent sends log
  as `suppressed` in `sms_logs`; email still works.
- Launch an offer for "Recent lapsed (31–90), SMS + Email" → sends land only on that
  segment (see `lifecycle_sends`), attribution shows on the Offers tab afterwards.
- Set frequency cap to 1 and trigger a campaign — customers already touched this
  week are deferred, not double-sent.
