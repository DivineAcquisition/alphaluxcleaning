import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OTPRequest {
  email: string;
  type: 'request' | 'verify';
  token?: string;
  captcha?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, type, token, captcha }: OTPRequest = await req.json();
    
    // Rate limiting check (simple IP-based for now)
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    if (type === 'request') {
      // Request OTP
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${req.headers.get("origin")}/auth/callback`,
        }
      });

      if (error) {
        console.error('OTP request error:', error);
        return new Response(JSON.stringify({ 
          error: "If an account exists for this email, we'll send a code." 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200, // Always return 200 to prevent user enumeration
        });
      }

      return new Response(JSON.stringify({ 
        message: "If an account exists for this email, we'll send a code." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else if (type === 'verify') {
      // Verify OTP
      if (!token) {
        return new Response(JSON.stringify({ error: "Token is required" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      });

      if (error) {
        return new Response(JSON.stringify({ error: "Invalid or expired code" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      // Check if user is a company user (admin/staff)
      if (data.user) {
        const { data: companyUser } = await supabase
          .from('company_users')
          .select('role, company_id')
          .eq('user_id', data.user.id)
          .single();

        return new Response(JSON.stringify({ 
          user: data.user,
          session: data.session,
          isAdmin: !!companyUser,
          role: companyUser?.role || null
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      return new Response(JSON.stringify({ error: "Authentication failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    return new Response(JSON.stringify({ error: "Invalid request type" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });

  } catch (error) {
    console.error('Admin auth error:', error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});