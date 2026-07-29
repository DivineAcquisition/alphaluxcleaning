# Admin Workspace

Every page under `/admin/*` reads live data from Supabase. This document records
what the workspace contains after the overhaul and what was removed, so nobody
re-introduces the placeholder data that used to be here.

## Where it lives

The workspace is served **only** from `admin.alphaluxcleaning.com`. Requesting
`/admin` on the public booking host redirects to the admin host, and requesting
a booking path on the admin host redirects back — enforced at the edge by
`middleware.ts` and on in-app navigation by `DomainGuard`, both reading
`src/config/domains.ts`. See [`README-Domains.md`](../README-Domains.md).

Internal tooling (`/dev-test*`, `/email-tools`, `/booking-debug`,
`/test-webhook`, `/demo-booking`, `/confirmation-preview`) counts as admin
surface and is unreachable from the public domain. Marketing and session-replay
tags do not load on the admin host.

## Navigation

| Group | Page | Route | Source of truth |
|-------|------|-------|-----------------|
| Operations | Dashboard | `/admin` | `useAdminMetrics` (live aggregate) |
| Operations | Booking Activity | `/admin/activity` | `useBookingActivity` (both rails) |
| Operations | Bookings | `/admin/bookings` | `bookings` ⨝ `customers` |
| Operations | Customers | `/admin/customers` | `customers` retention columns |
| Operations | Leads | `/admin/leads` | `lead_intro_notifications`, `partial_bookings` |
| Operations | Internal Booking | `/admin/internal-booking` | `book-as-va` edge function |
| Growth | Lifecycle Engine | `/admin/lifecycle` | `lifecycle_*` tables + views |
| Growth | Promo Codes | `/admin/promos` | `promo_codes` |
| Growth | Conversion | `/admin/conversion` | `booking_events`, `bookings` |
| Communications | Email Templates / Logs / Events | `/admin/email/*` | `email_templates`, `email_jobs`, `email_events` |
| System | Housecall Pro + Sync Logs | `/admin/integrations/housecall-pro*` | `get-hcp-config`, `hcp_sync_log` |
| System | Admin Users | `/admin/users` | `admin_users` via `admin-auth-guard` |
| System | Booking Monitor / DB Watcher / Booking Tester | `/admin/*` | realtime subscriptions |

## Booking Activity (`/admin/activity`)

The workspace runs two booking rails with deliberately different comms
plumbing (see [`COMMS_ROUTING.md`](./COMMS_ROUTING.md)), and this page is where
both are watched:

- **Per-rail panels** — volume over 24h / 7d / 30d, booked value, status mix,
  Housecall Pro coverage, SMS sent vs failed, and the providers that actually
  carried each rail's texts.
- **Merged timeline** — bookings, leads, outbound SMS, Housecall Pro syncs and
  GoHighLevel syncs in one feed, tagged by rail and filterable by rail and
  event type.
- **Rail warnings** — raised when a rail sends on a provider it isn't supposed
  to use. Public-funnel texts on GoHighLevel mean customers are being texted
  from the wrong area code with replies going to an unwatched inbox; internal
  texts on OpenPhone mean GHL is failing over and the CRM workflows are not
  being driven.

Rails are identified by `bookings.source` (`internal_booking` → internal) and
`sms_logs.channel`. SMS rows written before the channel column existed report
as unattributed rather than being guessed into a rail.

## What changed in the overhaul

**Removed — fabricated data.** The old dashboard mixed real booking counts with
invented numbers. All of the following are gone, not patched:

- `useDashboardData` — mock subcontractors ("John Smith", "Sarah Johnson"), a
  hardcoded `avgReliability: 85`, payouts estimated as `est_price × 0.7`, and a
  hardcoded `payment_status: 'pending'` on every job.
- `components/dashboard/AssignmentDrawer` — ranked crews with `Math.random()`.
- `components/dashboard/{JobsWorkboard,KPICards,PayoutsAlertsSection,SubcontractorsWorkboard}` —
  only ever rendered that mock data.
- `spa-pages/UserManagement.tsx` (hardcoded "1,247 users", "John Doe") and
  `spa-pages/SecuritySettings.tsx` (hardcoded KPIs) — unrouted placeholder UI.

None of this reflected reality: **this deployment has no subcontractor, crew, or
payout tables at all**, because field operations live in Housecall Pro. The
dashboard now reports what the app actually owns — funnel, revenue, comms rails
and integration health.

**Fixed — dead links and broken navigation.**

- `/admin/customers` and `/admin/subcontractors` were in the sidebar but had no
  routes. Customers is now a real page; the subcontractors link is gone.
- Sign-out navigated to `/auth`, which does not exist → now `/admin-login`.
- `AdminOTPLogin` sent admins to `/admin-dashboard` and `CSRBookingForm` to
  `/admin/dashboard`; neither route existed. Both now go to `/admin`, and legacy
  redirects catch any stragglers.
- The Housecall Pro "test connection" button POSTed to `/api/hcp/test`, which has
  never existed, so it always reported failure. It now asks `get-hcp-config`
  whether a usable credential is actually present.
- Pages that existed but were missing from the nav (promos, conversion, HCP,
  monitors) are now grouped into the sidebar.

**Fixed — authentication.** Every `/admin/*` route is wrapped in `AdminRoute`.
HCP settings, HCP test suite and promo codes were previously reachable by anyone
who knew the URL. Destructive actions (`update_user_role`, `update_user_status`,
`add_to_allowlist`) additionally require the full `admin` role.

`admin-auth-guard`'s management actions ran with the service-role key and **no
caller verification** — any anonymous client could list admin users or change
roles. They now resolve the caller's JWT to an active `admin_users` row first.

**Unified shell.** Booking Monitor, Booking Tester, Database Watcher and
Conversion Optimization rendered the customer-facing `Navigation` header instead
of the admin shell, so half the workspace looked like a different product. All
admin pages now use `AdminLayout`.

## Credential health

Run the check any time from **Housecall Pro settings → Test Connection**, which
calls the admin-gated `integration-health` edge function. It performs a real
authenticated request against each provider and reports the provider's own error
text (never secret values). The dashboard also surfaces the most recent stored
HCP and SMS failure reasons.

State as of the last check:

| Integration | Result |
|-------------|--------|
| Housecall Pro | **Not connected.** The value stored in Supabase as `HCP_API_KEY` is a placeholder string (32 chars, matches `PLACEHOLDER…REPLACED`), not a real key. |
| OpenPhone | **Not connected.** A real-looking key is stored but OpenPhone returns `401 Unauthorized`. |
| Resend | Working — a restricted send-only key. It can't list domains, which is expected and harmless. |

The Housecall Pro timeline matches the placeholder theory exactly: the last
successful sync was **2026-05-02**, and every attempt from **2026-05-17** onward
failed with 401. The key was working and was then overwritten.

Note there are two separate credential stores. The Next.js route
`app/api/create-job/route.ts` reads `HCP_API_KEY` from the **hosting provider's**
environment (Vercel), while every Supabase edge function reads it from **Supabase
secrets**. A key set in one is not visible to the other, so both need the real
value.

Once the keys are valid, the `retry-failed-hcp-syncs` cron (every 30 minutes)
drains the backlog of failed syncs automatically.
