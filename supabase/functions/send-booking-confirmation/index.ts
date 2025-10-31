import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, data?: any) => {
  console.log(`[SEND-BOOKING-CONFIRMATION] ${step}`, data || "");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting booking confirmation email");

    const { bookingId } = await req.json();

    if (!bookingId) {
      throw new Error("Booking ID is required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Fetch booking with customer details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        *,
        customer:customers (
          id,
          email,
          name,
          first_name,
          last_name,
          phone,
          address_line1,
          address_line2,
          city,
          state,
          postal_code
        )
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error(`Failed to fetch booking: ${bookingError?.message}`);
    }

    logStep("Booking data fetched", { bookingId, customerEmail: booking.customer.email });

    const serviceTypeLabels: Record<string, string> = {
      regular: "Standard Cleaning",
      deep: "Deep Cleaning",
      move_in_out: "Move-In/Out Cleaning",
    };

    const frequencyLabels: Record<string, string> = {
      one_time: "One-Time",
      weekly: "Weekly",
      bi_weekly: "Bi-Weekly",
      monthly: "Monthly",
    };

    const serviceDate = new Date(booking.service_date);
    const formattedDate = serviceDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Construct customer email HTML
    const customerEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .booking-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-row:last-child { border-bottom: none; }
          .label { font-weight: 600; color: #6b7280; }
          .value { color: #111827; }
          .highlight { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🎉 Booking Confirmed!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Order #${booking.id.slice(0, 8).toUpperCase()}</p>
          </div>
          
          <div class="content">
            <p style="font-size: 18px; margin-top: 0;">Hi ${booking.customer.first_name || booking.customer.name}!</p>
            <p>Great news! Your AlphaLux Clean booking is confirmed and locked in. We can't wait to make your home sparkle! ✨</p>
            
            <div class="booking-card">
              <h2 style="margin-top: 0; color: #667eea;">📅 Service Details</h2>
              <div class="detail-row">
                <span class="label">Service Type:</span>
                <span class="value">${serviceTypeLabels[booking.service_type] || booking.service_type}</span>
              </div>
              <div class="detail-row">
                <span class="label">Frequency:</span>
                <span class="value">${frequencyLabels[booking.frequency] || booking.frequency}</span>
              </div>
              <div class="detail-row">
                <span class="label">Date:</span>
                <span class="value">${formattedDate}</span>
              </div>
              <div class="detail-row">
                <span class="label">Time:</span>
                <span class="value">${booking.time_slot}</span>
              </div>
              <div class="detail-row">
                <span class="label">Address:</span>
                <span class="value">${booking.customer.address_line1}${booking.customer.address_line2 ? `, ${booking.customer.address_line2}` : ""}<br>${booking.customer.city}, ${booking.customer.state} ${booking.customer.postal_code}</span>
              </div>
            </div>

            <div class="booking-card">
              <h2 style="margin-top: 0; color: #667eea;">💰 Payment Summary</h2>
              <div class="detail-row">
                <span class="label">Estimated Total:</span>
                <span class="value" style="font-size: 18px; font-weight: 600;">$${booking.est_price.toFixed(2)}</span>
              </div>
              <div class="detail-row">
                <span class="label">Deposit Paid:</span>
                <span class="value" style="color: #10b981;">$${booking.deposit_amount.toFixed(2)}</span>
              </div>
              <div class="detail-row">
                <span class="label">Balance Due After Service:</span>
                <span class="value">$${(booking.est_price - booking.deposit_amount).toFixed(2)}</span>
              </div>
            </div>

            <div class="highlight">
              <strong>📱 What's Next?</strong>
              <ul style="margin: 10px 0;">
                <li>We'll send a reminder 24 hours before your service</li>
                <li>Our team will arrive within your scheduled time slot</li>
                <li>Remaining balance will be charged after completion</li>
              </ul>
            </div>

            <p style="text-align: center;">
              <a href="tel:9725590223" class="button">📞 Call Us: (972) 559-0223</a>
            </p>

            ${booking.special_instructions ? `
              <div class="booking-card">
                <h3 style="margin-top: 0; color: #667eea;">📝 Your Special Instructions</h3>
                <p style="margin: 0;">${booking.special_instructions}</p>
              </div>
            ` : ''}

            <p>Have questions? Just reply to this email or call us anytime!</p>
            <p>Thanks for choosing AlphaLux Clean! 💎</p>
          </div>
          
          <div class="footer">
            <p>AlphaLux Clean | Professional Cleaning Services</p>
            <p>(972) 559-0223 | info@alphaluxclean.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send customer confirmation email
    logStep("Sending customer confirmation email");
    const customerEmailResponse = await resend.emails.send({
      from: "AlphaLux Clean <noreply@info.alphaluxclean.com>",
      to: [booking.customer.email],
      subject: `✅ Booking Confirmed - ${formattedDate}`,
      html: customerEmailHtml,
    });

    logStep("Customer email sent", { messageId: customerEmailResponse.data?.id });

    // Send admin notification email
    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: monospace; background: #1a1a1a; color: #00ff00; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #0a0a0a; padding: 20px; border: 2px solid #00ff00; border-radius: 8px; }
          h1 { color: #00ff00; border-bottom: 2px solid #00ff00; padding-bottom: 10px; }
          .info { margin: 10px 0; padding: 10px; background: #1a1a1a; border-left: 4px solid #00ff00; }
          .label { color: #00aa00; font-weight: bold; }
          .value { color: #00ff00; }
          .alert { background: #ff6600; color: white; padding: 10px; margin: 15px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🔔 NEW BOOKING ALERT</h1>
          <div class="alert">Order #${booking.id.slice(0, 8).toUpperCase()}</div>
          
          <div class="info">
            <span class="label">CUSTOMER:</span> <span class="value">${booking.customer.name}</span><br>
            <span class="label">EMAIL:</span> <span class="value">${booking.customer.email}</span><br>
            <span class="label">PHONE:</span> <span class="value">${booking.customer.phone}</span>
          </div>
          
          <div class="info">
            <span class="label">SERVICE:</span> <span class="value">${serviceTypeLabels[booking.service_type]}</span><br>
            <span class="label">FREQUENCY:</span> <span class="value">${frequencyLabels[booking.frequency]}</span><br>
            <span class="label">DATE:</span> <span class="value">${formattedDate}</span><br>
            <span class="label">TIME:</span> <span class="value">${booking.time_slot}</span>
          </div>
          
          <div class="info">
            <span class="label">ADDRESS:</span><br>
            <span class="value">
              ${booking.customer.address_line1}<br>
              ${booking.customer.address_line2 ? `${booking.customer.address_line2}<br>` : ''}
              ${booking.customer.city}, ${booking.customer.state} ${booking.customer.postal_code}
            </span>
          </div>
          
          <div class="info">
            <span class="label">TOTAL:</span> <span class="value">$${booking.est_price.toFixed(2)}</span><br>
            <span class="label">DEPOSIT:</span> <span class="value">$${booking.deposit_amount.toFixed(2)}</span><br>
            <span class="label">BALANCE:</span> <span class="value">$${(booking.est_price - booking.deposit_amount).toFixed(2)}</span>
          </div>
          
          ${booking.special_instructions ? `
            <div class="info">
              <span class="label">SPECIAL INSTRUCTIONS:</span><br>
              <span class="value">${booking.special_instructions}</span>
            </div>
          ` : ''}
          
          <div class="info">
            <span class="label">BOOKING ID:</span> <span class="value">${booking.id}</span><br>
            <span class="label">SQUARE PAYMENT:</span> <span class="value">${booking.square_payment_id || 'N/A'}</span>
          </div>
        </div>
      </body>
      </html>
    `;

    logStep("Sending admin notification email");
    const adminEmailResponse = await resend.emails.send({
      from: "AlphaLux Bookings <noreply@info.alphaluxclean.com>",
      to: ["bookings@alphaluxclean.com"], // Admin email
      subject: `🔔 NEW BOOKING: ${serviceTypeLabels[booking.service_type]} - ${formattedDate}`,
      html: adminEmailHtml,
    });

    logStep("Admin email sent", { messageId: adminEmailResponse.data?.id });

    return new Response(
      JSON.stringify({
        success: true,
        customerEmailSent: !!customerEmailResponse.data?.id,
        adminEmailSent: !!adminEmailResponse.data?.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    logStep("ERROR", error.message);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to send confirmation emails",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
