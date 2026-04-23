// process-scheduled-emails — worker that picks up email_jobs rows
// whose `scheduled_for <= now()` and dispatches them through
// `send-email-system`. Designed to be pinged by a Supabase cron hook
// or any external scheduler (GitHub Actions, HCP, Zapier, etc.) on a
// 5-minute cadence.
//
// Behaviour:
//   - Claims up to `limit` rows (default 25) by flipping status from
//     `scheduled` → `sending` in a single UPDATE so two concurrent
//     workers don't double-send.
//   - Calls `send-email-system` for each claimed row.
//   - Marks each row `sent` / `failed` based on the response.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, data?: unknown) =>
  console.log(
    `[process-scheduled-emails] ${step}`,
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

    // Fetch due rows first so we can claim them with UPDATE ... WHERE id IN (...)
    const { data: due, error: fetchErr } = await supabase
      .from("email_jobs")
      .select("id, to_email, template_name, category, payload, trigger_kind, event_id")
      .eq("status", "scheduled")
      .lte("scheduled_for", nowIso)
      .order("scheduled_for", { ascending: true })
      .limit(limit);
    if (fetchErr) throw new Error(`Failed to fetch due emails: ${fetchErr.message}`);
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

    // Claim rows: flip scheduled → sending so another worker run skips them.
    const ids = due.map((d) => d.id);
    const { data: claimed, error: claimErr } = await supabase
      .from("email_jobs")
      .update({ status: "sending", attempts: 1, updated_at: nowIso })
      .in("id", ids)
      .eq("status", "scheduled")
      .select("id, to_email, template_name, category, payload, trigger_kind, event_id");
    if (claimErr) throw new Error(`Failed to claim emails: ${claimErr.message}`);

    const results: Array<Record<string, unknown>> = [];
    for (const job of claimed || []) {
      try {
        const { data: sendResp, error: sendErr } = await supabase.functions.invoke(
          "send-email-system",
          {
            body: {
              template: job.template_name,
              to: job.to_email,
              data: job.payload,
              category: job.category,
              event_id: job.event_id || `${job.id}`,
            },
          },
        );
        if (sendErr || (sendResp as any)?.error) {
          const msg =
            (sendResp as any)?.error || sendErr?.message || "unknown send error";
          await supabase
            .from("email_jobs")
            .update({
              status: "failed",
              last_error: msg,
              updated_at: new Date().toISOString(),
            })
            .eq("id", job.id);
          results.push({ id: job.id, status: "failed", error: msg });
        } else {
          await supabase
            .from("email_jobs")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
              provider_message_id: (sendResp as any)?.message_id || null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", job.id);
          results.push({
            id: job.id,
            status: "sent",
            template: job.template_name,
            to: job.to_email,
          });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await supabase
          .from("email_jobs")
          .update({
            status: "failed",
            last_error: msg,
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);
        results.push({ id: job.id, status: "failed", error: msg });
      }
    }

    log("Processed batch", { processed: results.length });
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
