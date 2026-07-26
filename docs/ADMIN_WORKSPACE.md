# Admin Workspace

Every page under `/admin/*` reads live data from Supabase. This document records
what the workspace contains after the overhaul and what was removed, so nobody
re-introduces the placeholder data that used to be here.

## Navigation

| Group | Page | Route | Source of truth |
|-------|------|-------|-----------------|
| Operations | Dashboard | `/admin` | `useAdminMetrics` (live aggregate) |
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

Two live integrations are currently failing authentication. The code paths are
correct; the stored secrets are being rejected:

- **Housecall Pro** — every `hcp_sync_log` failure is
  `HCP authentication failed under both Token and Bearer schemes (401 Unauthorized)`.
  Set a current `HCP_API_KEY` in Supabase secrets.
- **OpenPhone** — outbound sends return `401`. Set a current `OPENPHONE_API_KEY`.

Both surface on the dashboard with the actual error text, so the cause is visible
rather than showing a generic "sync failed". Once the keys are valid, the
`retry-failed-hcp-syncs` cron (every 30 minutes) drains the backlog automatically.
