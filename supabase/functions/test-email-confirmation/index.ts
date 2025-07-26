import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Test email confirmation function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { testEmail } = await req.json();
    console.log("Sending test email to:", testEmail);

    const ghlApiKey = Deno.env.get("GOHIGHLEVEL_API_KEY");
    console.log("API key available:", ghlApiKey ? "Yes" : "No");
    
    if (!ghlApiKey) {
      throw new Error("GOHIGHLEVEL_API_KEY not found in environment variables");
    }

    // For now, let's just return success without actually sending
    // This will help us isolate if the issue is with the API call or function setup
    console.log("Function completed successfully");

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Test function working! Would send email to ${testEmail}`,
      apiKeyPresent: !!ghlApiKey
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in test-email-confirmation function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        stack: error.stack
      }),
      {
        status: 200, // Return 200 to avoid function errors
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);