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
          companyName: 'Bay Area Cleaning Professionals',
        })
      );

      emailContent = {
        subject: 'Complete Your Admin Access Setup',
        html,
      };
    } else if (email_action_type === 'recovery') {
      // Password recovery email
      const resetUrl = `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;
      
      emailContent = {
        subject: 'Reset Your Admin Password - Bay Area Cleaning Professionals',
        html: `
          <h1>Reset Your Password</h1>
          <p>You requested to reset your password for Bay Area Cleaning Professionals admin access.</p>
          <p><a href="${resetUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Reset Password</a></p>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <p>This link will expire in 1 hour.</p>
        `,
      };
    } else {
      // Default confirmation email
      const confirmUrl = `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;
      
      emailContent = {
        subject: 'Confirm Your Email - Bay Area Cleaning Professionals',
        html: `
          <h1>Confirm Your Email</h1>
          <p>Please confirm your email address to complete your admin access setup.</p>
          <p><a href="${confirmUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Confirm Email</a></p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        `,
      };
    }

    const { error } = await resend.emails.send({
      from: "AlphaLuxClean <noreply@info.alphaluxclean.com>",
      to: [user.email],
      subject: emailContent.subject,
      html: emailContent.html,
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