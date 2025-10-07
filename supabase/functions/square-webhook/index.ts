import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-square-signature",
};

const logStep = (step: string, data?: any) => {
  console.log(`[Square Webhook ${step}]`, data ? JSON.stringify(data, null, 2) : "");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get("x-square-signature");
    
    // TODO: Verify webhook signature for production
    // Square provides HMAC-SHA256 signature verification
    
    const event = JSON.parse(body);
    logStep("Received event", { type: event.type });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    switch (event.type) {
      case "payment.created":
      case "payment.updated":
        await handlePaymentEvent(event, supabase);
        break;

      case "refund.created":
      case "refund.updated":
        await handleRefundEvent(event, supabase);
        break;

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    logStep("Error processing webhook", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

async function handlePaymentEvent(event: any, supabase: any) {
  const payment = event.data.object.payment;
  const paymentId = payment.id;
  const status = payment.status;

  logStep("Processing payment event", { paymentId, status });

  // Find booking by Square payment ID
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("*")
    .eq("square_payment_id", paymentId)
    .single();

  if (bookingError || !booking) {
    logStep("Booking not found", { paymentId });
    return;
  }

  if (status === "COMPLETED") {
    // Update booking status
    await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        paid_at: new Date().toISOString(),
      })
      .eq("id", booking.id);

    logStep("Payment succeeded", { bookingId: booking.id });

    // Trigger existing integrations
    await supabase.functions.invoke("enhanced-booking-webhook-v2", {
      body: {
        booking_id: booking.id,
        action: "booking_confirmed",
      },
    });

    await supabase.functions.invoke("trigger-hcp-sync", {
      body: { booking_id: booking.id },
    });
  } else if (status === "FAILED" || status === "CANCELED") {
    await supabase
      .from("bookings")
      .update({ status: "failed" })
      .eq("id", booking.id);

    logStep("Payment failed", { bookingId: booking.id, status });
  }
}

async function handleRefundEvent(event: any, supabase: any) {
  const refund = event.data.object.refund;
  const paymentId = refund.payment_id;
  const refundStatus = refund.status;

  logStep("Processing refund event", { paymentId, refundStatus });

  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("square_payment_id", paymentId)
    .single();

  if (booking) {
    if (refundStatus === "COMPLETED") {
      await supabase
        .from("bookings")
        .update({ status: "refunded" })
        .eq("id", booking.id);

      logStep("Refund completed", { bookingId: booking.id });
    }
  }
}
