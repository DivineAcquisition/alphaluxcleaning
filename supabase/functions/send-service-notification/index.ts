import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { ServiceRescheduledEmail } from '../_shared/email-templates/service-rescheduled.tsx';
import { ServicePausedEmail } from '../_shared/email-templates/service-paused.tsx';
import { ServiceResumedEmail } from '../_shared/email-templates/service-resumed.tsx';
import { ServiceCancelledEmail } from '../_shared/email-templates/service-cancelled.tsx';
import { RetentionDiscountEmail } from '../_shared/email-templates/retention-discount.tsx';
import { ReferralRewardEmail } from '../_shared/email-templates/referral-reward.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-SERVICE-NOTIFICATION] ${step}${detailsStr}`);
};

interface ServiceNotificationRequest {
  orderId?: string;
  type?: string;
  notificationType?: 'rescheduled' | 'paused' | 'resumed' | 'cancelled' | 'discount_applied';
  customerEmail?: string;
  customerName?: string;
  cleaningType?: string;
  frequency?: string;
  serviceAddress?: string;
  // For rescheduled
  oldDate?: string;
  oldTime?: string;
  newDate?: string;
  newTime?: string;
  // For paused
  pausedUntil?: string;
  lastServiceDate?: string;
  // For resumed/scheduled
  nextServiceDate?: string;
  nextServiceTime?: string;
  // For cancelled
  cancellationReason?: string;
  discountOffered?: boolean;
  discountAccepted?: boolean;
  // For discount
  originalAmount?: number;
  discountedAmount?: number;
  savingsAmount?: number;
  // For referral reward
  referrerEmail?: string;
  referrerName?: string;
  friendName?: string;
  rewardCode?: string;
  rewardAmount?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    logStep("Function started");

    const body: ServiceNotificationRequest = await req.json();
    logStep("Request body received", { type: body.notificationType, orderId: body.orderId });

    const {
      type,
      notificationType,
      customerEmail,
      customerName,
      cleaningType,
      frequency,
      serviceAddress,
      oldDate,
      oldTime,
      newDate,
      newTime,
      pausedUntil,
      lastServiceDate,
      nextServiceDate,
      nextServiceTime,
      cancellationReason,
      discountOffered,
      discountAccepted,
      originalAmount,
      discountedAmount,
      savingsAmount,
      referrerEmail,
      referrerName,
      friendName,
      rewardCode,
      rewardAmount
    } = body;

    let emailHtml: string;
    let subject: string;

    // Generate email based on notification type
    switch (type || notificationType) {
      case 'referral_reward':
        if (!referrerName || !friendName || !rewardCode || !rewardAmount) {
          throw new Error("Missing required fields for referral reward notification");
        }
        
        emailHtml = await renderAsync(
          React.createElement(ReferralRewardEmail, {
            referrerName,
            friendName,
            rewardCode,
            rewardAmount,
          })
        );
        subject = "🎉 Referral Reward Earned! - AlphaLux Cleaning";
        break;
      case 'rescheduled':
        if (!oldDate || !oldTime || !newDate || !newTime) {
          throw new Error("Missing required fields for rescheduled notification");
        }
        
        emailHtml = await renderAsync(
          React.createElement(ServiceRescheduledEmail, {
            customerName,
            cleaningType,
            oldDate,
            oldTime,
            newDate,
            newTime,
            serviceAddress,
          })
        );
        subject = "Service Rescheduled - AlphaLux Cleaning";
        break;

      case 'paused':
        if (!pausedUntil) {
          throw new Error("Missing required fields for paused notification");
        }
        
        emailHtml = await renderAsync(
          React.createElement(ServicePausedEmail, {
            customerName,
            cleaningType,
            frequency,
            pausedUntil,
            lastServiceDate,
          })
        );
        subject = "Service Paused - AlphaLux Cleaning";
        break;

      case 'resumed':
        if (!nextServiceDate || !nextServiceTime) {
          throw new Error("Missing required fields for resumed notification");
        }
        
        emailHtml = await renderAsync(
          React.createElement(ServiceResumedEmail, {
            customerName,
            cleaningType,
            frequency,
            nextServiceDate,
            nextServiceTime,
            serviceAddress,
          })
        );
        subject = "Welcome Back! Service Resumed - AlphaLux Cleaning";
        break;

      case 'cancelled':
        emailHtml = await renderAsync(
          React.createElement(ServiceCancelledEmail, {
            customerName,
            cleaningType,
            frequency,
            cancellationReason,
            discountOffered: discountOffered || false,
            discountAccepted: discountAccepted || false,
          })
        );
        subject = "Service Cancelled - AlphaLux Cleaning";
        break;

      case 'discount_applied':
        if (!originalAmount || !discountedAmount || !savingsAmount || !nextServiceDate || !nextServiceTime) {
          throw new Error("Missing required fields for discount notification");
        }
        
        emailHtml = await renderAsync(
          React.createElement(RetentionDiscountEmail, {
            customerName,
            cleaningType,
            frequency,
            originalAmount,
            discountedAmount,
            savingsAmount,
            nextServiceDate,
            nextServiceTime,
          })
        );
        subject = "🎉 Your 25% Discount is Active! - AlphaLux Cleaning";
        break;

      default:
        throw new Error(`Unknown notification type: ${notificationType}`);
    }

    logStep("Email template rendered", { notificationType });

    // Send email
    const recipientEmail = (type === 'referral_reward' && referrerEmail) ? referrerEmail : customerEmail;
    const emailResponse = await resend.emails.send({
      from: "AlphaLux Cleaning <noreply@info.alphaluxclean.com>",
      to: [recipientEmail],
      subject,
      html: emailHtml,
    });

    if (emailResponse.error) {
      throw emailResponse.error;
    }

    logStep("Email sent successfully", { emailId: emailResponse.data?.id });

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResponse.data?.id,
        type: notificationType
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    logStep("ERROR", { message: error.message, stack: error.stack });
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);