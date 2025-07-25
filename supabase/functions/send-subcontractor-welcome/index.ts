import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

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

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY is not set");

    const { email, fullName, splitTier } = await req.json();
    if (!email || !fullName || !splitTier) {
      throw new Error("Missing required fields: email, fullName, splitTier");
    }

    logStep("Request data received", { email, fullName, splitTier });

    const resend = new Resend(resendKey);

    // Determine plan details
    const planDetails = {
      "60_40": { name: "60/40 Split (FREE)", share: "40%", fee: "No monthly fee", jobs: "Accept jobs when available" },
      "50_50": { name: "50/50 Split", share: "50%", fee: "$10/month", jobs: "10 guaranteed jobs per month" },
      "35_65": { name: "35/65 Split", share: "65%", fee: "$50/month", jobs: "15 guaranteed jobs per month" }
    };

    const plan = planDetails[splitTier as keyof typeof planDetails];

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Bay Area Cleaning Pros</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Our Network!</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Bay Area Cleaning Professionals</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #667eea; margin-top: 0;">Hello ${fullName}! 🎉</h2>
            <p>Congratulations! You've successfully joined our network of professional cleaning subcontractors. We're excited to have you on board!</p>
          </div>

          <div style="background: white; border: 2px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #495057; margin-top: 0;">Your Plan Details:</h3>
            <ul style="padding-left: 20px;">
              <li><strong>Plan:</strong> ${plan.name}</li>
              <li><strong>Your Share:</strong> ${plan.share} of each completed job</li>
              <li><strong>Monthly Fee:</strong> ${plan.fee}</li>
              <li><strong>Job Guarantee:</strong> ${plan.jobs}</li>
            </ul>
          </div>

          <div style="background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #0c5460; margin-top: 0;">What's Next?</h3>
            <ol>
              <li>Access your dashboard to view available jobs</li>
              <li>Complete your profile if you haven't already</li>
              <li>Start accepting and completing jobs</li>
              <li>Track your earnings and performance</li>
            </ol>
          </div>

          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #856404; margin-top: 0;">Important Reminders:</h3>
            <ul>
              <li>Please arrive on time for all scheduled services</li>
              <li>Maintain high service quality to keep your rating high</li>
              <li>Dropping more than 2 jobs within 48 hours in a month will result in temporary restrictions</li>
              <li>Contact support if you have any questions or concerns</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${req.headers.get("origin") || "https://your-domain.com"}/subcontractor-dashboard" 
               style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Access Your Dashboard
            </a>
          </div>

          <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px; text-align: center; color: #6c757d;">
            <p><strong>Need Help?</strong></p>
            <p>Email: support@bayareacleaningpros.com | Phone: (281) 201-6112</p>
            <p style="font-size: 12px; margin-top: 20px;">
              © 2024 Bay Area Cleaning Professionals. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Bay Area Cleaning Pros <welcome@bayareacleaningpros.com>",
      to: [email],
      subject: `Welcome to Bay Area Cleaning Pros - ${plan.name}`,
      html: emailHtml,
    });

    logStep("Email sent successfully", { emailId: emailResponse.data?.id });

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id 
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