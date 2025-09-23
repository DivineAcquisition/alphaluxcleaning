import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResendWebhookPayload {
  type: string; // delivered | opened | clicked | bounced | complained
  data: {
    id: string; // message_id
    email: string;
    subject?: string;
    created_at?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { 
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const body: ResendWebhookPayload = await req.json();
    
    console.log("Received Resend webhook:", JSON.stringify(body, null, 2));

    const event = body.type;
    const recipient = body.data?.email;
    const message_id = body.data?.id;

    if (!event || !recipient || !message_id) {
      console.warn("Incomplete webhook payload:", { event, recipient, message_id });
      return new Response(JSON.stringify({ error: "Incomplete webhook payload" }), { 
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Log email event
    const { error: eventError } = await supabase
      .from("email_events")
      .insert({
        provider: "resend",
        event,
        recipient,
        message_id,
        meta: body
      });

    if (eventError) {
      console.error("Error logging email event:", eventError);
    } else {
      console.log(`Logged email event: ${event} for ${recipient}`);
    }

    // Handle bounces and complaints by adding to suppression list
    if (event === "bounced" || event === "complained") {
      console.log(`Adding ${recipient} to suppression list due to ${event}`);

      // Add to suppression list
      const { error: suppressionError } = await supabase
        .from("email_suppressions")
        .upsert({
          email: recipient,
          reason: event
        });

      if (suppressionError) {
        console.error("Error adding to suppression list:", suppressionError);
      }

      // Mark future queued jobs to this recipient as suppressed
      const { error: updateJobsError } = await supabase
        .from("email_jobs")
        .update({ 
          status: "suppressed", 
          last_error: `Suppressed due to ${event}` 
        })
        .eq("to_email", recipient)
        .eq("status", "queued");

      if (updateJobsError) {
        console.error("Error updating queued jobs:", updateJobsError);
      } else {
        console.log(`Suppressed future emails for ${recipient}`);
      }
    }

    return new Response(JSON.stringify({ ok: true }), { 
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error processing Resend webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);