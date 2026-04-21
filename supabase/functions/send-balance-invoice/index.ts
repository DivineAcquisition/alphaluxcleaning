import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, data?: any) =>
  console.log(`[send-balance-invoice] ${step}`, data ? JSON.stringify(data) : "");

/**
 * Creates + finalizes + emails a Stripe invoice for the remaining
 * balance on a booking. The invoice item is explicitly bound to the
 * invoice id to avoid the "pending items pool" race that was
 * finalizing invoices at $0.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { bookingId, daysUntilDue = 7 } = await req.json();
    if (!bookingId) throw new Error("Missing required field: bookingId");

    const stripeKey =
      Deno.env.get("STRIPE_SECRET_KEY") ||
      Deno.env.get("STRIPE_SECRET_KEY_ALPHALUX") ||
      Deno.env.get("STRIPE_RESTRICTED_KEY");
    if (!stripeKey) throw new Error("Stripe secret key not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
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

    const balanceCents = Math.round(Number(booking.balance_due) * 100);

    // Create the invoice FIRST so we can bind the invoice item to it
    // explicitly. Relying on Stripe's "pending items pool" flow is
    // racy — if `auto_advance` fires before the item attaches the
    // invoice can finalize at $0.
    const invoice = await stripe.invoices.create({
      customer: stripeCustomerId,
      collection_method: "send_invoice",
      days_until_due: daysUntilDue,
      auto_advance: false,
      metadata: {
        booking_id: bookingId,
        customer_id: customer.id,
        invoice_type: "balance_due",
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

    const sent = await stripe.invoices.sendInvoice(invoice.id);

    await supabase
      .from("bookings")
      .update({
        stripe_balance_invoice_id: sent.id,
        balance_invoice_url: sent.hosted_invoice_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    return new Response(
      JSON.stringify({
        success: true,
        invoiceId: sent.id,
        hostedInvoiceUrl: sent.hosted_invoice_url,
        amount: booking.balance_due,
        customerEmail: customer.email,
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
