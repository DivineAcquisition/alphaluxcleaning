// openphone-webhook — inbound SMS events from OpenPhone.
//
// Configure in OpenPhone (Settings → Webhooks) for message events on all
// four state numbers, pointing at:
//   https://<project>.functions.supabase.co/openphone-webhook
//
// Responsibilities:
//   * STOP / UNSUBSCRIBE keywords → global SMS opt-out (sms_opt_outs).
//     START / UNSTOP → opt back in. STOP means stop, immediately.
//   * Log every inbound message to sms_inbound_log (compliance trail).
//     Replies also live in the OpenPhone inbox itself — that IS the
//     conversation system, since we send from real OpenPhone numbers.
//   * Stamp replied_at on the customer's most recent lifecycle send so
//     reply rates show up in the engine analytics.
//   * message.delivered / message.failed → update the sms_logs ledger.
//
// Signature verification: OpenPhone signs webhooks with the signing
// secret shown when the webhook is created. Header `openphone-signature`
// is `hmac;<version>;<timestamp>;<base64 sig>` where the signature is
// HMAC-SHA256(base64-decoded secret, `${timestamp}.${rawBody}`). Set
// OPENPHONE_WEBHOOK_SECRET to enforce; when unset we accept (fail-open)
// so the integration keeps working before the secret is provisioned.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { phoneDigits10, toE164US } from "../_shared/phone-format.ts";

const log = (step: string, data?: unknown) =>
  console.log(`[openphone-webhook] ${step}`, data !== undefined ? JSON.stringify(data) : "");

const OPT_OUT_WORDS = new Set([
  "stop", "stopall", "stop all", "unsubscribe", "cancel", "end", "quit",
  "optout", "opt out", "opt-out", "revoke", "remove me",
]);
const OPT_IN_WORDS = new Set(["start", "unstop", "subscribe", "optin", "opt in", "opt-in"]);

function matchKeyword(body: string): { keyword: string; action: "opted_out" | "opted_in" } | null {
  const normalized = body.trim().toLowerCase().replace(/[!.,]+$/g, "");
  if (OPT_OUT_WORDS.has(normalized)) return { keyword: normalized, action: "opted_out" };
  if (OPT_IN_WORDS.has(normalized)) return { keyword: normalized, action: "opted_in" };
  return null;
}

async function verifySignature(req: Request, rawBody: string): Promise<boolean> {
  const secret = Deno.env.get("OPENPHONE_WEBHOOK_SECRET");
  if (!secret) return true; // fail-open until the secret is provisioned

  const header = req.headers.get("openphone-signature") || "";
  const parts = header.split(";");
  if (parts.length < 4) return false;
  const timestamp = parts[2];
  const providedSig = parts[3];

  try {
    const keyBytes = Uint8Array.from(atob(secret), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      "raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
    );
    const data = new TextEncoder().encode(`${timestamp}.${rawBody}`);
    const sig = await crypto.subtle.sign("HMAC", key, data);
    const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));
    return computed === providedSig;
  } catch (err) {
    log("signature verification error", { error: String(err) });
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200 });

  const rawBody = await req.text();

  if (!(await verifySignature(req, rawBody))) {
    log("invalid signature — rejecting");
    return new Response(JSON.stringify({ error: "invalid signature" }), { status: 401 });
  }

  let payload: any = {};
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: "invalid JSON" }), { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    const eventType: string = payload?.type || payload?.event || "";
    const msg = payload?.data?.object || payload?.data || {};

    if (eventType === "message.received") {
      const fromPhone = toE164US(msg.from) || String(msg.from || "");
      const toPhone = Array.isArray(msg.to)
        ? (toE164US(msg.to[0]) || String(msg.to[0] || ""))
        : (toE164US(msg.to) || String(msg.to || ""));
      const body: string = String(msg.body ?? msg.text ?? "");
      const digits = phoneDigits10(fromPhone);
      const keyword = matchKeyword(body);

      if (keyword?.action === "opted_out" && digits) {
        await supabase.from("sms_opt_outs").upsert({
          phone_digits: digits,
          phone_e164: fromPhone,
          source: "stop_keyword",
          reason: body.slice(0, 200),
        }, { onConflict: "phone_digits" });
        log("opt-out recorded", { digits });
      } else if (keyword?.action === "opted_in" && digits) {
        await supabase.from("sms_opt_outs").delete().eq("phone_digits", digits);
        log("opt-in — suppression removed", { digits });
      } else if (digits) {
        // Plain reply — attribute it to the most recent lifecycle touch
        // so reply rates appear in per-step / per-campaign analytics.
        const { data: send } = await supabase
          .from("lifecycle_sends")
          .select("id")
          .eq("phone_digits", digits)
          .eq("channel", "sms")
          .eq("status", "sent")
          .is("replied_at", null)
          .gt("created_at", new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString())
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (send?.id) {
          await supabase
            .from("lifecycle_sends")
            .update({ replied_at: new Date().toISOString() })
            .eq("id", send.id);
        }
      }

      await supabase.from("sms_inbound_log").insert({
        provider: "openphone",
        from_phone: fromPhone,
        to_phone: toPhone,
        body,
        matched_keyword: keyword?.keyword || null,
        action: keyword?.action || "reply",
        payload,
      });
    } else if (eventType === "message.delivered" || eventType === "message.failed") {
      const messageId = msg?.id;
      if (messageId) {
        await supabase
          .from("sms_logs")
          .update({
            status: eventType === "message.delivered" ? "delivered" : "failed",
            error: eventType === "message.failed" ? (msg?.errorMessage || "delivery failed") : null,
          })
          .eq("provider_message_id", messageId);
      }
    } else {
      log("unhandled event type", { eventType });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("ERROR", { message });
    // 200 so OpenPhone doesn't hammer retries for a handler bug — the
    // raw payload is logged above for replay.
    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  }
});
