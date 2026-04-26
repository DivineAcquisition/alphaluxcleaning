import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  FALLBACK_PUBLISHABLE_KEY,
  getStripePublishableKey,
  isValidPublishableKey,
} from "../_shared/stripe-env.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Returns the Stripe publishable key for the AlphaLux Cleaning
 * Stripe account. Single-account version — `_shared/stripe-env.ts`
 * is the only source of truth.
 *
 * Never expose a secret key from this endpoint — it's always
 * publishable only. `create-payment-intent` returns the publishable
 * key inline with the client secret so in the common case the
 * front-end doesn't even hit this endpoint anymore; this still
 * exists for code paths that boot Stripe.js before knowing which
 * booking the session belongs to.
 *
 * Falls back to a hard-coded production publishable key bundled in
 * `_shared/stripe-env.ts` so the form can never blank out due to a
 * missing/incorrect Supabase secret.
 */
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let publishableKey = getStripePublishableKey();
    let source: "env" | "bundled_fallback" = "env";

    if (!isValidPublishableKey(publishableKey)) {
      publishableKey = FALLBACK_PUBLISHABLE_KEY;
      source = "bundled_fallback";
      console.warn(
        "[get-stripe-config] No valid publishable key in env, using bundled fallback",
      );
    }

    return new Response(
      JSON.stringify({ publishableKey, source }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (error: any) {
    console.error("[get-stripe-config] Error:", error);
    return new Response(
      JSON.stringify({
        error: error?.message ?? "Failed to resolve Stripe config",
        publishableKey: FALLBACK_PUBLISHABLE_KEY,
        source: "bundled_fallback",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }
});
