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

    const { email, fullName, splitTier } = await req.json();
    if (!email || !fullName || !splitTier) {
      throw new Error("Missing required fields: email, fullName, splitTier");
    }

    logStep("Request data received", { email, fullName, splitTier });

    // Determine plan details
    const planDetails = {
      "60_40": { name: "60/40 Split (FREE)", share: "40%", fee: "No monthly fee", jobs: "Accept jobs when available" },
      "50_50": { name: "50/50 Split", share: "50%", fee: "$10/month", jobs: "10 guaranteed jobs per month" },
      "35_65": { name: "35/65 Split", share: "65%", fee: "$50/month", jobs: "15 guaranteed jobs per month" }
    };

    const plan = planDetails[splitTier as keyof typeof planDetails];

    // Create a welcome email content
    const emailContent = `
Welcome to Bay Area Cleaning Pros, ${fullName}!

🎉 Congratulations! You've successfully joined our network of professional cleaning subcontractors.

Your Plan Details:
• Plan: ${plan.name}
• Your Share: ${plan.share} of each completed job
• Monthly Fee: ${plan.fee}
• Job Guarantee: ${plan.jobs}

What's Next?
1. Access your dashboard to view available jobs
2. Complete your profile if you haven't already
3. Start accepting and completing jobs
4. Track your earnings and performance

Important Reminders:
• Please arrive on time for all scheduled services
• Maintain high service quality to keep your rating high
• Dropping more than 2 jobs within 48 hours in a month will result in temporary restrictions
• Contact support if you have any questions or concerns

Access Your Dashboard: ${req.headers.get("origin") || "https://your-domain.com"}/subcontractor-dashboard

Need Help?
Email: support@bayareacleaningpros.com
Phone: (281) 201-6112

Welcome to the team!

Best regards,
Bay Area Cleaning Professionals Team
    `;

    // Store the welcome message in a notifications table or send via Supabase Auth
    // For now, we'll just log it successfully since Supabase handles emails through Auth
    logStep("Welcome message prepared", { 
      recipient: email, 
      plan: plan.name,
      messageLength: emailContent.length 
    });

    // In a real implementation, you could:
    // 1. Store this in a notifications table for the user
    // 2. Use Supabase's built-in email templates
    // 3. Trigger a custom email webhook
    
    // For now, we'll simulate success and could integrate with Supabase's email system
    logStep("Welcome notification processed successfully");

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Welcome notification processed",
      plan: plan.name
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