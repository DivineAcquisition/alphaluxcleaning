import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const FROM = Deno.env.get("EMAIL_FROM") || "AlphaLux Cleaning <noreply@info.alphaluxclean.com>";
const REPLY_TO = Deno.env.get("EMAIL_REPLY_TO") || "support@alphaluxcleaning.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function renderTemplate(subject: string, html: string, payload: Record<string, any>) {
  // Simple mustache-like replace: {{var}}
  const rep = (s: string) =>
    s.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) => {
      const parts = k.split(".");
      let v: any = payload;
      for (const p of parts) v = v?.[p];
      return (v ?? "").toString();
    });
  return { subject: rep(subject), html: rep(html) };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting email worker batch processing...");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get a batch of queued jobs
    const { data: jobs, error: fetchError } = await supabase
      .from("email_jobs")
      .select("*")
      .eq("status", "queued")
      .order("created_at", { ascending: true })
      .limit(20);

    if (fetchError) {
      console.error("Error fetching jobs:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), { 
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!jobs?.length) {
      console.log("No jobs to process");
      return new Response(JSON.stringify({ message: "No jobs to process" }), { 
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Processing ${jobs.length} email jobs`);

    for (const job of jobs) {
      try {
        console.log(`Processing job ${job.id} for ${job.to_email} with template ${job.template_name}`);

        // Mark as sending
        await supabase
          .from("email_jobs")
          .update({ 
            status: "sending", 
            attempts: job.attempts + 1 
          })
          .eq("id", job.id);

        // Load template from database
        const { data: template, error: templateError } = await supabase
          .from("email_templates")
          .select("subject, html")
          .eq("name", job.template_name)
          .maybeSingle();

        if (templateError || !template) {
          throw new Error(`Template not found: ${job.template_name}`);
        }

        // Render template with payload
        const { subject, html } = renderTemplate(template.subject, template.html, job.payload);

        // Send email via Resend
        const emailResponse = await resend.emails.send({
          from: FROM,
          to: job.to_email,
          subject,
          html,
          replyTo: REPLY_TO,
          tags: [
            { name: "template", value: job.template_name },
            { name: "category", value: job.category }
          ]
        });

        if (emailResponse.error) {
          throw new Error(`Resend error: ${emailResponse.error.message}`);
        }

        // Mark as sent
        await supabase
          .from("email_jobs")
          .update({
            status: "sent",
            provider_message_id: emailResponse.data?.id ?? null,
            sent_at: new Date().toISOString(),
            last_error: null
          })
          .eq("id", job.id);

        // Log email event
        await supabase
          .from("email_events")
          .insert({
            provider: "resend",
            event: "sent",
            recipient: job.to_email,
            message_id: emailResponse.data?.id,
            meta: { job_id: job.id, template: job.template_name }
          });

        console.log(`Successfully sent email job ${job.id}, message_id: ${emailResponse.data?.id}`);

      } catch (error: any) {
        console.error(`Failed to send job ${job.id}:`, error);

        const errorMessage = error instanceof Error ? error.message : String(error);
        const newStatus = job.attempts >= 2 ? "failed" : "queued"; // Retry up to 3 times

        await supabase
          .from("email_jobs")
          .update({ 
            status: newStatus, 
            last_error: errorMessage 
          })
          .eq("id", job.id);

        console.log(`Job ${job.id} marked as ${newStatus} after ${job.attempts + 1} attempts`);
      }
    }

    return new Response(JSON.stringify({ 
      processed: jobs.length,
      message: "Email worker batch completed" 
    }), { 
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in emails-worker:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);