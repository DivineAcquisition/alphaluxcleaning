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
    console.log('Fixing admin users...');

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

    // Fix divineacquisition.io@gmail.com - Delete and recreate with proper email
    try {
      // First, list all users to find the problematic one
      const { data: listUsers } = await supabaseAdmin.auth.admin.listUsers();
      const problematicUser = listUsers?.users?.find(user => 
        user.email === 'divineacquisition.io@gmail.com'
      );

      if (problematicUser) {
        console.log('Found problematic user, deleting...');
        await supabaseAdmin.auth.admin.deleteUser(problematicUser.id);
      }

      // Create a new user with a clean email
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: 'divine@alphaluxclean.com',
        password: 'Bacp2025!-',
        email_confirm: true,
        user_metadata: {
          full_name: 'Divine Acquisition',
          original_email: 'divineacquisition.io@gmail.com'
        }
      });

      if (createError) {
        console.error('Error creating divine user:', createError);
        results.push({ 
          email: 'divine@alphaluxclean.com',
          status: 'error', 
          message: createError.message 
        });
      } else if (newUser?.user) {
        // Add admin role
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: newUser.user.id,
            role: 'admin'
          });

        if (roleError) {
          console.error('Error adding role:', roleError);
        }

        results.push({ 
          email: 'divine@alphaluxclean.com',
          status: 'success', 
          message: 'User fixed and recreated',
          originalEmail: 'divineacquisition.io@gmail.com'
        });
      }
    } catch (error) {
      console.error('Error fixing divine user:', error);
      results.push({ 
        email: 'divine@alphaluxclean.com', 
        status: 'error', 
        message: error.message 
      });
    }

    // Also ensure other admin users exist and work properly
    const adminEmails = [
      'admin1@alphaluxclean.com',
      'ellie@alphaluxclean.com'
    ];

    for (const email of adminEmails) {
      try {
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: 'Bacp2025!-',
          email_confirm: true,
          user_metadata: {
            full_name: email === 'ellie@alphaluxclean.com' ? 'Ellie' : 'Admin User'
          }
        });

        if (createError && !createError.message.includes('already been registered')) {
          console.error(`Error creating ${email}:`, createError);
          results.push({ email, status: 'error', message: createError.message });
        } else {
          if (newUser?.user) {
            // Add admin role
            const { error: roleError } = await supabaseAdmin
              .from('user_roles')
              .upsert({
                user_id: newUser.user.id,
                role: 'admin'
              }, {
                onConflict: 'user_id,role'
              });

            if (roleError) {
              console.error(`Error adding role for ${email}:`, roleError);
            }
          }
          
          results.push({ 
            email, 
            status: 'success', 
            message: newUser?.user ? 'Created successfully' : 'Already exists'
          });
        }
      } catch (error) {
        console.error(`Error processing ${email}:`, error);
        results.push({ email, status: 'error', message: error.message });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        message: 'Admin users fixed successfully'
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
    console.error('Error in fix-admin-users function:', error);
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