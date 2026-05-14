import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";
import {
  getInternalFromAddress,
  getInternalRecipients,
} from "../_shared/internal-recipients.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdminJobNotificationRequest {
  booking_id: string;
  order_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { booking_id, order_id }: AdminJobNotificationRequest = await req.json();
    
    if (!booking_id && !order_id) {
      return new Response(
        JSON.stringify({ error: "booking_id or order_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch booking details
    let booking;
    if (booking_id) {
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', booking_id)
        .single();

      if (bookingError || !bookingData) {
        console.error('Error fetching booking:', bookingError);
        return new Response(
          JSON.stringify({ error: "Booking not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      booking = bookingData;
    } else {
      // Fetch from orders table if order_id provided
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', order_id)
        .single();

      if (orderError || !orderData) {
        console.error('Error fetching order:', orderError);
        return new Response(
          JSON.stringify({ error: "Order not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      booking = orderData;
    }

    // Use the canonical internal recipient list (info@alphaluxclean.com
    // + info@alphaluxcleaning.com by default) rather than the previous
    // hard-coded mix of a personal gmail and the deprecated admin1@
    // mailbox — those addresses no longer route to anyone monitoring
    // the funnel.
    const adminEmails = getInternalRecipients();
    const assignmentUrl = `https://yltvknkqnzdeiqckqjha.supabase.co/functions/v1/job-assignments?highlight=${booking_id || order_id}`;

    // Branded HTML — matches the customer confirmation email family
    // (AlphaLux blue → navy gradient, white content cards on the
    // #F8F8F7 body, alx blue accents). Same vocabulary as
    // booking-admin-notification.tsx so all internal emails feel like
    // they're from the same brand.
    const emailHTML = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #F8F8F7; max-width: 640px; margin: 0 auto; padding: 20px 16px;">
        <div style="background: linear-gradient(135deg, #0F77CC 0%, #1B314B 100%); padding: 28px 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.01em;">🔔 New Job Assignment Required</h1>
          <p style="color: #EFF7FE; margin: 8px 0 0 0; font-size: 13px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;">AlphaLux Ops</p>
        </div>
        <div style="background: #ffffff; padding: 4px 20px; border-radius: 0 0 8px 8px;">
        
          <div style="background: #f9fafb; padding: 18px 20px; border-radius: 8px; margin: 18px 0; border: 1px solid #e5e7eb;">
            <h2 style="color: #0F77CC; margin: 0 0 12px 0; font-size: 14px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;">Job Details</h2>
            <p style="margin: 0 0 8px 0; color: #1B314B; font-size: 14px;"><span style="color: #6b7280; font-weight: 500; display: inline-block; min-width: 130px;">Customer:</span> <strong>${booking.customer_name || 'N/A'}</strong></p>
            <p style="margin: 0 0 8px 0; color: #1B314B; font-size: 14px;"><span style="color: #6b7280; font-weight: 500; display: inline-block; min-width: 130px;">Service Date:</span> ${booking.service_date || booking.scheduled_date || 'TBD'}</p>
            <p style="margin: 0 0 8px 0; color: #1B314B; font-size: 14px;"><span style="color: #6b7280; font-weight: 500; display: inline-block; min-width: 130px;">Service Time:</span> ${booking.service_time || booking.scheduled_time || 'TBD'}</p>
            <p style="margin: 0 0 8px 0; color: #1B314B; font-size: 14px;"><span style="color: #6b7280; font-weight: 500; display: inline-block; min-width: 130px;">Address:</span> ${booking.service_address || booking.customer_address || 'Address not provided'}</p>
            <p style="margin: 0 0 8px 0; color: #1B314B; font-size: 14px;"><span style="color: #6b7280; font-weight: 500; display: inline-block; min-width: 130px;">Phone:</span> ${booking.customer_phone || 'Not provided'}</p>
            <p style="margin: 0 0 8px 0; color: #1B314B; font-size: 14px;"><span style="color: #6b7280; font-weight: 500; display: inline-block; min-width: 130px;">Email:</span> ${booking.customer_email || 'Not provided'}</p>
            ${booking.cleaning_type ? `<p style="margin: 0 0 8px 0; color: #1B314B; font-size: 14px;"><span style="color: #6b7280; font-weight: 500; display: inline-block; min-width: 130px;">Service Type:</span> ${booking.cleaning_type.replace(/_/g, ' ')}</p>` : ''}
            ${booking.amount ? `<p style="margin: 0 0 8px 0; color: #1B314B; font-size: 14px;"><span style="color: #6b7280; font-weight: 500; display: inline-block; min-width: 130px;">Amount:</span> <strong style="color: #0F77CC;">$${(booking.amount / 100).toFixed(2)}</strong></p>` : ''}
            ${booking.special_instructions ? `<p style="margin: 12px 0 0 0; color: #1B314B; font-size: 13px; padding-top: 12px; border-top: 1px solid #e5e7eb; white-space: pre-wrap;"><span style="color: #6b7280; font-weight: 500;">Special Instructions:</span><br/>${booking.special_instructions}</p>` : ''}
          </div>

          <div style="text-align: center; margin: 24px 0 8px 0;">
            <a href="${assignmentUrl}" style="background: #0F77CC; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 14px;">
              Assign Cleaner Now
            </a>
          </div>

          <div style="background: #EFF7FE; border-left: 4px solid #0F77CC; padding: 14px 16px; border-radius: 8px; margin: 18px 0;">
            <p style="margin: 0; color: #0C5FA6; font-size: 13px;">
              <strong>Action required:</strong> This job needs to be assigned to up to 3 cleaners. Please review and assign as soon as possible.
            </p>
          </div>
        </div>

        <div style="text-align: center; padding: 18px 16px;">
          <p style="color: #6b7280; font-size: 12px; margin: 0; font-weight: 600;">AlphaLux Clean — Internal Job Notification</p>
          <p style="color: #9ca3af; font-size: 11px; margin: 4px 0 0 0;">Sent to internal ops mailboxes only · do not forward.</p>
        </div>
      </div>
    `;

    // Single Resend send with all internal recipients in `to`. Both
    // info@ mailboxes are ops, so they can see each other in the
    // header — no need to send separately or BCC.
    const emailPromises = [
      resend.emails.send({
        from: getInternalFromAddress(),
        to: adminEmails,
        subject: `🔔 Job Assignment Required — ${booking.customer_name || 'New booking'}`,
        html: emailHTML,
      }),
    ];

    const emailResults = await Promise.allSettled(emailPromises);
    
    // Log any email failures but don't fail the request
    emailResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Failed to send email to ${adminEmails[index]}:`, result.reason);
      }
    });

    console.log("Admin job notification emails sent successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Admin job notification emails sent",
        emails_sent: adminEmails.length
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-admin-job-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);