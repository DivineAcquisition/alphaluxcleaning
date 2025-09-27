import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DevUserRequest {
  email: string;
  role?: 'admin' | 'ops' | 'viewer';
  password?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Dev create admin user function called');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const requestBody = await req.json().catch(e => {
      console.error('Failed to parse JSON:', e);
      throw new Error('Invalid JSON in request body');
    });

    const { email, role = 'admin', password }: DevUserRequest = requestBody;
    
    console.log('Creating dev admin user:', { email, role, hasPassword: !!password });

    // Validate inputs
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      console.error('Invalid email provided:', email);
      return new Response(
        JSON.stringify({ error: 'Valid email is required' }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (role && !['admin', 'ops', 'viewer'].includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role. Must be admin, ops, or viewer' }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if user already exists
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('Error listing users:', listError);
      return new Response(
        JSON.stringify({ error: 'Failed to check existing users' }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    const existingUser = users?.users?.find(user => user.email === email);
    
    if (existingUser) {
      console.log('User already exists, checking admin status');
      
      // Check if they're in admin_users
      const { data: adminUser, error: adminCheckError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', existingUser.id)
        .single();

      if (adminCheckError && adminCheckError.code !== 'PGRST116') {
        console.error('Error checking admin status:', adminCheckError);
        return new Response(
          JSON.stringify({ error: 'Failed to verify admin status' }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      if (adminUser) {
        // Update password if provided
        if (password) {
          const { error: passwordError } = await supabase.auth.admin.updateUserById(
            existingUser.id, 
            { password }
          );
          if (passwordError) {
            console.error('Error updating password:', passwordError);
            return new Response(
              JSON.stringify({ error: 'Failed to update password' }),
              {
                status: 500,
                headers: { "Content-Type": "application/json", ...corsHeaders },
              }
            );
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'User already exists with admin access',
            userId: existingUser.id,
            existing: true
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Add to admin_allowlist with error handling
      const { error: allowlistError } = await supabase
        .from('admin_allowlist')
        .upsert({ email }, { onConflict: 'email' });
      
      if (allowlistError) {
        console.error('Error adding to allowlist:', allowlistError.message, allowlistError);
        // Continue anyway - this is not critical for admin access
      }
      
      // Add to admin_users with error handling
      const { error: adminUserError } = await supabase
        .from('admin_users')
        .insert({ 
          user_id: existingUser.id, 
          email: email,
          role: role,
          status: 'active'
        });

      if (adminUserError) {
        console.error('Error adding to admin_users:', adminUserError);
        return new Response(
          JSON.stringify({ error: 'Failed to grant admin access' }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Update password if provided
      if (password) {
        const { error: passwordError } = await supabase.auth.admin.updateUserById(
          existingUser.id, 
          { password }
        );
        if (passwordError) {
          console.error('Error updating password:', passwordError);
          // Don't fail the whole request for password update errors
        }
      }

      // Log the action (soft error - don't fail request)
      const { error: auditError } = await supabase
        .from('admin_audit_logs')
        .insert({
          user_id: existingUser.id,
          email: email,
          action: 'dev_admin_access_granted',
          metadata: { role: role, dev_mode: true }
        });

      if (auditError) {
        console.error('Error logging audit:', auditError);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Existing user granted admin access',
          userId: existingUser.id
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Add to allowlist first with error handling
    const { error: allowlistError } = await supabase
      .from('admin_allowlist')
      .upsert({ email }, { onConflict: 'email' });

    if (allowlistError) {
      console.error('Error adding to allowlist:', allowlistError);
      return new Response(
        JSON.stringify({ error: 'Failed to add to admin allowlist' }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create new user with confirmed email and password (dev mode)
    const userPassword = password || 'DevAdmin123!';
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: userPassword,
      email_confirm: true, // Auto-confirm for dev mode
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

    // Add to admin_users table
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
        return new Response(
          JSON.stringify({ error: `Failed to add admin role: ${adminError.message}` }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Log the action (soft error - don't fail request)
      const { error: auditError } = await supabase
        .from('admin_audit_logs')
        .insert({
          user_id: authData.user.id,
          email: email,
          action: 'dev_admin_user_created',
          metadata: { role: role, dev_mode: true }
        });

      if (auditError) {
        console.error('Error logging audit:', auditError);
      }
    }

    console.log('Dev admin user created successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Dev admin user created successfully (email confirmed)",
        userId: authData.user?.id,
        password: password ? 'Custom password set' : 'Default password: DevAdmin123!'
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
    console.error("Error in dev-create-admin-user function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Failed to create dev admin user"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);