import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { AdminInviteEmail } from '../_shared/email-templates/admin-invite.tsx';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  companyId: string;
  to: string;
  templateKey: string;
  variables: Record<string, any>;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('🚀 System email function called');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const emailRequest: EmailRequest = await req.json();
    console.log('📧 Processing email request:', {
      to: emailRequest.to,
      template: emailRequest.templateKey,
      companyId: emailRequest.companyId
    });

    const { companyId, to, templateKey, variables } = emailRequest;

    if (!to || !templateKey) {
      throw new Error('Missing required fields: to, templateKey');
    }

    // Determine email content based on template
    let subject: string;
    let html: string;
    let fromAddress = "Bay Area Cleaning Pros <onboarding@resend.dev>";

    switch (templateKey) {
      case 'booking_confirmation':
        subject = `🏠 Booking Confirmed - ${variables.service_date}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">Booking Confirmed!</h1>
            <p>Hi ${variables.customer_name},</p>
            <p>Your cleaning service has been confirmed for <strong>${variables.service_date}</strong> at <strong>${variables.service_time}</strong>.</p>
            ${variables.portal_url ? `<p><a href="${variables.portal_url}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Manage Booking</a></p>` : ''}
            <p>Thank you for choosing Bay Area Cleaning Pros!</p>
          </div>
        `;
        break;

      case 'booking_reminder_24h':
        subject = `⏰ Reminder: Cleaning Tomorrow - ${variables.service_date}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">Cleaning Reminder</h1>
            <p>Hi ${variables.customer_name},</p>
            <p>This is a friendly reminder that your cleaning service is scheduled for <strong>tomorrow (${variables.service_date})</strong> at <strong>${variables.service_time}</strong>.</p>
            <p>Our team will arrive as scheduled. Please ensure someone is available to let us in.</p>
            <p>Bay Area Cleaning Pros</p>
          </div>
        `;
        break;

      case 'booking_reminder_1h':
        subject = `🚨 Cleaning Starting Soon - ${variables.service_time}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">Cleaning Starting Soon</h1>
            <p>Hi ${variables.customer_name},</p>
            <p>Your cleaning service will begin in approximately 1 hour at <strong>${variables.service_time}</strong>.</p>
            <p>Our team will be there soon!</p>
            <p>Bay Area Cleaning Pros</p>
          </div>
        `;
        break;

      case 'receipt':
        subject = `💳 Payment Receipt - $${variables.amount}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">Payment Receipt</h1>
            <p>Hi ${variables.customer_name},</p>
            <p>Thank you for your payment of <strong>$${variables.amount}</strong> for your cleaning service on ${variables.service_date}.</p>
            <p><strong>Transaction ID:</strong> ${variables.transaction_id}</p>
            <p>Bay Area Cleaning Pros</p>
          </div>
        `;
        break;

      case 'portal_magic_link':
        subject = '🔐 Your Customer Portal Access Link';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">Customer Portal Access</h1>
            <p>Click the link below to access your customer portal:</p>
            <p><a href="${variables.magic_link}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Access Portal</a></p>
            <p>This link will expire in 24 hours.</p>
            <p>Bay Area Cleaning Pros</p>
          </div>
        `;
        break;

      case 'otp':
        subject = '🔢 Your Login Code';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">Login Code</h1>
            <p>Your login code is: <strong style="font-size: 24px; color: #007bff;">${variables.code}</strong></p>
            <p>This code will expire in 10 minutes.</p>
            <p>Bay Area Cleaning Pros</p>
          </div>
        `;
        break;

      case 'sub_offer':
        subject = `💼 New Job Opportunity - ${variables.service_date}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">Job Offer</h1>
            <p>Hi ${variables.subcontractor_name},</p>
            <p>We have a cleaning job available:</p>
            <ul>
              <li><strong>Date:</strong> ${variables.service_date} at ${variables.service_time}</li>
              <li><strong>Location:</strong> ${variables.address}</li>
              <li><strong>Payout:</strong> $${variables.payout}</li>
            </ul>
            <p>
              <a href="${variables.accept_url}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-right: 10px;">Accept Job</a>
              <a href="${variables.decline_url}" style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Decline</a>
            </p>
            <p>Bay Area Cleaning Pros</p>
          </div>
        `;
        break;

      case 'sub_reminder':
        subject = `📋 Job Reminder - ${variables.service_time}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">Job Reminder</h1>
            <p>Hi ${variables.subcontractor_name},</p>
            <p>Reminder: You have a cleaning job at <strong>${variables.service_time}</strong></p>
            <p><strong>Customer:</strong> ${variables.customer_name}</p>
            <p><strong>Address:</strong> ${variables.address}</p>
            <p>Bay Area Cleaning Pros</p>
          </div>
        `;
        break;

      case 'admin_invite':
        // Use React Email template for admin invites
        html = await renderAsync(
          React.createElement(AdminInviteEmail, {
            email: to,
            role: variables.role || 'viewer',
            inviteUrl: variables.invite_url,
            companyName: 'Bay Area Cleaning Professionals',
          })
        );
        subject = 'Admin Access Invitation - Bay Area Cleaning Pros';
        fromAddress = "Bay Area Cleaning Pros <admin@bayareacleaningpros.com>";
        break;

      default:
        throw new Error(`Unknown template: ${templateKey}`);
    }

    console.log('📤 Sending email via Resend...');
    const emailResponse = await resend.emails.send({
      from: fromAddress,
      to: [to],
      subject,
      html,
    });

    if (emailResponse.error) {
      console.error('❌ Resend API error:', emailResponse.error);
      throw emailResponse.error;
    }

    console.log('✅ Email sent successfully:', {
      emailId: emailResponse.data?.id,
      to,
      template: templateKey
    });

    return new Response(JSON.stringify({ 
      success: true,
      emailId: emailResponse.data?.id,
      message: `${templateKey} email sent to ${to}`
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('❌ Error in send-system-email function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);