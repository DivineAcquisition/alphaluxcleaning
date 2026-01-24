import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("Confirm booking payment function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      bookingId, 
      paymentIntentId, 
      subscriptionId,
      paymentStatus = 'deposit_paid'
    } = await req.json();

    console.log("Confirming payment for booking:", bookingId);

    if (!bookingId) {
      throw new Error("Missing required field: bookingId");
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Build update object
    const updateData: Record<string, any> = {
      status: 'confirmed',
      payment_status: paymentStatus,
      paid_at: new Date().toISOString(),
    };

    if (paymentIntentId) {
      updateData.stripe_payment_intent_id = paymentIntentId;
    }

    if (subscriptionId) {
      updateData.stripe_subscription_id = subscriptionId;
    }

    console.log("Updating booking with:", updateData);

    // Update booking
    const { data: booking, error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating booking:", updateError);
      throw new Error(`Failed to update booking: ${updateError.message}`);
    }

    console.log("Booking confirmed successfully:", booking.id);

    // Trigger webhook for integrations (non-blocking)
    try {
      supabase.functions.invoke('enhanced-booking-webhook-v2', {
        body: {
          booking_id: booking.id,
          action: 'payment_confirmed'
        }
      }).then((result) => {
        if (result.error) {
          console.error("Webhook trigger error:", result.error);
        } else {
          console.log("Webhook triggered successfully");
        }
      });
    } catch (webhookError) {
      console.error("Failed to trigger webhook:", webhookError);
    }

    // Send balance invoice if there's a remaining balance (non-blocking)
    const balanceDue = booking.balance_due || 0;
    if (balanceDue > 0) {
      console.log("Balance due detected, sending invoice:", balanceDue);
      try {
        supabase.functions.invoke('send-balance-invoice', {
          body: {
            bookingId: booking.id,
            daysUntilDue: 7, // Due 7 days after booking confirmation
          }
        }).then((result) => {
          if (result.error) {
            console.error("Balance invoice error:", result.error);
          } else {
            console.log("Balance invoice sent successfully:", result.data);
          }
        });
      } catch (invoiceError) {
        console.error("Failed to trigger balance invoice:", invoiceError);
      }
    } else {
      console.log("No balance due, skipping invoice");
    }

    return new Response(JSON.stringify({ 
      success: true,
      booking: booking,
      balanceInvoiceTriggered: balanceDue > 0,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Confirm booking payment error:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
