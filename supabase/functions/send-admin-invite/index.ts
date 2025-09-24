import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';
import { Resend } from "npm:resend@4.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { AdminInviteEmail } from '../_shared/email-templates/admin-invite.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdminInviteRequest {
  email: string;
  role?: 'admin' | 'ops' | 'viewer';
  redirectTo?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Admin invite function called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, role = 'viewer', redirectTo }: AdminInviteRequest = await req.json();
    
    console.log('Processing admin invite for:', { email, role });

    if (!email) {
      console.error('Email is required');
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if email is in allowlist first
    const { data: allowlistCheck } = await supabase
      .from('admin_allowlist')
      .select('email')
      .eq('email', email)
      .single();

    if (!allowlistCheck) {
      console.error('Email not in admin allowlist:', email);
      return new Response(
        JSON.stringify({ error: 'Email not authorized for admin access' }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create the user using Supabase Admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: false, // Don't auto-confirm, let them set password
    });

    if (authError) {
      console.error('Error creating user:', authError);
      return new Response(
        JSON.stringify({ error: `Failed to create user: ${authError.message}` }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log('User created successfully:', authData.user?.id);

    // Add user to admin_users table
    if (authData.user) {
      const { error: adminError } = await supabase
        .from('admin_users')
        .insert({ 
          user_id: authData.user.id, 
          email: email,
          role: role,
          status: 'active'
        });

      if (adminError) {
        console.error('Error adding to admin_users:', adminError);
        // Continue anyway, they can be assigned a role later
      }
    }

    // Generate password reset link for them to set their password
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: redirectTo || `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com')}/admin-auth-login`
      }
    });

    if (resetError) {
      console.error('Error generating reset link:', resetError);
      return new Response(
        JSON.stringify({ error: `Failed to generate reset link: ${resetError.message}` }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Render the email template
    const emailHtml = await renderAsync(
      React.createElement(AdminInviteEmail, {
        email,
        role,
        inviteUrl: resetData.properties?.action_link || '',
        companyName: 'Bay Area Cleaning Professionals',
      })
    );

    // Send the email using Resend
    const emailResponse = await resend.emails.send({
      from: "Bay Area Cleaning Professionals <admin@bayareacleaningpros.com>",
      to: [email],
      subject: `Admin Access Invitation - Bay Area Cleaning Professionals`,
      html: emailHtml,
    });

    console.log("Admin invite email sent successfully:", { 
      email, 
      emailId: emailResponse.data?.id 
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Admin invitation sent successfully",
        userId: authData.user?.id,
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
    console.error("Error in send-admin-invite function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Failed to send admin invitation"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);