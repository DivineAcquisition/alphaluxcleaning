import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, data?: any) => {
  console.log(`[${step}]`, data ? JSON.stringify(data, null, 2) : "");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting Square payment creation");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const accessToken = Deno.env.get("SQUARE_ACCESS_TOKEN");
    const locationId = Deno.env.get("SQUARE_LOCATION_ID");

    if (!accessToken || !locationId) {
      throw new Error("Square credentials not configured");
    }

    const {
      amount,
      customerEmail,
      customerName,
      customerPhone,
      bookingId,
      sourceId, // This comes from Square Web SDK tokenization
      verificationToken, // For 3DS
      applyCredits = false,
      creditsAmount = 0,
    } = await req.json();

    logStep("Request data", { amount, customerEmail, bookingId, applyCredits });

    if (!customerEmail) {
      throw new Error("Customer email is required");
    }

    // Apply referral credits if requested
    let finalAmount = amount;
    let creditsApplied = 0;

    if (applyCredits && creditsAmount > 0 && bookingId) {
      logStep("Applying referral credits");
      
      const { data: creditsData, error: creditsError } = await supabase.functions.invoke(
        'apply-referral-credits',
        {
          body: {
            customer_email: customerEmail,
            booking_id: bookingId,
            max_amount_cents: Math.round(amount * 100)
          }
        }
      );

      if (!creditsError && creditsData?.amount_redeemed_cents) {
        creditsApplied = creditsData.amount_redeemed_cents / 100;
        finalAmount = Math.max(0, amount - creditsApplied);
        logStep("Credits applied", { creditsApplied, finalAmount });
      }
    }

    // If amount is $0 after credits, just return success
    if (finalAmount === 0) {
      logStep("Payment fully covered by credits");
      return new Response(
        JSON.stringify({
          success: true,
          payment_id: "CREDITS_ONLY",
          amount: 0,
          credits_applied: creditsApplied,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Create or retrieve Square customer
    let customerId: string | null = null;

    const customersResponse = await fetch(
      "https://connect.squareup.com/v2/customers/search",
      {
        method: "POST",
        headers: {
          "Square-Version": "2024-01-18",
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: {
            filter: {
              email_address: {
                exact: customerEmail,
              },
            },
          },
        }),
      }
    );

    const customersData = await customersResponse.json();
    
    if (customersData.customers && customersData.customers.length > 0) {
      customerId = customersData.customers[0].id;
      logStep("Found existing Square customer", { customerId });
    } else {
      // Create new customer
      const createCustomerResponse = await fetch(
        "https://connect.squareup.com/v2/customers",
        {
          method: "POST",
          headers: {
            "Square-Version": "2024-01-18",
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            given_name: customerName?.split(" ")[0] || "",
            family_name: customerName?.split(" ").slice(1).join(" ") || "",
            email_address: customerEmail,
            phone_number: customerPhone || undefined,
          }),
        }
      );

      const createCustomerData = await createCustomerResponse.json();
      
      if (createCustomerData.customer) {
        customerId = createCustomerData.customer.id;
        logStep("Created new Square customer", { customerId });

        // Update our customers table with Square ID
        await supabase
          .from("customers")
          .update({ square_customer_id: customerId })
          .eq("email", customerEmail);
      }
    }

    // Create Square payment
    const paymentBody: any = {
      source_id: sourceId,
      idempotency_key: crypto.randomUUID(),
      amount_money: {
        amount: Math.round(finalAmount * 100), // Square uses cents
        currency: "USD",
      },
      location_id: locationId,
      customer_id: customerId,
    };

    if (verificationToken) {
      paymentBody.verification_token = verificationToken;
    }

    logStep("Creating Square payment", { amount: finalAmount });

    const paymentResponse = await fetch(
      "https://connect.squareup.com/v2/payments",
      {
        method: "POST",
        headers: {
          "Square-Version": "2024-01-18",
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentBody),
      }
    );

    const paymentData = await paymentResponse.json();

    if (paymentData.errors) {
      logStep("Square payment error", paymentData.errors);
      throw new Error(paymentData.errors[0].detail || "Payment failed");
    }

    logStep("Square payment created", { paymentId: paymentData.payment.id });

    // Update booking with Square payment ID
    if (bookingId) {
      await supabase
        .from("bookings")
        .update({
          square_payment_id: paymentData.payment.id,
          status: "confirmed",
          paid_at: new Date().toISOString(),
        })
        .eq("id", bookingId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: paymentData.payment.id,
        amount: finalAmount,
        credits_applied: creditsApplied,
        receipt_url: paymentData.payment.receipt_url,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    logStep("Error creating Square payment", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
