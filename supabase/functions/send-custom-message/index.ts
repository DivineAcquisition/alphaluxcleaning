import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CustomMessageRequest {
  type: 'email' | 'sms';
  subject?: string;
  content: string;
  recipients: string[];
  scheduled_for?: string;
  send_immediately?: boolean;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const body: CustomMessageRequest = await req.json();

    if (body.send_immediately && body.type === 'email') {
      // Send emails immediately using Resend
      const emailPromises = body.recipients.map(async (recipient) => {
        try {
          const emailResponse = await resend.emails.send({
            from: 'AlphaLuxClean <noreply@info.alphaluxclean.com>',
            to: [recipient],
            subject: body.subject || 'Message from Bay Area Cleaning',
            html: `
              <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                <h2 style="color: #333; margin-bottom: 20px;">Message from Bay Area Cleaning Professionals</h2>
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  ${body.content.replace(/\n/g, '<br>')}
                </div>
                <p style="color: #666; font-size: 14px;">
                  Best regards,<br>
                  Bay Area Cleaning Professionals Team
                </p>
              </div>
            `,
          });

          // Log the execution
          await supabase.from('automation_executions').insert({
            automation_rule_id: null, // This is a manual message
            status: 'success',
            recipient_email: recipient,
            message_content: body.content,
            execution_data: { 
              type: 'custom_message', 
              subject: body.subject,
              resend_id: emailResponse.data?.id 
            }
          });

          return { recipient, status: 'sent', id: emailResponse.data?.id };
        } catch (error) {
          console.error(`Failed to send email to ${recipient}:`, error);
          
          // Log the failure
          await supabase.from('automation_executions').insert({
            automation_rule_id: null,
            status: 'failed',
            recipient_email: recipient,
            message_content: body.content,
            error_message: error.message,
            execution_data: { type: 'custom_message', subject: body.subject }
          });

          return { recipient, status: 'failed', error: error.message };
        }
      });

      const results = await Promise.all(emailPromises);
      const successCount = results.filter(r => r.status === 'sent').length;
      const failureCount = results.filter(r => r.status === 'failed').length;

      return new Response(JSON.stringify({
        success: true,
        results,
        summary: {
          total: body.recipients.length,
          sent: successCount,
          failed: failureCount
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      // Queue messages for later sending
      const messagePromises = body.recipients.map(async (recipient) => {
        const messageData = {
          recipient: recipient,
          type: body.type,
          subject: body.subject || 'Custom Message',
          message: body.content,
          status: 'queued',
          scheduled_for: body.scheduled_for ? new Date(body.scheduled_for) : new Date(),
          created_at: new Date().toISOString()
        };

        return supabase.from('messages').insert(messageData).select().single();
      });

      const results = await Promise.all(messagePromises);
      const successful = results.filter(r => !r.error);

      return new Response(JSON.stringify({
        success: true,
        queued: successful.length,
        total: body.recipients.length,
        messages: successful.map(r => r.data)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error: any) {
    console.error('Error in send-custom-message:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});