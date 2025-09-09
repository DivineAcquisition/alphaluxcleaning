import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CustomerOTPRequest {
  email: string;
  type: 'request' | 'verify';
  token?: string;
  name?: string;
  companyId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, type, token, name, companyId }: CustomerOTPRequest = await req.json();
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const defaultCompanyId = '550e8400-e29b-41d4-a716-446655440000'; // Bay Area Cleaning Pros
    const targetCompanyId = companyId || defaultCompanyId;

    if (type === 'request') {
      // Request OTP for customer
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${req.headers.get("origin")}/portal/callback`,
        }
      });

      if (error) {
        console.error('Customer OTP request error:', error);
      }

      // Always return success to prevent user enumeration
      return new Response(JSON.stringify({ 
        message: "If a customer account exists for this email, we'll send a verification code." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else if (type === 'verify') {
      // Verify OTP for customer
      if (!token) {
        return new Response(JSON.stringify({ error: "Verification code is required" }), {
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
        return new Response(JSON.stringify({ error: "Invalid or expired verification code" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      if (data.user) {
        // Check if customer exists, create if not
        let { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('email', email)
          .eq('company_id', targetCompanyId)
          .single();

        if (!customer && !customerError) {
          // Create new customer record
          const { data: newCustomer, error: createError } = await supabase
            .from('customers')
            .insert({
              company_id: targetCompanyId,
              user_id: data.user.id,
              email: email,
              name: name || data.user.email?.split('@')[0] || 'Customer'
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating customer:', createError);
            return new Response(JSON.stringify({ error: "Failed to create customer account" }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 500,
            });
          }
          
          customer = newCustomer;
        } else if (customerError && customerError.code !== 'PGRST116') {
          console.error('Customer lookup error:', customerError);
          return new Response(JSON.stringify({ error: "Failed to verify customer" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          });
        }

        // Create customer portal session
        const sessionToken = crypto.randomUUID();
        const { error: sessionError } = await supabase
          .from('customer_portal_sessions')
          .insert({
            customer_id: customer.id,
            company_id: targetCompanyId,
            session_token: sessionToken,
            expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() // 8 hours
          });

        if (sessionError) {
          console.error('Session creation error:', sessionError);
          return new Response(JSON.stringify({ error: "Failed to create session" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          });
        }

        return new Response(JSON.stringify({ 
          user: data.user,
          session: data.session,
          customer,
          portalToken: sessionToken
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
    console.error('Customer auth error:', error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});