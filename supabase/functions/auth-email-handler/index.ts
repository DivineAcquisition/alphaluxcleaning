import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';
import { Resend } from "npm:resend@4.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { PasswordResetEmail } from '../_shared/email-templates/password-reset.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log('Auth email handler called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  // Verify hook secret to allow public access safely
  const hookSecret = Deno.env.get('AUTH_HOOK_SECRET');
  
  if (!hookSecret) {
    console.warn('AUTH_HOOK_SECRET is not set');
    return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Check for secret in either x-hook-secret header or Authorization Bearer format
  const providedSecretHeader = req.headers.get('x-hook-secret');
  const authHeader = req.headers.get('authorization');
  let providedSecret = providedSecretHeader;
  
  if (!providedSecret && authHeader?.startsWith('Bearer ')) {
    providedSecret = authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  if (!providedSecret || providedSecret !== hookSecret) {
    console.warn('Invalid or missing authentication. Tried x-hook-secret:', !!providedSecretHeader, 'and Authorization Bearer:', !!authHeader);
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const payload = await req.text();
    console.log('Received webhook payload for email');

    let webhookData;
    try {
      webhookData = JSON.parse(payload);
    } catch (e) {
      console.error('Failed to parse webhook payload:', e);
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    console.log('Webhook data:', JSON.stringify(webhookData, null, 2));

    // Check if this is a password recovery email or signup confirmation
    const { 
      user, 
      email_data 
    } = webhookData;

    if (!email_data) {
      console.log('No email_data found, webhook type:', webhookData.metadata?.name);
      return new Response(
        JSON.stringify({ success: true, message: "No email data to process" }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    const { 
      token, 
      token_hash, 
      redirect_to, 
      email_action_type,
      site_url 
    } = email_data;

    if (email_action_type === 'recovery') {
      console.log('Processing password recovery email for:', user.email);

      // Use Supabase's built-in recovery link construction
      const resetUrl = `${site_url}/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to || 'https://portal.bayareacleaningpros.com/password-reset')}`;
      
      // Get user role to determine user type
      let userType = 'customer';
      try {
        const { data: roleData } = await supabase.rpc('get_user_role', { _user_id: user.id });
        if (roleData) {
          userType = roleData;
        }
      } catch (error) {
        console.warn('Could not determine user role, defaulting to customer:', error);
      }

      // Render the email template
      const emailHtml = await renderAsync(
        React.createElement(PasswordResetEmail, {
          userName: user.user_metadata?.full_name || user.email?.split('@')[0],
          resetUrl,
          userType: userType as 'admin' | 'subcontractor' | 'customer',
        })
      );

      // Send the email using Resend
      const emailResponse = await resend.emails.send({
        from: "Bay Area Cleaning Professionals <onboarding@resend.dev>",
        to: [user.email],
        subject: "Reset Your Password - Bay Area Cleaning Professionals",
        html: emailHtml,
      });

      console.log("Password reset email sent successfully:", { 
        email: user.email, 
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
    }

    // For other email types, just return success (or handle them as needed)
    console.log('Email type not handled:', email_action_type);
    return new Response(
      JSON.stringify({ success: true, message: "Email type not handled by custom function" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error in auth-email-handler:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Failed to send auth email"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});