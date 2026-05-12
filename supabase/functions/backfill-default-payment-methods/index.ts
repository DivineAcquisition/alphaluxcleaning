import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  requireStripeSecretKey,
  slugFromBookingColumn,
  type StripeAccountSlug,
} from "../_shared/stripe-env.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, data?: unknown) =>
  console.log(
    `[backfill-default-payment-methods] ${step}`,
    data ? JSON.stringify(data) : "",
  );

/**
 * One-shot ops tool: walks every paid booking, checks each linked
 * Stripe Customer, and promotes their most-recently-attached card to
 * `invoice_settings.default_payment_method` so future invoices
 * (balance invoices, recurring visits, upsells) auto-charge instead
 * of falling back to the hosted-invoice email path.
 *
 * Need this because earlier deploys only attached cards to the
 * Customer (via setup_future_usage='off_session') without promoting
 * them to default. Customers paid their deposit, their card landed
 * on the Stripe Customer object — but neither stripe-webhook nor
 * send-balance-invoice could use it.
 *
 * Idempotent: skips Customers that already have a default PM or no
 * attached PMs. Safe to re-run.
 *
 * Per-account aware: each booking's `stripe_account_slug` is used to
 * pick the right Stripe secret (try vs book).
 *
 * Invocation:
 *   curl -X POST https://<project>.functions.supabase.co/backfill-default-payment-methods
 *     -H 'Authorization: Bearer <SERVICE_ROLE_KEY>'
 *     -H 'Content-Type: application/json'
 *     -d '{"limit": 500, "dryRun": false}'
 *
 * Returns a summary with per-Customer outcomes for ops visibility.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { limit = 500, dryRun = false } = await req
      .json()
      .catch(() => ({}));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    log("Starting backfill", { limit, dryRun });

    // Pull every customer that paid for at least one booking on a
    // known account slug. We don't filter on `stripe_card_on_file`
    // here because the column may not have been populated yet —
    // we'd skip exactly the customers we need to backfill.
    const { data: customers, error } = await supabase
      .from("customers")
      .select(
        "id, email, stripe_customer_id, stripe_default_payment_method_id, stripe_card_on_file",
      )
      .not("stripe_customer_id", "is", null)
      .limit(limit);

    if (error) throw new Error(`Customer query failed: ${error.message}`);

    log("Customers eligible for backfill", { count: customers?.length || 0 });

    // For each customer figure out which account their bookings ran
    // on. A customer paying on both accounts (legacy NY booking then
    // a CA move-in re-booking) is rare but possible — we walk each
    // distinct slug and promote the card on each side.
    const summary = {
      total: customers?.length || 0,
      already_default: 0,
      promoted: 0,
      no_card: 0,
      errors: [] as Array<{ customerId: string; error: string }>,
      details: [] as Array<{
        customerId: string;
        email: string;
        slug: StripeAccountSlug;
        outcome:
          | "already_default"
          | "promoted"
          | "no_card"
          | "error";
        paymentMethodId?: string;
        message?: string;
      }>,
    };

    for (const c of customers || []) {
      try {
        // Which slug did this customer pay against? Pull the most
        // recent paid booking; default to "try" if none on file.
        const { data: bookings } = await supabase
          .from("bookings")
          .select("stripe_account_slug, paid_at")
          .eq("customer_id", c.id)
          .not("paid_at", "is", null)
          .order("paid_at", { ascending: false })
          .limit(1);

        const slug: StripeAccountSlug = bookings?.length
          ? slugFromBookingColumn(bookings[0].stripe_account_slug)
          : "try";

        let secretKey: string;
        try {
          secretKey = requireStripeSecretKey(slug);
        } catch (err: any) {
          summary.errors.push({
            customerId: c.id,
            error: `No secret key for slug=${slug}: ${err?.message || err}`,
          });
          summary.details.push({
            customerId: c.id,
            email: c.email,
            slug,
            outcome: "error",
            message: `Missing STRIPE_SECRET_KEY_${slug.toUpperCase()}`,
          });
          continue;
        }

        const stripe = new Stripe(secretKey, { apiVersion: "2023-10-16" });

        // What's the current state on Stripe?
        const sc = await stripe.customers.retrieve(c.stripe_customer_id);
        if ("deleted" in sc && sc.deleted) {
          summary.details.push({
            customerId: c.id,
            email: c.email,
            slug,
            outcome: "no_card",
            message: "Stripe customer deleted",
          });
          summary.no_card += 1;
          continue;
        }

        const explicit =
          (sc as any)?.invoice_settings?.default_payment_method;
        const existingDefault =
          typeof explicit === "string" ? explicit : explicit?.id || null;

        if (existingDefault) {
          if (!dryRun) {
            await supabase
              .from("customers")
              .update({
                stripe_default_payment_method_id: existingDefault,
                stripe_card_on_file: true,
                stripe_card_on_file_at:
                  c.stripe_card_on_file ? undefined : new Date().toISOString(),
              })
              .eq("id", c.id);
          }
          summary.already_default += 1;
          summary.details.push({
            customerId: c.id,
            email: c.email,
            slug,
            outcome: "already_default",
            paymentMethodId: existingDefault,
          });
          continue;
        }

        // No default — see if there's an attached card we can promote.
        const pms = await stripe.paymentMethods.list({
          customer: c.stripe_customer_id,
          type: "card",
          limit: 1,
        });

        if (!pms.data.length) {
          summary.no_card += 1;
          summary.details.push({
            customerId: c.id,
            email: c.email,
            slug,
            outcome: "no_card",
            message: "No attached cards on Stripe Customer",
          });
          continue;
        }

        const pmId = pms.data[0].id;
        if (!dryRun) {
          await stripe.customers.update(c.stripe_customer_id, {
            invoice_settings: { default_payment_method: pmId },
          });
          await supabase
            .from("customers")
            .update({
              stripe_default_payment_method_id: pmId,
              stripe_card_on_file: true,
              stripe_card_on_file_at: new Date().toISOString(),
            })
            .eq("id", c.id);
        }

        summary.promoted += 1;
        summary.details.push({
          customerId: c.id,
          email: c.email,
          slug,
          outcome: "promoted",
          paymentMethodId: pmId,
        });
      } catch (err: any) {
        const message = err?.message || String(err);
        summary.errors.push({ customerId: c.id, error: message });
        summary.details.push({
          customerId: c.id,
          email: c.email,
          slug: "try",
          outcome: "error",
          message,
        });
      }
    }

    log("Backfill complete", {
      total: summary.total,
      already_default: summary.already_default,
      promoted: summary.promoted,
      no_card: summary.no_card,
      errors: summary.errors.length,
      dryRun,
    });

    return new Response(JSON.stringify({ success: true, dryRun, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { msg });
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
