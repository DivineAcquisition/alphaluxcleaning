import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { PasswordResetEmail } from '../_shared/email-templates/password-reset.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  resetUrl: string;
  userName?: string;
  userType?: 'admin' | 'subcontractor' | 'customer';
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Password reset email function called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, resetUrl, userName, userType = 'customer' }: PasswordResetRequest = await req.json();
    
    console.log('Processing password reset for:', { email, userType });

    if (!email || !resetUrl) {
      console.error('Missing required fields:', { email: !!email, resetUrl: !!resetUrl });
      return new Response(
        JSON.stringify({ error: 'Email and reset URL are required' }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Render the email template
    const emailHtml = await renderAsync(
      React.createElement(PasswordResetEmail, {
        userName,
        resetUrl,
        userType,
      })
    );

    // Send the email using Resend
    const emailResponse = await resend.emails.send({
      from: "AlphaLuxClean <noreply@info.alphaluxclean.com>",
      to: [email],
      subject: "Reset Your Password - AlphaLux Clean",
      html: emailHtml,
    });

    console.log("Password reset email sent successfully:", { 
      email, 
      emailId: emailResponse.data?.id 
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Password reset email sent successfully",
        emailId: emailResponse.data?.id 
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
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Failed to send password reset email"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);