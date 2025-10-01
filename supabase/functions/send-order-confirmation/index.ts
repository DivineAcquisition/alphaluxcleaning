import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, sessionId, to, testEmail } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let recipientEmail = to || testEmail;
    let bookingData = null;

    // If orderId or sessionId provided, fetch the booking details
    if (orderId || sessionId) {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          customers!inner(email, name, first_name, last_name)
        `);

      if (orderId) {
        query = query.eq('id', orderId);
      } else if (sessionId) {
        query = query.eq('stripe_checkout_session_id', sessionId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error("Error fetching booking:", error);
        throw new Error(`Failed to fetch booking: ${error.message}`);
      }

      if (!data) {
        throw new Error("Booking not found");
      }

      bookingData = data;
      recipientEmail = recipientEmail || data.customers?.email;
    }

    if (!recipientEmail) {
      return new Response(JSON.stringify({ error: "Recipient email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Queue email for booking confirmation
    const { error: queueError } = await supabase.functions.invoke('emails-queue', {
      body: {
        to: recipientEmail,
        name: bookingData?.customers?.name || bookingData?.customers?.first_name || "Customer",
        template: "booking_confirmation",
        payload: {
          customer_name: bookingData?.customers?.name || bookingData?.customers?.first_name || "Customer",
          service_date: bookingData?.service_date || "2024-01-15",
          service_time: bookingData?.time_window || "10:00 AM - 12:00 PM",
          service_type: bookingData?.service_type || "Standard Cleaning",
          address: bookingData?.customers?.address || "Address on file",
          total_amount: bookingData?.est_price ? `$${bookingData.est_price.toFixed(2)}` : "$150.00"
        },
        category: "transactional"
      }
    });

    if (queueError) {
      throw queueError;
    }

    // Immediately invoke emails-worker to process the queue
    const { error: workerError } = await supabase.functions.invoke('emails-worker', {
      body: {}
    });

    if (workerError) {
      console.error("Error invoking emails-worker:", workerError);
      // Don't throw - email is queued, worker will eventually process it
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: "Booking confirmation email queued and worker triggered" 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error queuing booking confirmation:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
