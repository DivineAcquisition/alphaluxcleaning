import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Resetting admin passwords...');

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

    const adminEmails = [
      'admin1@bayareacleaningpros.com',
      'ellie@bayareacleaningpros.com',
      'divine@bayareacleaningpros.com'
    ];

    const results = [];

    // Get all users
    const { data: listUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      throw new Error('Failed to list users');
    }

    for (const email of adminEmails) {
      try {
        console.log(`Resetting password for: ${email}`);

        // Find the user
        const user = listUsers?.users?.find(u => u.email === email);
        
        if (!user) {
          console.log(`User ${email} not found, creating...`);
          
          // Create the user if they don't exist
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: 'Bacp2025!-',
            email_confirm: true,
            user_metadata: {
              full_name: email === 'ellie@bayareacleaningpros.com' ? 'Ellie' : 
                        email === 'divine@bayareacleaningpros.com' ? 'Divine Acquisition' : 'Admin User'
            }
          });

          if (createError) {
            console.error(`Error creating ${email}:`, createError);
            results.push({ email, status: 'error', message: createError.message });
            continue;
          }

          if (newUser?.user) {
            // Add admin role
            const { error: roleError } = await supabaseAdmin
              .from('user_roles')
              .insert({
                user_id: newUser.user.id,
                role: 'admin'
              });

            if (roleError) {
              console.error(`Error adding role for ${email}:`, roleError);
            }
          }

          results.push({ email, status: 'created', message: 'User created with new password' });
        } else {
          console.log(`Found user ${email}, updating password...`);
          
          // Update the user's password
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            user.id,
            {
              password: 'Bacp2025!-',
              email_confirm: true
            }
          );

          if (updateError) {
            console.error(`Error updating password for ${email}:`, updateError);
            results.push({ email, status: 'error', message: updateError.message });
            continue;
          }

          // Ensure they have admin role
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .upsert({
              user_id: user.id,
              role: 'admin'
            }, {
              onConflict: 'user_id,role'
            });

          if (roleError) {
            console.error(`Error adding role for ${email}:`, roleError);
          }

          results.push({ email, status: 'updated', message: 'Password reset successfully' });
        }

      } catch (error) {
        console.error(`Error processing ${email}:`, error);
        results.push({ email, status: 'error', message: error.message });
      }
    }

    console.log('Password reset completed:', results);

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        message: 'Admin passwords reset successfully',
        newPassword: 'Bacp2025!-'
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
    console.error('Error in reset-admin-passwords function:', error);
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