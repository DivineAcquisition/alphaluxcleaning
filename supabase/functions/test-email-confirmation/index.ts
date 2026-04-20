import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { TestEmail } from '../_shared/email-templates/test-email.tsx';

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

    // Generate order status URL
    const orderStatusUrl = `https://fc9bf4c2-5143-4270-83ec-c7de4b1ed612.lovableproject.com/order-status?id=${sampleOrderId}`;

    // Render the React email template
    const emailContent = await renderAsync(
      React.createElement(TestEmail, {
        testEmail,
        sampleOrderId,
        orderStatusUrl,
      })
    );

    // Send test email using Resend
    const emailResponse = await resend.emails.send({
      from: "AlphaLux Cleaning <noreply@info.alphaluxclean.com>",
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