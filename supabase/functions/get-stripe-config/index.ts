import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getStripePublishableKey } from "../_shared/stripe-env.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Returns the Stripe publishable key for the AlphaLux Cleaning
 * Stripe account.
 *
 * Single-account; the publishable key is hard-coded in the shared
 * helper because it's a public, non-rotating value tied to one
 * specific Stripe account. The previous environment-variable lookup
 * repeatedly drifted to publishable keys for *other* accounts and
 * produced the "client_secret does not match the publishable key
 * used" outage at confirm time. Removing the env-var path fixes
 * that failure mode by construction.
 *
 * Most call sites no longer hit this endpoint — `create-payment-intent`
 * already returns the publishable key inline alongside the client
 * secret. This still exists for paths that need to boot Stripe.js
 * before knowing which booking the session belongs to.
 */
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const publishableKey = getStripePublishableKey();
  return new Response(
    JSON.stringify({ publishableKey, source: "single_account" }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    },
  );
});
