import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = req.headers.get("Authorization");
    const { action, ...params } = await req.json().catch(() => ({}));

    // If no action specified, default to auth guard behavior
    if (!action) {
      if (!auth?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const jwt = auth.replace("Bearer ", "");
      
      // Verify the JWT and get user
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        {
          global: { headers: { Authorization: `Bearer ${jwt}` } }
        }
      );

      const { data: { user }, error: userError } = await userClient.auth.getUser();
      if (userError || !user) {
        console.error('User verification failed:', userError);
        return new Response(JSON.stringify({ error: "Unauthorized" }), { 
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Use service role to check admin status
      const svc = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      const { data: admin, error: adminError } = await svc
        .from("admin_users")
        .select("role, status, email")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (adminError) {
        console.error('Admin check failed:', adminError);
        return new Response(JSON.stringify({ error: "Internal server error" }), { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (!admin || admin.status !== "active") {
        return new Response(JSON.stringify({ error: "Forbidden" }), { 
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Log successful admin access
      await svc.from("admin_audit_logs").insert({
        user_id: user.id,
        email: admin.email,
        action: "admin_access_granted",
        metadata: {
          role: admin.role,
          ip: req.headers.get("x-forwarded-for") || "unknown",
          user_agent: req.headers.get("user-agent") || "unknown"
        }
      });

      return new Response(JSON.stringify({ 
        role: admin.role, 
        email: admin.email, 
        user_id: user.id 
      }), { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Admin management actions (require service role or admin auth)
    const svc = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    switch (action) {
      case 'list_users': {
        const { data: users, error } = await svc
          .from("admin_users")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        
        return new Response(JSON.stringify({ users }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      case 'list_allowlist': {
        const { data: allowlist, error } = await svc
          .from("admin_allowlist")
          .select("*")
          .order("id", { ascending: true });
        
        if (error) throw error;
        
        return new Response(JSON.stringify({ allowlist }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      case 'add_to_allowlist': {
        const { email, domain } = params;
        
        const { error } = await svc
          .from("admin_allowlist")
          .insert({ email, domain });
        
        if (error) throw error;
        
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      case 'update_user_role': {
        const { user_id, role } = params;
        
        const { error } = await svc
          .from("admin_users")
          .update({ role })
          .eq("user_id", user_id);
        
        if (error) throw error;
        
        // Log the role change
        await svc.from("admin_audit_logs").insert({
          user_id,
          action: "role_changed",
          metadata: { new_role: role }
        });
        
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      case 'update_user_status': {
        const { user_id, status } = params;
        
        const { error } = await svc
          .from("admin_users")
          .update({ status })
          .eq("user_id", user_id);
        
        if (error) throw error;
        
        // Log the status change
        await svc.from("admin_audit_logs").insert({
          user_id,
          action: "status_changed",
          metadata: { new_status: status }
        });
        
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

  } catch (error) {
    console.error('Admin auth guard error:', error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});