import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Import email templates
import { LeadWelcomeEmail } from "./_templates/lead-welcome.tsx";
import { BookingStartedEmail } from "./_templates/booking-started.tsx";
import { BookingConfirmedEmail } from "./_templates/booking-confirmed.tsx";
import { RescheduledEmail } from "./_templates/rescheduled.tsx";
import { Reminder24hEmail } from "./_templates/reminder-24h.tsx";
import { Reminder2hEmail } from "./_templates/reminder-2h.tsx";
import { JobCompletedEmail } from "./_templates/job-completed.tsx";
import { PaymentSucceededEmail } from "./_templates/payment-succeeded.tsx";
import { PaymentFailedEmail } from "./_templates/payment-failed.tsx";
import { AbandonedCheckoutEmail } from "./_templates/abandoned-checkout.tsx";
import { RecurringUpsellEmail } from "./_templates/recurring-upsell.tsx";
import { ReferralRewardEarnedEmail } from "./_templates/referral-reward-earned.tsx";
import { ReferralWelcomeCreditEmail } from "./_templates/referral-welcome-credit.tsx";
import { ReferralInviteEmail } from "./_templates/referral-invite.tsx";
import { AdminOTPEmail } from "../_shared/email-templates/admin-otp-template.tsx";
import { WaitlistConfirmationEmail } from "../_shared/email-templates/waitlist-confirmation.tsx";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  template: string;
  to: string;
  data: Record<string, any>;
  category: 'transactional' | 'marketing';
  event_id?: string;
  subject_variant?: 'A' | 'B';
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { template, to, data, category, event_id, subject_variant }: EmailRequest = await req.json();

    // Check for idempotency
    if (event_id) {
      const { data: existing } = await supabase
        .from('email_jobs')
        .select('id')
        .eq('event_id', event_id)
        .single();

      if (existing) {
        console.log(`Email job already exists for event_id: ${event_id}`);
        return new Response(JSON.stringify({ success: true, message: "Already processed" }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // Check if marketing email and user has opted out
    if (category === 'marketing' && data.marketing_opt_in === false) {
      console.log(`Marketing email suppressed for ${to} - opted out`);
      return new Response(JSON.stringify({ success: true, message: "Marketing suppressed" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if email is bounced
    if (data && data.email_bounced_at) {
      console.log(`Email suppressed for ${to} - previously bounced`);
      return new Response(JSON.stringify({ success: true, message: "Email bounced, suppressed" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create email job record
    const emailJob = {
      template_name: template,
      to_email: to,
      payload: { ...data, subject_variant },
      category,
      event_id,
      status: 'sending'
    };

    const { data: jobData, error: jobError } = await supabase
      .from('email_jobs')
      .insert(emailJob)
      .select()
      .single();

    if (jobError) {
      throw new Error(`Failed to create email job: ${jobError.message}`);
    }

    // Render email template
    const { html, subject } = await renderEmailTemplate(template, data, subject_variant);

    // Send email via Resend. `EMAIL_FROM` / `EMAIL_REPLY_TO` on the
    // edge function's environment let ops pick a verified sender
    // without redeploying. Fall back to the branded sender first, and
    // only if Resend rejects it as unverified do we retry with the
    // Resend onboarding domain so the email is never silently dropped.
    const primaryFrom =
      Deno.env.get("EMAIL_FROM") ||
      "AlphaLuxClean <noreply@info.alphaluxcleaning.com>";
    const replyTo =
      Deno.env.get("EMAIL_REPLY_TO") || "support@alphaluxcleaning.com";

    let emailResponse = await resend.emails.send({
      from: primaryFrom,
      to: [to],
      subject,
      html,
      replyTo,
      tags: [
        { name: "template", value: template },
        { name: "category", value: category },
      ],
    });

    // Resend surfaces three different "your sender isn't usable for this
    // recipient" patterns depending on account state:
    //   1. "The X domain is not verified."  (sending domain has no DNS proof)
    //   2. "Sending domain X must be verified."
    //   3. "You can only send testing emails to your own email address (X).
    //       To send emails to other recipients, please verify a domain..."
    //      (account exists but no domain has ever been verified)
    // All three mean "we can't send from this 'from' address right now" —
    // fall back to onboarding@resend.dev so the customer email still goes
    // out instead of bouncing.
    if (
      emailResponse.error &&
      /domain.*is not verified|sending domain.*must be verified|testing emails to your own email address|verify a domain/i.test(
        emailResponse.error.message || "",
      )
    ) {
      const fallbackFrom = "AlphaLuxClean <onboarding@resend.dev>";
      console.warn(
        `[send-email-system] Primary sender ${primaryFrom} is unverified — retrying with ${fallbackFrom}. ` +
          `Ops should verify the sender domain in Resend and (optionally) set EMAIL_FROM in Supabase secrets.`,
      );
      emailResponse = await resend.emails.send({
        from: fallbackFrom,
        to: [to],
        subject,
        html,
        replyTo,
        tags: [
          { name: "template", value: template },
          { name: "category", value: category },
          { name: "sender_fallback", value: "true" },
        ],
      });
    }

    if (emailResponse.error) {
      // If Resend is still rejecting the recipient (e.g. the account is
      // in sandbox / no-domain-verified state and the recipient isn't
      // the account owner), don't 500. Park the job as `bounced_provider`
      // so ops can replay it later and return success so the booking
      // flow isn't blocked. The rest of the funnel (Stripe, GHL, HCP)
      // is unaffected.
      const msg = emailResponse.error.message || "";
      const isProviderRestriction =
        /domain.*is not verified|sending domain.*must be verified|testing emails to your own email address|verify a domain/i.test(msg);
      console.warn(`[send-email-system] Resend send failed: ${msg}`);
      await supabase
        .from('email_jobs')
        .update({
          status: isProviderRestriction ? 'bounced_provider' : 'failed',
          last_error: msg,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobData.id);
      if (isProviderRestriction) {
        return new Response(
          JSON.stringify({
            success: false,
            queued: true,
            job_id: jobData.id,
            warning: "Resend account is in sandbox mode for this recipient. Verify a sending domain at resend.com/domains so the email can be delivered.",
          }),
          { status: 202, headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }
      throw new Error(`Resend error: ${msg}`);
    }

    // Update job status to sent
    await supabase
      .from('email_jobs')
      .update({ 
        status: 'sent', 
        sent_at: new Date().toISOString(),
        provider_message_id: emailResponse.data?.id 
      })
      .eq('id', jobData.id);

    // Log email event
    await supabase
      .from('email_events')
      .insert({
        to_email: to,
        template,
        provider: 'resend',
        event: 'sent',
        message_id: emailResponse.data?.id,
        meta: { job_id: jobData.id, category }
      });

    return new Response(JSON.stringify({ 
      success: true, 
      job_id: jobData.id,
      message_id: emailResponse.data?.id 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-email-system:", error);
    
    return new Response(JSON.stringify({ 
      error: error.message || "Internal server error" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

async function renderEmailTemplate(template: string, data: any, variant?: 'A' | 'B') {
  const templateProps = {
    ...data,
    app_url: Deno.env.get("APP_URL") || "https://app.alphaluxclean.com",
    support_phone: Deno.env.get("SUPPORT_PHONE") || "(555) 123-4567"
  };

  let emailComponent;
  let subject = "";

  switch (template) {
    case 'lead_welcome':
      subject = variant === 'B' 
        ? "Finish in 60s: pick home size → see price"
        : "Your instant price is one click away";
      emailComponent = React.createElement(LeadWelcomeEmail, templateProps);
      break;

    case 'booking_started':
      subject = "You're almost done — confirm your cleaning";
      emailComponent = React.createElement(BookingStartedEmail, templateProps);
      break;

    case 'booking_confirmed':
      subject = `Confirmed: ${data.service_type} on ${data.service_date} (${data.time_window})`;
      emailComponent = React.createElement(BookingConfirmedEmail, templateProps);
      break;

    case 'rescheduled':
      subject = `Updated: your cleaning is now ${data.service_date} (${data.time_window})`;
      emailComponent = React.createElement(RescheduledEmail, templateProps);
      break;

    case 'reminder_24h':
      subject = `Reminder: we're arriving ${data.service_date} (${data.time_window})`;
      emailComponent = React.createElement(Reminder24hEmail, templateProps);
      break;

    case 'reminder_2h':
      subject = `We're on for today (${data.time_window})`;
      emailComponent = React.createElement(Reminder2hEmail, templateProps);
      break;

    case 'job_completed':
      subject = "Thank you — how did we do?";
      emailComponent = React.createElement(JobCompletedEmail, templateProps);
      break;

    case 'payment_succeeded':
      subject = "Payment received — thank you";
      emailComponent = React.createElement(PaymentSucceededEmail, templateProps);
      break;

    case 'payment_failed':
      subject = "Action needed: update your payment method";
      emailComponent = React.createElement(PaymentFailedEmail, templateProps);
      break;

    case 'abandoned_checkout':
      subject = variant === 'B'
        ? "Locked price, one click to complete"
        : "Finish booking — your time window is still available";
      emailComponent = React.createElement(AbandonedCheckoutEmail, templateProps);
      break;

    case 'recurring_upsell':
      subject = "Turn today's clean into a weekly reset (save 10–15%)";
      emailComponent = React.createElement(RecurringUpsellEmail, templateProps);
      break;

    case 'referral_invite':
      subject = `Give $25, get $25 — share your code ${data.referral_code}`;
      emailComponent = React.createElement(ReferralInviteEmail, templateProps);
      break;

    case 'referral_reward_earned':
      subject = `You earned ${data.amount} credit!`;
      emailComponent = React.createElement(ReferralRewardEarnedEmail, templateProps);
      break;

    case 'referral_welcome_credit':
      subject = `Welcome! ${data.amount} credit applied to your account`;
      emailComponent = React.createElement(ReferralWelcomeCreditEmail, templateProps);
      break;

    case 'admin_otp':
      subject = `Admin Portal Access Code: ${data.code}`;
      emailComponent = React.createElement(AdminOTPEmail, templateProps);
      break;

    case 'waitlist_confirmation':
      subject = "You're on the list! Here's your $60 off code 🎉";
      emailComponent = React.createElement(WaitlistConfirmationEmail, {
        firstName: data.firstName || data.first_name,
        promoCode: data.promoCode || 'DEEPCLEAN60',
        promoAmount: data.promoAmount || 60,
        bookingUrl: data.bookingUrl || `${templateProps.app_url}/booking?promo=DEEPCLEAN60`
      });
      break;

    default:
      throw new Error(`Unknown email template: ${template}`);
  }

  const html = await renderAsync(emailComponent);
  return { html, subject };
}

serve(handler);