import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[COMPLETE-ONBOARDING] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { 
      token,
      selected_tier, 
      profile_data, 
      banking_data, 
      application_data 
    } = await req.json();

    logStep("Processing onboarding", { token, selected_tier });

    // Validate and mark token as used first
    const { data: tokenResult, error: tokenError } = await supabaseService
      .rpc('validate_onboarding_token', { p_token: token });

    if (tokenError || !tokenResult?.valid) {
      logStep("Token validation failed", { tokenError, tokenResult });
      throw new Error(tokenResult?.error || "Invalid onboarding token");
    }

    const application_id = tokenResult.application_id;

    // Create auth user first
    const { data: authUser, error: authError } = await supabaseService.auth.admin.createUser({
      email: application_data.email,
      password: crypto.randomUUID(), // Temporary password
      email_confirm: true,
      user_metadata: {
        full_name: application_data.full_name,
        phone: application_data.phone
      }
    });

    if (authError) {
      logStep("Auth user creation failed", authError);
      throw new Error(`Failed to create user account: ${authError.message}`);
    }

    logStep("Auth user created", { user_id: authUser.user.id });

    // Assign subcontractor role
    await supabaseService.from("user_roles").insert({
      user_id: authUser.user.id,
      role: "subcontractor"
    });

    // Create subcontractor record
    const { data: subcontractor, error: subError } = await supabaseService
      .from("subcontractors")
      .insert({
        user_id: authUser.user.id,
        full_name: application_data.full_name,
        email: application_data.email,
        phone: application_data.phone,
        address: application_data.address,
        city: application_data.city,
        state: application_data.state,
        zip_code: application_data.zip_code,
        split_tier: selected_tier,
        subscription_status: selected_tier === "60_40" ? "active" : "pending"
      })
      .select()
      .single();

    if (subError) {
      logStep("Subcontractor creation failed", subError);
      throw new Error(`Failed to create subcontractor record: ${subError.message}`);
    }

    logStep("Subcontractor created", { id: subcontractor.id });

    // Create profile record
    await supabaseService.from("subcontractor_profiles").insert({
      subcontractor_id: subcontractor.id,
      profile_image_url: profile_data.profile_image_url,
      biography: profile_data.biography,
      legal_name: banking_data.legal_name,
      date_of_birth: banking_data.date_of_birth,
      ssn: banking_data.ssn,
      account_number: banking_data.account_number,
      routing_number: banking_data.routing_number,
      background_check_consent: banking_data.background_check_consent,
      background_check_copy_consent: banking_data.background_check_copy_consent
    });

    logStep("Profile created");

    // Update application status and mark token as used
    await supabaseService
      .from("subcontractor_applications")
      .update({ status: "onboarded" })
      .eq("id", application_id);

    // Mark token as used
    await supabaseService.rpc('mark_onboarding_token_used', { p_token: token });

    if (selected_tier === "60_40") {
      // Free tier - create auth session for auto-login
      logStep("Free tier onboarding complete - creating session");
      
      // Generate a one-time login link
      const { data: linkData, error: linkError } = await supabaseService.auth.admin.generateLink({
        type: 'magiclink',
        email: application_data.email,
        options: {
          redirectTo: `${req.headers.get("origin")}/subcontractor-dashboard`
        }
      });

      if (linkError) {
        logStep("Magic link generation failed", linkError);
        // Return success but redirect to login
        return new Response(JSON.stringify({ 
          success: true, 
          redirect_to_login: true,
          message: "Account created successfully. Please check your email to log in."
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      logStep("Magic link generated", { link_url: linkData.properties.action_link });
      
      return new Response(JSON.stringify({ 
        success: true, 
        auto_login_url: linkData.properties.action_link,
        message: "Onboarding completed successfully"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      // Paid tier - create Stripe checkout
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
        apiVersion: "2023-10-16",
      });

      const customers = await stripe.customers.list({ 
        email: application_data.email, 
        limit: 1 
      });

      let customerId;
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }

      const tierPrices = {
        "50_50": 2000,
        "40_60": 5000,
        "30_70": 10000
      };

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : application_data.email,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: { 
                name: `${selected_tier.replace('_', '/')} Revenue Share Plan`,
                description: `Monthly subscription for enhanced job matching and support`
              },
              unit_amount: tierPrices[selected_tier as keyof typeof tierPrices],
              recurring: { interval: "month" },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${req.headers.get("origin")}/subcontractor-dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get("origin")}/subcontractor-onboarding?token=${crypto.randomUUID()}&application_id=${application_id}`,
        metadata: {
          subcontractor_id: subcontractor.id,
          split_tier: selected_tier
        }
      });

      // Store Stripe customer ID
      await supabaseService
        .from("subcontractors")
        .update({ 
          stripe_customer_id: customerId || session.customer,
          subscription_id: session.subscription 
        })
        .eq("id", subcontractor.id);

      logStep("Stripe checkout created", { session_id: session.id });

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});