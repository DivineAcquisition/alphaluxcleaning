import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { BookingConfirmationEmail } from "../_shared/email-templates/booking-confirmation.tsx";

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  customerEmail: string;
  customerName: string;
  serviceDate: string;
  serviceTime: string;
  totalAmount: number;
  depositAmount: number;
  remainingBalance: number;
  orderId: string;
  serviceType: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: EmailRequest = await req.json();
    console.log('Sending order confirmation email:', {
      customerEmail: request.customerEmail,
      orderId: request.orderId,
      depositAmount: request.depositAmount
    });

    // Format service date
    const formattedDate = new Date(request.serviceDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Render the email template
    const html = await renderAsync(
      React.createElement(BookingConfirmationEmail, {
        customer_name: request.customerName,
        service_date: formattedDate,
        service_time: request.serviceTime,
        service_type: request.serviceType === 'regular' ? 'Regular Cleaning' :
                     request.serviceType === 'deep' ? 'Deep Cleaning' : 'Move-Out Cleaning',
        deposit_amount: `$${request.depositAmount.toFixed(2)}`,
        total_amount: `$${request.totalAmount.toFixed(2)}`,
        remaining_balance: `$${request.remainingBalance.toFixed(2)}`,
        order_id: request.orderId,
        portal_url: 'https://portal.bayareacleaningpros.com'
      })
    );

    // Send email
    const { data, error } = await resend.emails.send({
      from: 'Bay Area Cleaning Pros <bookings@bayareacleaningpros.com>',
      to: [request.customerEmail],
      subject: `Booking Confirmed - 20% Deposit Received (Order #${request.orderId.slice(-8)})`,
      html,
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    console.log('Order confirmation email sent successfully:', data);

    return new Response(JSON.stringify({
      success: true,
      messageId: data?.id,
      message: 'Order confirmation email sent successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error in send-order-confirmation:', error);
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});