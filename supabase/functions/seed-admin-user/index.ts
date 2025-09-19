import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🔧 Seeding admin user...");
    
    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { 
        auth: { 
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );

    const adminEmail = "info@alphaluxclean.com";
    const adminPassword = "@Sher2002";

    // Check if admin user already exists
    const { data: existingUser, error: getUserError } = await supabase.auth.admin.listUsers();
    
    if (getUserError) {
      throw new Error(`Failed to list users: ${getUserError.message}`);
    }

    const adminExists = existingUser.users.find(user => user.email === adminEmail);

    if (adminExists) {
      console.log("✅ Admin user already exists");
      
      // Ensure they have admin role in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: adminExists.id,
          email: adminEmail,
          first_name: 'Admin',
          last_name: 'User',
          role: 'admin'
        });

      if (profileError) {
        console.error("❌ Error updating admin profile:", profileError);
      } else {
        console.log("✅ Admin profile updated successfully");
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Admin user already exists and profile updated",
        userId: adminExists.id
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create admin user
    console.log("🔐 Creating admin user with email:", adminEmail);
    
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: 'Admin',
        last_name: 'User'
      }
    });

    if (createError) {
      throw new Error(`Failed to create admin user: ${createError.message}`);
    }

    console.log("✅ Admin user created with ID:", newUser.user?.id);

    // Create profile with admin role
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: newUser.user!.id,
        email: adminEmail,
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin'
      });

    if (profileError) {
      console.error("❌ Error creating admin profile:", profileError);
      throw new Error(`Failed to create admin profile: ${profileError.message}`);
    }

    console.log("✅ Admin profile created successfully");

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Admin user created successfully",
      userId: newUser.user?.id,
      email: adminEmail
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("❌ Error seeding admin user:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});