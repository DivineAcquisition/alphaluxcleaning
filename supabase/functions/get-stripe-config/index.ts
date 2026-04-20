import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Publishable keys are safe to expose publicly, so we bundle the current
  // AlphaLux live key as a fallback. The environment variable takes
  // precedence so the key can still be rotated via Supabase secrets.
  const FALLBACK_PUBLISHABLE_KEY =
    "pk_live_51TONej6CLM640LjskzQLH22Fnnw3c1fYFzJ8zodmoCDYSkKAAuFZfpDYFQEQMvMxWXaoiAfDbT0FSlJuFjjqqdoT00PzmRxxat";

  try {
    const envKey = Deno.env.get("STRIPE_PUBLISHABLE_KEY_ALPHALUX");
    const publishableKey = envKey || FALLBACK_PUBLISHABLE_KEY;

    if (!publishableKey) {
      console.error("❌ Stripe publishable key not configured");
      return new Response(
        JSON.stringify({
          error: "Stripe not configured",
          publishableKey: null,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    console.log(
      envKey
        ? "✅ Stripe publishable key retrieved from environment"
        : "✅ Stripe publishable key retrieved from bundled fallback"
    );
    
    return new Response(
      JSON.stringify({ 
        publishableKey: publishableKey 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("❌ Error in get-stripe-config:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        publishableKey: null 
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});