# Comms routing — which provider sends what

Two booking rails, two different providers. This is deliberate, and the
rest of this document explains why, because "just use one" is the
obvious-looking change that would break both.

| | Internal booking | Online booking |
|---|---|---|
| Where | `/admin/internal-booking` → `book-as-va` | Public funnel on the booking host |
| Who books | Staff / VA on the phone | The customer, self-serve |
| Automated SMS sent by | **GoHighLevel** | **OpenPhone**, state-routed |
| Support number in the copy | **OpenPhone**, state-routed | **OpenPhone**, state-routed |
| Automations | GHL workflows (via `ghl-sync-booking`) | Funnel edge functions |
| Transactional email | Resend | Resend |
| Field ops | Housecall Pro | Housecall Pro |
| `bookings.source` | `internal_booking` | anything else |
| `sms_logs.channel` | `internal` | `public` |

## Why the rails differ

**The online funnel is OpenPhone-only.** AlphaLux runs one OpenPhone
number per market — NJ (551) 239-9444, TX (972) 559-0223, CA
(323) 300-5528, NY (631) 366-8565 — and the automated texts are the
first thing a lead receives. Sending from a local number is what makes
them answer, and the reply has to land in that market's OpenPhone inbox
where someone is watching. A GoHighLevel fallback would send from a
LeadConnector number in the wrong area code and drop the reply into a
thread nobody reads, so on this rail there is no fallback at all: if
OpenPhone fails, the send is recorded as failed and retried, never
rerouted.

**The internal rail is GoHighLevel-first.** A booking taken on the phone
should behave like every other CRM record: it belongs in a pipeline, it
should trigger the same workflows, and its messages should thread into
the same conversation as the rest of the contact's history. That is
GoHighLevel's job, so `book-as-va` pushes the booking through
`ghl-sync-booking` (contact, custom fields, tags, opportunity, calendar)
and sends the confirmation through GHL Conversations.

**Support is OpenPhone on both rails.** The GHL sending number is not a
staffed inbox. Any message GHL sends therefore names the OpenPhone line
for the customer's market explicitly — "Questions? Call or text us at
(551) 239-9444" — resolved at send time by `resolveSupportNumber()`,
which reads the live `sms_state_numbers` registry (editable under
Lifecycle → Numbers) before falling back to the hardcoded defaults.

## Implementation

Every outbound SMS goes through `sendSms()` in
`supabase/functions/_shared/sms.ts`, which takes a `channel` and derives
the provider order from it:

```ts
await sendSms({ to, message, channel: 'public', state, zip, context });
```

| `channel` | Provider order |
|---|---|
| `'public'` | `openphone` |
| `'internal'` | `ghl`, then `openphone` as failover |
| omitted | `openphone`, then `ghl` (legacy, lifecycle and one-off sends) |

`channelFromBookingSource(booking.source)` maps a booking row to its
rail, which is how `booking-confirm-comms` confirms a booking on
whichever rail created it without the caller having to say so.

### Internal failover

OpenPhone stays as failover on the internal rail so a GoHighLevel outage
cannot silently drop a confirmation a VA just promised the customer on
the phone. The failover send still quotes the same OpenPhone support
number, so the customer sees a consistent contact either way.

Set `INTERNAL_SMS_OPENPHONE_FAILOVER=false` to make the internal rail
strictly GHL-only. When GHL credentials are absent entirely
(`GHL_PIT_TOKEN` / `GHL_LOCATION_ID` unset), the rail falls back to
OpenPhone regardless and the activity dashboard flags it.

## Cross-cutting guarantees

These apply on every path, both rails:

- **STOP means stop.** Numbers in `sms_opt_outs` are never messaged.
  A suppressed send returns `success: true` with `suppressed: true` so
  callers don't retry-loop.
- **Everything is logged.** Each attempt writes to `sms_logs` with its
  provider, status, context and channel. The ledger is best-effort and
  never blocks a send.
- **`sendSms` never throws.** It returns a structured result with the
  full attempt list.

## Watching it

`/admin/activity` reports both rails side by side, including which
providers actually carried each rail's traffic over the last 7 days. It
raises a warning when a rail sends on a provider it isn't supposed to
use, which is the failure mode this split introduces:

- Online funnel texts appearing on `ghl` → someone reintroduced a
  fallback, and customers are being texted from the wrong area code.
- Internal texts appearing on `openphone` → GHL is failing over, so the
  CRM thread and the workflows are not being driven.

Rows written before the `channel` column existed report as
*unattributed* rather than being guessed into a rail.

## Where each rail's comms are fired

| Trigger | Function | Rail | Channel used |
|---|---|---|---|
| Lead submits ZIP form | `lead-intro-comms` | public | OpenPhone direct (state-routed) |
| Lead sync to CRM | `ghl-sync-lead` | public | GHL contact only, no SMS |
| Deposit paid | `confirm-booking-payment` | public | email + webhooks |
| Details saved | `save-booking-details` → `booking-confirm-comms` | public | OpenPhone |
| Internal booking taken | `book-as-va` | internal | `ghl-sync-booking` + GHL SMS |
| Internal booking email | `book-as-va` → `booking-confirm-comms` | internal | Resend (SMS slot pre-claimed) |
| Reactivation / campaigns | `lifecycle-engine` | neither | legacy order |

## Required secrets

| Rail | Secrets |
|---|---|
| Public SMS | `OPENPHONE_API_KEY`, optional `OPENPHONE_DEFAULT_STATE` |
| Internal SMS | `GHL_PIT_TOKEN`, `GHL_LOCATION_ID` (both location-scoped) |
| Support numbers | `sms_state_numbers` table, defaults in `_shared/openphone.ts` |
| Email | `RESEND_API_KEY` |
