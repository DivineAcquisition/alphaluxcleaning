import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const ghlApiKey = Deno.env.get("GOHIGHLEVEL_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Test email confirmation function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { testEmail } = await req.json();
    console.log("Sending test email to:", testEmail);
    console.log("Using GoHighLevel API with key:", ghlApiKey ? "API key present" : "API key missing");

    // Create test email content that mimics the booking confirmation
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3B82F6, #6366F1); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🧪 Test Email - Order Confirmation</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Testing email delivery for Bay Area Cleaning Pros!</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #3B82F6; margin-top: 0;">Test Successful! 🎉</h2>
            <p style="margin: 15px 0; color: #64748b; line-height: 1.6;">
              This is a test email to verify that the booking confirmation email system is working correctly.
              Here's what a real booking confirmation would look like:
            </p>
          </div>

          <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #1e293b; margin-top: 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              📋 Sample Service Details
            </h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Service Type:</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">Deep Cleaning</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Frequency:</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">One-time</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Square Footage:</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">1,500 sq ft</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Add-ons:</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">Inside Oven, Inside Refrigerator</td>
              </tr>
              <tr style="border-top: 2px solid #e2e8f0;">
                <td style="padding: 15px 0 8px 0; color: #1e293b; font-weight: 700; font-size: 18px;">Total Amount:</td>
                <td style="padding: 15px 0 8px 0; color: #059669; font-weight: 700; font-size: 18px;">$299.00</td>
              </tr>
            </table>
          </div>

          <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #1e293b; margin-top: 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              📞 What Happens Next?
            </h3>
            <div style="color: #64748b; line-height: 1.6;">
              <p style="margin: 15px 0;"><strong>1. Service Details:</strong> Customer completes service details form with address and scheduling preferences.</p>
              <p style="margin: 15px 0;"><strong>2. Confirmation Call:</strong> Our team contacts the customer within 24 hours to confirm appointment.</p>
              <p style="margin: 15px 0;"><strong>3. Service Day:</strong> Professional cleaning team arrives with all necessary supplies.</p>
            </div>
          </div>

          <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #1e293b; margin-top: 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              📞 Contact Information
            </h3>
            <div style="color: #1e293b; margin: 15px 0;">
              <p style="margin: 5px 0;"><strong>📞 Phone:</strong> <a href="tel:+12812016112" style="color: #3B82F6;">(281) 201-6112</a></p>
              <p style="margin: 5px 0;"><strong>✉️ Email:</strong> <a href="mailto:support@bayareacleaningpros.com" style="color: #3B82F6;">support@bayareacleaningpros.com</a></p>
            </div>
          </div>

          <div style="background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 20px; border-radius: 8px; text-align: center;">
            <p style="margin: 0; font-size: 16px; font-weight: 500;">
              ✅ Email system is working correctly! This confirms that booking confirmation emails will be delivered.
            </p>
          </div>
        </div>
      </div>
    `;

    // Send test email using GoHighLevel API
    const emailResponse = await fetch('https://services.leadconnectorhq.com/emails/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ghlApiKey}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify({
        message: {
          from: "Bay Area Cleaning Pros <noreply@bayareacleaningpros.com>",
          to: testEmail,
          subject: "🧪 Test - Booking Confirmation Email System",
          html: emailContent
        }
      })
    });

    const responseData = await emailResponse.json();
    console.log("Test email sent successfully:", responseData);

    return new Response(JSON.stringify({ 
      success: true, 
      emailResponse: responseData,
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
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);