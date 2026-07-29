// integration-health — admin-gated live credential check.
//
// Answers "is this integration actually working right now?" by probing each
// provider's API with the configured secret and reporting the provider's own
// error text. It never returns secret values, prefixes or lengths.
//
// This exists because a rejected credential is otherwise invisible: bookings
// silently stop reaching Housecall Pro and texts silently stop sending, while
// the code paths themselves look healthy. Surfacing the provider's actual
// response turns a mystery into a one-line fix.
//
// Requires an active admin (admin_users); the caller's JWT is resolved before
// anything is probed.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getSecret } from "../_shared/secrets.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function clean(v: string | undefined): string {
  return (v || "").trim().replace(/^["']|["']$/g, "");
}

/** A value that is obviously a stub rather than a real credential. */
function looksPlaceholder(v: string): boolean {
  return /placeholder|replace[_-]?me|to[_-]?be[_-]?replaced|your[_-]?key|changeme|xxxx|dummy|example/i
    .test(v);
}

async function checkHcp() {
  const key = clean(
    await getSecret("HCP_API_KEY", ["HOUSECALL_PRO_API_KEY", "HCP_LIVE_API_KEY"]),
  );
  if (!key) {
    return { ok: false, configured: false, reason: "No HCP API key is set in Supabase secrets." };
  }
  if (looksPlaceholder(key)) {
    return {
      ok: false,
      configured: true,
      placeholder: true,
      reason: "The stored HCP_API_KEY is a placeholder string, not a real key. Replace it with the key from Housecall Pro (Settings → API).",
    };
  }
  for (const scheme of ["Token", "Bearer"]) {
    try {
      const res = await fetch("https://api.housecallpro.com/customers?page_size=1", {
        headers: { Authorization: `${scheme} ${key}`, Accept: "application/json" },
      });
      if (res.ok) return { ok: true, configured: true, scheme };
      if (scheme === "Bearer") {
        const body = (await res.text()).slice(0, 200);
        return {
          ok: false,
          configured: true,
          status: res.status,
          reason: res.status === 401
            ? `Housecall Pro rejected the key (401 ${body}). It has been revoked or rotated — issue a new one.`
            : `Housecall Pro returned ${res.status}: ${body}`,
        };
      }
    } catch (err) {
      return { ok: false, configured: true, reason: String(err).slice(0, 200) };
    }
  }
  return { ok: false, configured: true, reason: "unknown" };
}

async function checkOpenPhone() {
  const key = clean(await getSecret("OPENPHONE_API_KEY"));
  if (!key) {
    return {
      ok: false,
      configured: false,
      reason: "No OPENPHONE_API_KEY found in edge-function secrets or app_secrets.",
    };
  }
  if (looksPlaceholder(key)) {
    return { ok: false, configured: true, placeholder: true, reason: "OPENPHONE_API_KEY is a placeholder string." };
  }
  for (const auth of [key, `Bearer ${key}`]) {
    try {
      const res = await fetch("https://api.openphone.com/v1/phone-numbers", {
        headers: { Authorization: auth, "Content-Type": "application/json" },
      });
      const text = await res.text();
      if (res.ok) {
        // Also report which numbers the workspace owns — the state-routed
        // sender can only send from a number in this list.
        let owned: Array<Record<string, unknown>> = [];
        try {
          const j = JSON.parse(text);
          const arr = j?.data || j;
          if (Array.isArray(arr)) {
            owned = arr.map((n: any) => ({
              id: n?.id,
              number: n?.number || n?.phoneNumber || n?.formattedNumber,
              name: n?.name,
            }));
          }
        } catch { /* non-JSON */ }
        return { ok: true, configured: true, ownedNumbers: owned };
      }
      if (auth.startsWith("Bearer ")) {
        return {
          ok: false,
          configured: true,
          status: res.status,
          reason: res.status === 401
            ? "OpenPhone rejected the key (401). Issue a fresh API key in OpenPhone (Settings → API) — note API access requires a Business plan."
            : `OpenPhone returned ${res.status}: ${text.slice(0, 200)}`,
        };
      }
    } catch (err) {
      return { ok: false, configured: true, reason: String(err).slice(0, 200) };
    }
  }
  return { ok: false, configured: true, reason: "unknown" };
}

/**
 * GoHighLevel is load-bearing for the internal booking rail (it sends the
 * automated comms), and its two credentials fail in ways that look
 * identical from the outside but need opposite fixes:
 *
 *   "Invalid Private Integration token"        → the token is revoked
 *   "This location is not accessible from
 *    this token!"                              → the token is FINE, the
 *                                                location id is wrong
 *
 * The second one reads like a bad key and sends people off rotating a
 * perfectly good token, so it gets its own message.
 */
async function checkGhl() {
  const token = clean(
    await getSecret("GHL_PIT_TOKEN", ["GHL_PRIVATE_INTEGRATION_TOKEN", "GOHIGHLEVEL_API_KEY"]),
  );
  const locationId = clean(
    await getSecret("GHL_LOCATION_ID", ["GOHIGHLEVEL_LOCATION_ID"]),
  );

  if (!token) {
    return {
      ok: false,
      configured: false,
      reason: "No GHL_PIT_TOKEN found in edge-function secrets or app_secrets. Internal-booking texts cannot send.",
    };
  }
  if (looksPlaceholder(token)) {
    return { ok: false, configured: true, placeholder: true, reason: "GHL_PIT_TOKEN is a placeholder string." };
  }
  if (!locationId) {
    return {
      ok: false,
      configured: false,
      reason: "GHL_PIT_TOKEN is set but GHL_LOCATION_ID is not. Private Integration tokens are location-scoped — copy the Location ID from GoHighLevel (Settings → Business Profile) for the same subaccount the integration was created in.",
      token: "present",
    };
  }

  try {
    const res = await fetch(
      `https://services.leadconnectorhq.com/users/?locationId=${encodeURIComponent(locationId)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Version: "2021-07-28",
          Accept: "application/json",
        },
      },
    );
    const text = await res.text();
    if (res.ok) {
      let users = 0;
      try { users = (JSON.parse(text)?.users || []).length; } catch { /* non-JSON */ }
      return { ok: true, configured: true, locationId, users };
    }
    if (/not accessible from this token/i.test(text)) {
      return {
        ok: false,
        configured: true,
        status: res.status,
        locationMismatch: true,
        locationId,
        reason: `The token is valid, but it is not scoped to location ${locationId}. Do not rotate the token — set GHL_LOCATION_ID to the subaccount the Private Integration was created in.`,
      };
    }
    if (/invalid private integration token/i.test(text)) {
      return {
        ok: false,
        configured: true,
        status: res.status,
        reason: "GoHighLevel rejected the token (Invalid Private Integration token). It was revoked or rotated — mint a new one under Settings → Private Integrations.",
      };
    }
    return {
      ok: false,
      configured: true,
      status: res.status,
      reason: `GoHighLevel returned ${res.status}: ${text.slice(0, 200)}`,
    };
  } catch (err) {
    return { ok: false, configured: true, reason: String(err).slice(0, 200) };
  }
}

async function checkResend() {
  const key = clean(await getSecret("RESEND_API_KEY"));
  if (!key) {
    return {
      ok: false,
      configured: false,
      reason: "No RESEND_API_KEY found in edge-function secrets or app_secrets.",
    };
  }
  if (looksPlaceholder(key)) {
    return { ok: false, configured: true, placeholder: true, reason: "RESEND_API_KEY is a placeholder string." };
  }
  try {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (res.ok) return { ok: true, configured: true, scope: "full" };
    const body = await res.text();
    // A sending-only restricted key can't list domains but CAN send mail,
    // which is all this app needs — don't report that as broken.
    if (res.status === 401 && /restricted_api_key/i.test(body)) {
      return {
        ok: true,
        configured: true,
        scope: "sending-only",
        note: "Restricted send-only key — cannot list domains, but email delivery works.",
      };
    }
    return {
      ok: false,
      configured: true,
      status: res.status,
      reason: `Resend returned ${res.status}: ${body.slice(0, 160)}`,
    };
  } catch (err) {
    return { ok: false, configured: true, reason: String(err).slice(0, 200) };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data, null, 2), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  // Admin gate: never probe or report on behalf of an anonymous caller.
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const svc = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: auth } } },
  );

  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { data: admin } = await svc
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (!admin) return json({ error: "Forbidden" }, 403);

  const [housecallPro, openPhone, goHighLevel, resend] = await Promise.all([
    checkHcp(),
    checkOpenPhone(),
    checkGhl(),
    checkResend(),
  ]);

  return json({
    checkedAt: new Date().toISOString(),
    integrations: { housecallPro, openPhone, goHighLevel, resend },
  });
});
