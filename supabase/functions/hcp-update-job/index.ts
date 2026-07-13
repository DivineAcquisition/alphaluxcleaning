import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Pushes local booking changes back to Housecall Pro so the two systems stay
 * in sync. Handles two actions:
 *   - action "reschedule": PUT /jobs/{id} with an updated schedule
 *   - action "cancel":     PUT /jobs/{id}/cancel
 *
 * Request body: { booking_id: string, action?: "reschedule" | "cancel" }
 * If action is omitted it is inferred from the booking's current status.
 *
 * Mirrors the auth-scheme detection used by sync-booking-to-hcp so API keys
 * (Token) and OAuth tokens (Bearer) both work.
 */
function buildHcpAuthHeader(rawKey: string): string {
  const key = (rawKey || "").trim();
  const forced = (Deno.env.get("HCP_AUTH_SCHEME") || "").trim().toLowerCase();
  if (forced === "token") return `Token ${key}`;
  if (forced === "bearer") return `Bearer ${key}`;
  if (key.includes(".") && key.split(".").length === 3) return `Bearer ${key}`;
  return `Token ${key}`;
}

function computeSchedule(dateStr: string, timeWindow: string | null, timezone: string | null) {
  // Default to a 9:00-11:00 window when no explicit window is present.
  const [startTime, endTime] = (timeWindow || "09:00-11:00").split("-");
  const start = new Date(`${dateStr}T${(startTime || "09:00").trim()}:00`);
  const end = new Date(`${dateStr}T${(endTime || "11:00").trim()}:00`);
  return {
    scheduled_start: start.toISOString(),
    scheduled_end: end.toISOString(),
    arrival_window: 60,
    timezone: timezone || "America/New_York",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { booking_id, action: requestedAction } = await req.json();
    if (!booking_id) throw new Error("booking_id is required");

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, status, service_date, service_time_window, timezone, hcp_job_id, housecall_job_id")
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) throw new Error(`Booking not found: ${booking_id}`);

    const hcpJobId = booking.hcp_job_id || booking.housecall_job_id;
    if (!hcpJobId) {
      return new Response(
        JSON.stringify({ success: false, skipped: true, reason: "Booking has no HCP job to update" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const status = (booking.status || "").toLowerCase();
    const action = requestedAction || (status === "cancelled" || status === "canceled" ? "cancel" : "reschedule");

    const apiKey = Deno.env.get("HCP_API_KEY");
    if (!apiKey) throw new Error("HCP_API_KEY not configured");
    const baseUrl = Deno.env.get("HCP_BASE_URL") || "https://api.housecallpro.com";
    const testMode = Deno.env.get("HCP_TEST_MODE") === "true";

    const headers = {
      Authorization: buildHcpAuthHeader(apiKey),
      "Content-Type": "application/json",
    };

    let hcpResponse: any = { test_mode: true };

    if (!testMode) {
      if (action === "cancel") {
        const res = await fetch(`${baseUrl}/jobs/${hcpJobId}/cancel`, { method: "PUT", headers });
        const text = await res.text();
        if (!res.ok) throw new Error(`HCP cancel failed (${res.status}): ${text.slice(0, 200)}`);
        hcpResponse = text ? JSON.parse(text) : { ok: true };
      } else {
        if (!booking.service_date) throw new Error("Cannot reschedule: booking has no service_date");
        const schedule = computeSchedule(
          booking.service_date,
          booking.service_time_window,
          booking.timezone
        );
        const res = await fetch(`${baseUrl}/jobs/${hcpJobId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ schedule }),
        });
        const text = await res.text();
        if (!res.ok) throw new Error(`HCP reschedule failed (${res.status}): ${text.slice(0, 200)}`);
        hcpResponse = text ? JSON.parse(text) : { ok: true };
      }
    }

    await supabase.from("integration_logs").insert({
      integration_type: "HCP",
      action: `job_${action}`,
      status: "success",
      booking_id,
      external_id: hcpJobId,
      request_payload: { action, hcp_job_id: hcpJobId },
      response_payload: hcpResponse,
    });

    return new Response(
      JSON.stringify({ success: true, action, hcp_job_id: hcpJobId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("hcp-update-job error:", error);
    await supabase
      .from("integration_logs")
      .insert({
        integration_type: "HCP",
        action: "job_update",
        status: "error",
        error_message: error.message,
      })
      .then(() => {}, () => {});
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
