import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { OrderConfirmationEmail } from '../_shared/email-templates/order-confirmation.tsx';

const ghlApiKey = Deno.env.get("GOHIGHLEVEL_API_KEY");

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

    // Generate service details URL
    const serviceDetailsUrl = `${req.headers.get("origin")}/service-details?session_id=${order.stripe_session_id}`;

    // Render the React email template
    const emailContent = await renderAsync(
      React.createElement(OrderConfirmationEmail, {
        customerName: name,
        orderId: order.id.slice(-12), // Last 12 characters
        cleaningType,
        frequency,
        squareFootage: order.square_footage?.toString(),
        addOns,
        amount,
        serviceDetailsUrl,
      })
    );

    // Send confirmation email using GoHighLevel
    const emailResponse = await fetch("https://services.leadconnectorhq.com/communications/campaign/email", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ghlApiKey}`,
        "Content-Type": "application/json",
        "Version": "2021-07-28"
      },
      body: JSON.stringify({
        html: emailContent,
        subject: `Order Confirmation - ${cleaningType} Service`,
        altText: `Order Confirmation for ${cleaningType} Service - Order #${order.id.slice(-12)}`,
        emailFrom: "hello@bayareacleaningpros.com",
        emailFromName: "Bay Area Cleaning Pros",
        recipients: [email]
      })
    });

    console.log("GHL API Response Status:", emailResponse.status);
    
    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("GHL API Error:", errorText);
      throw new Error(`GoHighLevel API error: ${emailResponse.status} - ${errorText}`);
    }

    const emailResult = await emailResponse.json();
    console.log("Email sent successfully:", emailResult);

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