import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';

// Import the referral welcome email template
import { ReferralWelcomeEmail } from '../_shared/email-templates/referral-welcome.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendReferralEmailRequest {
  ownerName: string;
  ownerEmail: string;
  referralCode: string;
  referralLink?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ownerName, ownerEmail, referralCode, referralLink }: SendReferralEmailRequest = await req.json();

    console.log('📧 Sending referral email:', { ownerName, ownerEmail, referralCode });

    // Create the referral link with pre-applied discount
    const baseUrl = "https://bayareacleaningpros.com";
    const defaultReferralLink = referralLink || `${baseUrl}?referral=${referralCode}&discount=50`;

    // Render the email template
    const emailHtml = await renderAsync(
      React.createElement(ReferralWelcomeEmail, {
        ownerName: ownerName,
        referralCode: referralCode,
        referralLink: defaultReferralLink
      })
    );

    // Send the email using Resend
    const emailResponse = await resend.emails.send({
      from: "Bay Area Cleaning Pros <noreply@bayareacleaningpros.com>",
      to: [ownerEmail],
      subject: "Your Referral Code is Ready! Share & Save 50%",
      html: emailHtml,
    });

    console.log("✅ Referral email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Referral email sent successfully",
        emailId: emailResponse.data?.id,
        referralCode,
        referralLink: defaultReferralLink
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("❌ Error sending referral email:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to send referral email"
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});