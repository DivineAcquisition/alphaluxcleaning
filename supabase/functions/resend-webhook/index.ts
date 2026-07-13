import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
};

// Resend delivers webhooks with a namespaced type (e.g. "email.opened") and a
// data payload that may carry the recipient in `to` (array), `email`, or `to_email`.
// We normalize both the legacy short form ("opened") and the current form.
function normalizeEvent(rawType: string): string {
  const t = (rawType || "").toLowerCase();
  if (t.includes("deliver")) return "delivered";
  if (t.includes("open")) return "opened";
  if (t.includes("click")) return "clicked";
  if (t.includes("bounce")) return "bounced";
  if (t.includes("complain")) return "complained";
  if (t.includes("sent")) return "sent";
  if (t.includes("delivery_delayed") || t.includes("delayed")) return "delayed";
  return t.replace(/^email\./, "") || "unknown";
}

function extractRecipient(data: Record<string, any>): string | null {
  if (!data) return null;
  if (Array.isArray(data.to) && data.to.length) return String(data.to[0]);
  return data.email || data.to_email || data.recipient || null;
}

const handler = async (req: Request): Promise<Response> => {
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
    const body = await req.json();
    console.log("Received Resend webhook:", JSON.stringify(body, null, 2));

    const data = body?.data ?? {};
    const event = normalizeEvent(body?.type);
    const recipient = extractRecipient(data);
    const message_id = data.email_id || data.id || body?.id || null;
    const template = data.tags?.template || data.template || body?.template || "unknown";

    if (!event || !recipient) {
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

    // email_events requires to_email + template (NOT NULL); always populate them.
    const { error: eventError } = await supabase.from("email_events").insert({
      provider: "resend",
      event,
      recipient,
      to_email: recipient,
      template,
      message_id,
      meta: body,
    });

    if (eventError) {
      console.error("Error logging email event:", eventError);
    } else {
      console.log(`Logged email event: ${event} for ${recipient}`);
    }

    if (event === "bounced" || event === "complained") {
      const { error: suppressionError } = await supabase
        .from("email_suppressions")
        .upsert({ email: recipient, reason: event });
      if (suppressionError) console.error("Error adding to suppression list:", suppressionError);

      const { error: updateJobsError } = await supabase
        .from("email_jobs")
        .update({ status: "suppressed", last_error: `Suppressed due to ${event}` })
        .eq("to_email", recipient)
        .eq("status", "queued");
      if (updateJobsError) console.error("Error updating queued jobs:", updateJobsError);
    }

    return new Response(JSON.stringify({ ok: true, event, recipient }), {
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
