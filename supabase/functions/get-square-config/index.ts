import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const applicationId = Deno.env.get("SQUARE_APPLICATION_ID");
    const locationId = Deno.env.get("SQUARE_LOCATION_ID");
    
    if (!applicationId || !locationId) {
      console.error("❌ Square credentials not configured");
      return new Response(
        JSON.stringify({ 
          error: "Square not configured",
          applicationId: null,
          locationId: null
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

    console.log("✅ Square configuration retrieved successfully");
    
    return new Response(
      JSON.stringify({ 
        applicationId,
        locationId
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
    console.error("❌ Error in get-square-config:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        applicationId: null,
        locationId: null
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
