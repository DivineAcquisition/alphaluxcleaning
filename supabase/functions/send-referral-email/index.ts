import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { testEmail } = await req.json();

    if (!testEmail) {
      return new Response(JSON.stringify({ error: "testEmail is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Queue email for referral
    const { error: queueError } = await supabase.functions.invoke('emails-queue', {
      body: {
        to: testEmail,
        name: "Test Customer",
        template: "referral_reward_earned", 
        payload: {
          first_name: "Test Customer",
          amount: "$50.00",
          referred_name: "Jane Smith",
          app_url: "https://app.alphaluxclean.com"
        },
        category: "marketing"
      }
    });

    if (queueError) {
      throw queueError;
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: "Referral email queued successfully" 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error queuing referral email:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);