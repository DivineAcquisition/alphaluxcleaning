import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const adminEmails = [
  'admin1@alphaluxclean.com',
  'ellie@alphaluxclean.com', 
  'divine@alphaluxclean.com'
];

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting admin invites process...');

    // Initialize Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const results = [];

    for (const email of adminEmails) {
      try {
        console.log(`Processing admin invite for: ${email}`);

        // Check if user already exists
        const { data: listUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = listUsers?.users?.find(user => user.email === email);

        if (existingUser) {
          console.log(`User ${email} already exists`);
          
          // Add admin role if not exists
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .upsert({
              user_id: existingUser.id,
              role: 'admin'
            }, {
              onConflict: 'user_id,role'
            });

          if (roleError) {
            console.error(`Error adding role for ${email}:`, roleError);
          }
          
          results.push({ email, status: 'existing_user', message: 'User already exists with admin role' });
          continue;
        }

        // Use our send-user-invite function instead of Supabase's invite
        const inviteResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-user-invite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            email,
            role: 'admin',
            redirectTo: 'https://fc9bf4c2-5143-4270-83ec-c7de4b1ed612.lovableproject.com/auth'
          })
        });

        const inviteResult = await inviteResponse.json();

        if (!inviteResponse.ok) {
          console.error(`Error inviting ${email}:`, inviteResult);
          results.push({ email, status: 'error', message: inviteResult.error || 'Failed to send invitation' });
          continue;
        }

        console.log(`Invitation sent to ${email}:`, inviteResult);
        results.push({ 
          email, 
          status: 'success', 
          message: 'User created and invitation email sent',
          userId: inviteResult.userId 
        });

      } catch (error) {
        console.error(`Error processing ${email}:`, error);
        results.push({ 
          email, 
          status: 'error', 
          message: error.message 
        });
      }
    }

    console.log('Admin invites process completed:', results);

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        message: `Processed ${adminEmails.length} admin invitations`
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error in send-admin-invites function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);