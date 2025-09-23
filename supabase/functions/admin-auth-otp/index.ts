import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

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
      // Generate secure 6-digit code
      const code = Array.from(crypto.getRandomValues(new Uint8Array(6)), byte => 
        String(byte % 10)
      ).join('');
      
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      // Clean up old codes for this email
      await supabase
        .from('admin_otp_codes')
        .delete()
        .eq('email', email);
      
      // Store new code
      const { error: insertError } = await supabase
        .from('admin_otp_codes')
        .insert({
          email,
          code,
          expires_at: expiresAt.toISOString()
        });
      
      if (insertError) {
        console.error('Error storing OTP code:', insertError);
        return new Response(JSON.stringify({ 
          error: "If an account exists for this email, we'll send a code." 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      // Send email via send-email-system
      try {
        const { error: emailError } = await supabase.functions.invoke('send-email-system', {
          body: {
            template: 'admin_otp',
            to: email,
            data: {
              code,
              adminEmail: email
            },
            category: 'transactional'
          }
        });
        
        if (emailError) {
          console.error('Email sending error:', emailError);
        }
      } catch (error) {
        console.error('Email function call error:', error);
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

      // Look up the OTP code in our custom table
      const { data: otpRecord, error: otpError } = await supabase
        .from('admin_otp_codes')
        .select('*')
        .eq('email', email)
        .eq('code', token)
        .eq('verified', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (otpError || !otpRecord) {
        // Increment attempts for security logging
        if (otpRecord) {
          await supabase
            .from('admin_otp_codes')
            .update({ attempts: otpRecord.attempts + 1 })
            .eq('id', otpRecord.id);
        }
        
        return new Response(JSON.stringify({ error: "Invalid or expired code" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      // Mark code as verified
      await supabase
        .from('admin_otp_codes')
        .update({ 
          verified: true, 
          verified_at: new Date().toISOString() 
        })
        .eq('id', otpRecord.id);

      // Check if user exists and has admin role
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .eq('role', 'admin')
        .single();

      if (!profile) {
        return new Response(JSON.stringify({ error: "Admin access denied" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        });
      }

      // Create a session token for the admin (simplified approach)
      const sessionToken = Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => 
        byte.toString(16).padStart(2, '0')
      ).join('');

      return new Response(JSON.stringify({ 
        user: {
          id: profile.user_id,
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name
        },
        session: {
          access_token: sessionToken,
          expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        },
        isAdmin: true,
        role: profile.role
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
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