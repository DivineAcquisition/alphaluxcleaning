import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-SUBCONTRACTOR-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Use service role key for secure database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { sessionId } = await req.json();
    if (!sessionId) throw new Error("Missing session ID");

    logStep("Session ID received", { sessionId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription']
    });

    logStep("Session retrieved", { 
      sessionId: session.id, 
      paymentStatus: session.payment_status,
      subscriptionId: session.subscription?.id 
    });

    if (session.payment_status !== 'paid') {
      throw new Error("Payment not completed");
    }

    const metadata = session.metadata;
    if (!metadata?.user_id || !metadata?.split_tier || !metadata?.subcontractor_data) {
      throw new Error("Missing required metadata");
    }

    const subcontractorData = JSON.parse(metadata.subcontractor_data);
    const subscription = session.subscription as Stripe.Subscription;

    // Create subcontractor profile
    const { data: subcontractor, error: insertError } = await supabaseClient
      .from('subcontractors')
      .insert({
        user_id: metadata.user_id,
        full_name: subcontractorData.fullName,
        email: subcontractorData.email || session.customer_email,
        phone: subcontractorData.phone,
        address: subcontractorData.address,
        city: subcontractorData.city,
        state: subcontractorData.state,
        zip_code: subcontractorData.zipCode,
        split_tier: metadata.split_tier,
        subscription_status: 'active',
        stripe_customer_id: session.customer,
        subscription_id: subscription.id
      })
      .select()
      .single();

    if (insertError) {
      logStep("Error creating subcontractor", { error: insertError });
      throw new Error(`Failed to create subcontractor: ${insertError.message}`);
    }

    logStep("Subcontractor created successfully", { subcontractorId: subcontractor.id });

    // Send welcome email
    try {
      const { error: emailError } = await supabaseClient.functions.invoke('send-subcontractor-welcome', {
        body: {
          email: subcontractor.email,
          fullName: subcontractor.full_name,
          splitTier: subcontractor.split_tier,
          userId: metadata.user_id,
          subcontractorId: subcontractor.id
        }
      });

      if (emailError) {
        logStep("Warning: Failed to send welcome notification", { error: emailError });
      } else {
        logStep("Welcome notification sent successfully");
      }
    } catch (emailError) {
      logStep("Warning: Email function error", { error: emailError });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      subcontractor: {
        id: subcontractor.id,
        full_name: subcontractor.full_name,
        split_tier: subcontractor.split_tier
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in process-subcontractor-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});