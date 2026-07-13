import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, openphone-signature",
};

// OpenPhone webhook events look like:
//   { id, object: "event", type: "message.delivered",
//     data: { object: { id, to, from, direction, status, body, ... } } }
// We normalize both the "message.delivered" form and any short form.
function normalizeStatus(rawType: string, objStatus?: string): {
  status: string;
  inbound: boolean;
} {
  const t = (rawType || "").toLowerCase();
  const s = (objStatus || "").toLowerCase();
  const inbound = t.includes("received") || t.includes("incoming");
  if (inbound) return { status: "received", inbound: true };
  if (t.includes("deliver") || s.includes("deliver")) return { status: "delivered", inbound: false };
  if (t.includes("fail") || t.includes("undeliver") || s.includes("fail") || s.includes("undeliver"))
    return { status: "failed", inbound: false };
  if (t.includes("sent") || s.includes("sent")) return { status: "sent", inbound: false };
  return { status: s || "sent", inbound: false };
}

serve(async (req) => {
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
    console.log("Received OpenPhone webhook:", JSON.stringify(body, null, 2));

    const rawType: string = body?.type || body?.event || "";
    const obj = body?.data?.object ?? body?.data ?? body;
    const messageId: string | null = obj?.id || body?.id || null;
    const { status, inbound } = normalizeStatus(rawType, obj?.status);
    const toNumber: string | null = Array.isArray(obj?.to) ? obj.to[0] : obj?.to || null;
    const fromNumber: string | null = obj?.from || null;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Locate the originating notification (outbound only) by provider message id,
    // falling back to the most recent SMS to this recipient.
    let queueRow: any = null;
    if (!inbound && messageId) {
      const { data } = await supabase
        .from("notification_queue")
        .select("id, customer_id, recipient_phone, metadata")
        .filter("metadata->>message_id", "eq", messageId)
        .limit(1)
        .maybeSingle();
      queueRow = data;
    }
    if (!inbound && !queueRow && toNumber) {
      const { data } = await supabase
        .from("notification_queue")
        .select("id, customer_id, recipient_phone, metadata")
        .eq("delivery_method", "sms")
        .eq("recipient_phone", toNumber)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      queueRow = data;
    }

    // Update the queue row's delivery state.
    if (queueRow?.id) {
      const updates: Record<string, unknown> = {
        status,
        provider_used: "openphone",
        updated_at: new Date().toISOString(),
      };
      if (status === "delivered") updates.delivered_at = new Date().toISOString();
      await supabase.from("notification_queue").update(updates).eq("id", queueRow.id);
    }

    // Record an analytics event with the schema-correct columns.
    const { error: analyticsError } = await supabase.from("notification_analytics").insert({
      notification_id: queueRow?.id ?? null,
      customer_id: queueRow?.customer_id ?? null,
      notification_type: inbound ? "sms_inbound" : "sms",
      delivery_method: "sms",
      status,
      provider: "openphone",
      metadata: {
        message_id: messageId,
        to: toNumber,
        from: fromNumber,
        direction: inbound ? "inbound" : "outbound",
        raw_type: rawType,
      },
    });
    if (analyticsError) console.error("Error inserting notification_analytics:", analyticsError);

    return new Response(
      JSON.stringify({ success: true, status, inbound, matched: !!queueRow?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("OpenPhone webhook error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
