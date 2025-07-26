import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("✨ Test email confirmation function called");
  console.log("📧 Request method:", req.method);
  console.log("🔍 Request headers:", Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { testEmail } = await req.json();
    console.log("📤 Sending test email to:", testEmail);
    
    // Generate a sample order ID for the test
    const sampleOrderId = `ORDER-${Date.now().toString().slice(-6)}`;

    // Create branded email content with app colors
    const emailContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <!-- Header with App Branding -->
        <div style="background: linear-gradient(135deg, #8B00FF, #A855F7); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; box-shadow: 0 4px 20px rgba(139, 0, 255, 0.15);">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🏠 Bay Area Cleaning Pros</h1>
          <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.95;">Your Booking Confirmation</p>
        </div>
        
        <!-- Main Content -->
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
          
          <!-- Success Message -->
          <div style="background: linear-gradient(135deg, #F8F4FF, #F3E8FF); border: 1px solid #E9D5FF; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
            <h2 style="color: #8B00FF; margin: 0 0 8px 0; font-size: 20px; font-weight: 600;">✅ Booking Confirmed!</h2>
            <p style="margin: 0; color: #6B46C1; line-height: 1.5; font-size: 14px;">
              Thank you for choosing Bay Area Cleaning Pros. Your service has been scheduled and confirmed.
            </p>
          </div>

          <!-- Order Details -->
          <div style="border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
            <div style="background: #F9FAFB; padding: 16px; border-bottom: 1px solid #E5E7EB;">
              <h3 style="margin: 0; color: #111827; font-size: 16px; font-weight: 600;">📋 Service Details</h3>
            </div>
            <div style="padding: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6B7280; font-weight: 500; width: 40%;">Order ID:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 600;">${sampleOrderId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6B7280; font-weight: 500;">Service Type:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 600;">Deep Cleaning</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6B7280; font-weight: 500;">Frequency:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 600;">One-time</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6B7280; font-weight: 500;">Square Footage:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 600;">1,500 sq ft</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6B7280; font-weight: 500;">Scheduled Date:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 600;">${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                </tr>
                <tr style="border-top: 2px solid #E5E7EB;">
                  <td style="padding: 16px 0 8px 0; color: #111827; font-weight: 700; font-size: 18px;">Total Amount:</td>
                  <td style="padding: 16px 0 8px 0; color: #059669; font-weight: 700; font-size: 18px;">$299.00</td>
                </tr>
              </table>
            </div>
          </div>

          <!-- Order Status Button -->
          <div style="text-align: center; margin: 24px 0;">
            <a href="https://fc9bf4c2-5143-4270-83ec-c7de4b1ed612.lovableproject.com/order-status?id=${sampleOrderId}" 
               style="display: inline-block; background: linear-gradient(135deg, #8B00FF, #A855F7); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; box-shadow: 0 4px 12px rgba(139, 0, 255, 0.25);">
              📊 Check Order Status
            </a>
          </div>

          <!-- Test Status -->
          <div style="background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-top: 24px;">
            <p style="margin: 0; font-size: 16px; font-weight: 500;">
              🧪 This is a test email - Email system is working correctly!
            </p>
          </div>

          <!-- Footer -->
          <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #E5E7EB; text-align: center;">
            <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px;">
              Questions about your service? Contact us anytime.
            </p>
            <p style="margin: 0; color: #8B00FF; font-size: 14px; font-weight: 600;">
              Bay Area Cleaning Pros - Professional & Reliable
            </p>
          </div>
        </div>
      </div>
    `;

    // Send test email using Resend
    const emailResponse = await resend.emails.send({
      from: "Bay Area Cleaning Pros <noreply@notify.bayareacleaningpros.com>",
      to: [testEmail],
      subject: "🧪 Test - Booking Confirmation Email System",
      html: emailContent,
    });

    console.log("✅ Test email sent successfully:", emailResponse);
    console.log("📊 Sample Order ID generated:", sampleOrderId);

    return new Response(JSON.stringify({ 
      success: true, 
      emailResponse,
      message: `Test confirmation email sent successfully to ${testEmail}`
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in test-email-confirmation function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        stack: error.stack
      }),
      {
        status: 200, // Return 200 to avoid function errors
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);