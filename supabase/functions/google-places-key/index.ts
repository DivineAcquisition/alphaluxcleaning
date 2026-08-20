// google-places-key — hands the browser a Places key without shipping it.
//
// Ported from the Novara implementation. The Maps JS API has to run in
// the browser, so the key is necessarily public to anyone who opens
// devtools — but baking it into the bundle would put it in the git
// history and in every cached asset, where rotating it means a redeploy.
// Serving it from `app_secrets` means a rotation is one SQL update.
//
// The real protection for a browser Maps key is an HTTP-referrer
// restriction in Google Cloud Console, not secrecy. Restrict the key to
// the AlphaLux hosts or it will be usable from anywhere.
//
// Returns `{ apiKey: "" }` with HTTP 200 when nothing is configured,
// rather than an error, so the caller renders a plain typeable address
// input instead of breaking the booking form.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getSecret, getSecretFromDb } from "../_shared/secrets.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const respond = (apiKey: string) =>
    new Response(JSON.stringify({ apiKey }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        // Places quota is billed per script load; let the CDN absorb
        // repeat hits from the same admin session.
        "Cache-Control": "public, max-age=300",
      },
      status: 200,
    });

  try {
    // Prefer app_secrets so a stale dashboard env var cannot blank the
    // Internal Booking address autocomplete.
    const apiKey =
      (await getSecretFromDb("GOOGLE_PLACES_API_KEY")) ||
      (await getSecret("GOOGLE_PLACES_API_KEY", ["GOOGLE_MAPS_API_KEY"]));
    return respond(apiKey || "");
  } catch (error) {
    console.error("[google-places-key]", error);
    return respond("");
  }
});
