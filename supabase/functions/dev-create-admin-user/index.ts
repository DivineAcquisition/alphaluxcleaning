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
    const { email, role = 'admin' }: DevUserRequest = await req.json();
    
    console.log('Creating dev admin user:', { email, role });

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(email);
    
    if (existingUser?.user) {
      console.log('User already exists, checking admin status');
      
      // Check if they're in admin_users
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', existingUser.user.id)
        .single();

      if (adminUser) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'User already exists with admin access',
            userId: existingUser.user.id,
            existing: true
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Add to admin tables
      const { error: allowlistError } = await supabase
        .from('admin_allowlist')
        .upsert({ email }, { onConflict: 'email' });
      
      const { error: adminUserError } = await supabase
        .from('admin_users')
        .insert({ 
          user_id: existingUser.user.id, 
          email: email,
          role: role,
          status: 'active'
        });

      if (adminUserError) {
        console.error('Error adding to admin_users:', adminUserError);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Existing user granted admin access',
          userId: existingUser.user.id
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Add to allowlist first
    const { error: allowlistError } = await supabase
      .from('admin_allowlist')
      .upsert({ email }, { onConflict: 'email' });

    // Create new user with confirmed email (dev mode)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
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
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Log the action
      await supabase
        .from('admin_audit_logs')
        .insert({
          user_id: authData.user.id,
          email: email,
          action: 'dev_admin_user_created',
          metadata: { role: role, dev_mode: true }
        });
    }

    console.log('Dev admin user created successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Dev admin user created successfully (email confirmed)",
        userId: authData.user?.id
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