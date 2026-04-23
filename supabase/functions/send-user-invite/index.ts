import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';
import { Resend } from "npm:resend@4.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { UserInviteEmail } from '../_shared/email-templates/user-invite.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  role?: 'admin' | 'subcontractor' | 'customer';
  redirectTo?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('User invite function called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, role = 'customer', redirectTo }: InviteRequest = await req.json();
    
    console.log('Processing invite for:', { email, role });

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

    // Assign the specified role
    if (authData.user) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ 
          user_id: authData.user.id, 
          role: role 
        });

      if (roleError) {
        console.error('Error assigning role:', roleError);
        // Continue anyway, they can be assigned a role later
      }
    }

    // Generate password reset link for them to set their password
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: redirectTo || `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com')}/auth`
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
      React.createElement(UserInviteEmail, {
        email,
        role,
        inviteUrl: resetData.properties?.action_link || '',
        companyName: 'AlphaLux Clean',
      })
    );

    // Send the email using Resend
    const emailResponse = await resend.emails.send({
      from: "AlphaLuxClean <noreply@info.alphaluxclean.com>",
      to: [email],
      subject: `You're invited to join AlphaLux Clean${role !== 'customer' ? ` as ${role}` : ''}`,
      html: emailHtml,
    });

    console.log("Invite email sent successfully:", { 
      email, 
      emailId: emailResponse.data?.id 
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "User invited successfully",
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
    console.error("Error in send-user-invite function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Failed to send user invitation"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);