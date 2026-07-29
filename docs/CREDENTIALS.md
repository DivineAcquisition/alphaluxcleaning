# Credentials — what goes where

No credential belongs in this repo. There are three separate stores and
setting a value in one does **not** set it in the others.

| Store | Holds | Where |
|---|---|---|
| Supabase edge-function secrets | Everything the booking and comms rails run on | Supabase dashboard → Edge Functions → Secrets |
| Vercel environment variables | The Next.js server route and public browser values | Vercel → Project → Settings → Environment Variables |
| `.env` (local only, gitignored) | Local development copies | Your machine |

Verify any of it from the workspace: **Admin → Housecall Pro → Test
Connection** calls the admin-gated `integration-health` function, which
performs a real authenticated request against Housecall Pro, OpenPhone,
GoHighLevel and Resend and reports each provider's own error text. It
never returns secret values.

## Supabase edge-function secrets

### Comms rails

| Secret | Rail | Notes |
|---|---|---|
| `OPENPHONE_API_KEY` | Public booking SMS + support numbers | Requires an OpenPhone Business plan. Sent as the raw key in `Authorization`, no `Bearer` prefix. |
| `GHL_PIT_TOKEN` | Internal booking SMS + CRM automations | Private Integration token. **Location-scoped.** |
| `GHL_LOCATION_ID` | Same | The subaccount the Private Integration was created in. Required — the token alone is useless. |
| `RESEND_API_KEY` | All transactional email | A restricted send-only key is fine. |

Optional: `OPENPHONE_WEBHOOK_SECRET`, `OPENPHONE_DEFAULT_STATE` (default
`NJ`), `INTERNAL_SMS_OPENPHONE_FAILOVER` (set `false` for a strictly
GHL-only internal rail), `GHL_OWNER_USER_ID` / `GHL_OWNER_EMAIL`,
`GHL_ALPHALUX_CALENDAR_ID`.

### Operations and payments

`HCP_API_KEY` (also needed in Vercel, see below), `HCP_WEBHOOK_SECRET`,
`STRIPE_SECRET_KEY_ALPHALUX`, `STRIPE_WEBHOOK_SECRET_ALPHALUX`,
`SUPABASE_SERVICE_ROLE_KEY`.

## The GoHighLevel token is location-scoped

This is the single most common way GHL setup fails, because two very
different problems produce a near-identical 401:

| GoHighLevel says | What it means | Fix |
|---|---|---|
| `Invalid Private Integration token` | The token is revoked or mistyped | Mint a new PIT: Settings → Private Integrations |
| `This location is not accessible from this token!` | **The token is fine.** It belongs to a different subaccount than `GHL_LOCATION_ID` | Correct `GHL_LOCATION_ID` — do *not* rotate the token |

Find the Location ID in GoHighLevel under **Settings → Business Profile**,
or read it out of the subaccount URL:
`app.gohighlevel.com/v2/location/<LOCATION_ID>/dashboard`.

The token and the location must come from the *same* subaccount. There
are no baked-in defaults in `_shared/ghl-client.ts` on purpose: a default
location silently paired with a valid token produces the second error
above and sends you looking in entirely the wrong place.

Note the outbound webhook URLs in `emit-lead-webhook` and
`send-ghl-payment-webhook` embed their own location ids
(`Lvvq87zxxbYFnaTEklYX`, `jWh1TtlCjUDeZZ27RkkI`). If `GHL_LOCATION_ID`
does not match the one in those URLs, leads and bookings are being
written into two different subaccounts — worth confirming.

## OpenPhone numbers

One number per market, held in `public.sms_state_numbers` and editable at
**Admin → Lifecycle → Numbers & Opt-outs**:

| State | Number | `openphone_phone_id` |
|---|---|---|
| NJ | (551) 239-9444 | `PNadeAhbSz` |
| TX | (972) 559-0223 | `PNcr6AQ0lI` |
| CA | (323) 300-5528 | `PNixdsFI1a` |
| NY | (631) 366-8565 | `PNmbaQkeHE` |

The ids are populated by migration `20260729140000_openphone_phone_ids`.
`openPhoneSend()` prefers the id over the raw number because sending by
E.164 breaks with a 403 the moment a number is ported, renamed or moved
between workspaces.

If OpenPhone returns **403** rather than 401, the key is valid but the
workspace does not own the number being sent from — check this table
against `GET https://api.openphone.com/v1/phone-numbers`.

## Rotating a credential

1. Issue the new value at the provider.
2. Update it in Supabase secrets (and Vercel, if it lives in both).
3. Redeploy the affected edge functions.
4. Confirm with **Test Connection**.

Rotate immediately if a key has ever been pasted into a chat, ticket,
commit or screenshot. Nothing here is committed, so rotation is the only
place a leaked value can still be revoked.
