import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { PaymentConfirmation } from '../_shared/email-templates/payment-confirmation.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentConfirmationRequest {
  paymentId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentId }: PaymentConfirmationRequest = await req.json();

    console.log('Sending payment confirmation:', { paymentId });

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get payment with related data
    const { data: payment, error: paymentError } = await supabase
      .from('subcontractor_payments')
      .select(`
        *,
        subcontractor:subcontractors(full_name, email, split_tier),
        booking:bookings(customer_name, service_date, service_address, service_type)
      `)
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      console.error('Error fetching payment:', paymentError);
      throw new Error('Payment not found');
    }

    if (!payment.subcontractor || !payment.booking) {
      throw new Error('Missing subcontractor or booking data');
    }

    // Calculate YTD earnings
    const currentYear = new Date().getFullYear();
    const { data: ytdPayments, error: ytdError } = await supabase
      .from('subcontractor_payments')
      .select('subcontractor_amount')
      .eq('subcontractor_id', payment.subcontractor_id)
      .eq('payment_status', 'paid')
      .gte('paid_at', `${currentYear}-01-01`)
      .lte('paid_at', `${currentYear}-12-31`);

    const ytdTotal = ytdPayments?.reduce((sum, p) => sum + parseFloat(p.subcontractor_amount), 0) || 0;

    // Render email using React Email
    const emailHtml = await renderAsync(
      React.createElement(PaymentConfirmation, {
        subcontractorName: payment.subcontractor.full_name,
        paymentAmount: `$${parseFloat(payment.subcontractor_amount).toFixed(2)}`,
        jobDetails: {
          customerName: payment.booking.customer_name,
          serviceDate: new Date(payment.booking.service_date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          serviceAddress: payment.booking.service_address,
          serviceType: payment.booking.service_type || 'Standard Cleaning',
          totalAmount: `$${parseFloat(payment.total_amount).toFixed(2)}`,
          splitPercentage: `${payment.split_percentage}%`,
        },
        paymentMethod: 'Direct Deposit',
        paymentDate: new Date(payment.paid_at || payment.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        ytdEarnings: `$${ytdTotal.toFixed(2)}`,
        dashboardUrl: `${supabaseUrl.replace('.supabase.co', '')}.com/subcontractor-portal`,
      })
    );

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Bay Area Cleaning <payments@bayareacleaningpros.com>",
      to: [payment.subcontractor.email],
      subject: `Payment Received - $${parseFloat(payment.subcontractor_amount).toFixed(2)} for ${payment.booking.customer_name}`,
      html: emailHtml,
    });

    console.log('Email sent successfully:', emailResponse);

    // Create notification record
    const { error: notificationError } = await supabase
      .from('subcontractor_notifications')
      .insert({
        subcontractor_id: payment.subcontractor_id,
        title: 'Payment Received',
        message: `You received $${parseFloat(payment.subcontractor_amount).toFixed(2)} for ${payment.booking.customer_name}'s service`,
        type: 'payment'
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id,
      message: 'Payment confirmation sent successfully' 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-payment-confirmation function:", error);
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