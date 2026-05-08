import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  getStripePublishableKey,
  resolveStripeAccount,
} from "../_shared/stripe-env.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Returns the Stripe publishable key for the requesting account.
 *
 * Account resolution:
 *   1. Explicit `account` field on the JSON body, or `?account=` on
 *      the query string. Accepted values: `'try' | 'book'`.
 *   2. Origin / Referer / Host header sniffing — anything from
 *      `book.alphaluxclean.com` resolves to `book`, everything else
 *      (including legacy try.alphaluxcleaning.com) resolves to `try`.
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

  // Pull `account` from query string or body (best-effort — body is
  // POST-only, query string works for GET).
  const url = new URL(req.url);
  let override: string | null = url.searchParams.get("account");
  if (!override && req.method !== "GET") {
    try {
      const body = await req.clone().json();
      if (body && typeof body.account === "string") {
        override = body.account;
      }
    } catch {
      // ignore — empty body / non-JSON is fine
    }
  }

  const slug = resolveStripeAccount(req, override);
  const publishableKey = getStripePublishableKey(slug);

  if (!publishableKey) {
    return new Response(
      JSON.stringify({
        error: "Publishable key not configured for this account",
        account: slug,
        details:
          slug === "book"
            ? "Set STRIPE_PUBLISHABLE_KEY_BOOK in Supabase secrets."
            : "Set STRIPE_PUBLISHABLE_KEY in Supabase secrets.",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }

  return new Response(
    JSON.stringify({
      publishableKey,
      account: slug,
      source: "dual_account",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    },
  );
});
