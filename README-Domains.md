# Domain architecture

One Vercel project serves every host. There is no separate admin
deployment — the surface a visitor gets is decided by the `Host` header.

| Host | Serves | Auth |
|------|--------|------|
| `admin.alphaluxcleaning.com` | Admin workspace (`/admin/*`, admin login, internal tooling) | Required, `admin_users` |
| `admin.alphaluxclean.com` | Same, legacy brand spelling | Required |
| `try.alphaluxcleaning.com` | Public booking funnel | None (guest) |
| `try.novaracleaning.com` | Same funnel, alternate hostname | None (guest) |
| `book.alphaluxclean.com` | Retired — 308 to `try.alphaluxcleaning.com` | — |
| localhost, `*.vercel.app` | Everything, unenforced | — |

`try.alphaluxcleaning.com` is the **canonical** public origin: it is where
cross-host redirects land and what outbound links in SMS, email and
Stripe use. Override with `NEXT_PUBLIC_BOOKING_ORIGIN` /
`NEXT_PUBLIC_ADMIN_ORIGIN` if that ever changes.

## Where the rule lives

```
src/config/domains.ts   ← the rule (host role, path surface, decision)
├── middleware.ts               applies it at the edge, on hard loads
├── src/components/DomainGuard  applies it on in-app navigation
├── app/ChatWidget.tsx          public funnel only
└── app/MarketingScripts.tsx    everywhere except the admin host
```

Both enforcement points are needed. This app is a Next.js shell around a
client-side React Router SPA, so a `<Link to="/admin">` clicked on the
public host never reaches the edge — only the router guard sees it.
Conversely the guard only runs after React boots, which is far too late
to keep admin code off a public page load.

## Path surfaces

Paths are classified into three surfaces, and a host only serves its own
plus `shared`.

**Admin surface** — `/admin*`, the admin login and status pages, and the
internal tooling that used to be public on the booking domain:
`/dev-test*`, `/demo-booking`, `/booking-debug`, `/email-tools`,
`/test-webhook`, `/confirmation-preview`.

**Shared** — `/api/*` (the Next route the funnel calls for Housecall Pro
job creation) and `/health/*` (uptime probes).

**Public** — everything else: the booking funnel, payment links,
referrals, careers, marketing pages.

## What each host does with a foreign path

- Admin host, public path → 307 to the same path on the booking origin.
- Admin host, `/` → 307 to `/admin` (the workspace is the front door).
- Booking host, admin path → 307 to the same path on the admin origin.
- Retired host, any path → 308 to the booking origin.

Query strings and fragments survive every hop, so an ad link with
`?promo=…` or a deep link into the workspace still works.

Redirects between live surfaces are 307 (temporary) on purpose: a 308
would be cached in visitors' browsers indefinitely and make a future
config change impossible to roll out. The retired host is a genuine
permanent move, so it stays 308.

## Admin host hardening

Responses on the admin host carry `X-Robots-Tag: noindex, nofollow,
noarchive`, `X-Frame-Options: DENY` and `Referrer-Policy: same-origin`.
Meta Pixel and Mouseflow do not load there — session replay over the
bookings and leads pages would record customer PII, and internal traffic
would pollute conversion data.

## DNS

Point each hostname at Vercel and attach it to this project. No
per-host project or rewrite rules are required.

```
Type: CNAME   Name: admin   Value: cname.vercel-dns.com
Type: CNAME   Name: try     Value: cname.vercel-dns.com
```

Vercel provisions certificates automatically once the records resolve.

## Verifying a deployment

```bash
npm test                                              # the rule itself
npm run health-check                                  # against production DNS
BASE_URL=http://localhost:3000 npm run health-check   # against next start
```

`npm test` runs `src/config/domains.deno-test.ts` under Deno (already a
dependency of this repo for the edge functions) and pins the decision
table: which hosts map to which surface, which paths are admin-only,
where each foreign path is sent, and that unknown hosts stay unenforced.

`npm run health-check` then asserts the deployment actually behaves that
way over HTTP.

The script asserts the full matrix — admin surface reachable on the
admin host, funnel bounced off it, admin bounced off the public host,
internal tooling bounced off the public host, retired host still
forwarding — and exits non-zero on the first violation. `BASE_URL` sends
the hostnames as `Host` headers, so the whole thing can be checked
against a preview build before DNS is cut over.

## Adding a host

1. Add the hostname to `ADMIN_HOSTS` or `BOOKING_HOSTS` in
   `src/config/domains.ts`.
2. Add a case to `src/config/domains.deno-test.ts` and to `CASES` in
   `scripts/health-check.js`.
3. Attach the domain in Vercel.

Nothing else needs to change: the middleware, the router guard, the chat
widget and the marketing tags all read from the same config.
