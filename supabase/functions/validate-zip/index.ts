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
    const { zipCode } = await req.json();
    
    console.log("🔍 Validating ZIP code:", zipCode);
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Query service_areas table
    const { data, error } = await supabase
      .from('service_areas')
      .select('city, state, active')
      .eq('zip_code', zipCode)
      .eq('active', true)
      .maybeSingle();

    if (error) {
      console.error("❌ Database error:", error);
      throw error;
    }

    if (!data) {
      console.log("❌ ZIP not serviced:", zipCode);
      return new Response(
        JSON.stringify({
          isValid: false,
          message: `Sorry, we don't service ${zipCode} yet. Call (972) 559-0223 for options.`
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 200 
        }
      );
    }

    console.log("✅ Valid ZIP:", zipCode, "in", data.city, data.state);
    
    return new Response(
      JSON.stringify({
        isValid: true,
        city: data.city,
        state: data.state
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 200 
      }
    );
  } catch (error: any) {
    console.error("❌ Error in validate-zip:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        isValid: false 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 500 
      }
    );
  }
});
