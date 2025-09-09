import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AssignmentInviteRequest {
  booking_id: string;
  subcontractor_id: string;
  company_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { booking_id, subcontractor_id, company_id }: AssignmentInviteRequest = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get booking details
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*, services(name, description)')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    // Get subcontractor details
    const { data: subcontractor, error: subError } = await supabaseClient
      .from('subcontractors')
      .select('*')
      .eq('id', subcontractor_id)
      .single();

    if (subError || !subcontractor) {
      throw new Error('Subcontractor not found');
    }

    // Generate assignment token
    const token = crypto.randomUUID();
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const { error: tokenError } = await supabaseClient
      .from('assignment_tokens')
      .insert({
        booking_id,
        subcontractor_id,
        token,
        expires_at: expires_at.toISOString()
      });

    if (tokenError) {
      throw new Error('Failed to create assignment token');
    }

    // Create invite links
    const acceptUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/assignment-response?token=${token}&action=accept`;
    const declineUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/assignment-response?token=${token}&action=decline`;

    // Calculate estimated payout
    let payoutInfo = { amount: 0, mode: 'percent_of_quote' };
    if (booking.service_id) {
      const { data: payoutCalc } = await supabaseClient
        .rpc('compute_payout', {
          p_service_id: booking.service_id,
          p_quote_total: booking.estimated_duration || 120,
          p_sqft: booking.entered_sqft || 0
        });
      
      if (payoutCalc && !payoutCalc.error) {
        payoutInfo = payoutCalc;
      }
    }

    // Send assignment email
    const emailResponse = await resend.emails.send({
      from: "Bay Area Cleaning Pros <noreply@bayareacleaningpros.com>",
      to: [subcontractor.email],
      subject: `New Job Assignment - ${booking.service_date}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Job Assignment</title>
            <style>
              body { font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
              .header { background: linear-gradient(135deg, #A58FFF 0%, #6600FF 100%); color: white; padding: 32px; text-align: center; }
              .content { padding: 32px; }
              .job-details { background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; }
              .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
              .detail-label { font-weight: 600; color: #64748b; }
              .detail-value { color: #1e293b; }
              .cta-buttons { text-align: center; margin: 32px 0; }
              .btn { display: inline-block; padding: 14px 28px; margin: 0 8px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; }
              .btn-accept { background: #22c55e; color: white; }
              .btn-decline { background: #ef4444; color: white; }
              .btn:hover { opacity: 0.9; }
              .footer { text-align: center; padding: 20px; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">🧹 New Job Assignment</h1>
                <p style="margin: 8px 0 0; opacity: 0.9; font-size: 16px;">You have a new cleaning job opportunity</p>
              </div>
              
              <div class="content">
                <p style="font-size: 16px; color: #334155; margin-bottom: 24px;">
                  Hi ${subcontractor.full_name},
                </p>
                
                <p style="font-size: 16px; color: #334155; line-height: 1.6;">
                  You've been assigned a new cleaning job. Please review the details below and respond within 24 hours.
                </p>
                
                <div class="job-details">
                  <h3 style="margin: 0 0 16px; color: #1e293b; font-size: 18px;">📋 Job Details</h3>
                  <div class="detail-row">
                    <span class="detail-label">Date:</span>
                    <span class="detail-value">${new Date(booking.service_date).toLocaleDateString()}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Time:</span>
                    <span class="detail-value">${booking.service_time || 'TBD'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Address:</span>
                    <span class="detail-value">${booking.service_address}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Service:</span>
                    <span class="detail-value">${booking.services?.name || 'Standard Cleaning'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Duration:</span>
                    <span class="detail-value">${booking.estimated_duration || 120} minutes</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Estimated Payout:</span>
                    <span class="detail-value" style="font-weight: 700; color: #059669;">$${payoutInfo.amount?.toFixed(2) || '0.00'}</span>
                  </div>
                  ${booking.special_instructions ? `
                    <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                      <span class="detail-label">Special Instructions:</span>
                      <p style="margin: 8px 0 0; color: #1e293b; font-style: italic;">${booking.special_instructions}</p>
                    </div>
                  ` : ''}
                </div>
                
                <div class="cta-buttons">
                  <a href="${acceptUrl}" class="btn btn-accept">✅ Accept Job</a>
                  <a href="${declineUrl}" class="btn btn-decline">❌ Decline</a>
                </div>
                
                <p style="font-size: 14px; color: #64748b; line-height: 1.5; margin-top: 24px;">
                  <strong>Important:</strong> This invitation expires in 24 hours. If you don't respond, the job will be offered to another cleaner.
                </p>
              </div>
              
              <div class="footer">
                <p style="margin: 0;">Bay Area Cleaning Professionals</p>
                <p style="margin: 4px 0 0; font-size: 12px;">Professional cleaning services you can trust</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Assignment invite sent:", emailResponse);

    // Update booking with assignment
    await supabaseClient
      .from('bookings')
      .update({
        assigned_employee_id: subcontractor_id,
        status: 'assigned'
      })
      .eq('id', booking_id);

    return new Response(JSON.stringify({
      success: true,
      message: "Assignment invite sent successfully",
      token,
      email_id: emailResponse.data?.id
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-assignment-invite:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to send assignment invite"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);