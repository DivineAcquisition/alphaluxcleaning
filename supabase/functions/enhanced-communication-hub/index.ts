import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { Resend } from 'npm:resend@4.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CommunicationRequest {
  userId: string;
  channels: Array<'sms' | 'email' | 'in_app'>;
  template: string;
  templateData: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  secureAction?: {
    action: 'accept_job' | 'decline_job' | 'confirm_timesheet' | 'approve_payout';
    resourceId: string;
  };
  scheduledFor?: string; // ISO string for scheduled delivery
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

// Communication templates with role-based messaging
const templates = {
  job_assignment: {
    sms: (data: any) => `🏠 New job assigned! ${data.location} on ${data.date} at ${data.time}. Total: $${data.amount}`,
    email: {
      subject: (data: any) => `New Job Assignment - ${data.location}`,
      html: (data: any) => `
        <h2>New Job Assignment</h2>
        <p><strong>Location:</strong> ${data.location}</p>
        <p><strong>Date:</strong> ${data.date}</p>
        <p><strong>Time:</strong> ${data.time}</p>
        <p><strong>Service Type:</strong> ${data.serviceType}</p>
        <p><strong>Amount:</strong> $${data.amount}</p>
      `
    },
    in_app: (data: any) => ({
      title: 'New Job Assignment',
      message: `Job at ${data.location} on ${data.date}`,
      action_url: `/subcontractor-portal/jobs/${data.jobId}`,
      action_label: 'View Details'
    })
  },
  
  timesheet_reminder: {
    sms: (data: any) => `⏰ Don't forget to submit your timesheet for ${data.date}. ${data.hoursLogged || 0} hours logged so far.`,
    email: {
      subject: () => 'Timesheet Submission Reminder',
      html: (data: any) => `
        <h2>Timesheet Reminder</h2>
        <p>Please submit your timesheet for ${data.date}</p>
        <p>Hours logged: ${data.hoursLogged || 0}</p>
      `
    }
  },

  payout_ready: {
    sms: (data: any) => `💰 Your payout of $${data.amount} is ready! Expected deposit: ${data.depositDate}`,
    email: {
      subject: (data: any) => `Payout Ready - $${data.amount}`,
      html: (data: any) => `
        <h2>Your Payout is Ready!</h2>
        <p><strong>Amount:</strong> $${data.amount}</p>
        <p><strong>Period:</strong> ${data.periodStart} - ${data.periodEnd}</p>
        <p><strong>Expected Deposit:</strong> ${data.depositDate}</p>
      `
    }
  },

  booking_confirmed: {
    sms: (data: any) => `✅ Booking confirmed for ${data.date} at ${data.time}. Address: ${data.address}. Total: $${data.total}`,
    email: {
      subject: () => 'Booking Confirmation - Bay Area Cleaning Pros',
      html: (data: any) => `
        <h2>Booking Confirmed!</h2>
        <p>Thank you for choosing Bay Area Cleaning Pros!</p>
        <p><strong>Date:</strong> ${data.date}</p>
        <p><strong>Time:</strong> ${data.time}</p>
        <p><strong>Address:</strong> ${data.address}</p>
        <p><strong>Service:</strong> ${data.serviceType}</p>
        <p><strong>Total:</strong> $${data.total}</p>
      `
    }
  }
};

async function sendSMS(to: string, message: string, priority: string = 'normal'): Promise<any> {
  // Use Twilio for high priority, regular SMS for others
  const functionName = priority === 'urgent' || priority === 'high' 
    ? 'secure-sms-actions' 
    : 'send-sms-notification';
    
  return fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ to, message, priority })
  });
}

async function sendEmail(to: string, subject: string, html: string): Promise<any> {
  return resend.emails.send({
    from: 'Bay Area Cleaning Pros <notifications@bayareacleaningpros.com>',
    to: [to],
    subject,
    html
  });
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      userId, 
      channels, 
      template, 
      templateData, 
      priority = 'normal',
      secureAction,
      scheduledFor 
    }: CommunicationRequest = await req.json();

    // Get user contact information and preferences
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select(`
        *,
        customer_notification_preferences (*)
      `)
      .eq('user_id', userId)
      .single();

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ success: false, error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const results: Array<{ channel: string; success: boolean; result?: any; error?: string }> = [];

    // Process each communication channel
    for (const channel of channels) {
      try {
        let result: any;

        switch (channel) {
          case 'sms':
            if (userData.phone && templates[template]?.sms) {
              const message = templates[template].sms(templateData);
              
              if (secureAction) {
                // Send secure SMS with HMAC token
                result = await supabase.functions.invoke('secure-sms-actions', {
                  body: {
                    to: userData.phone,
                    action: secureAction.action,
                    userId,
                    resourceId: secureAction.resourceId,
                    templateData,
                    priority
                  }
                });
              } else {
                // Send regular SMS
                const response = await sendSMS(userData.phone, message, priority);
                result = await response.json();
              }
              
              results.push({ channel, success: true, result });
            } else {
              results.push({ channel, success: false, error: 'No phone number or template' });
            }
            break;

          case 'email':
            if (userData.email && templates[template]?.email) {
              const emailTemplate = templates[template].email;
              const subject = emailTemplate.subject(templateData);
              const html = emailTemplate.html(templateData);
              
              result = await sendEmail(userData.email, subject, html);
              results.push({ channel, success: !result.error, result });
            } else {
              results.push({ channel, success: false, error: 'No email or template' });
            }
            break;

          case 'in_app':
            if (templates[template]?.in_app) {
              const notificationData = templates[template].in_app(templateData);
              
              const { error } = await supabase
                .from('customer_notifications')
                .insert({
                  customer_id: userId,
                  title: notificationData.title,
                  message: notificationData.message,
                  notification_type: template,
                  action_url: notificationData.action_url,
                  action_label: notificationData.action_label,
                  importance: priority
                });
              
              results.push({ channel, success: !error, error: error?.message });
            } else {
              results.push({ channel, success: false, error: 'No in-app template' });
            }
            break;
        }

        // Log communication attempt
        await supabase
          .from('notification_deliveries')
          .insert({
            user_id: userId,
            delivery_method: channel,
            destination: channel === 'sms' ? userData.phone : userData.email,
            message_content: JSON.stringify(templateData),
            provider: channel === 'sms' ? 'twilio' : channel === 'email' ? 'resend' : 'in_app',
            status: results[results.length - 1].success ? 'sent' : 'failed',
            metadata: {
              template,
              priority,
              secure_action: !!secureAction,
              scheduled: !!scheduledFor
            }
          });

      } catch (error) {
        results.push({ channel, success: false, error: error.message });
      }
    }

    // Log communication hub usage
    await supabase
      .from('security_audit_log')
      .insert({
        user_id: userId,
        action_type: 'communication_sent',
        resource_type: 'notification',
        new_values: {
          template,
          channels,
          priority,
          secure_action: !!secureAction,
          results_summary: results.map(r => ({ channel: r.channel, success: r.success }))
        },
        risk_level: priority === 'urgent' ? 'medium' : 'low'
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Communications processed',
        results,
        summary: {
          total: results.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in enhanced-communication-hub:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});