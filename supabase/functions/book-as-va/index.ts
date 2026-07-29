// ─── book-as-va ──────────────────────────────────────────────────────────
//
// Internal booking endpoint (ported from the Novara internal booking
// system, molded for AlphaLux). Admins/VAs hit this from the admin
// workspace when they finish a call. Atomically:
//
//   1. Verify the caller is an active admin (admin_users)
//   2. Upsert the customer row — including city/state, which drive the
//      support number the customer is given and the Stripe account
//      routing
//   3. Insert the booking row with canonical pricing + schedule fields
//   4. Sync the job into HOUSECALL PRO via hcp-sync-booking — HCP is
//      the ops platform here, the job IS the schedule
//   5. Optionally create Stripe invoices on the customer's state-routed
//      Stripe account:
//        a) deposit invoice due today (default 25%, AlphaLux convention)
//        b) remaining-balance invoice due on the service date
//        or a single full-amount invoice ("full_now")
//   6. Push the booking into GOHIGHLEVEL via ghl-sync-booking (contact,
//      custom fields, tags, opportunity, calendar) — this is what fires
//      the automated GHL workflows for the internal rail
//   7. Send the branded confirmation email via booking-confirm-comms
//      (Resend) — the SMS flag is pre-claimed so the shared helper only
//      emails
//   8. Send the invoice-aware confirmation SMS through GOHIGHLEVEL so
//      it threads into the same CRM conversation as the workflow
//      messages, with the OpenPhone number for the customer's market
//      named in the copy as the support line
//   9. Return everything the VA needs to copy/paste invoice URLs to the
//      customer while still on the phone.
//
// Comms split (deliberate, see _shared/sms.ts):
//   internal rail (this function) — GoHighLevel sends, OpenPhone is the
//     support contact and the failover provider.
//   public rail (online booking interface) — OpenPhone sends, always.
//
// The retention triggers fire on the booking insert, so the customer's
// lifecycle clock (last/next booking) updates automatically and the
// lifecycle engine won't send reactivation touches to someone with an
// upcoming clean.
//
// Body (dollars, not cents — matching the AlphaLux schema):
//   firstName *required, lastName, email *required, phone *required
//   addressLine1, addressLine2, city, state, zipCode
//   sqftRange *required ('under_1000' .. '5000_plus')
//   offerType ('standard' | 'tester' | '90_day')  default 'standard'
//   bedrooms?, bathrooms?
//   frequency? ('one-time' | 'weekly' | 'biweekly' | 'monthly')
//   serviceDate *required (YYYY-MM-DD), timeSlot *required
//     ('early_morning' | 'morning' | 'late_morning' | 'afternoon' |
//      'late_afternoon' | 'evening')
//   priceOverride?: { total?: dollars, deposit?: dollars }
//   invoiceMode? 'deposit_plus_remaining' | 'full_now' | 'none'
//     (default 'deposit_plus_remaining')
//   depositPercent? 0..1 (default 0.25)
//   csrName?, specialInstructions?, promoCode?
//   sendConfirmationSms? bool (default true)
//
// Response: { booking, bookingRef, customerId, hcpJobId, totals,
//             depositInvoice?, remainingInvoice?, fullInvoice?,
//             smsResult, emailResult }

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { sendSms } from "../_shared/sms.ts";
import { toE164US } from "../_shared/phone-format.ts";
import { resolveSupportNumber, timezoneForState } from "../_shared/openphone.ts";
import {
  type Cadence,
  offerPrice,
  OFFERS,
  resolveHomeSizeId,
  splitTotal,
  tierFor,
  type InvoiceMode,
  type OfferId,
} from "../_shared/pricing-internal.ts";
import {
  slugFromCustomerLocation,
  getStripeSecretKey,
  bookingColumnFromSlug,
} from "../_shared/stripe-env.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const tail = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[BOOK-AS-VA] ${step}${tail}`);
};

// Pricing lives in ../_shared/pricing-internal.ts, the byte-identical
// mirror of the rate card the admin form quotes from. The superseded
// local table that used to sit here priced by sqft bucket and offer
// name, which no longer matches what the VA is shown.

// ─── Stripe + invoice helpers ───────────────────────────────────────
async function ensureStripeCustomer(
  stripe: Stripe,
  email: string,
  firstName: string,
  lastName: string,
  phoneE164: string | null,
  address: { line1?: string; city?: string; state?: string; postal_code?: string },
): Promise<string> {
  const found = await stripe.customers.list({ email, limit: 1 });
  if (found.data.length > 0) return found.data[0].id;
  const created = await stripe.customers.create({
    email,
    name: `${firstName || ""} ${lastName || ""}`.trim() || undefined,
    phone: phoneE164 || undefined,
    address: {
      line1: address.line1 || undefined,
      city: address.city || undefined,
      state: address.state || undefined,
      postal_code: address.postal_code || undefined,
      country: "US",
    },
  });
  return created.id;
}

async function createAndSendInvoice(
  stripe: Stripe,
  customerId: string,
  amountCents: number,
  description: string,
  daysUntilDue: number,
  metadata: Record<string, string>,
): Promise<{ invoiceId: string; hostedInvoiceUrl: string | null }> {
  await stripe.invoiceItems.create({
    customer: customerId,
    amount: amountCents,
    currency: "usd",
    description,
  });
  const invoice = await stripe.invoices.create({
    customer: customerId,
    collection_method: "send_invoice",
    days_until_due: daysUntilDue,
    pending_invoice_items_behavior: "include",
    description,
    metadata,
    auto_advance: true,
  });
  if (!invoice.id) throw new Error("Stripe did not return invoice id");
  const finalized = await stripe.invoices.finalizeInvoice(invoice.id, {
    auto_advance: true,
  });
  await stripe.invoices.sendInvoice(invoice.id);
  return {
    invoiceId: invoice.id,
    hostedInvoiceUrl: finalized.hosted_invoice_url || null,
  };
}

function daysUntil(dateStr: string): number {
  const [y, m, d] = String(dateStr).split("-").map(Number);
  if (!y || !m || !d) return 7;
  const target = Date.UTC(y, m - 1, d);
  const diff = Math.ceil((target - Date.now()) / 86_400_000);
  return Math.max(0, diff);
}

const TIME_SLOT_WINDOWS: Record<string, string> = {
  early_morning: "7–9 AM",
  morning: "9–11 AM",
  late_morning: "11 AM–1 PM",
  afternoon: "1–3 PM",
  late_afternoon: "3–5 PM",
  evening: "5–7 PM",
};

// ─── Main handler ───────────────────────────────────────────────────
interface InternalBookingBody {
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  /** Rate-card size id, e.g. "1501_2000". Preferred. */
  homeSizeId?: string;
  /** 'standard' | 'deep' | 'move_in_out' | 'bundle' | 'recurring'. */
  offerId?: OfferId;
  /** Only meaningful for the recurring offer. */
  cadence?: Cadence;
  accessNotes?: string;
  teamNotes?: string;
  propertyDetails?: Record<string, unknown>;
  /** Legacy fields kept so older callers keep working. */
  sqftRange?: string;
  offerType?: string;
  bedrooms?: string | number;
  bathrooms?: string | number;
  frequency?: string;
  serviceDate: string;
  timeSlot: string;
  priceOverride?: { total?: number; deposit?: number };
  invoiceMode?: "deposit_plus_remaining" | "full_now" | "none";
  depositPercent?: number;
  csrName?: string;
  specialInstructions?: string;
  promoCode?: string;
  sendConfirmationSms?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    // 0. Admin auth — same gate as csr-create-booking.
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("No authorization header");
    const jwt = authHeader.replace("Bearer ", "");

    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const { data: { user }, error: userError } = await supabaseAnon.auth.getUser(jwt);
    if (userError || !user) throw new Error("User not authenticated");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data: adminData, error: adminError } = await supabase
      .from("admin_users")
      .select("role, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();
    if (adminError || !adminData) throw new Error("User is not an admin");

    const body: InternalBookingBody = await req.json();
    const sizeId = body.homeSizeId || body.sqftRange;
    if (
      !body.firstName || !body.email || !body.phone || !sizeId ||
      !body.serviceDate || !body.timeSlot
    ) {
      return json(
        { error: "firstName, email, phone, homeSizeId, serviceDate, timeSlot are required" },
        400,
      );
    }

    // 1. Compute pricing from the SHARED rate card. This module is the
    //    byte-identical mirror of the one the admin form quotes from, so
    //    the number the VA reads on the phone is the number Stripe
    //    invoices. Never recompute a price here.
    const email = body.email.trim().toLowerCase();
    const phoneE164 = toE164US(body.phone) || null;
    const sizeIdResolved = resolveHomeSizeId(sizeId);
    const offerId: OfferId = body.offerId ||
      (body.offerType === "tester" ? "deep"
        : body.offerType === "move_in_out" ? "move_in_out"
        : "standard");
    const offerDef = OFFERS[offerId];
    const offer = {
      name: offerDef.label,
      type: offerDef.offerType,
      serviceType: offerDef.serviceType,
      visits: offerDef.visits,
    };
    // State matters: NY carries a 15% uplift in the funnel's rate card,
    // so a phone quote must apply it too or the website and the VA
    // disagree for the same house.
    const rateCardTotal = offerPrice(
      sizeIdResolved,
      offerId,
      body.state,
      body.cadence || "biweekly",
    );
    const listTotal = rateCardTotal;
    const total = typeof body.priceOverride?.total === "number" && body.priceOverride.total > 0
      ? Math.round(body.priceOverride.total * 100) / 100
      : rateCardTotal;
    const invoiceMode: InvoiceMode = body.invoiceMode || "deposit_plus_preauth";
    const depositPercent = typeof body.depositPercent === "number"
      ? Math.max(0, Math.min(1, body.depositPercent))
      : 0.5;
    const split = splitTotal(total, invoiceMode, depositPercent);
    const deposit = typeof body.priceOverride?.deposit === "number"
      ? Math.round(body.priceOverride.deposit * 100) / 100
      : split.deposit;
    const balance = Math.max(0, Math.round((total - deposit) * 100) / 100);

    const frequency = offerDef.isRecurring
      ? (body.cadence || "biweekly")
      : (body.frequency || "one-time");
    const isRecurring = offerDef.isRecurring ||
      ["weekly", "biweekly", "monthly"].includes(frequency);

    // 2. Upsert the customer row. City/state matter: they route the
    //    OpenPhone "from" number AND the Stripe account.
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    const customerFields = {
      first_name: body.firstName,
      last_name: body.lastName || "",
      name: `${body.firstName} ${body.lastName || ""}`.trim(),
      phone: body.phone,
      address_line1: body.addressLine1 || null,
      address_line2: body.addressLine2 || null,
      city: body.city || null,
      state: body.state || null,
      postal_code: body.zipCode || null,
    };
    let customerId: string;
    if (existingCustomer) {
      const { data, error } = await supabase
        .from("customers")
        .update(customerFields)
        .eq("id", existingCustomer.id)
        .select("id")
        .single();
      if (error) throw new Error(`Customer update failed: ${error.message}`);
      customerId = data.id;
    } else {
      const { data, error } = await supabase
        .from("customers")
        .insert({ email, ...customerFields })
        .select("id")
        .single();
      if (error) throw new Error(`Customer create failed: ${error.message}`);
      customerId = data.id;
    }
    logStep("customer ready", { customerId });

    // 3. Insert the booking row. Status is confirmed immediately for
    //    invoiced bookings (the VA collected commitment on the phone);
    //    "none" leaves it pending like Novara's pending_payment.
    const bookingStatus = invoiceMode === "none" ? "pending" : "confirmed";
    const stripeSlug = slugFromCustomerLocation(body.state, body.zipCode) ?? "try";
    const timezone = timezoneForState(body.state, body.zipCode);

    const { data: booking, error: bookErr } = await supabase
      .from("bookings")
      .insert({
        // NOTE: `bookings` has no email column — the address of record
        // lives on the linked customers row (joined via customer_id).
        customer_id: customerId,
        full_name: `${body.firstName} ${body.lastName || ""}`.trim(),
        address_line1: body.addressLine1 || null,
        address_line2: body.addressLine2 || null,
        zip_code: body.zipCode || null,
        sqft_or_bedrooms: sizeIdResolved,
        service_type: offer.serviceType,
        frequency,
        service_date: body.serviceDate,
        time_slot: body.timeSlot,
        est_price: total,
        base_price: listTotal,
        deposit_amount: deposit,
        balance_due: balance,
        offer_name: offer.name,
        offer_type: offer.type,
        visit_count: offer.visits,
        is_recurring: isRecurring,
        status: bookingStatus,
        payment_status: "pending",
        source: "internal_booking",
        created_by_user_id: user.id,
        special_instructions: body.specialInstructions || null,
        promo_code: body.promoCode ? body.promoCode.toUpperCase() : null,
        timezone,
        stripe_account_slug: bookingColumnFromSlug(stripeSlug),
        notes: body.csrName ? `Booked by ${body.csrName} (internal booking)` : "Internal booking",
        property_details: {
          bedrooms: body.bedrooms ?? null,
          bathrooms: body.bathrooms ?? null,
          home_size_id: sizeIdResolved,
          home_size_label: tierFor(sizeIdResolved)?.label ?? null,
          offer_id: offerId,
          cadence: offerDef.isRecurring ? (body.cadence || "biweekly") : null,
          state_multiplier_applied: body.state || null,
          dwelling_type: (body.propertyDetails as any)?.dwellingType ?? null,
          pets: (body.propertyDetails as any)?.pets ?? null,
          access_notes: body.accessNotes || null,
          team_notes: body.teamNotes || null,
          invoice_mode: invoiceMode,
          deposit_percent: depositPercent,
          booked_by: body.csrName || user.email || "admin",
        },
      })
      .select()
      .single();
    if (bookErr) throw new Error(`Booking insert failed: ${bookErr.message}`);
    const bookingId = booking.id as string;
    const bookingRef = `AL-${bookingId.slice(0, 8).toUpperCase()}`;
    logStep("booking created", { bookingId, bookingRef, status: bookingStatus });

    // 4. Stripe invoices on the customer's state-routed account.
    //    deposit_plus_remaining — deposit invoice due today + remaining
    //    invoice due on the service date. full_now — one invoice today.
    let depositInvoice: { invoiceId: string; hostedInvoiceUrl: string | null } | null = null;
    let remainingInvoice: { invoiceId: string; hostedInvoiceUrl: string | null } | null = null;
    let fullInvoice: { invoiceId: string; hostedInvoiceUrl: string | null } | null = null;
    let invoiceError: string | null = null;
    let payPageUrl: string | null = null;

    // deposit_plus_preauth doesn't raise an invoice at all. The customer
    // gets a tokenized pay link instead: they pay the deposit there and
    // the card is saved, which is the only way the balance hold can be
    // placed later without them present. The token — not the booking id —
    // is the credential for that page.
    if (invoiceMode === "deposit_plus_preauth" && total > 0) {
      const bytes = new Uint8Array(20);
      crypto.getRandomValues(bytes);
      const payToken = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const origin = Deno.env.get("BOOKING_ORIGIN") || "https://try.alphaluxcleaning.com";
      payPageUrl = `${origin}/pay/${payToken}`;
      const { error: tokenError } = await supabase
        .from("bookings")
        .update({ pay_page_token: payToken })
        .eq("id", bookingId);
      if (tokenError) {
        invoiceError = `Could not create the pay link: ${tokenError.message}`;
        payPageUrl = null;
      }
      logStep("pay link minted", { bookingId, ok: Boolean(payPageUrl) });
    }

    if (invoiceMode !== "none" && invoiceMode !== "deposit_plus_preauth" && total > 0) {
      const stripeKey = getStripeSecretKey(stripeSlug);
      if (stripeKey) {
        try {
          const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
          const stripeCustomerId = await ensureStripeCustomer(
            stripe, email, body.firstName, body.lastName || "", phoneE164,
            {
              line1: body.addressLine1,
              city: body.city,
              state: body.state,
              postal_code: body.zipCode,
            },
          );
          await supabase
            .from("customers")
            .update({ stripe_customer_id: stripeCustomerId })
            .eq("id", customerId);

          const svcLabel = `${offer.name} on ${body.serviceDate}`;
          if (invoiceMode === "deposit_plus_remaining") {
            if (deposit > 0) {
              depositInvoice = await createAndSendInvoice(
                stripe, stripeCustomerId, Math.round(deposit * 100),
                `${bookingRef} — Deposit for ${svcLabel}`, 0,
                { booking_id: bookingId, purpose: "deposit" },
              );
            }
            if (balance > 0) {
              remainingInvoice = await createAndSendInvoice(
                stripe, stripeCustomerId, Math.round(balance * 100),
                `${bookingRef} — Remaining balance for ${svcLabel}`,
                daysUntil(body.serviceDate),
                { booking_id: bookingId, purpose: "balance" },
              );
            }
          } else if (invoiceMode === "full_now") {
            fullInvoice = await createAndSendInvoice(
              stripe, stripeCustomerId, Math.round(total * 100),
              `${bookingRef} — Full payment for ${svcLabel}`, 0,
              { booking_id: bookingId, purpose: "full_payment" },
            );
          }

          await supabase
            .from("bookings")
            .update({
              stripe_balance_invoice_id:
                remainingInvoice?.invoiceId || fullInvoice?.invoiceId || null,
              balance_invoice_url:
                remainingInvoice?.hostedInvoiceUrl || fullInvoice?.hostedInvoiceUrl || null,
              pricing_breakdown: {
                invoice_mode: invoiceMode,
                deposit_percent: depositPercent,
                deposit_invoice_id: depositInvoice?.invoiceId || null,
                deposit_invoice_url: depositInvoice?.hostedInvoiceUrl || null,
                remaining_invoice_id: remainingInvoice?.invoiceId || null,
                remaining_invoice_url: remainingInvoice?.hostedInvoiceUrl || null,
                full_invoice_id: fullInvoice?.invoiceId || null,
                full_invoice_url: fullInvoice?.hostedInvoiceUrl || null,
                stripe_account: stripeSlug,
              },
            })
            .eq("id", bookingId);
          logStep("invoices created", {
            deposit: depositInvoice?.invoiceId,
            remaining: remainingInvoice?.invoiceId,
            full: fullInvoice?.invoiceId,
          });
        } catch (err) {
          invoiceError = err instanceof Error ? err.message : String(err);
          logStep("invoice creation failed (non-blocking)", { error: invoiceError });
        }
      } else {
        invoiceError = `Stripe secret key for the ${stripeSlug} account is not configured`;
        logStep("skipping invoices — no Stripe key", { slug: stripeSlug });
      }
    }

    // 5. Housecall Pro sync — the ops platform gets the job immediately
    //    (replaces Novara's GHL pipeline + calendar push). Idempotent;
    //    the hourly ensure-recent-bookings-hcp-synced sweep is the net.
    let hcpJobId: string | null = null;
    let hcpError: string | null = null;
    if (bookingStatus === "confirmed") {
      try {
        const r = await supabase.functions.invoke("hcp-sync-booking", {
          body: { booking_id: bookingId },
        });
        if (r.data?.success) hcpJobId = r.data.hcp_job_id || null;
        else hcpError = r.data?.error || r.data?.skipped || r.error?.message || "unknown";
        logStep("HCP sync", { hcpJobId, hcpError });
      } catch (err) {
        hcpError = err instanceof Error ? err.message : String(err);
        logStep("HCP sync errored (non-blocking)", { error: hcpError });
      }
    }

    // 6. GoHighLevel — the automation platform for the internal rail.
    //    Pushing the booking here upserts the contact with every booking
    //    custom field, tags it, opens the opportunity and books the
    //    calendar event, which is what triggers the GHL workflows that
    //    fire the rest of the automated comms. Idempotent on booking_id;
    //    retry-ghl-syncs replays a transient LeadConnector outage.
    let ghlContactId: string | null = null;
    let ghlError: string | null = null;
    if (bookingStatus === "confirmed") {
      try {
        const r = await supabase.functions.invoke("ghl-sync-booking", {
          body: { booking_id: bookingId },
        });
        if (r.data?.success) ghlContactId = r.data.contact_id || r.data.ghl_contact_id || null;
        else ghlError = r.data?.error || r.error?.message || "unknown";
        logStep("GHL sync", { ghlContactId, ghlError });
      } catch (err) {
        ghlError = err instanceof Error ? err.message : String(err);
        logStep("GHL sync errored (non-blocking)", { error: ghlError });
      }
    }

    // 7 + 8. Confirmation comms. We pre-claim the SMS flag so the shared
    //    booking-confirm-comms helper only sends the branded email, then
    //    send the VA-specific invoice-aware SMS ourselves on the internal
    //    rail (GoHighLevel).
    let emailResult: unknown = null;
    let smsResult: unknown = null;
    if (bookingStatus === "confirmed") {
      const wantsSms = body.sendConfirmationSms !== false && Boolean(phoneE164);
      if (wantsSms) {
        await supabase
          .from("bookings")
          .update({ confirmation_sms_sent_at: new Date().toISOString() })
          .eq("id", bookingId)
          .is("confirmation_sms_sent_at", null);
      }

      try {
        const r = await supabase.functions.invoke("booking-confirm-comms", {
          body: { bookingId },
        });
        emailResult = r.data ?? { error: r.error?.message };
      } catch (err) {
        emailResult = { error: err instanceof Error ? err.message : String(err) };
      }

      if (wantsSms) {
        const window = TIME_SLOT_WINDOWS[body.timeSlot] || body.timeSlot;
        // GoHighLevel sends this message from a LeadConnector number
        // nobody monitors, so the copy has to hand the customer the
        // OpenPhone line for their market to call or text for support.
        const support = await resolveSupportNumber({
          state: body.state,
          zip: body.zipCode,
          supabase,
        });
        const parts = [
          `AlphaLux Clean: Hi ${body.firstName}! Your ${offer.name} is confirmed for ${body.serviceDate} (${window}). Total $${total.toFixed(2)}.`,
        ];
        if (payPageUrl) {
          parts.push(
            ` Please secure it with your $${deposit.toFixed(2)} deposit here: ${payPageUrl} — we won't charge the remaining $${balance.toFixed(2)} until after the clean is done.`,
          );
        }
        if (depositInvoice) {
          parts.push(
            ` Deposit invoice ($${deposit.toFixed(2)}) just sent to your email — please pay today. The remaining $${balance.toFixed(2)} is due on your service date.`,
          );
        }
        if (fullInvoice) parts.push(" Invoice sent to your email.");
        parts.push(` Questions? Call or text us at ${support.display}.`);
        parts.push(" Reply STOP to opt out.");

        const sms = await sendSms({
          to: phoneE164 as string,
          message: parts.join(""),
          // Internal rail: GoHighLevel sends, OpenPhone is the failover.
          channel: "internal",
          contactId: ghlContactId || undefined,
          state: body.state,
          zip: body.zipCode,
          context: "internal_booking_confirm",
          email,
          firstName: body.firstName,
          lastName: body.lastName || undefined,
        });
        smsResult = sms;
        if (!sms.success) {
          // Release the claim so booking-confirm-comms can retry the
          // standard confirmation SMS later.
          await supabase
            .from("bookings")
            .update({ confirmation_sms_sent_at: null })
            .eq("id", bookingId);
        }
      }
    } else {
      logStep("invoiceMode=none → booking left pending, comms skipped");
    }

    // 9. Final response — everything the VA needs while on the phone.
    return json({
      success: true,
      bookingId,
      bookingRef,
      customerId,
      hcpJobId,
      hcpError,
      ghlContactId,
      ghlError,
      invoiceMode,
      stripeAccount: stripeSlug,
      totals: { total, deposit, balance },
      payPageUrl,
      depositInvoice,
      remainingInvoice,
      fullInvoice,
      invoiceError,
      smsResult,
      emailResult,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[book-as-va] error", message);
    return json({ success: false, error: message }, 400);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
