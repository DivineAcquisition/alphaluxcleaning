import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { Resend } from "npm:resend@2.0.0";
import { OrderConfirmationEmail } from '../_shared/email-templates/order-confirmation.tsx';

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
  isSchedulingConfirmation?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Send order confirmation function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, sessionId, customerEmail, customerName, isSchedulingConfirmation }: OrderConfirmationRequest = await req.json();
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

    // Generate order status URL
    const orderStatusUrl = orderId 
      ? `${req.headers.get("origin")}/order-status?order_id=${orderId}`
      : `${req.headers.get("origin")}/order-status?session_id=${order.stripe_session_id}`;

    // Extract scheduling information if available
    const schedulingInfo = serviceDetails.scheduling || {};
    const scheduledDate = order.scheduled_date || schedulingInfo.scheduledDate;
    const scheduledTime = order.scheduled_time || schedulingInfo.scheduledTime;

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
        serviceDetailsUrl: orderStatusUrl,
        scheduledDate,
        scheduledTime,
        isSchedulingConfirmation: isSchedulingConfirmation || false,
      })
    );

    // Send confirmation email using Resend
    const emailResponse = await resend.emails.send({
      from: "Bay Area Cleaning Pros <hello@bayareacleaningpros.com>",
      to: [email],
      subject: isSchedulingConfirmation 
        ? `Scheduling Request Received - ${cleaningType} Service`
        : `Order Confirmation - ${cleaningType} Service`,
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