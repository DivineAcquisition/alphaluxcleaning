import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';
import { Resend } from "npm:resend@4.0.0";

// Log environment variable access for debugging
console.log('Initializing auth-email-handler...');
const resendApiKey = Deno.env.get("RESEND_API_KEY");
console.log('RESEND_API_KEY status:', resendApiKey ? 'Found' : 'Missing');

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Simple HTML email template to avoid React dependencies
function createPasswordResetEmailHtml(userName: string, resetUrl: string, userType: string): string {
  const typeLabels: Record<string, string> = {
    admin: 'Administrator',
    subcontractor: 'Subcontractor', 
    customer: 'Customer',
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f9fafb;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
        
        <!-- Header -->
        <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #e5e7eb; margin-bottom: 30px;">
          <h1 style="color: #1f2937; fontSize: 24px; font-weight: 600; margin: 0;">Bay Area Cleaning Professionals</h1>
        </div>
        
        <!-- Main Content -->
        <div>
          <h2 style="color: #1f2937; font-size: 24px; font-weight: 600; margin: 0 0 20px 0;">Reset Your Password</h2>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 15px 0;">
            Hello ${userName || 'there'}, we received a request to reset your ${typeLabels[userType] || 'Customer'} account password.
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 15px 0;">
            Click the button below to create a new password:
          </p>
          
          <!-- Button Section -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #3b82f6; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.4; margin: 0 0 10px 0;">
            Or copy this link: <a href="${resetUrl}" style="color: #3b82f6; text-decoration: underline;">${resetUrl}</a>
          </p>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.4; margin: 0 0 10px 0;">
            This link will expire in 24 hours. If you didn't request this reset, please ignore this email.
          </p>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.4; margin: 0 0 10px 0;">
            Need help? Contact us at support@bayareacleaningpros.com
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; margin-top: 30px;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Bay Area Cleaning Professionals<br>
            📧 info@bayareacleaningpros.com | 📞 (415) 987-6543
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

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

      // Check email service configuration FIRST
      if (!resendApiKey) {
        console.error('RESEND_API_KEY is not configured - cannot send password reset email');
        return new Response(JSON.stringify({ error: 'Email service not configured' }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      console.log('Email service configured, proceeding with password reset...');

      try {
        // Use Supabase's built-in recovery link construction
        const resetUrl = `${site_url}/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to || 'https://portal.bayareacleaningpros.com/password-reset')}`;
        console.log('Generated reset URL for recovery');
        
        // Get user role to determine user type
        let userType = 'customer';
        try {
          console.log('Fetching user role for:', user.id);
          const { data: roleData } = await supabase.rpc('get_user_role', { _user_id: user.id });
          if (roleData) {
            userType = roleData;
            console.log('User role determined:', userType);
          } else {
            console.log('No role data returned, using default: customer');
          }
        } catch (error) {
          console.warn('Could not determine user role, defaulting to customer:', error);
        }

        // Create email HTML using simple template (no React dependencies)
        console.log('Generating email HTML...');
        const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'there';
        const emailHtml = createPasswordResetEmailHtml(userName, resetUrl, userType);
        console.log('Email HTML generated successfully');

        // Initialize Resend client and send email
        console.log('Initializing Resend client and sending email...');
        const resend = new Resend(resendApiKey);
        const emailResponse = await resend.emails.send({
          from: "Bay Area Cleaning Professionals <onboarding@resend.dev>",
          to: [user.email],
          subject: "Reset Your Password - Bay Area Cleaning Professionals",
          html: emailHtml,
        });

        console.log("Password reset email sent successfully:", { 
          email: user.email, 
          emailId: emailResponse.data?.id,
          success: !!emailResponse.data
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

      } catch (emailError: any) {
        console.error('Error during password reset email processing:', emailError);
        console.error('Error stack:', emailError.stack);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to send password reset email',
            details: emailError.message
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
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