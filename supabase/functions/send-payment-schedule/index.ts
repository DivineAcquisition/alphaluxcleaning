import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentScheduleRequest {
  bookingId: string;
  customerEmail: string;
  customerName: string;
  offerType: string;
  totalPrice: number;
  depositAmount: number;
  firstCleanBalance: number;
  monthlyPayment: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      customerEmail,
      customerName,
      offerType,
      totalPrice,
      depositAmount,
      firstCleanBalance,
      monthlyPayment,
    }: PaymentScheduleRequest = await req.json();

    console.log("Sending payment schedule email to:", customerEmail);

    let emailHtml = "";
    let subject = "";

    if (offerType === "90_day_plan") {
      // 90-Day Plan Payment Schedule
      subject = "Your 90-Day Clean Plan Payment Schedule";
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
            .schedule-box { background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .schedule-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
            .schedule-item:last-child { border-bottom: none; }
            .schedule-label { font-weight: 600; color: #374151; }
            .schedule-amount { font-weight: 700; color: #1e3a8a; font-size: 18px; }
            .total-box { background: #eff6ff; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
            .total-amount { font-size: 32px; font-weight: 800; color: #1e3a8a; }
            .savings { color: #059669; font-weight: 600; font-size: 16px; }
            .checklist { margin: 20px 0; }
            .checklist-item { padding: 8px 0; display: flex; align-items: start; }
            .checklist-icon { color: #059669; margin-right: 8px; font-size: 20px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            .button { display: inline-block; background: #1e3a8a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            h1 { margin: 0; font-size: 28px; }
            h2 { color: #1e3a8a; font-size: 20px; margin-top: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Your 90-Day Clean Plan!</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Hi ${customerName}, your booking is confirmed!</p>
            </div>
            
            <div class="content">
              <h2>Your Payment Schedule</h2>
              <p>Here's a clear breakdown of when each payment is due:</p>
              
              <div class="schedule-box">
                <div class="schedule-item">
                  <span class="schedule-label">💳 Today (Starter Deposit)</span>
                  <span class="schedule-amount">$${depositAmount.toFixed(2)}</span>
                </div>
                <div class="schedule-item">
                  <span class="schedule-label">🧹 After 1st Service (Complete First Clean)</span>
                  <span class="schedule-amount">$${firstCleanBalance.toFixed(2)}</span>
                </div>
                <div class="schedule-item">
                  <span class="schedule-label">📅 Monthly Payment (3 months)</span>
                  <span class="schedule-amount">$${monthlyPayment.toFixed(2)}/month</span>
                </div>
              </div>

              <div class="total-box">
                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">TOTAL SERVICE COST (OVER 3 MONTHS)</p>
                <div class="total-amount">$${totalPrice.toFixed(2)}</div>
                <p class="savings" style="margin: 10px 0 0 0;">✨ Bundled savings included!</p>
              </div>

              <h2>What's Included in Your Plan</h2>
              <div class="checklist">
                <div class="checklist-item">
                  <span class="checklist-icon">✓</span>
                  <span><strong>First Deep Clean:</strong> Complete 40-point deep cleaning service</span>
                </div>
                <div class="checklist-item">
                  <span class="checklist-icon">✓</span>
                  <span><strong>3 Monthly Maintenance Cleans:</strong> Keep your home consistently spotless</span>
                </div>
                <div class="checklist-item">
                  <span class="checklist-icon">✓</span>
                  <span><strong>Flexible Scheduling:</strong> Book at times that work for you</span>
                </div>
                <div class="checklist-item">
                  <span class="checklist-icon">✓</span>
                  <span><strong>Consistent Team:</strong> Same professionals who know your home</span>
                </div>
                <div class="checklist-item">
                  <span class="checklist-icon">✓</span>
                  <span><strong>100% Satisfaction Guarantee:</strong> We'll make it right if anything isn't perfect</span>
                </div>
              </div>

              <h2>Next Steps</h2>
              <ol style="line-height: 2;">
                <li>We'll contact you within 24 hours to schedule your first deep clean</li>
                <li>Complete your first service and pay the remaining balance</li>
                <li>Enjoy 3 months of consistently clean spaces</li>
              </ol>

              <div style="text-align: center;">
                <a href="https://app.alphaluxclean.com" class="button">View Your Booking Details</a>
              </div>

              <p style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <strong>💡 Pro Tip:</strong> We'll send you reminder emails before each payment is due, so you'll never be surprised!
              </p>

              <h2>Questions?</h2>
              <p>We're here to help! Contact us anytime:</p>
              <ul style="list-style: none; padding: 0;">
                <li>📞 Call or Text: <strong>972-559-0223</strong></li>
                <li>📧 Email: <strong>support@alphaluxclean.com</strong></li>
              </ul>
            </div>

            <div class="footer">
              <p><strong>AlphaLux Clean</strong></p>
              <p>Professional cleaning services you can trust</p>
              <p style="font-size: 12px; margin-top: 20px;">
                This is an automated email. Please do not reply directly to this message.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      // Standard or Deep Clean Payment Schedule
      subject = "Your Cleaning Service Payment Confirmation";
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
            .payment-box { background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .payment-item { display: flex; justify-content: space-between; padding: 12px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            h1 { margin: 0; font-size: 28px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✨ Booking Confirmed!</h1>
              <p style="margin: 10px 0 0 0;">Hi ${customerName}, we're excited to clean your space!</p>
            </div>
            
            <div class="content">
              <h2 style="color: #1e3a8a;">Payment Summary</h2>
              
              <div class="payment-box">
                <div class="payment-item">
                  <span><strong>Deposit Paid Today:</strong></span>
                  <span style="font-weight: 700; color: #1e3a8a; font-size: 20px;">$${depositAmount.toFixed(2)}</span>
                </div>
                <div class="payment-item" style="border-top: 1px solid #e5e7eb; margin-top: 10px; padding-top: 15px;">
                  <span><strong>Remaining Balance (Due After Service):</strong></span>
                  <span style="font-weight: 700; color: #059669; font-size: 20px;">$${(totalPrice - depositAmount).toFixed(2)}</span>
                </div>
              </div>

              <p style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <strong>📌 Important:</strong> The remaining balance will be charged after your service is completed to your satisfaction.
              </p>

              <h2 style="color: #1e3a8a;">Next Steps</h2>
              <ol style="line-height: 2;">
                <li>We'll contact you within 24 hours to confirm your service date and time</li>
                <li>Our professional team will arrive and complete your cleaning</li>
                <li>The remaining balance will be automatically charged after service</li>
              </ol>

              <h2 style="color: #1e3a8a;">Questions?</h2>
              <p>Contact us anytime:</p>
              <ul style="list-style: none; padding: 0;">
                <li>📞 <strong>972-559-0223</strong></li>
                <li>📧 <strong>support@alphaluxclean.com</strong></li>
              </ul>
            </div>

            <div class="footer">
              <p><strong>AlphaLux Clean</strong></p>
              <p>Professional cleaning services you can trust</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "AlphaLux Clean <onboarding@resend.dev>",
      to: [customerEmail],
      subject: subject,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-payment-schedule function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
