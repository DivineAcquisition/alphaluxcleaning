# Credentials — what goes where

No credential belongs in this repo. There are three separate stores and
setting a value in one does **not** set it in the others.

| Store | Holds | Where |
|---|---|---|
| Supabase edge-function secrets | Everything the booking and comms rails run on | Supabase dashboard → Edge Functions → Secrets |
| Vercel environment variables | The Next.js server route and public browser values | Vercel → Project → Settings → Environment Variables |
| `.env` (local only, gitignored) | Local development copies | Your machine |

## Use the right Supabase project

The organization contains three projects with confusingly similar
purposes. This app is **AlphaLuxClean**:

| Project | Ref | Used by this repo |
|---|---|---|
| **AlphaLuxClean** | `yltvknkqnzdeiqckqjha` | **Yes** — matches `src/integrations/supabase/client.ts` |
| BayAreaCleaningPros | `rfgurianvyrgonjvvsnc` | No — predecessor brand |
| NovaraCleaning | `sxdraeptzuamsgjcvfeg` | No — sibling business |

A key pasted into the wrong project's secrets looks saved and changes
nothing, which is a genuinely hard failure to spot. Check the project
name in the dashboard header before saving.

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
| `GHL_LOCATION_ID` | Same | `ESaf0wtNvMhNtUYQ4rzz` — verified against the live subaccount. Required; the token alone is useless. |
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

## The verified subaccount

`GHL_LOCATION_ID = ESaf0wtNvMhNtUYQ4rzz`. Everything below was read from
that location and matches what the code expects:

| Thing | Value | Used by |
|---|---|---|
| Sales pipeline | `AGP - Sales & Growth Pipeline` (`N0lXiyx68MYygHNvd8ZZ`) | `pickBookedPipelineStage` |
| Booked stage | `bad281f3-36e0-42df-bee1-b30f35ad2601` | Opportunity creation |
| Calendar | `AlphaLuxCleaning` (`L5BDUEPT1Kiq8NGbvPeP`) | `ghl-sync-booking` step 4 |
| Custom fields | 40, all resolving | `KNOWN_GHL_FIELD_IDS` |

Two caveats found while verifying:

**The calendar is marked inactive.** Appointment pushes will fail until
it is switched on in GoHighLevel. This degrades quietly rather than
breaking anything — `ghl-sync-booking` logs the failure and still records
the contact, custom fields and opportunity, and the confirmation SMS
still sends — but no appointment will appear on the GHL calendar.
Housecall Pro remains the real schedule either way.

**`/users/` returns an empty list** for this token, so
`resolveOwnerUserId()` cannot match `GHL_OWNER_EMAIL` and opportunities
are created unassigned. Set `GHL_OWNER_USER_ID` explicitly, or grant the
Private Integration the users scope, if opportunities need an owner.

## Webhooks point at different subaccounts

The PIT writes to `ESaf0wtNvMhNtUYQ4rzz`, but five functions POST to
hard-coded LeadConnector webhook URLs that embed *other* location ids:

| Function | Embedded location |
|---|---|
| `emit-lead-webhook` | `Lvvq87zxxbYFnaTEklYX` |
| `enhanced-booking-webhook-v2` | `Lvvq87zxxbYFnaTEklYX` |
| `customer-payment-webhook` | `jWh1TtlCjUDeZZ27RkkI` |
| `send-ghl-payment-webhook` | `jWh1TtlCjUDeZZ27RkkI` |
| `send-recent-orders-to-ghl` | `jWh1TtlCjUDeZZ27RkkI` |

So public-funnel leads and payments are being fired into two subaccounts
that are not the one the CRM sync and internal-booking texts use. That is
almost certainly not intended, but the URLs are workflow-trigger links
that only exist in whichever subaccount created them — they cannot be
rewritten by guesswork. Regenerate the inbound webhook triggers inside
`ESaf0wtNvMhNtUYQ4rzz` and replace these URLs, or confirm the split is
deliberate.

## OpenPhone numbers

One number per market, held in `public.sms_state_numbers` and editable at
**Admin → Lifecycle → Numbers & Opt-outs**:

| State | Number | `openphone_phone_id` |
|---|---|---|
| NJ | (551) 239-9444 | `PNadeAhbSz` |
| TX | (972) 559-0223 | `PNcr6AQ0lI` |
| CA | (323) 300-5528 | `PNixdsFI1a` |
| NY | (631) 366-8565 | `PNmbaQkeHE` |

These ids are already applied to the AlphaLuxClean database (migration
`20260729140000_openphone_phone_ids`), and were read from the live
workspace, so all four match. `openPhoneSend()` prefers the id over the
raw number because sending by E.164 breaks with a 403 the moment a number
is ported, renamed or moved between workspaces.

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
