import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Client probe used by the booking flow to decide whether to render
 * the Google Calendar CTA and the Google Places address autocomplete.
 *
 * Both features must ship with real credentials — per product
 * requirement, we never show a half-working Google feature to a
 * customer. If any required env var is missing we report
 * `configured: false` and the UI falls back to the plain input.
 */

function hasNonEmpty(name: string): boolean {
  const v = Deno.env.get(name);
  return !!(v && v.trim().length > 0);
}

function firstPresent(...names: string[]): string | null {
  for (const n of names) {
    const v = Deno.env.get(n);
    if (v && v.trim().length > 0) return v.trim();
  }
  return null;
}

function calendarConfig() {
  const serviceAccount = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY");
  if (serviceAccount) {
    try {
      const parsed = JSON.parse(serviceAccount);
      const ok = !!(parsed?.client_email && parsed?.private_key);
      return {
        configured: ok,
        method: ok ? "service_account" : "invalid_service_account",
        calendar_id: firstPresent("GOOGLE_CALENDAR_ID") || "primary",
      };
    } catch {
      return {
        configured: false,
        method: "invalid_service_account",
        calendar_id: firstPresent("GOOGLE_CALENDAR_ID") || "primary",
      };
    }
  }
  const oauthOk =
    hasNonEmpty("GOOGLE_OAUTH_CLIENT_ID") &&
    hasNonEmpty("GOOGLE_OAUTH_CLIENT_SECRET");
  return {
    configured: oauthOk,
    method: oauthOk ? "oauth" : "missing",
    calendar_id: firstPresent("GOOGLE_CALENDAR_ID") || "primary",
  };
}

function placesConfig() {
  // The browser needs a client-exposable Maps JS key; the edge
  // function itself doesn't need a key. Ops is expected to set both
  // `GOOGLE_PLACES_API_KEY` (restricted, server-side, used by any
  // server-side geocoding) and `GOOGLE_MAPS_PUBLISHABLE_KEY`
  // (referrer-restricted, OK to ship to the client).
  const serverKey = firstPresent("GOOGLE_PLACES_API_KEY");
  const publishable = firstPresent(
    "GOOGLE_MAPS_PUBLISHABLE_KEY",
    "GOOGLE_MAPS_BROWSER_KEY",
    "GOOGLE_MAPS_PUBLIC_KEY",
  );
  const configured = !!(serverKey && publishable);
  return {
    configured,
    publishable_key: configured ? publishable : null,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const payload = {
    calendar: calendarConfig(),
    places: placesConfig(),
    generated_at: new Date().toISOString(),
  };

  return new Response(JSON.stringify(payload), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
