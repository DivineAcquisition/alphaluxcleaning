// process-scheduled-sms — worker that picks up sms_jobs rows
// whose `scheduled_for <= now()` and sends them through `sendSms`.
// Pinged by pg_cron every 5 minutes (anon JWT), same pattern as
// process-scheduled-emails.
//
// Behaviour:
//   - Claims up to `limit` rows (default 25) by flipping status from
//     `scheduled` → `sending` so two concurrent workers don't double-send.
//   - Renders `_shared/sms-templates.ts` with the job payload.
//   - Sends on the rail stored in payload.channel (public = OpenPhone,
//     internal = GHL-first).
//   - Marks each row `sent` / `failed` based on the response.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendSms, type SmsChannel } from "../_shared/sms.ts";
import { renderSMSTemplate } from "../_shared/sms-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, data?: unknown) =>
  console.log(
    `[process-scheduled-sms] ${step}`,
    data !== undefined ? JSON.stringify(data) : "",
  );

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const limit = Math.max(1, Math.min(Number(body?.limit) || 25, 100));
    const dryRun = !!body?.dry_run;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const nowIso = new Date().toISOString();

    const { data: due, error: fetchErr } = await supabase
      .from("sms_jobs")
      .select("id, to_phone, template_name, payload, trigger_kind, event_id, booking_id")
      .eq("status", "scheduled")
      .lte("scheduled_for", nowIso)
      .order("scheduled_for", { ascending: true })
      .limit(limit);
    if (fetchErr) throw new Error(`Failed to fetch due SMS: ${fetchErr.message}`);
    if (!due || due.length === 0) {
      return json({ success: true, processed: 0, ready: 0 });
    }

    if (dryRun) {
      return json({
        success: true,
        dry_run: true,
        ready: due.length,
        ids: due.map((d) => d.id),
      });
    }

    const ids = due.map((d) => d.id);
    const { data: claimed, error: claimErr } = await supabase
      .from("sms_jobs")
      .update({ status: "sending", attempts: 1, updated_at: nowIso })
      .in("id", ids)
      .eq("status", "scheduled")
      .select("id, to_phone, template_name, payload, trigger_kind, event_id, booking_id");
    if (claimErr) throw new Error(`Failed to claim SMS: ${claimErr.message}`);

    const results: Array<Record<string, unknown>> = [];
    for (const job of claimed || []) {
      try {
        const payload = (job.payload || {}) as Record<string, unknown>;
        const channel: SmsChannel =
          payload.channel === "internal" ? "internal" : "public";
        let message: string;
        try {
          message = renderSMSTemplate(job.template_name, payload);
        } catch {
          message =
            `Hi ${payload.first_name || "there"} — reminder about your AlphaLux cleaning ` +
            `${payload.service_date || ""} (${payload.time_window || ""}). ` +
            (payload.support_phone ? `Questions? ${payload.support_phone}. ` : "") +
            "- AlphaLux Clean";
        }

        const res = await sendSms({
          to: job.to_phone,
          message,
          channel,
          state: (payload.state as string) || undefined,
          zip: (payload.zip as string) || undefined,
          context: job.trigger_kind || job.template_name,
          email: (payload.email as string) || undefined,
          firstName: (payload.first_name as string) || undefined,
          lastName: (payload.last_name as string) || undefined,
          contactId: (payload.ghl_contact_id as string) || undefined,
        });

        if (!res.success) {
          await supabase
            .from("sms_jobs")
            .update({
              status: "failed",
              last_error: res.error || "unknown send error",
              updated_at: new Date().toISOString(),
            })
            .eq("id", job.id);
          results.push({ id: job.id, status: "failed", error: res.error });
        } else {
          await supabase
            .from("sms_jobs")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
              provider_message_id: res.messageId || null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", job.id);
          results.push({
            id: job.id,
            status: res.suppressed ? "suppressed" : "sent",
            template: job.template_name,
            to: job.to_phone,
            provider: res.provider,
          });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await supabase
          .from("sms_jobs")
          .update({
            status: "failed",
            last_error: msg,
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);
        results.push({ id: job.id, status: "failed", error: msg });
      }
    }

    log("processed", { count: results.length });
    return json({ success: true, processed: results.length, results });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log("ERROR", { msg });
    return json({ success: false, error: msg }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
