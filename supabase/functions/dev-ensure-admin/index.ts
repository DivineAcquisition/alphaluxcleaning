import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdminSetupRequest {
  email: string;
  password?: string;
  role?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password = 'Admin123!', role = 'admin' }: AdminSetupRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate role
    const validRoles = ['admin', 'ops', 'viewer'];
    if (!validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: "Invalid role. Must be admin, ops, or viewer" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log(`Setting up admin account for: ${email}`);

    // Check if user exists in auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === email);

    let userId: string;

    if (existingUser) {
      console.log(`User exists: ${existingUser.id}`);
      userId = existingUser.id;

      // Update password and confirm email
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: password,
        email_confirm: true,
      });

      console.log('Updated password and confirmed email');
    } else {
      console.log('Creating new user');
      // Create new user with confirmed email
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
      });

      if (createError) {
        console.error('User creation failed:', createError);
        throw createError;
      }

      if (!newUser.user) {
        throw new Error('User creation returned no user data');
      }

      userId = newUser.user.id;
      console.log(`Created new user: ${userId}`);
    }

    // Add to admin_allowlist
    const { error: allowlistError } = await supabaseAdmin
      .from("admin_allowlist")
      .upsert({ email }, { onConflict: 'email' });

    if (allowlistError) {
      console.error('Allowlist error:', allowlistError);
    } else {
      console.log('Added to allowlist');
    }

    // Add/update admin_users record
    const { error: adminError } = await supabaseAdmin
      .from("admin_users")
      .upsert(
        {
          user_id: userId,
          email: email,
          role: role,
          status: 'active',
        },
        { onConflict: 'user_id' }
      );

    if (adminError) {
      console.error('Admin users error:', adminError);
      throw adminError;
    }

    console.log('Updated admin_users table');

    // Log the action
    await supabaseAdmin.from("admin_audit_logs").insert({
      user_id: userId,
      email: email,
      action: "dev_admin_setup",
      metadata: {
        role: role,
        method: 'dev-ensure-admin',
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Admin account ${existingUser ? 'updated' : 'created'} successfully`,
        user_id: userId,
        email: email,
        role: role,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error setting up admin:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to set up admin account",
        details: error.toString(),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
