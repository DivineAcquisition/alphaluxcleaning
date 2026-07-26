import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Resolve the caller's JWT to an active `admin_users` row.
 *
 * Used to gate the service-role management actions below. Returns the
 * caller's role on success so the handler can additionally require the
 * full `admin` role for destructive operations.
 */
async function requireActiveAdmin(
  authHeader: string | null,
  // deno-lint-ignore no-explicit-any
  svc: any,
): Promise<
  | { ok: true; userId: string; role: string }
  | { ok: false; status: number; error: string }
> {
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }
  const jwt = authHeader.replace("Bearer ", "");

  const userClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: `Bearer ${jwt}` } } },
  );

  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const { data: admin } = await svc
    .from("admin_users")
    .select("role, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!admin) {
    return { ok: false, status: 403, error: "Forbidden" };
  }
  return { ok: true, userId: user.id, role: (admin as any).role };
}

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
        console.error('JWT token:', jwt?.substring(0, 20) + '...');
        return new Response(JSON.stringify({ 
          error: "Unauthorized", 
          details: userError?.message 
        }), { 
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      console.log('User authenticated:', { 
        id: user.id, 
        email: user.email 
      });

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
        return new Response(JSON.stringify({ 
          error: "Internal server error", 
          details: adminError.message 
        }), { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      console.log('Admin query result:', { 
        admin, 
        userId: user.id,
        queryUsed: `user_id = ${user.id}, status = active`
      });

      if (!admin || admin.status !== "active") {
        return new Response(JSON.stringify({ 
          error: "Forbidden", 
          reason: !admin ? "No admin record found" : "Admin status not active",
          userId: user.id 
        }), { 
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

    // ---- Admin management actions ----
    //
    // These run with the service-role key, so the CALLER must be proven
    // to be an active admin first. Previously this block executed for
    // anyone who could reach the function URL, which meant an anonymous
    // client could enumerate admin users and change roles.
    const svc = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const caller = await requireActiveAdmin(auth, svc);
    if (!caller.ok) {
      return new Response(
        JSON.stringify({ error: caller.error }),
        {
          status: caller.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Role and status changes are destructive — restrict to full admins.
    const PRIVILEGED_ACTIONS = ["update_user_role", "update_user_status", "add_to_allowlist"];
    if (PRIVILEGED_ACTIONS.includes(action) && caller.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden", reason: `${action} requires the admin role` }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

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
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Admin auth guard error:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    return new Response(JSON.stringify({ 
      error: "Internal server error", 
      details: err.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});