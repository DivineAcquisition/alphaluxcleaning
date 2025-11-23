import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailQueueRequest {
  to: string;
  name?: string;
  template: string;
  payload?: Record<string, any>;
  category?: 'transactional' | 'marketing';
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
    const { to, name, template, payload = {}, category = "transactional" }: EmailQueueRequest = await req.json();

    if (!to || !template) {
      return new Response(JSON.stringify({ error: "Missing to/template" }), { 
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Queuing email: template=${template}, to=${to}, category=${category}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check suppression list
    const { data: suppressed } = await supabase
      .from("email_suppressions")
      .select("email")
      .eq("email", to)
      .maybeSingle();

    if (suppressed) {
      console.log(`Email suppressed for ${to} - on suppression list`);
      
      // Still create a job record but mark as suppressed
      await supabase.from("email_jobs").insert({
        to_email: to,
        to_name: name ?? null,
        template_name: template,
        payload,
        category,
        status: "suppressed"
      });

      return new Response(JSON.stringify({ ok: true, status: "suppressed" }), { 
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create email job
    const { error: jobError } = await supabase.from("email_jobs").insert({
      to_email: to,
      to_name: name ?? null,
      template_name: template,
      payload,
      category,
      status: "queued"
    });

    if (jobError) {
      console.error("Error creating email job:", jobError);
      return new Response(JSON.stringify({ error: jobError.message }), { 
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Email job queued successfully for ${to}`);

    // Trigger worker to process the queue
    try {
      const { error: workerError } = await supabase.functions.invoke('emails-worker', {
        body: {}
      });
      
      if (workerError) {
        console.error("Error invoking emails-worker:", workerError);
        // Don't throw - email is queued, worker will eventually process it
      } else {
        console.log("emails-worker triggered successfully");
      }
    } catch (workerInvokeError) {
      console.error("Failed to invoke emails-worker:", workerInvokeError);
      // Continue - email is queued
    }

    return new Response(JSON.stringify({ ok: true }), { 
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in emails-queue:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);