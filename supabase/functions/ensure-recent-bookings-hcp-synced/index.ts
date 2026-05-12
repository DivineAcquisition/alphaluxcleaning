// ensure-recent-bookings-hcp-synced — one-shot ops sweep.
//
// Walks the N most-recent paid bookings and makes sure each one is
// in Housecall Pro. For any booking that doesn't already have an
// `hcp_job_id` stamped on it, invokes `hcp-sync-booking` (the
// canonical idempotent sync path used by `confirm-booking-payment`
// and `save-booking-details`).
//
// Use this when:
//   * Ops thinks recent jobs are missing from the HCP dashboard.
//   * After an HCP outage or API-key rotation, to backfill anything
//     that fell through the cracks.
//   * After a code change to the HCP payload shape, to re-verify
//     the most recent jobs are still landing.
//
// Idempotent: bookings that are already in HCP are skipped via
// `hcp-sync-booking`'s own `already_synced` short-circuit. Bookings
// that are missing required data (no service date, no address)
// short-circuit as `incomplete_booking` so we don't push garbage
// jobs into HCP.
//
// Invocation:
//   POST /functions/v1/ensure-recent-bookings-hcp-synced
//     Authorization: Bearer <SERVICE_ROLE_KEY>
//     Content-Type: application/json
//
//     { "n": 3 }                              # default 3
//     { "n": 10, "includeUnpaid": true }      # also sweep pending
//     { "n": 3, "forceResync": true }         # clear hcp_job_id and
//                                             # re-push (use sparingly)
//
// Response: { success: true, summary: { ... }, results: [...] }

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, data?: unknown) =>
  console.log(
    `[ensure-recent-bookings-hcp-synced] ${step}`,
    data !== undefined ? JSON.stringify(data) : "",
  );

type SyncOutcome =
  | "already_synced"
  | "synced"
  | "incomplete_booking"
  | "no_api_key"
  | "error"
  | "skipped_not_paid";

interface BookingResult {
  bookingId: string;
  customerEmail: string | null;
  serviceDate: string | null;
  state: string | null;
  outcome: SyncOutcome;
  hcpJobId: string | null;
  hcpCustomerId: string | null;
  errorMessage?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      n = 3,
      includeUnpaid = false,
      forceResync = false,
    } = await req.json().catch(() => ({}));

    const limit = Math.max(1, Math.min(50, Number(n) || 3));

    log("Starting sweep", { limit, includeUnpaid, forceResync });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    // Pull the N most-recent bookings. We prefer ordering by
    // `paid_at` so we operate on real customer transactions, not
    // half-abandoned drafts. The .nulls('last') keeps unpaid rows
    // out of the top when `includeUnpaid: false`.
    let query = supabase
      .from("bookings")
      .select(
        "id, customer_id, payment_status, paid_at, created_at, hcp_job_id, status, service_date, address_line1, customers:customers!bookings_customer_id_fkey(email, state)",
      )
      .order("paid_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!includeUnpaid) {
      // Match every payment_status that means the customer actually
      // gave us money — covers the legacy 'paid' literal, the
      // current 'deposit_paid' from the 50%-deposit flow, and
      // anything labeled 'fully_paid' by send-balance-invoice.
      query = query.in("payment_status", [
        "deposit_paid",
        "paid",
        "fully_paid",
      ]);
    }

    const { data: bookings, error } = await query;
    if (error) throw new Error(`Booking query failed: ${error.message}`);

    log("Bookings selected", {
      count: bookings?.length || 0,
      ids: (bookings || []).map((b: any) => b.id),
    });

    const results: BookingResult[] = [];

    for (const b of bookings || []) {
      const entry: BookingResult = {
        bookingId: b.id,
        customerEmail: (b.customers as any)?.email ?? null,
        serviceDate: b.service_date ?? null,
        state: (b.customers as any)?.state ?? null,
        outcome: "skipped_not_paid",
        hcpJobId: b.hcp_job_id ?? null,
        hcpCustomerId: null,
      };

      try {
        // If forceResync, clear the hcp_job_id so the idempotent
        // short-circuit inside hcp-sync-booking doesn't bail. We
        // null it pre-emptively so if the resync fails we surface
        // the failure rather than silently keeping a stale id.
        if (forceResync && b.hcp_job_id) {
          await supabase
            .from("bookings")
            .update({ hcp_job_id: null, hcp_customer_id: null })
            .eq("id", b.id);
          entry.hcpJobId = null;
        }

        const { data, error: syncErr } = await supabase.functions.invoke(
          "hcp-sync-booking",
          { body: { booking_id: b.id } },
        );

        if (syncErr) {
          entry.outcome = "error";
          entry.errorMessage = syncErr.message || String(syncErr);
        } else if (data?.skipped === "already_synced") {
          entry.outcome = "already_synced";
          entry.hcpJobId = data?.hcp_job_id || entry.hcpJobId;
        } else if (data?.skipped === "incomplete_booking") {
          entry.outcome = "incomplete_booking";
          entry.errorMessage =
            "Booking is missing service_date / address — sync deferred.";
        } else if (data?.skipped === "no_api_key") {
          entry.outcome = "no_api_key";
          entry.errorMessage =
            "HCP_API_KEY is not configured on the Supabase edge runtime.";
        } else if (data?.success && data?.hcp_job_id) {
          entry.outcome = "synced";
          entry.hcpJobId = data.hcp_job_id;
          entry.hcpCustomerId = data.hcp_customer_id || null;
        } else if (data?.success === false) {
          entry.outcome = "error";
          entry.errorMessage = data?.error || "hcp-sync-booking returned failure";
        } else {
          // Function returned a shape we don't recognize — record raw
          // result for ops to inspect.
          entry.outcome = "error";
          entry.errorMessage = `Unexpected response: ${JSON.stringify(data)}`;
        }
      } catch (err: any) {
        entry.outcome = "error";
        entry.errorMessage = err?.message || String(err);
      }

      results.push(entry);
    }

    const summary = {
      total: results.length,
      already_synced: results.filter((r) => r.outcome === "already_synced").length,
      synced: results.filter((r) => r.outcome === "synced").length,
      incomplete: results.filter((r) => r.outcome === "incomplete_booking").length,
      errors: results.filter((r) => r.outcome === "error").length,
      no_api_key: results.filter((r) => r.outcome === "no_api_key").length,
    };

    log("Sweep complete", summary);

    return new Response(
      JSON.stringify({
        success: true,
        requestedCount: limit,
        includeUnpaid,
        forceResync,
        summary,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
