import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    const baseUrl = "https://alphaluxclean.com";
    const defaultReferralLink = referralLink || `${baseUrl}?referral=${referralCode}&discount=50`;

    // Send email using Supabase email system instead
    const { error: emailError } = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({
        companyId: '550e8400-e29b-41d4-a716-446655440000',
        to: ownerEmail,
        templateKey: 'referral_code',
        variables: {
          owner_name: ownerName,
          referral_code: referralCode,
          referral_link: defaultReferralLink
        }
      })
    });

    if (emailError) {
      console.error("❌ Error sending referral email:", emailError);
      throw new Error("Failed to send referral email");
    }

    console.log("✅ Referral email sent successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Referral email sent successfully",
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