import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderConfirmationRequest {
  orderId?: string;
  sessionId?: string;
  customerEmail?: string;
  customerName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Send order confirmation function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, sessionId, customerEmail, customerName }: OrderConfirmationRequest = await req.json();
    console.log("Request data:", { orderId, sessionId, customerEmail, customerName });

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get order details from database
    let orderQuery = supabaseClient.from("orders").select("*");
    
    if (orderId) {
      orderQuery = orderQuery.eq("id", orderId);
    } else if (sessionId) {
      orderQuery = orderQuery.eq("stripe_session_id", sessionId);
    } else {
      throw new Error("Either orderId or sessionId must be provided");
    }
    
    const { data: order, error: orderError } = await orderQuery.single();
    
    if (orderError || !order) {
      console.error("Order not found:", orderError);
      throw new Error("Order not found");
    }

    console.log("Order found:", order.id);

    // Use customer info from request or fallback to order data
    const email = customerEmail || order.customer_email;
    const name = customerName || order.customer_name || "Valued Customer";

    if (!email) {
      throw new Error("Customer email not available");
    }

    // Format service details
    const serviceDetails = order.service_details || {};
    const cleaningType = order.cleaning_type?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || "Standard Cleaning";
    const frequency = order.frequency?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || "One-time";
    const amount = (order.amount / 100).toFixed(2); // Convert from cents
    const addOns = order.add_ons?.join(", ") || "None";

    // Create email content
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3B82F6, #6366F1); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Order Confirmation</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Thank you for choosing Bay Area Cleaning Pros!</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #3B82F6; margin-top: 0;">Hello ${name}!</h2>
            <p style="margin: 15px 0; color: #64748b; line-height: 1.6;">
              We've received your order and we're excited to provide you with exceptional cleaning service. 
              Here are the details of your booking:
            </p>
          </div>

          <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #1e293b; margin-top: 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              📋 Service Details
            </h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Service Type:</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">${cleaningType}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Frequency:</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">${frequency}</td>
              </tr>
              ${order.square_footage ? `
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Square Footage:</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">${order.square_footage} sq ft</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Add-ons:</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">${addOns}</td>
              </tr>
              <tr style="border-top: 2px solid #e2e8f0;">
                <td style="padding: 15px 0 8px 0; color: #1e293b; font-weight: 700; font-size: 18px;">Total Amount:</td>
                <td style="padding: 15px 0 8px 0; color: #059669; font-weight: 700; font-size: 18px;">$${amount}</td>
              </tr>
            </table>
          </div>

          <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #1e293b; margin-top: 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              📞 What Happens Next?
            </h3>
            <div style="color: #64748b; line-height: 1.6;">
              <p style="margin: 15px 0;"><strong>1. Service Details:</strong> Please complete your service details at <a href="${req.headers.get("origin")}/service-details?session_id=${order.stripe_session_id}" style="color: #3B82F6;">this link</a> to provide your address and scheduling preferences.</p>
              <p style="margin: 15px 0;"><strong>2. Confirmation Call:</strong> Our team will contact you within 24 hours to confirm your appointment and discuss any special requirements.</p>
              <p style="margin: 15px 0;"><strong>3. Service Day:</strong> Our professional cleaning team will arrive at your scheduled time with all necessary supplies and equipment.</p>
            </div>
          </div>

          <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #1e293b; margin-top: 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              📞 Contact Information
            </h3>
            <p style="margin: 15px 0; color: #64748b; line-height: 1.6;">
              If you have any questions or need to make changes to your booking, please don't hesitate to contact us:
            </p>
            <div style="color: #1e293b; margin: 15px 0;">
              <p style="margin: 5px 0;"><strong>📞 Phone:</strong> <a href="tel:+14159876543" style="color: #3B82F6;">(415) 987-6543</a></p>
              <p style="margin: 5px 0;"><strong>✉️ Email:</strong> <a href="mailto:info@bayareacleaningpros.com" style="color: #3B82F6;">info@bayareacleaningpros.com</a></p>
              <p style="margin: 5px 0;"><strong>🌐 Website:</strong> <a href="https://bayareacleaningpros.com" style="color: #3B82F6;">bayareacleaningpros.com</a></p>
            </div>
          </div>

          <div style="background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 20px; border-radius: 8px; text-align: center;">
            <p style="margin: 0; font-size: 16px; font-weight: 500;">
              Thank you for trusting Bay Area Cleaning Pros with your cleaning needs!
            </p>
          </div>
        </div>
      </div>
    `;

    // Send confirmation email
    const emailResponse = await resend.emails.send({
      from: "Bay Area Cleaning Pros <noreply@bayareacleaningpros.com>",
      to: [email],
      subject: `Order Confirmation - ${cleaningType} Service`,
      html: emailContent,
    });

    console.log("Email sent successfully:", emailResponse);

    // Update order status to indicate email was sent
    await supabaseClient
      .from("orders")
      .update({ 
        status: "confirmed",
        updated_at: new Date().toISOString()
      })
      .eq("id", order.id);

    return new Response(JSON.stringify({ 
      success: true, 
      emailResponse,
      message: "Order confirmation email sent successfully"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-order-confirmation function:", error);
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