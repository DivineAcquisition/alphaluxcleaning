// get-hcp-config — expose HCP settings to the admin UI (key redacted).
// Read precedence: platform env var first, then the app_secrets table
// (written by update-hcp-config).

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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const fromDb: Record<string, string> = {};
    try {
      const { data } = await supabase
        .from("app_secrets")
        .select("name, value")
        .in("name", ["HCP_API_KEY", "HCP_TEST_MODE", "HCP_WEBHOOK_SECRET"]);
      for (const row of data || []) fromDb[row.name] = row.value;
    } catch (_) { /* env-only fallback */ }

    const apiKey =
      Deno.env.get("HCP_API_KEY") ||
      Deno.env.get("HOUSECALL_PRO_API_KEY") ||
      Deno.env.get("HCP_LIVE_API_KEY") ||
      fromDb.HCP_API_KEY ||
      "";
    const testMode =
      (Deno.env.get("HCP_TEST_MODE") || fromDb.HCP_TEST_MODE) === "true";
    const webhookSecretSet = Boolean(
      Deno.env.get("HCP_WEBHOOK_SECRET") || fromDb.HCP_WEBHOOK_SECRET,
    );

    const config = {
      // Redacted — the UI only needs to know whether a key is configured.
      api_key: apiKey ? `${apiKey.slice(0, 4)}…${apiKey.slice(-4)}` : "",
      api_key_configured: Boolean(apiKey),
      webhook_secret_configured: webhookSecretSet,
      base_url: "https://api.housecallpro.com",
      enabled: Boolean(apiKey),
      test_mode: testMode,
    };

    return new Response(JSON.stringify(config), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error getting HCP config:", error);
    
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
      success: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
