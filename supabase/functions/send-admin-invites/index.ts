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
  'divine@bayareacleaningpros.com'
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

        // Create new user with admin role
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true,
          password: 'Bacp2025!-', // Updated password
          user_metadata: {
            role: 'admin',
            full_name: email === 'ellie@bayareacleaningpros.com' ? 'Ellie' : 
                      email === 'divine@bayareacleaningpros.com' ? 'Divine Acquisition' : 'Admin User'
          }
        });

        if (createError) {
          // If user already exists, that's okay
          if (createError.message.includes('already been registered')) {
            console.log(`User ${email} already exists`);
            
            // Find the existing user and ensure they have admin role
            const { data: listUsers } = await supabaseAdmin.auth.admin.listUsers();
            const existingUser = listUsers?.users?.find(user => user.email === email);
            
            if (existingUser) {
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
            }
            
            results.push({ email, status: 'existing_user', message: 'User already exists with admin role' });
            continue;
          } else {
            console.error(`Error creating user ${email}:`, createError);
            results.push({ email, status: 'error', message: createError.message });
            continue;
          }
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

          // Send welcome email with Resend using custom domain
          const emailResponse = await resend.emails.send({
            from: 'Bay Area Cleaning Pros <admin@bayareacleaningpros.com>',
            to: [email],
            subject: 'Welcome to Bay Area Cleaning Pros Admin Portal',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #2563eb;">Welcome to Bay Area Cleaning Pros</h1>
                <p>Your admin account has been created with the email: <strong>${email}</strong></p>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2>Login Credentials:</h2>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Password:</strong> Bacp2025!-</p>
                </div>
                
                <h2>Getting Started:</h2>
                <ol>
                  <li>Visit the admin portal: <a href="https://fc9bf4c2-5143-4270-83ec-c7de4b1ed612.lovableproject.com/admin-auth">Admin Portal</a></li>
                  <li>Login with the credentials above</li>
                  <li>You'll be redirected to update your password</li>
                  <li>Create a secure password that meets all requirements</li>
                </ol>
                
                <p style="color: #dc2626; font-weight: bold;">
                  IMPORTANT: Please keep your password secure. You can change it anytime in your profile settings.
                </p>
                
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