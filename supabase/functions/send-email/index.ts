import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendEmailRequest {
  companyId: string;
  to: string;
  templateKey: string;
  variables: Record<string, any>;
}

interface EmailSettings {
  from_name: string;
  from_email: string;
  reply_to?: string;
  brand: {
    logo_url?: string;
    color_hex: string;
  };
}

interface EmailTemplate {
  subject: string;
  react_component_key: string;
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId, to, templateKey, variables }: SendEmailRequest = await req.json();

    console.log('Sending email:', { companyId, to, templateKey });

    // Get company email settings
    const { data: settings, error: settingsError } = await supabase
      .from('email_settings')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (settingsError) {
      console.error('Error fetching email settings:', settingsError);
    }

    // Use defaults if no settings found
    const emailSettings: EmailSettings = settings || {
      from_name: 'Bay Area Cleaning Pros',
      from_email: 'notifications@bayareacleaningpros.com',
      brand: { color_hex: '#A58FFF' }
    };

    // Get template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('company_id', companyId)
      .eq('template_key', templateKey)
      .single();

    if (templateError || !template) {
      throw new Error(`Template ${templateKey} not found`);
    }

    // Replace variables in subject
    let subject = template.subject;
    Object.entries(variables).forEach(([key, value]) => {
      subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    });

    // Generate email HTML content
    const html = generateEmailHTML(templateKey, variables, emailSettings);

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: `${emailSettings.from_name} <${emailSettings.from_email}>`,
      to: [to],
      subject: subject,
      html: html,
      replyTo: emailSettings.reply_to || emailSettings.from_email,
    });

    console.log('Email sent successfully:', emailResponse);

    // Log email event
    const { error: logError } = await supabase
      .from('email_events')
      .insert({
        company_id: companyId,
        template_key: templateKey,
        to_email: to,
        message_id: emailResponse.data?.id,
        status: 'sent',
        payload: {
          subject,
          variables,
          resend_response: emailResponse
        }
      });

    if (logError) {
      console.error('Error logging email event:', logError);
    }

    return new Response(JSON.stringify({
      success: true,
      message_id: emailResponse.data?.id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error in send-email function:', error);

    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

function generateEmailHTML(templateKey: string, variables: Record<string, any>, settings: EmailSettings): string {
  const { brand } = settings;
  const brandColor = brand.color_hex || '#A58FFF';
  
  // Base email template with brand styling
  const baseStyles = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f9fafb; }
      .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
      .header { background: linear-gradient(135deg, ${brandColor}, ${brandColor}dd); color: white; padding: 30px 40px; text-align: center; }
      .content { padding: 40px; }
      .button { background: linear-gradient(135deg, ${brandColor}, ${brandColor}dd); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500; }
      .footer { background: #f3f4f6; padding: 20px 40px; text-align: center; color: #6b7280; font-size: 14px; }
    </style>
  `;

  const header = `
    <div class="header">
      ${brand.logo_url ? `<img src="${brand.logo_url}" alt="${settings.from_name}" style="max-height: 40px; margin-bottom: 10px;">` : ''}
      <h1 style="margin: 0; font-size: 24px;">${settings.from_name}</h1>
    </div>
  `;

  const footer = `
    <div class="footer">
      <p style="margin: 0 0 10px 0;">You received this transactional email related to your service with ${settings.from_name}.</p>
      <p style="margin: 0; font-size: 12px;">© ${new Date().getFullYear()} ${settings.from_name}</p>
    </div>
  `;

  let content = '';

  switch (templateKey) {
    case 'booking_confirmation':
      content = `
        <h2 style="color: ${brandColor};">Booking Confirmed!</h2>
        <p>Hello ${variables.customer_name || 'Valued Customer'},</p>
        <p>Your cleaning service has been confirmed. We're excited to serve you!</p>
        <p><strong>Service Date:</strong> ${variables.service_date || 'TBD'}</p>
        <p><strong>Service Time:</strong> ${variables.service_time || 'TBD'}</p>
        ${variables.portal_url ? `<p><a href="${variables.portal_url}" class="button">View Booking Details</a></p>` : ''}
        <p>If you have any questions, please don't hesitate to contact us.</p>
      `;
      break;
    
    case 'booking_reminder_24h':
    case 'booking_reminder_1h':
      const timeframe = templateKey.includes('24h') ? 'tomorrow' : 'soon';
      content = `
        <h2 style="color: ${brandColor};">Service Reminder</h2>
        <p>Hello ${variables.customer_name || 'Valued Customer'},</p>
        <p>This is a friendly reminder that your cleaning service is scheduled for ${timeframe}.</p>
        <p><strong>Service Date:</strong> ${variables.service_date || 'TBD'}</p>
        <p><strong>Service Time:</strong> ${variables.service_time || 'TBD'}</p>
        <p>Please ensure someone is available to provide access to your property.</p>
      `;
      break;
    
    case 'receipt':
      content = `
        <h2 style="color: ${brandColor};">Payment Receipt</h2>
        <p>Hello ${variables.customer_name || 'Valued Customer'},</p>
        <p>Thank you for your payment. Here's your receipt:</p>
        <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <p><strong>Amount:</strong> $${variables.amount || '0.00'}</p>
          <p><strong>Service Date:</strong> ${variables.service_date || 'TBD'}</p>
          <p><strong>Transaction ID:</strong> ${variables.transaction_id || 'N/A'}</p>
        </div>
        <p>We appreciate your business!</p>
      `;
      break;
    
    case 'portal_magic_link':
      content = `
        <h2 style="color: ${brandColor};">Access Your Account</h2>
        <p>Hello!</p>
        <p>Click the button below to securely access your customer portal:</p>
        <p><a href="${variables.magic_link || '#'}" class="button">Access Portal</a></p>
        <p>This link will expire in 1 hour for security purposes.</p>
      `;
      break;
    
    case 'otp':
      content = `
        <h2 style="color: ${brandColor};">Your Verification Code</h2>
        <p>Hello!</p>
        <p>Your verification code is:</p>
        <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center;">
          <h1 style="font-size: 36px; letter-spacing: 8px; margin: 0; color: ${brandColor};">${variables.code || '123456'}</h1>
        </div>
        <p>This code will expire in 10 minutes.</p>
      `;
      break;
    
    case 'sub_offer':
      content = `
        <h2 style="color: ${brandColor};">New Job Offer</h2>
        <p>Hello ${variables.subcontractor_name || 'Team Member'},</p>
        <p>You have a new job offer available:</p>
        <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <p><strong>Service Date:</strong> ${variables.service_date || 'TBD'}</p>
          <p><strong>Service Time:</strong> ${variables.service_time || 'TBD'}</p>
          <p><strong>Location:</strong> ${variables.address || 'TBD'}</p>
          <p><strong>Estimated Payout:</strong> $${variables.payout || '0.00'}</p>
        </div>
        <div style="text-align: center;">
          <a href="${variables.accept_url || '#'}" class="button" style="margin-right: 10px; background: #10b981;">Accept Job</a>
          <a href="${variables.decline_url || '#'}" class="button" style="background: #ef4444;">Decline</a>
        </div>
      `;
      break;
    
    case 'sub_reminder':
      content = `
        <h2 style="color: ${brandColor};">Job Reminder</h2>
        <p>Hello ${variables.subcontractor_name || 'Team Member'},</p>
        <p>This is a reminder about your upcoming job today:</p>
        <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <p><strong>Service Time:</strong> ${variables.service_time || 'TBD'}</p>
          <p><strong>Customer:</strong> ${variables.customer_name || 'TBD'}</p>
          <p><strong>Address:</strong> ${variables.address || 'TBD'}</p>
        </div>
        <p>Please arrive on time and contact the customer if you need assistance.</p>
      `;
      break;
    
    default:
      content = `
        <h2 style="color: ${brandColor};">Notification</h2>
        <p>Hello!</p>
        <p>You have received a notification from ${settings.from_name}.</p>
        <p>Please check your account for more details.</p>
      `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      ${baseStyles}
    </head>
    <body>
      <div class="container">
        ${header}
        <div class="content">
          ${content}
        </div>
        ${footer}
      </div>
    </body>
    </html>
  `;
}

serve(handler);