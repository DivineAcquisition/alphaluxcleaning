import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  requireStripeSecretKey,
  slugFromBookingColumn,
} from "../_shared/stripe-env.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, data?: any) =>
  console.log(`[send-balance-invoice] ${step}`, data ? JSON.stringify(data) : "");

/**
 * Creates + finalizes + emails a Stripe invoice for the remaining
 * balance on a booking. Single-account version — every booking is
 * processed on the AlphaLux NY Stripe account.
 *
 * The invoice item is explicitly bound to the invoice id to avoid
 * the "pending items pool" race that was finalizing invoices at $0.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { bookingId, daysUntilDue = 7 } = await req.json();
    if (!bookingId) throw new Error("Missing required field: bookingId");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*, customers!bookings_customer_id_fkey(*)")
      .eq("id", bookingId)
      .single();
    if (error || !booking) {
      throw new Error(`Booking not found: ${error?.message || "unknown"}`);
    }

    // Honor the account stamped on the booking row at checkout time
    // so the balance invoice runs through the same Stripe account
    // that holds the saved card from the deposit. This is critical
    // for the `book.alphaluxclean.com` flow — its saved cards live
    // on the BOOK Stripe account and would not be charge-able from
    // the legacy try account.
    const bookingSlug = slugFromBookingColumn(booking.stripe_account_slug);
    log("Using Stripe account from booking", {
      slug: bookingSlug,
      column: booking.stripe_account_slug,
    });

    let secretKey: string;
    try {
      secretKey = requireStripeSecretKey(bookingSlug);
    } catch (err: any) {
      throw new Error(
        err?.message ||
          (bookingSlug === "book"
            ? "Stripe secret key for the BOOK account is not configured. Set STRIPE_SECRET_KEY_BOOK in Supabase secrets."
            : "Stripe secret key not configured. Set STRIPE_SECRET_KEY in Supabase secrets."),
      );
    }

    const stripe = new Stripe(secretKey, { apiVersion: "2023-10-16" });

    if (!booking.balance_due || booking.balance_due <= 0) {
      return new Response(
        JSON.stringify({ success: true, skipped: true, message: "No balance due" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    if (booking.stripe_balance_invoice_id) {
      return new Response(
        JSON.stringify({
          success: true,
          skipped: true,
          invoiceId: booking.stripe_balance_invoice_id,
          hostedInvoiceUrl: booking.balance_invoice_url,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const customer = booking.customers;
    if (!customer) throw new Error("Customer data not found for booking");

    let stripeCustomerId = customer.stripe_customer_id;
    if (!stripeCustomerId) {
      const sc = await stripe.customers.create({
        email: customer.email,
        name:
          customer.name ||
          `${customer.first_name || ""} ${customer.last_name || ""}`.trim(),
        phone: customer.phone,
        metadata: { customer_id: customer.id },
      });
      stripeCustomerId = sc.id;
      await supabase
        .from("customers")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", customer.id);
    }

    // Resolve a default PaymentMethod for off-session charging.
    //
    // Priority:
    //   1. The Stripe Customer's own `invoice_settings.default_payment_method`
    //      (set by stripe-webhook / confirm-booking-payment after the
    //      deposit succeeds).
    //   2. The most-recently-attached card on the Customer (covers
    //      bookings paid before we wired up the default-promotion
    //      step — we self-heal by promoting the existing card on the
    //      fly).
    //   3. None — fall back to the legacy hosted-invoice email path
    //      so the customer can still pay manually.
    let defaultPaymentMethodId: string | null = null;
    try {
      const stripeCustomer = await stripe.customers.retrieve(stripeCustomerId);
      if (!("deleted" in stripeCustomer) || !stripeCustomer.deleted) {
        const explicit =
          (stripeCustomer as any)?.invoice_settings?.default_payment_method;
        defaultPaymentMethodId =
          typeof explicit === "string" ? explicit : explicit?.id || null;
      }
      if (!defaultPaymentMethodId) {
        const pms = await stripe.paymentMethods.list({
          customer: stripeCustomerId,
          type: "card",
          limit: 1,
        });
        if (pms.data.length) {
          defaultPaymentMethodId = pms.data[0].id;
          // Self-heal: promote the attached card so future invoices
          // skip this lookup.
          await stripe.customers.update(stripeCustomerId, {
            invoice_settings: { default_payment_method: defaultPaymentMethodId },
          });
          await supabase
            .from("customers")
            .update({
              stripe_default_payment_method_id: defaultPaymentMethodId,
              stripe_card_on_file: true,
              stripe_card_on_file_at: new Date().toISOString(),
            })
            .eq("id", customer.id);
          log("Self-healed default PM from attached card list", {
            stripeCustomerId,
            paymentMethodId: defaultPaymentMethodId,
          });
        }
      }
    } catch (err: any) {
      log("Failed to resolve default PM (will fall back to send_invoice)", {
        error: err?.message || String(err),
      });
    }

    const balanceCents = Math.round(Number(booking.balance_due) * 100);
    const useAutoCharge = Boolean(defaultPaymentMethodId);

    // Create the invoice FIRST so we can bind the invoice item to it
    // explicitly. Relying on Stripe's "pending items pool" flow is
    // racy — if `auto_advance` fires before the item attaches the
    // invoice can finalize at $0.
    //
    // When a default PaymentMethod is on file we use
    // `collection_method: 'charge_automatically'` so Stripe charges
    // the saved card off-session as soon as the invoice finalizes.
    // No more "hosted invoice link email" for the customer — they
    // see a receipt for the auto-charge instead.
    const invoice = await stripe.invoices.create({
      customer: stripeCustomerId,
      collection_method: useAutoCharge ? "charge_automatically" : "send_invoice",
      ...(useAutoCharge
        ? {
            default_payment_method: defaultPaymentMethodId!,
            // `auto_advance: true` tells Stripe to finalize and
            // charge the invoice as soon as it's ready. Combined
            // with `charge_automatically`, this is the off-session
            // charge of the saved card.
            auto_advance: true,
          }
        : {
            days_until_due: daysUntilDue,
            auto_advance: false,
          }),
      metadata: {
        booking_id: bookingId,
        customer_id: customer.id,
        invoice_type: "balance_due",
        charge_mode: useAutoCharge ? "auto" : "manual",
      },
      description: `Balance due for your cleaning service on ${booking.service_date || "scheduled date"}`,
    });

    await stripe.invoiceItems.create({
      customer: stripeCustomerId,
      invoice: invoice.id,
      amount: balanceCents,
      currency: "usd",
      description: `Remaining balance for ${booking.service_type || "cleaning"} service - Booking #${booking.id.substring(0, 8)}`,
      metadata: {
        booking_id: bookingId,
        customer_id: customer.id,
        invoice_type: "balance_due",
      },
    });

    const finalized = await stripe.invoices.finalizeInvoice(invoice.id);
    if (finalized.total === 0) {
      await stripe.invoices.voidInvoice(invoice.id).catch(() => {});
      throw new Error(
        `Invoice finalized at $0 — the invoice item did not attach. Booking id ${bookingId}.`,
      );
    }

    // For auto-charge invoices, finalize already triggers the charge
    // attempt via `auto_advance: true`. For send_invoice we still
    // explicitly email the hosted link so the customer can pay.
    let invoiceForResponse = finalized;
    if (!useAutoCharge) {
      invoiceForResponse = await stripe.invoices.sendInvoice(invoice.id);
    } else {
      // Re-fetch so we surface the post-charge state (paid / pending /
      // requires_action) to the caller and log it.
      try {
        invoiceForResponse = await stripe.invoices.retrieve(invoice.id);
        log("Auto-charge invoice status after finalize", {
          invoiceId: invoiceForResponse.id,
          status: invoiceForResponse.status,
          amountPaid: invoiceForResponse.amount_paid,
          paid: invoiceForResponse.paid,
        });
      } catch (err: any) {
        log("Failed to re-retrieve invoice after finalize (non-fatal)", {
          error: err?.message || String(err),
        });
      }
    }

    await supabase
      .from("bookings")
      .update({
        stripe_balance_invoice_id: invoiceForResponse.id,
        balance_invoice_url: invoiceForResponse.hosted_invoice_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    return new Response(
      JSON.stringify({
        success: true,
        invoiceId: invoiceForResponse.id,
        hostedInvoiceUrl: invoiceForResponse.hosted_invoice_url,
        amount: booking.balance_due,
        customerEmail: customer.email,
        chargeMode: useAutoCharge ? "auto" : "manual",
        invoiceStatus: invoiceForResponse.status,
        paid: invoiceForResponse.paid,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { msg });
    return new Response(
      JSON.stringify({ error: msg, success: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
