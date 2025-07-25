import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-SUBCONTRACTOR-WELCOME] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Use service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { email, fullName, splitTier, userId, subcontractorId } = await req.json();
    if (!email || !fullName || !splitTier) {
      throw new Error("Missing required fields: email, fullName, splitTier");
    }

    logStep("Request data received", { email, fullName, splitTier, userId, subcontractorId });

    // Determine plan details
    const planDetails = {
      "60_40": { name: "60/40 Split (FREE)", share: "40%", fee: "No monthly fee", jobs: "Accept jobs when available" },
      "50_50": { name: "50/50 Split", share: "50%", fee: "$10/month", jobs: "10 guaranteed jobs per month" },
      "35_65": { name: "35/65 Split", share: "65%", fee: "$50/month", jobs: "15 guaranteed jobs per month" }
    };

    const plan = planDetails[splitTier as keyof typeof planDetails];

    // Create welcome notification content
    const welcomeTitle = `Welcome to Bay Area Cleaning Pros!`;
    const welcomeMessage = `🎉 Congratulations ${fullName}! You've successfully joined our network with the ${plan.name} plan.

Your Benefits:
• Your Share: ${plan.share} of each completed job
• Monthly Fee: ${plan.fee}
• Job Guarantee: ${plan.jobs}

What's Next:
1. Browse and accept available jobs
2. Complete jobs to start earning
3. Maintain high service quality
4. Track your earnings and performance

Important: Dropping more than 2 jobs within 48 hours in a month will result in temporary restrictions.

Welcome to the team!`;

    // Store welcome notification in database if we have the subcontractor ID
    if (subcontractorId && userId) {
      const { error: notificationError } = await supabaseAdmin
        .from('subcontractor_notifications')
        .insert({
          subcontractor_id: subcontractorId,
          user_id: userId,
          title: welcomeTitle,
          message: welcomeMessage,
          type: 'welcome'
        });

      if (notificationError) {
        logStep("Warning: Failed to store notification", { error: notificationError });
      } else {
        logStep("Welcome notification stored successfully");
      }
    }

    logStep("Welcome message prepared", { 
      recipient: email, 
      plan: plan.name,
      messageLength: welcomeMessage.length 
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Welcome notification processed",
      plan: plan.name,
      notification: {
        title: welcomeTitle,
        message: welcomeMessage
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in send-subcontractor-welcome", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});