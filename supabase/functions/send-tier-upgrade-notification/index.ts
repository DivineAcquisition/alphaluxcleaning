import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TIER-UPGRADE-NOTIFICATION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      throw new Error("RESEND_API_KEY is not set");
    }

    const resend = new Resend(resendKey);

    const { 
      email, 
      fullName, 
      previousTier, 
      newTier, 
      newHourlyRate, 
      newMonthlyFee,
      subcontractorId 
    } = await req.json();

    if (!email || !fullName) {
      throw new Error("Missing required fields: email and fullName");
    }

    logStep("Sending tier upgrade notification", { 
      email, 
      fullName, 
      previousTier, 
      newTier 
    });

    const tierNames = {
      1: "Standard",
      2: "Professional", 
      3: "Elite"
    };

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://yltvknkqnzdeiqckqjha.supabase.co/storage/v1/object/public/images/alphalux-logo.png" alt="AlphaLux Clean" style="height: 60px;">
          </div>
          
          <h1 style="color: #2563eb; text-align: center; margin-bottom: 20px;">🎉 Congratulations on Your Tier Upgrade!</h1>
          
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">Dear ${fullName},</p>
          
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            We're excited to inform you that based on your outstanding performance, you've been upgraded from 
            <strong>${tierNames[previousTier]} (Tier ${previousTier})</strong> to 
            <strong>${tierNames[newTier]} (Tier ${newTier})</strong>!
          </p>
          
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-bottom: 15px;">Your New Benefits:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Hourly Rate: <strong>$${newHourlyRate}/hour</strong></li>
              <li style="margin-bottom: 8px;">Monthly Fee: <strong>$${newMonthlyFee}/month</strong></li>
              <li style="margin-bottom: 8px;">Higher priority for job assignments</li>
              <li style="margin-bottom: 8px;">Access to premium client locations</li>
              <li style="margin-bottom: 8px;">Enhanced support and training resources</li>
            </ul>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            This upgrade is effective immediately and reflects your commitment to excellence. Your new rates will apply to all future job assignments.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://app.alphaluxclean.com/subcontractor-dashboard" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              View Your Dashboard
            </a>
          </div>
          
          <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px; color: #666;">
            Keep up the excellent work! We appreciate your dedication to providing top-quality cleaning services to our clients.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <div style="text-align: center; color: #666; font-size: 14px;">
            <p>AlphaLux Clean</p>
            <p>📞 (281) 201-6112 | 📧 support@alphaluxclean.com</p>
            <p>Visit us at <a href="https://alphaluxclean.com" style="color: #2563eb;">alphaluxclean.com</a></p>
          </div>
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: "AlphaLuxClean <noreply@info.alphaluxclean.com>",
      to: [email],
      subject: `🎉 Tier Upgrade: Welcome to ${tierNames[newTier]} Status!`,
      html: emailContent,
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }

    logStep("Tier upgrade notification sent successfully", { 
      email, 
      messageId: data?.id 
    });

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: data?.id,
      email
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in send-tier-upgrade-notification", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});