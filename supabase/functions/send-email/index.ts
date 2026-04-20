import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';
import { Resend } from "npm:resend@4.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { AdminInviteEmail } from '../_shared/email-templates/admin-invite.tsx';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function renderBrandedAuthEmail({
  title,
  body,
  ctaLabel,
  ctaUrl,
  footerNote,
}: {
  title: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  footerNote?: string;
}) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#FCFBF7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#FCFBF7;padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(15,42,68,0.06);">
          <tr><td style="height:6px;background:linear-gradient(135deg,#F6DFA8 0%,#ECC98B 40%,#A17938 100%);"></td></tr>
          <tr>
            <td style="padding:32px 28px 8px 28px;text-align:center;background:#ffffff;">
              <a href="https://alphaluxcleaning.com" style="text-decoration:none;">
                <img src="https://alphaluxcleaning.com/wp-content/uploads/2024/08/alphalux-logo.png" alt="AlphaLux Cleaning" width="180" style="display:block;margin:0 auto;" />
              </a>
              <div style="margin-top:12px;font-family:Georgia,serif;font-style:italic;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#A17938;">A Higher Standard of Clean</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 32px 32px;color:#0F2A44;">
              <h1 style="margin:0 0 16px 0;font-family:Georgia,serif;font-size:26px;color:#0F2A44;">${title}</h1>
              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.6;color:#1B314B;">${body}</p>
              <div style="text-align:center;margin:28px 0;">
                <a href="${ctaUrl}" style="background:linear-gradient(135deg,#F6DFA8 0%,#ECC98B 45%,#A17938 100%);color:#0F2A44;padding:14px 36px;border-radius:999px;text-decoration:none;font-weight:700;display:inline-block;box-shadow:0 6px 18px rgba(161,121,56,0.35);">${ctaLabel}</a>
              </div>
              ${footerNote ? `<p style="margin:16px 0 0 0;font-size:13px;color:#5a6b7d;line-height:1.5;">${footerNote}</p>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px 28px;background:#FCFBF7;text-align:center;border-top:1px solid #F0E9D6;">
              <div style="font-family:Georgia,serif;font-weight:700;color:#0F2A44;margin-bottom:6px;">AlphaLux Cleaning</div>
              <div style="font-size:12px;color:#5a6b7d;line-height:1.55;">
                Premium Residential & Commercial Cleaning<br/>
                Long Island, NY • New Jersey • Texas • California
              </div>
              <div style="font-size:11px;color:#a5adb8;margin-top:10px;">© ${new Date().getFullYear()} AlphaLux Cleaning. All rights reserved.</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Email auth hook called');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    const wh = new Webhook(hookSecret);
    
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = wh.verify(payload, headers) as {
      user: {
        email: string;
      };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
      };
    };

    console.log('Processing email for:', { email: user.email, action: email_action_type });

    // Handle different email types
    let emailContent: { subject: string; html: string };

    if (email_action_type === 'signup' || email_action_type === 'email_change_confirm_new') {
      // Admin invite email for signup/confirmation
      const html = await renderAsync(
        React.createElement(AdminInviteEmail, {
          email: user.email,
          role: 'viewer',
          inviteUrl: `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`,
          companyName: 'AlphaLux Cleaning',
        })
      );

      emailContent = {
        subject: 'Complete Your Admin Access Setup - AlphaLux Cleaning',
        html,
      };
    } else if (email_action_type === 'recovery') {
      // Password recovery email
      const resetUrl = `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;

      emailContent = {
        subject: 'Reset Your Admin Password - AlphaLux Cleaning',
        html: renderBrandedAuthEmail({
          title: 'Reset Your Password',
          body: 'You requested to reset your password for the AlphaLux Cleaning admin portal. Click the button below to choose a new one. This link will expire in 1 hour.',
          ctaLabel: 'Reset Password',
          ctaUrl: resetUrl,
          footerNote: "If you didn't request this, you can safely ignore this email.",
        }),
      };
    } else {
      // Default confirmation email
      const confirmUrl = `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;

      emailContent = {
        subject: 'Confirm Your Email - AlphaLux Cleaning',
        html: renderBrandedAuthEmail({
          title: 'Confirm Your Email',
          body: 'Please confirm your email address to complete your AlphaLux Cleaning admin access setup.',
          ctaLabel: 'Confirm Email',
          ctaUrl: confirmUrl,
          footerNote: "If you didn't request this, you can safely ignore this email.",
        }),
      };
    }

    const fromAddress = Deno.env.get("EMAIL_FROM") || "AlphaLux Cleaning <noreply@info.alphaluxclean.com>";
    const replyTo = Deno.env.get("EMAIL_REPLY_TO") || "support@alphaluxcleaning.com";

    const { error } = await resend.emails.send({
      from: fromAddress,
      to: [user.email],
      subject: emailContent.subject,
      html: emailContent.html,
      replyTo,
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    console.log('Email sent successfully to:', user.email);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Email hook error:', error);
    return new Response(
      JSON.stringify({
        error: {
          http_code: error.code || 500,
          message: error.message || 'Failed to send email',
        },
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);