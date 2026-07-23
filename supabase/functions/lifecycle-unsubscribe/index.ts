// lifecycle-unsubscribe — one-click email opt-out target for the
// unsubscribe links embedded in every lifecycle email (see
// _shared/lifecycle-email.ts). GET with ?e=<base64url email>&t=<hmac>.
//
// Unsubscribing stops marketing EMAIL only — SMS keeps working unless
// the customer separately texts STOP (per-channel opt-outs).

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { unsubscribeToken } from "../_shared/lifecycle-email.ts";

function page(title: string, message: string, status = 200): Response {
  return new Response(
    `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title></head>
<body style="font-family:-apple-system,'Segoe UI',Roboto,sans-serif;background:#f4f4f5;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
  <div style="background:#fff;border-radius:12px;padding:40px;max-width:420px;text-align:center;">
    <h1 style="font-size:20px;color:#111827;">${title}</h1>
    <p style="color:#4b5563;font-size:15px;line-height:1.6;">${message}</p>
  </div>
</body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200 });

  try {
    const url = new URL(req.url);
    const encoded = url.searchParams.get("e") || "";
    const token = url.searchParams.get("t") || "";

    let email = "";
    try {
      const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
      email = atob(b64).trim().toLowerCase();
    } catch {
      return page("Invalid link", "This unsubscribe link is malformed.", 400);
    }
    if (!email || !email.includes("@")) {
      return page("Invalid link", "This unsubscribe link is malformed.", 400);
    }

    const expected = await unsubscribeToken(email);
    if (token !== expected) {
      return page("Invalid link", "This unsubscribe link is invalid or expired.", 403);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );
    await supabase.from("email_opt_outs").upsert(
      { email, source: "unsubscribe_link" },
      { onConflict: "email" },
    );

    return page(
      "You're unsubscribed",
      `${email} won't receive marketing emails from AlphaLux Clean anymore. Booking confirmations and receipts still arrive as usual.`,
    );
  } catch (err) {
    console.error("[lifecycle-unsubscribe] error", err);
    return page("Something went wrong", "Please try the link again in a moment.", 500);
  }
});
