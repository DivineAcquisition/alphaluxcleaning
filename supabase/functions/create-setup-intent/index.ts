// create-setup-intent — back-end for the customer-facing "Save a
// card on file" page (/save-card). Mirrors the same dual-account
// routing the booking flow uses (NY → try, CA+TX → book), but works
// without a booking: the customer enters email + name + optional
// zip/state and we provision a Stripe Customer + SetupIntent so
// Stripe Elements can collect a card off-session.
//
// On success the front-end calls `confirm-saved-card` (separate
// edge function) which promotes the new PaymentMethod to the
// Customer's default and stamps the result onto our customers row.
//
// Account routing priority (most authoritative first):
//   1. customerData.state (NY → try, CA/TX → book)
//   2. customerData.zip prefix (same ranges /book/zip validates)
//   3. body.account override (legacy / dev)
//   4. Origin / Referer / Host headers
//   5. Falls through to `try` (legacy default)
//
// Input (JSON body):
//   {
//     email:       "jane@example.com",        // required
//     firstName?:  "Jane",
//     lastName?:   "Doe",
//     phone?:      "5555551234",
//     state?:      "NY",                      // 2-letter US state
//     zip?:        "11221",
//     account?:    "try" | "book"             // override (rare)
//   }
//
// Response:
//   {
//     success: true,
//     clientSecret: "seti_..._secret_...",
//     setupIntentId: "seti_...",
//     publishableKey: "pk_live_...",
//     account: "try" | "book",
//     stripeCustomerId: "cus_...",
//     customerId: "<supabase customers.id>"
//   }

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  bookingColumnFromSlug,
  getStripePublishableKey,
  requireStripeSecretKey,
  resolveStripeAccount,
  slugFromCustomerLocation,
  type StripeAccountSlug,
} from "../_shared/stripe-env.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, data?: unknown) =>
  console.log(
    `[create-setup-intent] ${step}`,
    data !== undefined ? JSON.stringify(data) : "",
  );

function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().toLowerCase();
  return /^\S+@\S+\.\S+$/.test(trimmed) ? trimmed : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const {
      firstName,
      lastName,
      phone,
      state,
      zip,
      account: accountOverride,
    } = body;
    const email = normalizeEmail(body?.email);

    if (!email) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "A valid email address is required to save a card on file.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    log("Request received", { email, state, zip, accountOverride });

    // STRICT state-based routing — same priority chain as
    // create-payment-intent.
    const stateSlug = slugFromCustomerLocation(state, zip);
    let accountSlug: StripeAccountSlug;
    let routingSource: "state" | "zip" | "override" | "host";
    if (stateSlug) {
      accountSlug = stateSlug;
      routingSource = state ? "state" : "zip";
    } else {
      accountSlug = resolveStripeAccount(req, accountOverride);
      routingSource = accountOverride ? "override" : "host";
    }
    const accountColumnValue = bookingColumnFromSlug(accountSlug);

    log("Resolved Stripe account", {
      slug: accountSlug,
      routingSource,
      bookingColumn: accountColumnValue,
    });

    let secretKey: string;
    try {
      secretKey = requireStripeSecretKey(accountSlug);
    } catch (err: any) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Our payment processor is temporarily unavailable. Please try again in a moment.",
          code: "stripe_secret_missing",
          details: err?.message || String(err),
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    const publishableKey = getStripePublishableKey(accountSlug);

    const stripe = new Stripe(secretKey, { apiVersion: "2023-10-16" });

    // Service-role Supabase client so we can upsert into customers
    // even though the page is unauthenticated.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    // === Upsert our customers row ===
    //
    // Email is the natural key. We don't overwrite name fields if
    // the caller didn't provide them — preserves existing data on
    // returning customers.
    let customerId: string | null = null;
    const { data: existing } = await supabase
      .from("customers")
      .select("id, stripe_customer_id, first_name, last_name, phone, state, postal_code")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      customerId = existing.id;
      const updatePayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (firstName) updatePayload.first_name = firstName;
      if (lastName) updatePayload.last_name = lastName;
      if (firstName || lastName) {
        updatePayload.name = [
          firstName ?? existing.first_name,
          lastName ?? existing.last_name,
        ]
          .filter(Boolean)
          .join(" ")
          .trim();
      }
      if (phone) updatePayload.phone = phone;
      if (state) updatePayload.state = state;
      if (zip) updatePayload.postal_code = zip;
      if (Object.keys(updatePayload).length > 1) {
        await supabase.from("customers").update(updatePayload).eq("id", existing.id);
      }
    } else {
      const { data: created, error: insertErr } = await supabase
        .from("customers")
        .insert({
          email,
          first_name: firstName || null,
          last_name: lastName || null,
          name:
            [firstName, lastName].filter(Boolean).join(" ").trim() || email,
          phone: phone || null,
          state: state || null,
          postal_code: zip || null,
        })
        .select("id")
        .single();
      if (insertErr) {
        log("Customer insert failed", { error: insertErr.message });
        throw new Error(`Failed to create customer: ${insertErr.message}`);
      }
      customerId = created.id;
    }

    // === Find or create the Stripe Customer on the resolved account ===
    //
    // Per-account Stripe Customer IDs: a customer on the BOOK
    // account is a different Stripe object than the same email on
    // the TRY account. We always query Stripe by email for the
    // right account; the customers.stripe_customer_id column is a
    // best-effort cache (it may hold a try-account id even if this
    // request is on book — we just overwrite it for the most
    // recent account in use).
    let stripeCustomerId: string;
    const stripeCustomers = await stripe.customers.list({ email, limit: 1 });
    if (stripeCustomers.data.length > 0) {
      stripeCustomerId = stripeCustomers.data[0].id;
      log("Found existing Stripe Customer", { stripeCustomerId, slug: accountSlug });
    } else {
      const created = await stripe.customers.create({
        email,
        name:
          [firstName, lastName].filter(Boolean).join(" ").trim() || undefined,
        phone: phone || undefined,
        metadata: {
          supabase_customer_id: customerId || "",
          source: "save_card_page",
          account_slug: accountSlug,
        },
      });
      stripeCustomerId = created.id;
      log("Created new Stripe Customer", { stripeCustomerId, slug: accountSlug });
    }

    if (customerId) {
      await supabase
        .from("customers")
        .update({
          stripe_customer_id: stripeCustomerId,
        })
        .eq("id", customerId);
    }

    // === SetupIntent — collect card off-session for future charges ===
    //
    // `usage: 'off_session'` means we plan to charge the card later
    // without the customer present (balance invoices, recurring
    // visits 2+3, etc.). This is the off-session equivalent of
    // setup_future_usage on a PaymentIntent.
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      usage: "off_session",
      metadata: {
        supabase_customer_id: customerId || "",
        account_slug: accountSlug,
        source: "save_card_page",
      },
    });

    log("SetupIntent created", {
      id: setupIntent.id,
      slug: accountSlug,
    });

    return new Response(
      JSON.stringify({
        success: true,
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id,
        publishableKey,
        account: accountSlug,
        stripeCustomerId,
        customerId,
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
