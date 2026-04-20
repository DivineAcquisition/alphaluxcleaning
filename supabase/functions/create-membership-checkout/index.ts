import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-MEMBERSHIP-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = (Deno.env.get("STRIPE_SECRET_KEY") || Deno.env.get("STRIPE_SECRET_KEY_ALPHALUX"));
    if (!stripeKey) throw new Error("Stripe secret key is not configured (set STRIPE_SECRET_KEY in Supabase secrets)");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Parse request body to get customer info
    const { bookingData, customerInfo } = await req.json();
    if (!bookingData) throw new Error("Booking data is required");
    if (!customerInfo?.email) throw new Error("Customer email is required");
    
    const customerEmail = customerInfo.email;
    const customerName = customerInfo.name || 'Guest Customer';
    const customerPhone = customerInfo.phone || '';
    logStep("Customer info received", { email: customerEmail, name: customerName, phone: customerPhone });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Check if customer exists
    const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }
    logStep("Customer lookup completed", { customerId });

    const origin = req.headers.get("origin") || "http://localhost:3000";

    // Calculate the service cost with membership discount applied
    const serviceAmount = Math.round(bookingData.pricing.total * 100); // Convert to cents
    const membershipAmount = 3900; // $39 in cents

    logStep("Creating checkout session", { 
      serviceAmount, 
      membershipAmount,
      hasCustomer: !!customerId 
    });

    // Create checkout session with both one-time service payment and recurring membership
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      line_items: [
        {
          // One-time payment for the cleaning service (with membership discount already applied)
          price_data: {
            currency: "usd",
            product_data: { 
              name: `${bookingData.tier.hours}-Hour Cleaning Service`,
              description: `${bookingData.paymentOption === 'half' ? '50% Payment' : bookingData.paymentOption === 'prepayment' ? '$150 Prepayment' : 'Full Payment'} • Professional cleaning service with AlphaLux Club™ membership benefits${bookingData.pricing.addonMemberDiscount > 0 ? ` (10% addon discount: $${bookingData.pricing.addonMemberDiscount})` : ''}`
            },
            unit_amount: serviceAmount,
          },
          quantity: 1,
        },
        {
          // Recurring monthly membership
          price_data: {
            currency: "usd",
            product_data: { 
              name: "AlphaLux Club™ Membership",
              description: "Monthly membership with $20 credit, priority booking, and exclusive perks"
            },
            unit_amount: membershipAmount,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      mode: "subscription", // This handles both one-time and recurring items
      success_url: `${origin}/service-details?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`,
      metadata: {
        customer_email: customerEmail,
        customer_name: customerName,
        customer_phone: customerPhone,
        booking_data: JSON.stringify(bookingData),
        membership_enabled: "true"
      }
    });

    logStep("Checkout session created successfully", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-membership-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});