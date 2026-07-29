// booking-pay-page — the only way to turn a pay token into a payment.
//
// Backs /pay/<token>. Public by design: the 40-char token IS the
// credential, which is why this function exists at all. The page it
// replaces queried `bookings` directly from the browser using the anon
// key and a raw booking UUID, so anyone with an id could read a
// customer's name, address and price. Booking ids appear in webhooks,
// logs and admin URLs; they are identifiers, not secrets.
//
// Everything here is deliberately narrow:
//   * A token resolves to exactly one booking, or nothing.
//   * The response contains only what the pay page renders — no ids
//     beyond the booking id the client already holds, no tokens, no
//     Stripe customer, no internal notes.
//   * Cancelled bookings refuse to take money.
//   * The deposit PaymentIntent is created server-side, so the amount
//     cannot be tampered with from the browser.
//
// Actions:
//   get    — booking summary for rendering
//   intent — create (or reuse) the deposit PaymentIntent
//
// The PaymentIntent saves the card (`setup_future_usage: 'off_session'`).
// That is what later lets `authorize-booking-balance` place the
// pre-authorization hold for the remaining balance without the customer
// present, and `capture-booking-balance` collect it after the clean.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { getStripeSecretKey, slugFromCustomerLocation } from "../_shared/stripe-env.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, data?: unknown) =>
  console.log(`[booking-pay-page] ${step}`, data !== undefined ? JSON.stringify(data) : "");

/** Reject anything that clearly isn't a minted token before touching the DB. */
function isPlausibleToken(token: unknown): token is string {
  return typeof token === "string" && /^[a-f0-9]{32,64}$/.test(token);
}

const BOOKING_COLUMNS = [
  "id",
  "customer_id",
  "status",
  "payment_status",
  "service_type",
  "offer_name",
  "service_date",
  "time_slot",
  "address_line1",
  "address_line2",
  "zip_code",
  "full_name",
  "est_price",
  "deposit_amount",
  "balance_due",
  "paid_at",
  "stripe_payment_intent_id",
  "stripe_account_slug",
].join(", ");

interface BookingRow {
  id: string;
  customer_id: string | null;
  status: string | null;
  payment_status: string | null;
  service_type: string | null;
  offer_name: string | null;
  service_date: string | null;
  time_slot: string | null;
  address_line1: string | null;
  address_line2: string | null;
  zip_code: string | null;
  full_name: string | null;
  est_price: number | string | null;
  deposit_amount: number | string | null;
  balance_due: number | string | null;
  paid_at: string | null;
  stripe_payment_intent_id: string | null;
  stripe_account_slug: string | null;
}

const TIME_SLOT_WINDOWS: Record<string, string> = {
  early_morning: "7–9 AM",
  morning: "9–11 AM",
  late_morning: "11 AM–1 PM",
  afternoon: "1–3 PM",
  late_afternoon: "3–5 PM",
  evening: "5–7 PM",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const { action, token } = await req.json();

    if (!isPlausibleToken(token)) return json({ error: "not_found" }, 404);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data: bookingRow } = await supabase
      .from("bookings")
      .select(BOOKING_COLUMNS)
      .eq("pay_page_token", token)
      .maybeSingle();

    // Same response for "no such token" and "revoked" — never confirm
    // that a token was ever valid.
    if (!bookingRow) return json({ error: "not_found" }, 404);
    const booking = bookingRow as unknown as BookingRow;

    if (booking.status === "cancelled") {
      return json({ error: "cancelled", message: "This booking has been cancelled." }, 410);
    }

    const { data: customer } = booking.customer_id
      ? await supabase
        .from("customers")
        .select("email, first_name, last_name, phone, state, postal_code")
        .eq("id", booking.customer_id)
        .maybeSingle()
      : { data: null };

    const total = Number(booking.est_price) || 0;
    const depositDue = Number(booking.deposit_amount) || total;
    const alreadyPaid = Boolean(booking.paid_at) ||
      ["paid", "deposit_paid"].includes(String(booking.payment_status || ""));

    const summary = {
      bookingId: booking.id,
      reference: `AL-${String(booking.id).slice(0, 8).toUpperCase()}`,
      customerName: booking.full_name ||
        [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") || null,
      serviceLabel: booking.offer_name || booking.service_type || "Cleaning",
      serviceDate: booking.service_date,
      timeWindow: booking.time_slot
        ? TIME_SLOT_WINDOWS[booking.time_slot] || booking.time_slot
        : null,
      address: [booking.address_line1, booking.address_line2, booking.zip_code]
        .filter(Boolean).join(", ") || null,
      total,
      depositDue,
      balanceDue: Number(booking.balance_due) || Math.max(0, total - depositDue),
      paid: alreadyPaid,
    };

    if (action === "get") return json({ success: true, booking: summary });

    if (action !== "intent") return json({ error: "unknown_action" }, 400);

    // ─── Create or reuse the deposit PaymentIntent ────────────────────
    if (alreadyPaid) return json({ error: "already_paid" }, 409);

    const amountCents = Math.round(depositDue * 100);
    if (amountCents <= 0) return json({ error: "nothing_due" }, 400);

    // Route to the Stripe account that owns this customer's market.
    const slug = booking.stripe_account_slug
      ? (String(booking.stripe_account_slug).includes("book") ? "book" : "try")
      : slugFromCustomerLocation(customer?.state, customer?.postal_code || booking.zip_code) ?? "try";
    const stripeKey = getStripeSecretKey(slug);
    if (!stripeKey) {
      log("no stripe key", { slug });
      return json({ error: "stripe_not_configured" }, 500);
    }
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Reuse an in-flight intent rather than stacking abandoned ones on
    // the customer — a refreshed page should resume, not duplicate.
    if (booking.stripe_payment_intent_id) {
      try {
        const existing = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id);
        const resumable = ["requires_payment_method", "requires_confirmation", "requires_action"];
        if (resumable.includes(existing.status) && existing.amount === amountCents) {
          return json({
            success: true,
            clientSecret: existing.client_secret,
            amount: amountCents,
            reused: true,
          });
        }
      } catch (_) { /* fall through and mint a new one */ }
    }

    let stripeCustomerId: string | undefined;
    if (customer?.email) {
      const found = await stripe.customers.list({ email: customer.email, limit: 1 });
      stripeCustomerId = found.data[0]?.id ??
        (await stripe.customers.create({
          email: customer.email,
          name: summary.customerName || undefined,
          phone: customer.phone || undefined,
        })).id;
    }

    const pi = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      customer: stripeCustomerId,
      // Saving the card here is what makes the later balance hold
      // possible without the customer present.
      setup_future_usage: "off_session",
      automatic_payment_methods: { enabled: true },
      receipt_email: customer?.email || undefined,
      description: `${summary.reference} — Deposit for ${summary.serviceLabel}`,
      metadata: {
        booking_id: booking.id,
        purpose: "deposit_preauth",
        source: "pay_page",
      },
    });

    await supabase
      .from("bookings")
      .update({ stripe_payment_intent_id: pi.id })
      .eq("id", booking.id);

    log("intent created", { bookingId: booking.id, amountCents, slug });

    return json({
      success: true,
      clientSecret: pi.client_secret,
      amount: amountCents,
      publishableKeySlug: slug,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log("ERROR", { message });
    return new Response(JSON.stringify({ error: "server_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
