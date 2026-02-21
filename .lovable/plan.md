

# Set Up Separate Stripe Secrets for AlphaLux Clean

Since both projects share the same Supabase, we need dedicated Stripe secret names so each project uses its own Stripe account.

## Step 1: Add New Secrets

Add two new Supabase secrets:

- **STRIPE_SECRET_KEY_ALPHALUX** -- Your AlphaLux Stripe secret key (sk_live_...)
- **STRIPE_PUBLISHABLE_KEY_ALPHALUX** -- `pk_live_51S6xTvEFKFvC92D7wCSKXNX71yE6nc4Kwv2ilwuq2PD7ZDDhdfxvK4OLaJpLNAB8CiKjiLSpNWpw9fugWOdP8Q2300jcYkIDjd`

You will also need a new **STRIPE_WEBHOOK_SECRET_ALPHALUX** if you set up a separate webhook endpoint in the new Stripe account.

## Step 2: Update All Edge Functions

Replace `STRIPE_SECRET_KEY` with `STRIPE_SECRET_KEY_ALPHALUX` and `STRIPE_PUBLISHABLE_KEY` with `STRIPE_PUBLISHABLE_KEY_ALPHALUX` in all 25 edge functions that reference them:

| # | Edge Function | Key Used |
|---|--------------|----------|
| 1 | `verify-payment-status` | SECRET_KEY |
| 2 | `remove-payment-method` | SECRET_KEY |
| 3 | `get-stripe-config` | PUBLISHABLE_KEY |
| 4 | `process-recurring-billing` | SECRET_KEY |
| 5 | `send-balance-invoice` | SECRET_KEY |
| 6 | `create-membership-checkout` | SECRET_KEY |
| 7 | `create-payment-intent` | SECRET_KEY |
| 8 | `create-stripe-customer` | SECRET_KEY |
| 9 | `customer-portal` | SECRET_KEY |
| 10 | `create-90day-subscription` | SECRET_KEY |
| 11 | `payment-retry-processor` | SECRET_KEY |
| 12 | `create-subcontractor-subscription` | SECRET_KEY |
| 13 | `get-payment-methods` | SECRET_KEY |
| 14 | `process-subcontractor-payment` | SECRET_KEY |
| 15 | `stripe-webhook` | SECRET_KEY + WEBHOOK_SECRET |
| 16 | `process-auto-charge` | SECRET_KEY |
| 17 | `payment-webhook-handler` | SECRET_KEY |
| 18 | `set-default-payment-method` | SECRET_KEY |
| 19 | `customer-payment-intent` | SECRET_KEY |
| 20 | `customer-payment-webhook` | SECRET_KEY |
| 21 | `process-refund` | SECRET_KEY |
| 22 | `setup-payment-method` | SECRET_KEY |
| 23 | `enhanced-payment-processor` | SECRET_KEY |
| 24 | `send-payment-link` | SECRET_KEY |
| 25 | `check-subscription` | SECRET_KEY |

Each function will have its `Deno.env.get("STRIPE_SECRET_KEY")` changed to `Deno.env.get("STRIPE_SECRET_KEY_ALPHALUX")`, and similarly for the publishable key and webhook secret.

The existing `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` secrets remain untouched for the other project sharing this Supabase.

## Step 3: Update Webhook Secret

In `stripe-webhook/index.ts`, change `STRIPE_WEBHOOK_SECRET` to `STRIPE_WEBHOOK_SECRET_ALPHALUX`. You will need to create a new webhook endpoint in the new Stripe dashboard pointing to the same edge function URL and save the new signing secret.

## What You Need to Provide

1. Your AlphaLux Stripe **secret key** (sk_live_...)
2. A new **webhook signing secret** after creating the webhook endpoint in the new Stripe dashboard

## Technical Notes

- The old secrets (`STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`) stay in place for the other project
- Error messages in the edge functions will be updated to reference the new secret names (e.g., "STRIPE_SECRET_KEY_ALPHALUX is not set")
- No database changes required
- All 25 edge functions will be redeployed after the update

