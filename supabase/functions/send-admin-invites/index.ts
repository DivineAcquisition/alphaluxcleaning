import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const adminEmails = [
  'admin1@bayareacleaningpros.com',
  'ellie@bayareacleaningpros.com', 
  'divineacquisition.io@gmail.com'
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

        // Check if user already exists using listUsers
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = usersData?.users?.find(user => user.email === email);
        
        if (existingUser) {
          console.log(`User ${email} already exists, skipping invite`);
          
          // Ensure they have admin role
          const { data: roleData } = await supabaseAdmin
            .from('user_roles')
            .select('*')
            .eq('user_id', existingUser.id)
            .eq('role', 'admin')
            .single();

          if (!roleData) {
            await supabaseAdmin
              .from('user_roles')
              .insert({
                user_id: existingUser.id,
                role: 'admin'
              });
            console.log(`Added admin role to existing user: ${email}`);
          }

          results.push({ email, status: 'existing_user', message: 'User already exists with admin role' });
          continue;
        }

        // Create new user with admin role
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: {
            role: 'admin'
          }
        });

        if (createError) {
          console.error(`Error creating user ${email}:`, createError);
          results.push({ email, status: 'error', message: createError.message });
          continue;
        }

        if (newUser?.user) {
          // Add admin role to user_roles table
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .insert({
              user_id: newUser.user.id,
              role: 'admin'
            });

          if (roleError) {
            console.error(`Error adding role for ${email}:`, roleError);
          }

          // Send password setup email
          const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email,
            options: {
              redirectTo: `${Deno.env.get('SUPABASE_URL')?.replace('https://', 'https://').replace('.supabase.co', '.supabase.co')}/auth/v1/verify?redirect_to=${encodeURIComponent(window?.location?.origin || 'https://kqoezqzogleaaupjzxch.supabase.co')}/admin-auth`
            }
          });

          if (resetError) {
            console.error(`Error generating reset link for ${email}:`, resetError);
          }

          // Send welcome email with Resend
          const emailResponse = await resend.emails.send({
            from: 'Bay Area Cleaning Pros <onboarding@resend.dev>',
            to: [email],
            subject: 'Welcome to Bay Area Cleaning Pros Admin Portal',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #2563eb;">Welcome to Bay Area Cleaning Pros</h1>
                <p>You've been invited to join the Bay Area Cleaning Pros admin portal.</p>
                <p>Your admin account has been created with the email: <strong>${email}</strong></p>
                
                <h2>Getting Started:</h2>
                <ol>
                  <li>Visit the admin portal: <a href="${window?.location?.origin || 'https://kqoezqzogleaaupjzxch.supabase.co'}/admin-auth">Admin Portal</a></li>
                  <li>Click "Forgot your password?" to set up your password</li>
                  <li>Or continue with Google if you prefer</li>
                </ol>
                
                <p>If you have any questions, please contact the system administrator.</p>
                
                <hr style="margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">
                  This email was sent from Bay Area Cleaning Pros admin system.
                </p>
              </div>
            `,
          });

          console.log(`Email sent to ${email}:`, emailResponse);
          results.push({ 
            email, 
            status: 'success', 
            message: 'User created and invitation email sent',
            userId: newUser.user.id 
          });
        }

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