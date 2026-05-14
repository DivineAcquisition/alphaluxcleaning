import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { BookingConfirmationEmail } from "./_templates/booking-confirmation.tsx";
import {
  BookingAdminNotification,
  type BookingAdminNotificationProps,
} from "./_templates/booking-admin-notification.tsx";
import {
  getInternalFromAddress,
  getInternalRecipients,
} from "../_shared/internal-recipients.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, data?: unknown) => {
  console.log(`[SEND-BOOKING-CONFIRMATION] ${step}`, data ?? "");
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  regular: "Standard Cleaning",
  deep: "Deep Cleaning",
  move_in_out: "Move-In/Out Cleaning",
};

const FREQUENCY_LABELS: Record<string, string> = {
  one_time: "One-Time",
  weekly: "Weekly",
  bi_weekly: "Bi-Weekly",
  monthly: "Monthly",
};

const TIME_SLOT_WINDOWS: Record<string, string> = {
  early_morning: "7 – 9 AM",
  morning: "9 – 11 AM",
  late_morning: "11 AM – 1 PM",
  afternoon: "1 – 3 PM",
  late_afternoon: "3 – 5 PM",
  evening: "5 – 7 PM",
};

function arrivalWindow(slot: string | null | undefined): string {
  if (!slot) return "Time TBD";
  return TIME_SLOT_WINDOWS[slot] ?? slot;
}

function fmtDate(yyyymmdd: string | null | undefined): string {
  if (!yyyymmdd) return "Date TBD";
  const [y, m, d] = String(yyyymmdd).split("-").map(Number);
  if (!y || !m || !d) return String(yyyymmdd);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * The Resend `from` for the customer-facing confirmation. Falls back
 * through the historical env-var soup so any deploy that already has
 * one of these set keeps working without touching ops config.
 */
function getCustomerFromAddress(): string {
  return (
    Deno.env.get("EMAIL_FROM") ||
    Deno.env.get("EMAIL_FROM_CUSTOMER") ||
    "AlphaLux Clean <noreply@info.alphaluxcleaning.com>"
  );
}

/**
 * Convenience wrapper: send a Resend email, and if the primary
 * sending domain bounces with "domain not verified", retry against
 * Resend's onboarding domain so the email still lands during DNS
 * cutover windows. Returns the final response (success or otherwise).
 */
async function sendWithUnverifiedRetry(
  args: {
    from: string;
    to: string[];
    subject: string;
    html: string;
    replyTo?: string;
  },
  retryFromBrand: string,
) {
  let response = await resend.emails.send(args);
  const errMsg = response.error?.message || "";
  if (
    response.error &&
    /domain.*is not verified|sending domain.*must be verified|testing emails to your own email address|verify a domain/i
      .test(errMsg)
  ) {
    logStep("Primary sender unverified — retrying via Resend onboarding domain", {
      original: args.from,
    });
    response = await resend.emails.send({
      ...args,
      from: `${retryFromBrand} <onboarding@resend.dev>`,
    });
  }
  return response;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting booking confirmation email");

    const { bookingId } = await req.json();
    if (!bookingId) {
      throw new Error("Booking ID is required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(
        `
        *,
        customer:customers (
          id,
          email,
          name,
          first_name,
          last_name,
          phone,
          address_line1,
          address_line2,
          city,
          state,
          postal_code
        )
      `,
      )
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error(`Failed to fetch booking: ${bookingError?.message}`);
    }

    const customer = booking.customer || {};
    if (!customer.email) {
      throw new Error(
        `Booking ${bookingId} has no customer email — cannot send confirmation.`,
      );
    }

    logStep("Booking loaded", {
      bookingId,
      customerEmail: customer.email,
    });

    const serviceTypeLabel =
      SERVICE_TYPE_LABELS[booking.service_type] || booking.service_type;
    const frequencyLabel =
      FREQUENCY_LABELS[booking.frequency] || booking.frequency;
    const offerName: string | null = booking.offer_name || null;
    const offerType: string | null = booking.offer_type || null;
    const isComboBundle = offerType === "deep_plus_standard";

    const formattedDate = fmtDate(booking.service_date);
    const formattedArrivalWindow = arrivalWindow(booking.time_slot);

    const total = Number(booking.est_price) || 0;
    const deposit = Number(booking.deposit_amount) || 0;
    const balance = Math.max(0, total - deposit);
    const promoDiscount =
      booking.promo_discount_cents && booking.promo_discount_cents > 0
        ? Number(booking.promo_discount_cents) / 100
        : 0;

    const isOneTime = booking.frequency === "one_time";

    // ===================== Customer confirmation =====================

    const customerEmailHtml = await renderAsync(
      React.createElement(BookingConfirmationEmail, {
        customerName: customer.first_name || customer.name || "Customer",
        orderId: booking.id.slice(0, 8).toUpperCase(),
        serviceType: serviceTypeLabel,
        frequency: frequencyLabel,
        serviceDate: formattedDate,
        timeSlot: formattedArrivalWindow,
        address: {
          line1: booking.address_line1 || customer.address_line1 || "",
          line2:
            booking.address_line2 || customer.address_line2 || undefined,
          city: customer.city || "",
          state: customer.state || "",
          postalCode: booking.zip_code || customer.postal_code || "",
        },
        pricing: {
          total,
          deposit,
          balance,
          discount: promoDiscount > 0 ? promoDiscount : undefined,
        },
        specialInstructions: booking.special_instructions || undefined,
        isOneTime,
      }),
    );

    logStep("Sending customer confirmation email", { to: customer.email });
    const customerFrom = getCustomerFromAddress();
    const customerReplyTo =
      Deno.env.get("EMAIL_REPLY_TO") || "info@alphaluxcleaning.com";
    const customerEmailResponse = await sendWithUnverifiedRetry(
      {
        from: customerFrom,
        to: [customer.email],
        replyTo: customerReplyTo,
        subject: `✅ Booking Confirmed — ${formattedDate}`,
        html: customerEmailHtml,
      },
      "AlphaLux Clean",
    );
    if (customerEmailResponse.error) {
      logStep("Customer email failed", {
        error: customerEmailResponse.error.message,
      });
    } else {
      logStep("Customer email sent", {
        messageId: customerEmailResponse.data?.id,
      });
    }

    // ===================== Internal / admin notification =====================

    const internalRecipients = getInternalRecipients();
    logStep("Internal recipients resolved", { internalRecipients });

    // Second-visit details (combo bundle only).
    let secondVisitProp: BookingAdminNotificationProps["secondVisit"] = null;
    const sv = booking.property_details?.second_visit;
    if (isComboBundle && sv?.date && sv?.time_slot) {
      secondVisitProp = {
        date: fmtDate(sv.date),
        arrivalWindow: arrivalWindow(sv.time_slot),
        type: sv.type || "standard",
      };
    }

    const adminProps: BookingAdminNotificationProps = {
      orderId: booking.id.slice(0, 8).toUpperCase(),
      bookingId: booking.id,
      customer: {
        name:
          customer.name ||
          [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
          booking.full_name ||
          "Customer",
        email: customer.email,
        phone: customer.phone || "",
      },
      service: {
        type: serviceTypeLabel,
        frequency: frequencyLabel,
        offerName: offerName || undefined,
        visitCount: booking.visit_count ?? null,
        isRecurring: !!booking.is_recurring,
      },
      schedule: {
        date: formattedDate,
        arrivalWindow: formattedArrivalWindow,
      },
      address: {
        line1: booking.address_line1 || customer.address_line1 || "—",
        line2:
          booking.address_line2 || customer.address_line2 || undefined,
        city: customer.city || "",
        state: customer.state || "",
        postalCode: booking.zip_code || customer.postal_code || "",
      },
      pricing: {
        total,
        deposit,
        balance,
        promoCode: booking.promo_code || undefined,
        promoDiscount: promoDiscount > 0 ? promoDiscount : undefined,
      },
      stripe: {
        accountSlug: booking.stripe_account_slug || "alphalux_ny",
        paymentIntentId: booking.stripe_payment_intent_id || null,
      },
      hcp: {
        jobId: booking.hcp_job_id || null,
        customerId: booking.hcp_customer_id || null,
      },
      ghl: {
        contactId: booking.ghl_contact_id || null,
      },
      secondVisit: secondVisitProp,
      specialInstructions: booking.special_instructions || null,
      adminConsoleUrl: (() => {
        const base = (
          Deno.env.get("APP_URL") || "https://alphaluxcleaning.com"
        ).replace(/\/+$/, "");
        return `${base}/admin/bookings/${booking.id}`;
      })(),
    };

    const adminEmailHtml = await renderAsync(
      React.createElement(BookingAdminNotification, adminProps),
    );

    const adminFrom = getInternalFromAddress();
    const adminSubject = `🔔 New booking · ${adminProps.customer.name} · ${
      offerName || serviceTypeLabel
    } · ${formattedDate}`;

    logStep("Sending admin notification email", {
      to: internalRecipients,
      from: adminFrom,
    });
    const adminEmailResponse = await sendWithUnverifiedRetry(
      {
        from: adminFrom,
        // Single Resend send with multiple recipients — they each
        // see a "To: info@…, info@…" header rather than getting
        // BCC'd. That's intentional: both mailboxes are ops, so the
        // visibility is fine and we save a Resend quota call.
        to: internalRecipients,
        subject: adminSubject,
        html: adminEmailHtml,
      },
      "AlphaLux Bookings",
    );
    if (adminEmailResponse.error) {
      logStep("Admin email failed", {
        error: adminEmailResponse.error.message,
      });
    } else {
      logStep("Admin email sent", {
        messageId: adminEmailResponse.data?.id,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        customerEmailSent: !!customerEmailResponse.data?.id,
        customerEmailError: customerEmailResponse.error?.message || null,
        adminEmailSent: !!adminEmailResponse.data?.id,
        adminEmailError: adminEmailResponse.error?.message || null,
        adminRecipients: internalRecipients,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", msg);
    return new Response(
      JSON.stringify({
        success: false,
        error: msg || "Failed to send confirmation emails",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
