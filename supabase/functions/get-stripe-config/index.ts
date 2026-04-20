import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Returns the Stripe PUBLISHABLE key only.
 *
 * Never expose the secret key from an edge function — the SDK uses
 * the publishable key on the client and the secret key is only used
 * server-side inside Supabase Edge Functions (e.g. create-payment,
 * stripe-webhook). We accept any of the following env var names so
 * the function works whether the Supabase secret is stored as
 * `STRIPE_PUBLISHABLE_KEY` (conventional), `STRIPE_PUBLISHABLE_KEY_ALPHALUX`
 * (legacy), or just the project default.
 */
const PUBLISHABLE_KEY_CANDIDATES = [
  "STRIPE_PUBLISHABLE_KEY",
  "STRIPE_PUBLISHABLE_KEY_ALPHALUX",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
];

// Publishable keys are safe to expose publicly. When the Supabase secret
// hasn't been set yet we fall back to the current AlphaLux live key so
// the checkout form never blanks out on a cold project.
const FALLBACK_PUBLISHABLE_KEY =
  "pk_live_51TONej6CLM640LjskzQLH22Fnnw3c1fYFzJ8zodmoCDYSkKAAuFZfpDYFQEQMvMxWXaoiAfDbT0FSlJuFjjqqdoT00PzmRxxat";

function resolvePublishableKey(): { key: string | null; source: "env" | "fallback" | "none" } {
  for (const name of PUBLISHABLE_KEY_CANDIDATES) {
    const v = Deno.env.get(name);
    if (v && typeof v === "string" && v.trim().length > 0) {
      return { key: v.trim(), source: "env" };
    }
  }
  if (FALLBACK_PUBLISHABLE_KEY) {
    return { key: FALLBACK_PUBLISHABLE_KEY, source: "fallback" };
  }
  return { key: null, source: "none" };
}

function isValidPublishableKey(key: string): boolean {
  return key.startsWith("pk_live_") || key.startsWith("pk_test_");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { key: publishableKey, source } = resolvePublishableKey();

    if (!publishableKey) {
      console.error(
        "❌ No Stripe publishable key configured. Set STRIPE_PUBLISHABLE_KEY in Supabase.",
      );
      return new Response(
        JSON.stringify({
          error:
            "Stripe is not configured. Add STRIPE_PUBLISHABLE_KEY to Supabase secrets.",
          publishableKey: null,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    if (!isValidPublishableKey(publishableKey)) {
      // We accidentally stored a secret (sk_) or restricted (rk_) key — refuse to expose it.
      console.error(
        "❌ Stripe publishable key looks malformed or is not a publishable key",
      );
      return new Response(
        JSON.stringify({
          error:
            "Stripe publishable key is malformed. It must start with pk_live_ or pk_test_.",
          publishableKey: null,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    console.log(
      `✅ Stripe publishable key resolved from ${source} (prefix: ${publishableKey.slice(0, 12)}...)`,
    );

    return new Response(
      JSON.stringify({ publishableKey }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (error: any) {
    console.error("❌ Error in get-stripe-config:", error);
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
