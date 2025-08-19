import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

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

    const adminEmails = ["elliepangilinan17@gmail.com", "admin1@bayareacleaningpros.com"];
    const assignmentUrl = `https://kqoezqzogleaaupjzxch.supabase.co/job-assignments?highlight=${booking_id || order_id}`;

    const emailHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🔔 New Job Assignment Required</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #1f2937; margin-top: 0;">Job Details</h2>
          <p><strong>Customer:</strong> ${booking.customer_name || 'N/A'}</p>
          <p><strong>Service Date:</strong> ${booking.service_date || booking.scheduled_date || 'TBD'}</p>
          <p><strong>Service Time:</strong> ${booking.service_time || booking.scheduled_time || 'TBD'}</p>
          <p><strong>Address:</strong> ${booking.service_address || booking.customer_address || 'Address not provided'}</p>
          <p><strong>Phone:</strong> ${booking.customer_phone || 'Not provided'}</p>
          <p><strong>Email:</strong> ${booking.customer_email || 'Not provided'}</p>
          ${booking.special_instructions ? `<p><strong>Special Instructions:</strong> ${booking.special_instructions}</p>` : ''}
          ${booking.cleaning_type ? `<p><strong>Service Type:</strong> ${booking.cleaning_type.replace(/_/g, ' ')}</p>` : ''}
          ${booking.amount ? `<p><strong>Amount:</strong> $${(booking.amount / 100).toFixed(2)}</p>` : ''}
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${assignmentUrl}" 
             style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; 
                    border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
            🎯 Assign Cleaner Now
          </a>
        </div>

        <div style="background: #fffbeb; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px;">
          <p style="margin: 0; color: #92400e;">
            <strong>⚡ Action Required:</strong> This job needs to be assigned to up to 3 cleaners. 
            Please review and assign as soon as possible to ensure customer satisfaction.
          </p>
        </div>

        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
          <p>Bay Area Cleaning Pros - Job Management System</p>
        </div>
      </div>
    `;

    // Send emails to both admin addresses
    const emailPromises = adminEmails.map(email => 
      resend.emails.send({
        from: "Bay Area Cleaning Pros <admin@bayareacleaningpros.com>",
        to: [email],
        subject: `🔔 Job Assignment Required - ${booking.customer_name}`,
        html: emailHTML
      })
    );

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