import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  resolveAccountForZip,
  getCredentials,
} from "../_shared/stripe-accounts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Returns the Stripe PUBLISHABLE key for the account that owns a
 * given service ZIP. The caller passes the ZIP (either as a JSON body
 * `{ zipCode }` or the `?zip=` query param); if it's missing we fall
 * back to the NY account, which is the historical default.
 *
 * Never expose a secret key from this endpoint — it's always
 * publishable only. The create-payment-intent function returns the
 * publishable key inline with the client secret so in the common case
 * the client doesn't even need to hit this endpoint anymore; this
 * still exists for pages that want to boot stripe.js before knowing
 * which booking/ZIP the session belongs to (e.g. a raw subscribe
 * flow).
 */

// The hardcoded fallback is the NY account's publishable key. It's
// safe to bundle into the client since Stripe publishable keys are
// designed to be public; this prevents the checkout form from
// blanking out if the Supabase secret hasn't been rotated yet.
const FALLBACK_NY_PUBLISHABLE_KEY =
  "pk_live_51TONej6CLM640LjskzQLH22Fnnw3c1fYFzJ8zodmoCDYSkKAAuFZfpDYFQEQMvMxWXaoiAfDbT0FSlJuFjjqqdoT00PzmRxxat";

function isValidPublishableKey(key: string): boolean {
  return key.startsWith("pk_live_") || key.startsWith("pk_test_");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let zipCode: string | null = null;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        zipCode = body?.zipCode || body?.zip || null;
      } catch {
        // Body optional — fine to continue without a ZIP.
      }
    } else {
      const url = new URL(req.url);
      zipCode = url.searchParams.get("zip") || url.searchParams.get("zipCode");
    }

    // Resolve the account for this ZIP (NY if ZIP is missing or
    // unmapped, or if the target account is disabled).
    let account = resolveAccountForZip(zipCode);

    // If we still don't have an account (ops hasn't set any Stripe
    // secrets yet), fall back to the bundled NY publishable key so
    // the UI never completely blanks.
    if (!account) {
      console.warn(
        "[get-stripe-config] No Stripe account configured, returning bundled fallback",
      );
      return new Response(
        JSON.stringify({
          publishableKey: FALLBACK_NY_PUBLISHABLE_KEY,
          stripeAccountSlug: "alphalux_ny",
          source: "bundled_fallback",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    // Prefer the account-specific publishable key; if that slot is
    // empty fall back to the NY publishable key (and then the bundled
    // fallback) so stripe.js always has something to initialize with.
    let publishableKey = account.publishableKey;
    let source: "env" | "ny_fallback" | "bundled_fallback" = "env";
    if (!publishableKey || !isValidPublishableKey(publishableKey)) {
      const ny = getCredentials("alphalux_ny");
      publishableKey = ny?.publishableKey ?? null;
      source = "ny_fallback";
    }
    if (!publishableKey || !isValidPublishableKey(publishableKey)) {
      publishableKey = FALLBACK_NY_PUBLISHABLE_KEY;
      source = "bundled_fallback";
    }

    return new Response(
      JSON.stringify({
        publishableKey,
        stripeAccountSlug: account.slug,
        source,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (error: any) {
    console.error("[get-stripe-config] Error:", error);
    return new Response(
      JSON.stringify({
        error: error.message ?? "Failed to resolve Stripe config",
        publishableKey: null,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }
});
