// update-hcp-config — persist Housecall Pro settings from the admin UI.
//
// Values are stored in the service-role-only `app_secrets` table so they
// survive function redeploys and don't require dashboard access to
// rotate. Read precedence everywhere is: platform env var first, then
// app_secrets (see get-hcp-config / hcp-sync-booking).

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Whitelist of settings the admin UI may write.
const ALLOWED_KEYS: Record<string, string> = {
  api_key: "HCP_API_KEY",
  test_mode: "HCP_TEST_MODE",
  webhook_secret: "HCP_WEBHOOK_SECRET",
  auth_scheme: "HCP_AUTH_SCHEME",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const updates = await req.json();
    console.log("Updating HCP config (values redacted)", Object.keys(updates || {}));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const written: string[] = [];
    for (const [key, secretName] of Object.entries(ALLOWED_KEYS)) {
      const value = updates?.[key];
      if (value === undefined || value === null || value === "") continue;
      const { error } = await supabase.from("app_secrets").upsert(
        { name: secretName, value: String(value), updated_at: new Date().toISOString() },
        { onConflict: "name" },
      );
      if (error) throw new Error(`Failed to store ${secretName}: ${error.message}`);
      written.push(secretName);
    }

    return new Response(JSON.stringify({
      success: true,
      message: written.length
        ? `Stored: ${written.join(", ")}`
        : "No recognized settings in payload — nothing stored",
      stored: written,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error updating HCP config:", error);
    
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
      success: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
