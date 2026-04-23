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
 *
 * Calendar additionally has a master kill-switch:
 *   GOOGLE_CALENDAR_ENABLED=true
 * must be set before the Calendar CTA can render, even when the
 * credentials are present. Default = disabled.
 */

function present(name: string): boolean {
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

function flagOn(name: string): boolean {
  const v = (Deno.env.get(name) || "").trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes" || v === "on";
}

function calendarConfig() {
  // Master kill-switch. Ops must explicitly set
  // GOOGLE_CALENDAR_ENABLED=true before the Calendar CTA can render —
  // even if credentials are present. Default = disabled.
  const enabled = flagOn("GOOGLE_CALENDAR_ENABLED");

  const serviceAccount = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY");
  const missing: string[] = [];

  if (!enabled) {
    missing.push("GOOGLE_CALENDAR_ENABLED=true (kill-switch)");
  }

  let credsValid = false;
  let method: string = "missing";

  if (serviceAccount) {
    try {
      const parsed = JSON.parse(serviceAccount);
      credsValid = !!(parsed?.client_email && parsed?.private_key);
      method = credsValid ? "service_account" : "invalid_service_account";
      if (!credsValid) missing.push("GOOGLE_SERVICE_ACCOUNT_KEY(invalid)");
    } catch {
      credsValid = false;
      method = "invalid_service_account";
      missing.push("GOOGLE_SERVICE_ACCOUNT_KEY(unparseable)");
    }
  } else {
    const hasId = present("GOOGLE_OAUTH_CLIENT_ID");
    const hasSecret = present("GOOGLE_OAUTH_CLIENT_SECRET");
    credsValid = hasId && hasSecret;
    method = credsValid ? "oauth" : "missing";
    if (!credsValid) {
      missing.push("GOOGLE_SERVICE_ACCOUNT_KEY");
      if (!hasId) missing.push("GOOGLE_OAUTH_CLIENT_ID");
      if (!hasSecret) missing.push("GOOGLE_OAUTH_CLIENT_SECRET");
    }
  }

  return {
    configured: enabled && credsValid,
    method,
    calendar_id: firstPresent("GOOGLE_CALENDAR_ID") || "primary",
    missing,
  };
}

function placesConfig() {
  const serverKey = firstPresent("GOOGLE_PLACES_API_KEY");
  const publishable = firstPresent(
    "GOOGLE_MAPS_PUBLISHABLE_KEY",
    "GOOGLE_MAPS_BROWSER_KEY",
    "GOOGLE_MAPS_PUBLIC_KEY",
  );
  const configured = !!(serverKey && publishable);
  const missing: string[] = [];
  if (!serverKey) missing.push("GOOGLE_PLACES_API_KEY");
  if (!publishable) {
    missing.push(
      "GOOGLE_MAPS_PUBLISHABLE_KEY (or GOOGLE_MAPS_BROWSER_KEY / GOOGLE_MAPS_PUBLIC_KEY)",
    );
  }
  return {
    configured,
    publishable_key: configured ? publishable : null,
    missing,
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
