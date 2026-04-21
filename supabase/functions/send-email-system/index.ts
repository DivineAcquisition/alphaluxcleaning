import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// FROM / REPLY-TO are read from env so ops can rotate them without a
// code change. The defaults keep the legacy address working in case
// the env var is missing, but the live domain needs to be verified
// in the Resend dashboard (resend.com/domains).
const FROM_EMAIL =
  Deno.env.get("EMAIL_FROM") ||
  Deno.env.get("RESEND_FROM_EMAIL") ||
  "AlphaLux Cleaning <noreply@alphaluxcleaning.com>";
const REPLY_TO_EMAIL =
  Deno.env.get("EMAIL_REPLY_TO") ||
  Deno.env.get("RESEND_REPLY_TO") ||
  "support@alphaluxcleaning.com";

interface EmailRequest {
  template: string;
  to: string;
  data: Record<string, any>;
  category?: "transactional" | "marketing";
  event_id?: string;
  subject_variant?: "A" | "B";
}

function esc(s: any): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function baseLayout(title: string, body: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title></head><body style="margin:0;padding:0;background:#f7f5f1;font-family:Inter,Helvetica,Arial,sans-serif;color:#15120f;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"><tr><td align="center" style="padding:32px 12px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:600px;background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(10,10,11,0.06);">
        <tr><td style="padding:28px 32px 8px;border-bottom:1px solid #ece7dd;">
          <div style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#15120f;letter-spacing:.01em;">AlphaLux Cleaning</div>
          <div style="font-size:12px;color:#8a7d69;letter-spacing:.2em;text-transform:uppercase;margin-top:4px;">A Higher Standard of Clean</div>
        </td></tr>
        <tr><td style="padding:24px 32px 28px;font-size:15px;line-height:1.6;color:#15120f;">${body}</td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #ece7dd;font-size:12px;color:#8a7d69;">
          AlphaLux Cleaning &middot; Serving all of New York State<br/>
          Questions? Reply to this email or call <a href="tel:+18577544557" style="color:#A17938;">(857) 754-4557</a>
        </td></tr>
      </table>
    </td></tr></table>
  </body></html>`;
}

function renderTemplate(
  template: string,
  data: Record<string, any>,
  variant?: "A" | "B",
): { html: string; subject: string } {
  const firstName = esc(
    data.first_name || data.customer_name?.split(" ")?.[0] || "there",
  );
  const appUrl = Deno.env.get("APP_URL") || "https://alphaluxcleaning.com";
  const supportPhone = Deno.env.get("SUPPORT_PHONE") || "(857) 754-4557";

  switch (template) {
    case "lead_welcome": {
      const subject =
        variant === "B"
          ? "Finish in 60s: pick home size → see price"
          : "Your instant cleaning quote is one click away";
      const html = baseLayout(
        subject,
        `
        <h1 style="font-size:22px;margin:0 0 12px;">Hi ${firstName},</h1>
        <p>Thanks for checking out AlphaLux Cleaning. Our booking flow is designed so you can pick your home size, see your exact price, and reserve a time slot in under a minute.</p>
        <p style="margin:24px 0;"><a href="${esc(appUrl)}/book/zip" style="background:#A17938;color:#15120f;padding:14px 28px;border-radius:999px;text-decoration:none;font-weight:700;display:inline-block;">Get my instant quote &rarr;</a></p>
        <p style="color:#6b5d49;font-size:13px;">No surprises, no hidden fees. 100% satisfaction guarantee on every visit.</p>
      `,
      );
      return { html, subject };
    }
    case "booking_confirmed": {
      const subject = `Confirmed: ${esc(data.service_type || "Your cleaning")} on ${esc(
        data.service_date || "your scheduled date",
      )}`;
      const rows: string[] = [];
      if (data.service_type)
        rows.push(
          `<tr><td style="padding:6px 0;color:#6b5d49;">Service</td><td style="padding:6px 0;text-align:right;">${esc(data.service_type)}</td></tr>`,
        );
      if (data.service_date)
        rows.push(
          `<tr><td style="padding:6px 0;color:#6b5d49;">Date</td><td style="padding:6px 0;text-align:right;">${esc(data.service_date)}</td></tr>`,
        );
      if (data.time_window)
        rows.push(
          `<tr><td style="padding:6px 0;color:#6b5d49;">Time</td><td style="padding:6px 0;text-align:right;">${esc(data.time_window)}</td></tr>`,
        );
      if (data.address)
        rows.push(
          `<tr><td style="padding:6px 0;color:#6b5d49;">Address</td><td style="padding:6px 0;text-align:right;">${esc(data.address)}</td></tr>`,
        );
      if (data.total_amount)
        rows.push(
          `<tr><td style="padding:6px 0;color:#6b5d49;">Total</td><td style="padding:6px 0;text-align:right;">$${esc(data.total_amount)}</td></tr>`,
        );
      if (data.deposit_paid)
        rows.push(
          `<tr><td style="padding:6px 0;color:#6b5d49;">Deposit paid</td><td style="padding:6px 0;text-align:right;color:#2f7d4a;">$${esc(data.deposit_paid)}</td></tr>`,
        );
      if (data.balance_due)
        rows.push(
          `<tr><td style="padding:6px 0;color:#6b5d49;">Balance due</td><td style="padding:6px 0;text-align:right;">$${esc(data.balance_due)}</td></tr>`,
        );
      const manageUrl =
        data.manage_url || data.manage_link || `${appUrl}/order-status`;
      const html = baseLayout(
        subject,
        `
        <h1 style="font-size:22px;margin:0 0 12px;">You're booked, ${firstName}! 🎉</h1>
        <p>Your cleaning is confirmed. A member of our team will arrive during your scheduled time window with all supplies.</p>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-top:1px solid #ece7dd;border-bottom:1px solid #ece7dd;margin:18px 0;">${rows.join("")}</table>
        <p style="margin:18px 0;"><a href="${esc(manageUrl)}" style="background:#15120f;color:#f6dfa8;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:700;display:inline-block;">Manage your booking</a></p>
        <p style="color:#6b5d49;font-size:13px;">Need to change anything? Reply to this email or call ${esc(supportPhone)}.</p>
      `,
      );
      return { html, subject };
    }
    case "payment_succeeded": {
      const subject = "Payment received — thank you";
      const html = baseLayout(
        subject,
        `
        <h1 style="font-size:22px;margin:0 0 12px;">Thank you, ${firstName}!</h1>
        <p>We've received your payment${data.amount ? ` of <strong>$${esc(data.amount)}</strong>` : ""}. Your ${esc(data.service_type || "cleaning")} is all set.</p>
        ${data.receipt_link ? `<p><a href="${esc(data.receipt_link)}" style="color:#A17938;">View receipt</a></p>` : ""}
      `,
      );
      return { html, subject };
    }
    case "payment_failed": {
      const subject = "Action needed: update your payment method";
      const html = baseLayout(
        subject,
        `
        <h1 style="font-size:22px;margin:0 0 12px;">Hi ${firstName},</h1>
        <p>We weren't able to process your payment for your upcoming cleaning. Please update your payment method to keep your booking.</p>
        <p><a href="${esc(appUrl)}/account/billing" style="background:#b4311f;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:700;display:inline-block;">Update payment</a></p>
      `,
      );
      return { html, subject };
    }
    case "abandoned_checkout": {
      const subject =
        variant === "B"
          ? "Locked price, one click to complete"
          : "Finish booking — your time window is still available";
      const html = baseLayout(
        subject,
        `
        <h1 style="font-size:22px;margin:0 0 12px;">Still interested, ${firstName}?</h1>
        <p>Your ${esc(data.service_type || "cleaning")} quote${data.price_final ? ` ($${esc(data.price_final)})` : ""} is still available. Time slots fill up fast — finish booking to lock it in.</p>
        <p><a href="${esc(appUrl)}/book/checkout${data.booking_id ? `?booking=${esc(data.booking_id)}` : ""}" style="background:#A17938;color:#15120f;padding:14px 28px;border-radius:999px;text-decoration:none;font-weight:700;display:inline-block;">Complete my booking</a></p>
      `,
      );
      return { html, subject };
    }
    case "promo_applied": {
      const subject = `Promo ${esc(data.promo_code || "")} applied to your booking`;
      const html = baseLayout(
        subject,
        `
        <h1 style="font-size:22px;margin:0 0 12px;">Thanks, ${firstName}!</h1>
        <p>We've applied promo code <strong>${esc(data.promo_code || "")}</strong> (saving you $${esc(data.discount_amount || "0.00")}). Your new total is $${esc(data.new_total || "")}.</p>
      `,
      );
      return { html, subject };
    }
    default: {
      // Generic fallback so a bad template name still delivers
      // something instead of 500'ing the whole request.
      const subject = esc(data.subject || "AlphaLux Cleaning update");
      const html = baseLayout(
        subject,
        `<p>${esc(data.body || data.message || "Thanks for choosing AlphaLux Cleaning.")}</p>`,
      );
      return { html, subject };
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body: EmailRequest = await req.json();
    const {
      template,
      to,
      data = {},
      category = "transactional",
      event_id,
      subject_variant,
    } = body;

    if (!template || !to) {
      return new Response(
        JSON.stringify({ error: "template and to are required" }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
          status: 400,
        },
      );
    }

    if (event_id) {
      const { data: existing } = await supabase
        .from("email_jobs")
        .select("id")
        .eq("event_id", event_id)
        .maybeSingle();
      if (existing) {
        return new Response(
          JSON.stringify({ success: true, message: "Already processed" }),
          {
            headers: { "Content-Type": "application/json", ...corsHeaders },
            status: 200,
          },
        );
      }
    }

    if (category === "marketing" && data.marketing_opt_in === false) {
      return new Response(
        JSON.stringify({ success: true, message: "Marketing suppressed" }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
          status: 200,
        },
      );
    }
    if (data && data.email_bounced_at) {
      return new Response(
        JSON.stringify({ success: true, message: "Email bounced, suppressed" }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
          status: 200,
        },
      );
    }

    const { data: jobData, error: jobError } = await supabase
      .from("email_jobs")
      .insert({
        template_name: template,
        to_email: to,
        payload: { ...data, subject_variant },
        category,
        event_id,
        status: "sending",
      })
      .select()
      .single();

    if (jobError) {
      console.error("email_jobs insert failed:", jobError);
    }

    const { html, subject } = renderTemplate(template, data, subject_variant);

    const emailResponse = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
      replyTo: REPLY_TO_EMAIL,
      tags: [
        { name: "template", value: template },
        { name: "category", value: category },
      ],
    });

    if (emailResponse.error) {
      const errMsg = emailResponse.error.message || "Resend send failed";
      console.error("Resend error:", emailResponse.error);
      if (jobData) {
        await supabase
          .from("email_jobs")
          .update({ status: "failed", last_error: errMsg })
          .eq("id", jobData.id);
      }
      return new Response(
        JSON.stringify({
          success: false,
          error: `Resend error: ${errMsg}`,
        }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
          status: 502,
        },
      );
    }

    if (jobData) {
      await supabase
        .from("email_jobs")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          provider_message_id: emailResponse.data?.id,
        })
        .eq("id", jobData.id);
    }
    await supabase.from("email_events").insert({
      to_email: to,
      template,
      provider: "resend",
      event: "sent",
      message_id: emailResponse.data?.id,
      meta: { category, from: FROM_EMAIL },
    });

    return new Response(
      JSON.stringify({
        success: true,
        job_id: jobData?.id,
        message_id: emailResponse.data?.id,
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 200,
      },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("send-email-system error:", msg);
    return new Response(
      JSON.stringify({ error: msg || "Internal server error" }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 500,
      },
    );
  }
});
