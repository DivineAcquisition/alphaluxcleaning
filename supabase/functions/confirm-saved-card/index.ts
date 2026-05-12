// confirm-saved-card — back-end for the /save-card page's post-
// confirm step. Called by the front-end after Stripe.js confirms a
// SetupIntent on the customer's behalf. We:
//
//   1. Retrieve the SetupIntent from Stripe (on the account the
//      front-end says it ran against) to verify it's actually
//      `succeeded` and to learn which PaymentMethod was attached.
//   2. Promote that PaymentMethod to the Customer's default
//      (invoice_settings.default_payment_method) so future
//      invoices, balance charges, and recurring visit charges
//      auto-charge it off-session.
//   3. Mirror the state onto our customers row so admins / other
//      edge functions can read "card on file?" without a Stripe
//      round-trip.
//
// Input (JSON body):
//   {
//     setupIntentId: "seti_...",       // required
//     account: "try" | "book",         // required — which Stripe acct
//     customerId?: "<supabase uuid>",  // optional (looked up by Stripe id)
//     email?: "jane@example.com"       // optional (helps when customerId missing)
//   }
//
// Response:
//   {
//     success: true,
//     cardOnFile: true,
//     card: { brand, last4, expMonth, expYear },
//     account: "try" | "book",
//     stripeCustomerId: "cus_..."
//   }

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  requireStripeSecretKey,
  type StripeAccountSlug,
} from "../_shared/stripe-env.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, data?: unknown) =>
  console.log(
    `[confirm-saved-card] ${step}`,
    data !== undefined ? JSON.stringify(data) : "",
  );

function coerceSlug(raw: unknown): StripeAccountSlug {
  return raw === "book" ? "book" : "try";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const setupIntentId: string | undefined = body?.setupIntentId;
    const accountSlug = coerceSlug(body?.account);
    const supabaseCustomerId: string | undefined = body?.customerId;
    const email: string | undefined = body?.email;

    if (!setupIntentId || !setupIntentId.startsWith("seti_")) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing or invalid setupIntentId.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    log("Request received", {
      setupIntentId,
      accountSlug,
      supabaseCustomerId,
      email,
    });

    const secretKey = requireStripeSecretKey(accountSlug);
    const stripe = new Stripe(secretKey, { apiVersion: "2023-10-16" });

    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId, {
      expand: ["payment_method"],
    });

    if (setupIntent.status !== "succeeded") {
      return new Response(
        JSON.stringify({
          success: false,
          error: `SetupIntent is not yet succeeded (status: ${setupIntent.status}). Card was not saved.`,
          status: setupIntent.status,
        }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const stripeCustomerId =
      typeof setupIntent.customer === "string"
        ? setupIntent.customer
        : (setupIntent.customer as any)?.id;
    const pm =
      typeof setupIntent.payment_method === "string"
        ? null
        : (setupIntent.payment_method as any);
    const paymentMethodId =
      typeof setupIntent.payment_method === "string"
        ? setupIntent.payment_method
        : pm?.id;

    if (!stripeCustomerId || !paymentMethodId) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "SetupIntent succeeded but no PaymentMethod / Customer is attached — cannot save card.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // === Promote PM to Customer default ===
    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
    log("Default PM set on Stripe Customer", {
      stripeCustomerId,
      paymentMethodId,
    });

    // === Mirror onto Supabase customers row ===
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    let customerRowId = supabaseCustomerId ?? null;
    if (!customerRowId && email) {
      const { data } = await supabase
        .from("customers")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      customerRowId = data?.id ?? null;
    }
    if (!customerRowId) {
      const { data } = await supabase
        .from("customers")
        .select("id")
        .eq("stripe_customer_id", stripeCustomerId)
        .maybeSingle();
      customerRowId = data?.id ?? null;
    }

    if (customerRowId) {
      await supabase
        .from("customers")
        .update({
          stripe_customer_id: stripeCustomerId,
          stripe_default_payment_method_id: paymentMethodId,
          stripe_card_on_file: true,
          stripe_card_on_file_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", customerRowId);
    } else {
      log("No matching customers row to update", {
        stripeCustomerId,
        paymentMethodId,
      });
    }

    // Fetch the PaymentMethod for card brand / last4 to echo back.
    let card: {
      brand?: string;
      last4?: string;
      expMonth?: number;
      expYear?: number;
    } = {};
    if (pm?.card) {
      card = {
        brand: pm.card.brand,
        last4: pm.card.last4,
        expMonth: pm.card.exp_month,
        expYear: pm.card.exp_year,
      };
    } else {
      try {
        const fetched = await stripe.paymentMethods.retrieve(paymentMethodId);
        if (fetched.card) {
          card = {
            brand: fetched.card.brand,
            last4: fetched.card.last4,
            expMonth: fetched.card.exp_month,
            expYear: fetched.card.exp_year,
          };
        }
      } catch (err: any) {
        log("Failed to retrieve PaymentMethod card details (non-fatal)", {
          error: err?.message || String(err),
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        cardOnFile: true,
        card,
        account: accountSlug,
        stripeCustomerId,
        paymentMethodId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    const msg = error?.message || String(error);
    log("ERROR", { message: msg });
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
