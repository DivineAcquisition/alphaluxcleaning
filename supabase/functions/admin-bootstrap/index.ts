import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Admin Bootstrap starting...');

    // Validate environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing environment variables');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Server configuration error: Missing required environment variables',
          details: {
            hasUrl: !!supabaseUrl,
            hasServiceKey: !!supabaseServiceKey
          }
        }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Parse request body
    const { email, password } = await req.json();
    console.log(`📧 Processing admin bootstrap for: ${email}`);

    if (!email || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Check if user exists
    console.log('🔍 Checking if user exists...');
    const { data: listUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError);
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    const existingUser = listUsers?.users?.find(u => u.email === email);
    let userId: string;

    if (existingUser) {
      console.log(`✅ User exists, updating: ${existingUser.id}`);
      
      // Update existing user
      const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        {
          password,
          email_confirm: true,
          user_metadata: {
            full_name: 'Admin User'
          }
        }
      );

      if (updateError) {
        console.error('❌ Error updating user:', updateError);
        throw new Error(`Failed to update user: ${updateError.message}`);
      }

      userId = existingUser.id;
      console.log('✅ User updated and email confirmed');
    } else {
      console.log('🆕 Creating new user...');
      
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: 'Admin User'
        }
      });

      if (createError) {
        console.error('❌ Error creating user:', createError);
        throw new Error(`Failed to create user: ${createError.message}`);
      }

      if (!newUser?.user) {
        throw new Error('User creation returned no user object');
      }

      userId = newUser.user.id;
      console.log(`✅ User created: ${userId}`);
    }

    // Add to admin allowlist
    console.log('📝 Adding to admin_allowlist...');
    const { error: allowlistError } = await supabaseAdmin
      .from('admin_allowlist')
      .upsert({ email }, { onConflict: 'email' });

    if (allowlistError) {
      console.error('⚠️ Warning: Failed to add to allowlist:', allowlistError);
    } else {
      console.log('✅ Added to admin_allowlist');
    }

    // Add to admin_users with admin role
    console.log('👤 Setting up admin_users record...');
    const { error: adminUserError } = await supabaseAdmin
      .from('admin_users')
      .upsert({
        user_id: userId,
        email,
        role: 'admin',
        status: 'active'
      }, { onConflict: 'email' });

    if (adminUserError) {
      console.error('❌ Error setting admin role:', adminUserError);
      throw new Error(`Failed to set admin role: ${adminUserError.message}`);
    }

    console.log('✅ Admin role assigned');

    // Log the action
    const { error: auditError } = await supabaseAdmin
      .from('admin_audit_logs')
      .insert({
        user_id: userId,
        email,
        action: 'admin_bootstrap_complete',
        metadata: { source: 'admin-bootstrap-function' }
      });

    if (auditError) {
      console.error('⚠️ Warning: Failed to create audit log:', auditError);
    }

    console.log('🎉 Admin bootstrap completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        user_id: userId,
        email,
        role: 'admin',
        message: 'Admin account created/updated successfully. You can now log in.'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('💥 Error in admin-bootstrap function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
